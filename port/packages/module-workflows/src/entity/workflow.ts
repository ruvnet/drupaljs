/**
 * Port of `Drupal\workflows\Entity\Workflow` (Entity/Workflow.php).
 *
 * The `workflow` config entity. It owns identity (`id`, `label`), the chosen
 * workflow `type` plugin ID, and the plugin's stored `type_settings`. The entity
 * lazily instantiates its type plugin (porting the DefaultSingleLazyPluginCollection
 * behaviour) and enforces required states on save (preSave).
 *
 * The Drupal DI plugin manager is replaced here by a `typePluginFactory`
 * callback injected at construction — the TS-idiomatic seam for the
 * `plugin.manager.workflows.type` service.
 *
 * TODO(@drupaljs/entity, @drupaljs/config): extend the shared ConfigEntityBase and
 * EntityWithPluginCollectionInterface once those packages land; this slice models
 * only the surface needed for the workflows API.
 */

import { RequiredStateMissingException } from '../exception.js';
import type {
  WorkflowInterface,
  WorkflowTypeConfiguration,
  WorkflowTypeInterface,
} from '../types.js';

/** Stored config-entity values (ports the entity's config_export keys). */
export interface WorkflowValues {
  id?: string;
  label?: string;
  /** The workflow type plugin ID. */
  type?: string;
  /** The type plugin's stored configuration. */
  type_settings?: Partial<WorkflowTypeConfiguration>;
  /** Whether the entity is enabled. Ports ConfigEntityBase::$status. */
  status?: boolean;
}

/**
 * Instantiates a configured workflow type plugin for the given plugin ID.
 * Stands in for `plugin.manager.workflows.type` + DefaultSingleLazyPluginCollection.
 */
export type TypePluginFactory = (
  configuration: Partial<WorkflowTypeConfiguration>,
) => WorkflowTypeInterface;

export class Workflow implements WorkflowInterface {
  private typePlugin?: WorkflowTypeInterface;

  constructor(
    private readonly values: WorkflowValues,
    private readonly typePluginFactory: TypePluginFactory,
  ) {}

  id(): string | undefined {
    return this.values.id;
  }

  label(): string | undefined {
    return this.values.label;
  }

  /** Ports Workflow::getTypePlugin() / getPluginCollection() (lazy + cached). */
  getTypePlugin(): WorkflowTypeInterface {
    if (this.typePlugin === undefined) {
      this.typePlugin = this.typePluginFactory(this.values.type_settings ?? {});
    }
    return this.typePlugin;
  }

  /** Ports Workflow::status(): enabled AND has at least one state. */
  status(): boolean {
    return Boolean(this.values.status) && this.getTypePlugin().getStates().length > 0;
  }

  /**
   * Ports Workflow::preSave(): refuse to save if the type plugin's required
   * states are not all present.
   */
  preSave(): void {
    const workflowType = this.getTypePlugin();
    const present = new Set(workflowType.getStates().map((s) => s.id()));
    const missing = workflowType.getRequiredStates().filter((id) => !present.has(id));
    if (missing.length > 0) {
      throw new RequiredStateMissingException(
        `Workflow type '${workflowType.label()}' requires states with the ID '${missing.join("', '")}' in workflow '${this.id() ?? ''}'`,
      );
    }
  }
}
