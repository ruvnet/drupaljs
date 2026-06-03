import { describe, it, expect } from 'vitest';
import {
  RestResourceConfig,
  RestResourceConfigGranularity,
} from './rest-resource-config.js';

describe('RestResourceConfig construction', () => {
  it('derives plugin_id from id (`.` -> `:`) when not supplied', () => {
    const config = new RestResourceConfig({ id: 'entity.node' });
    expect(config.getPluginId()).toBe('entity:node');
  });

  it('keeps an explicit plugin_id', () => {
    const config = new RestResourceConfig({
      id: 'entity.node',
      plugin_id: 'custom:thing',
    });
    expect(config.getPluginId()).toBe('custom:thing');
  });

  it('exports only the config_export keys', () => {
    const config = new RestResourceConfig({
      id: 'entity.node',
      granularity: RestResourceConfigGranularity.RESOURCE,
      configuration: { methods: ['GET'] },
    });
    expect(Object.keys(config.toArray()).sort()).toEqual([
      'configuration',
      'granularity',
      'id',
      'plugin_id',
    ]);
    expect(config.toArray().plugin_id).toBe('entity:node');
  });
});

describe('RestResourceConfig resource granularity', () => {
  const config = new RestResourceConfig({
    id: 'entity.node',
    granularity: RestResourceConfigGranularity.RESOURCE,
    configuration: {
      methods: ['GET', 'POST'],
      formats: ['json'],
      authentication: ['basic_auth'],
    },
  });

  it('returns the configured methods verbatim', () => {
    expect(config.getMethods()).toEqual(['GET', 'POST']);
  });

  it('returns the configured formats for any method', () => {
    expect(config.getFormats('GET')).toEqual(['json']);
    expect(config.getFormats('POST')).toEqual(['json']);
  });

  it('returns the configured authentication providers for any method', () => {
    expect(config.getAuthenticationProviders('GET')).toEqual(['basic_auth']);
  });
});

describe('RestResourceConfig method granularity', () => {
  const config = new RestResourceConfig({
    id: 'entity.node',
    granularity: RestResourceConfigGranularity.METHOD,
    configuration: {
      GET: {
        supported_formats: ['json', 'xml'],
        supported_auth: ['cookie'],
      },
      POST: {
        supported_formats: ['json'],
        supported_auth: ['basic_auth'],
      },
    },
  });

  it('normalizes method names to upper case', () => {
    expect(config.getMethods().sort()).toEqual(['GET', 'POST']);
    expect(config.getFormats('get')).toEqual(['json', 'xml']);
  });

  it('returns per-method formats and auth', () => {
    expect(config.getFormats('POST')).toEqual(['json']);
    expect(config.getAuthenticationProviders('POST')).toEqual(['basic_auth']);
  });

  it('returns [] for a method not present in configuration', () => {
    expect(config.getFormats('DELETE')).toEqual([]);
    expect(config.getAuthenticationProviders('DELETE')).toEqual([]);
  });
});

describe('RestResourceConfig invalid granularity', () => {
  it('throws when granularity is unknown', () => {
    const config = new RestResourceConfig({
      id: 'x',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      granularity: 'bogus' as any,
      configuration: {},
    });
    expect(() => config.getMethods()).toThrow(/granularity/i);
  });
});
