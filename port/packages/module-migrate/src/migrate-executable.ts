/**
 * Drives a migration: iterates the source, runs each destination property's
 * process pipeline onto the Row, then hands the Row to the destination plugin.
 * Port of `Drupal\migrate\MigrateExecutable` (the import + processRow surface;
 * the rollback loop and event dispatch are intentionally trimmed for this
 * minimal port — see TODOs).
 */

import {
  MigrationStatus,
  MigrationResult,
  MessageLevel,
  MigrateException,
  MigrateSkipProcessException,
  MigrateSkipRowException,
  type MigrationInterface,
  type MigrateExecutableInterface,
  type MigrateMessageInterface,
  type MigrateProcessInterface,
  type MigrateSourceInterface,
} from './contracts.js';
import { Row } from './row.js';

/** Default message sink: collects nothing, swallows output. */
class NullMessage implements MigrateMessageInterface {
  display(_message: string, _type?: string): void {
    /* no-op */
  }
}

export class MigrateExecutable implements MigrateExecutableInterface {
  private readonly migration: MigrationInterface;
  private readonly message: MigrateMessageInterface;
  private source?: MigrateSourceInterface;

  constructor(migration: MigrationInterface, message?: MigrateMessageInterface) {
    this.migration = migration;
    this.message = message ?? new NullMessage();
  }

  private getSource(): MigrateSourceInterface {
    if (this.source === undefined) {
      this.source = this.migration.getSourcePlugin();
    }
    return this.source;
  }

  saveMessage(message: string, level: MessageLevel = MessageLevel.ERROR): void {
    const type = level === MessageLevel.ERROR ? 'error' : 'status';
    this.message.display(message, type);
  }

  /**
   * Imports all source rows. Returns a MigrationResult.
   *
   * TODO(@drupaljs/migrate): wire the MigrateIdMap so destination IDs and
   * source-row statuses persist across runs; this minimal port runs the
   * pipeline and destination without a backing map table.
   */
  import(): MigrationResult {
    if (this.migration.getStatus() !== MigrationStatus.IDLE) {
      this.message.display(
        `Migration ${this.migration.id()} is busy with another operation: ${this.migration.getStatusLabel()}`,
        'error',
      );
      return MigrationResult.FAILED;
    }

    this.migration.setStatus(MigrationStatus.IMPORTING);
    const source = this.getSource();

    try {
      source.rewind();
    } catch (e) {
      this.message.display(
        `Migration failed with source plugin exception: ${asMessage(e)}`,
        'error',
      );
      this.migration.setStatus(MigrationStatus.IDLE);
      return MigrationResult.FAILED;
    }

    const pipeline = source.valid() ? this.migration.getProcessPlugins() : null;
    const destination = this.migration.getDestinationPlugin();

    if (pipeline) {
      while (source.valid()) {
        const row = source.current();
        if (row === null) {
          break;
        }

        let save = true;
        try {
          for (const [destinationProperty, plugins] of Object.entries(pipeline)) {
            this.processPipeline(row, destinationProperty, plugins, undefined);
          }
        } catch (e) {
          if (e instanceof MigrateException) {
            this.saveMessage(`${destination.getPluginId()}: ${e.message}`, e.level);
            save = false;
          } else if (e instanceof MigrateSkipRowException) {
            if (e.message.trim() !== '') {
              this.saveMessage(
                `${this.migration.id()}: ${e.message}`,
                MessageLevel.INFORMATIONAL,
              );
            }
            save = false;
          } else {
            throw e;
          }
        }

        if (save) {
          try {
            destination.import(row, []);
          } catch (e) {
            if (e instanceof MigrateException) {
              this.saveMessage(e.message, e.level);
            } else {
              throw e;
            }
          }
        }

        // Honour a stop request between rows.
        if (this.migration.getStatus() === MigrationStatus.STOPPING) {
          this.migration.setStatus(MigrationStatus.IDLE);
          return MigrationResult.STOPPED;
        }

        try {
          source.next();
        } catch (e) {
          this.message.display(
            `Migration failed with source plugin exception: ${asMessage(e)}`,
            'error',
          );
          this.migration.setStatus(MigrationStatus.IDLE);
          return MigrationResult.FAILED;
        }
      }
    }

    this.migration.setStatus(MigrationStatus.IDLE);
    return MigrationResult.COMPLETED;
  }

  /**
   * Runs the migration's process pipeline against a row. Ports
   * MigrateExecutable::processRow.
   */
  processRow(row: Row, process?: Record<string, MigrateProcessInterface[]>): void {
    const pipeline = process ?? this.migration.getProcessPlugins();
    for (const [destination, plugins] of Object.entries(pipeline)) {
      this.processPipeline(row, destination, plugins, undefined);
    }
  }

  /**
   * Runs one destination property's pipeline. Ports
   * MigrateExecutable::processPipeline, including the multiple-value handling
   * for plugins that do not declare `handle_multiples`.
   */
  private processPipeline(
    row: Row,
    destination: string,
    plugins: MigrateProcessInterface[],
    initialValue: unknown,
  ): void {
    let value = initialValue;
    let multiple = false;

    for (const plugin of plugins) {
      const definition = plugin.getPluginDefinition();
      if (multiple && !definition.handle_multiples) {
        if (!Array.isArray(value)) {
          throw new MigrateException(
            `Pipeline failed at ${plugin.getPluginId()} plugin for destination ${destination}: ${String(value)} received instead of an array`,
          );
        }
        const newValue: unknown[] = [];
        let stop = false;
        for (const scalar of value) {
          plugin.reset();
          try {
            newValue.push(plugin.transform(scalar, this, row, destination));
          } catch (e) {
            if (e instanceof MigrateSkipProcessException) {
              newValue.push(null);
              stop = true;
            } else if (e instanceof MigrateException) {
              throw new MigrateException(`${plugin.getPluginId()}: ${e.message}`);
            } else {
              throw e;
            }
          }
          if (plugin.isPipelineStopped()) {
            stop = true;
          }
        }
        value = newValue;
        if (stop) {
          break;
        }
      } else {
        plugin.reset();
        try {
          value = plugin.transform(value, this, row, destination);
        } catch (e) {
          if (e instanceof MigrateSkipProcessException) {
            value = undefined;
            break;
          }
          if (e instanceof MigrateException) {
            throw new MigrateException(`${plugin.getPluginId()}: ${e.message}`);
          }
          throw e;
        }
        if (plugin.isPipelineStopped()) {
          break;
        }
        multiple = plugin.multiple();
      }
    }

    // Ensure all values, including nulls, are migrated.
    if (plugins.length > 0) {
      if (value !== undefined && value !== null) {
        row.setDestinationProperty(destination, value);
      } else {
        row.setEmptyDestinationProperty(destination);
      }
    }
  }
}

function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
