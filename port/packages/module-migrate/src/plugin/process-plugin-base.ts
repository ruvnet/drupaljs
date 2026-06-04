/**
 * Base for process plugins. Port of `Drupal\migrate\ProcessPluginBase`.
 *
 * Provides the common `multiple()` / pipeline-stop / `reset()` machinery and
 * carries the plugin id + definition that `MigrateExecutable` inspects (notably
 * `handle_multiples`).
 */

import type {
  MigrateExecutableInterface,
  MigrateProcessInterface,
} from '../contracts.js';
import type { Row } from '../row.js';

export abstract class ProcessPluginBase implements MigrateProcessInterface {
  protected readonly configuration: Record<string, unknown>;
  private readonly pluginId: string;
  private readonly definition: { handle_multiples?: boolean; [key: string]: unknown };
  private stopPipeline = false;

  constructor(
    configuration: Record<string, unknown> = {},
    pluginId = '',
    definition: { handle_multiples?: boolean; [key: string]: unknown } = {},
  ) {
    this.configuration = configuration;
    this.pluginId = pluginId;
    this.definition = definition;
  }

  abstract transform(
    value: unknown,
    executable: MigrateExecutableInterface,
    row: Row,
    destinationProperty: string,
  ): unknown;

  multiple(): boolean {
    return false;
  }

  isPipelineStopped(): boolean {
    return this.stopPipeline;
  }

  /** Marks the pipeline as stopped (consumed by the executable). */
  protected stopPipelineNow(): void {
    this.stopPipeline = true;
  }

  reset(): void {
    this.stopPipeline = false;
  }

  getPluginId(): string {
    return this.pluginId;
  }

  getPluginDefinition(): { handle_multiples?: boolean; [key: string]: unknown } {
    return this.definition;
  }
}
