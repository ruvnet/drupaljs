/**
 * The `rest_resource_config` configuration entity — TypeScript port of
 * `Drupal\rest\Entity\RestResourceConfig` and its interface
 * `Drupal\rest\RestResourceConfigInterface`.
 *
 * Stores which REST resource plugins are enabled and, per HTTP method (or for
 * the whole resource), which formats and authentication providers are allowed.
 *
 * The PHP class extends `ConfigEntityBase`; that base is not yet ported, so the
 * minimal config-entity surface (id/label, config_export-driven toArray,
 * getEntityTypeId, status) is modelled locally here.
 *
 * TODO(@drupaljs/entity): extend the shared ConfigEntityBase once it lands and
 * drop the local surface.
 */

/** Granularity of a REST resource configuration. */
export enum RestResourceConfigGranularity {
  /** Per-HTTP-method configuration. */
  METHOD = 'method',
  /** Per-resource configuration (same formats/auth for every method). */
  RESOURCE = 'resource',
}

/** Per-method configuration block under METHOD granularity. */
export interface RestMethodConfiguration {
  supported_formats?: string[];
  supported_auth?: string[];
}

/**
 * The `configuration` map. Under RESOURCE granularity it has `methods`,
 * `formats` and `authentication`; under METHOD granularity it is keyed by HTTP
 * method.
 */
export interface RestResourceConfiguration {
  methods?: string[];
  formats?: string[];
  authentication?: string[];
  [method: string]: RestMethodConfiguration | string[] | undefined;
}

/** Values accepted by the entity constructor. */
export interface RestResourceConfigValues {
  id: string;
  plugin_id?: string;
  granularity?: RestResourceConfigGranularity;
  configuration?: RestResourceConfiguration;
  /** Config-entity enabled flag (ConfigEntityBase::$status). Defaults true. */
  status?: boolean;
}

/** The `config_export` order, faithful to the `#[ConfigEntityType]` attribute. */
const CONFIG_EXPORT = ['id', 'plugin_id', 'granularity', 'configuration'] as const;

const ENTITY_TYPE_ID = 'rest_resource_config';

/** Ports `Drupal\rest\RestResourceConfigInterface`. */
export interface RestResourceConfigInterface {
  id(): string;
  status(): boolean;
  getEntityTypeId(): string;
  getPluginId(): string;
  getMethods(): string[];
  getAuthenticationProviders(method: string): string[];
  getFormats(method: string): string[];
  /** The config-dependency name, e.g. `rest.resource.entity.node`. */
  getConfigDependencyName(): string;
}

export class RestResourceConfig implements RestResourceConfigInterface {
  private readonly _id: string;
  private readonly _plugin_id: string;
  private readonly _granularity: RestResourceConfigGranularity | undefined;
  private readonly _configuration: RestResourceConfiguration;
  private readonly _status: boolean;

  constructor(values: RestResourceConfigValues) {
    this._id = values.id;
    // The config entity id mirrors the plugin id but uses `.` instead of `:`
    // (`:` is not valid for config entities). Derive plugin_id on creation.
    this._plugin_id = values.plugin_id ?? values.id.replaceAll('.', ':');
    this._granularity = values.granularity;
    this._configuration = values.configuration ?? {};
    this._status = values.status ?? true;
  }

  id(): string {
    return this._id;
  }

  status(): boolean {
    return this._status;
  }

  getEntityTypeId(): string {
    return ENTITY_TYPE_ID;
  }

  getPluginId(): string {
    return this._plugin_id;
  }

  getConfigDependencyName(): string {
    // ConfigEntityBase::getConfigDependencyName() => `<provider>.<prefix>.<id>`.
    // For rest the config prefix is `resource`, provider `rest`.
    return `rest.resource.${this._id}`;
  }

  getMethods(): string[] {
    switch (this._granularity) {
      case RestResourceConfigGranularity.METHOD:
        return this.getMethodsForMethodGranularity();
      case RestResourceConfigGranularity.RESOURCE:
        return (this._configuration.methods as string[]) ?? [];
      default:
        throw new Error('Invalid granularity specified.');
    }
  }

  getAuthenticationProviders(method: string): string[] {
    switch (this._granularity) {
      case RestResourceConfigGranularity.METHOD:
        return this.getMethodConfigList(method, 'supported_auth');
      case RestResourceConfigGranularity.RESOURCE:
        return (this._configuration.authentication as string[]) ?? [];
      default:
        throw new Error('Invalid granularity specified.');
    }
  }

  getFormats(method: string): string[] {
    switch (this._granularity) {
      case RestResourceConfigGranularity.METHOD:
        return this.getMethodConfigList(method, 'supported_formats');
      case RestResourceConfigGranularity.RESOURCE:
        return (this._configuration.formats as string[]) ?? [];
      default:
        throw new Error('Invalid granularity specified.');
    }
  }

  /**
   * Serializes the entity to its config representation — only the
   * `config_export` keys, in declaration order (ConfigEntityBase::toArray()).
   */
  toArray(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of CONFIG_EXPORT) {
      switch (key) {
        case 'id':
          out.id = this._id;
          break;
        case 'plugin_id':
          out.plugin_id = this._plugin_id;
          break;
        case 'granularity':
          out.granularity = this._granularity;
          break;
        case 'configuration':
          out.configuration = this._configuration;
          break;
      }
    }
    return out;
  }

  // -- METHOD-granularity helpers (faithful to the PHP, with normalization) --

  private getMethodsForMethodGranularity(): string[] {
    return Object.keys(this._configuration).map((m) => this.normalizeRestMethod(m));
  }

  private getMethodConfigList(
    method: string,
    key: 'supported_formats' | 'supported_auth',
  ): string[] {
    const normalized = this.normalizeRestMethod(method);
    if (this.getMethods().includes(normalized)) {
      const block = this.findMethodBlock(normalized);
      const value = block?.[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
    return [];
  }

  /** Looks up a per-method configuration block by normalized method name. */
  private findMethodBlock(normalizedMethod: string): RestMethodConfiguration | undefined {
    for (const [rawKey, value] of Object.entries(this._configuration)) {
      if (this.normalizeRestMethod(rawKey) === normalizedMethod && this.isMethodBlock(value)) {
        return value;
      }
    }
    return undefined;
  }

  private isMethodBlock(value: unknown): value is RestMethodConfiguration {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private normalizeRestMethod(method: string): string {
    return method.toUpperCase();
  }
}
