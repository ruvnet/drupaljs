import { describe, it, expect } from 'vitest';
import { FieldUI } from './field-ui.js';
import type { EntityTypeInterface } from './types.js';

function entityType(overrides: Partial<{
  bundleEntityType: string | null;
  annotations: Record<string, unknown>;
}> = {}): EntityTypeInterface {
  const annotations = overrides.annotations ?? {};
  const bundleEntityType =
    'bundleEntityType' in overrides ? overrides.bundleEntityType! : null;
  return {
    get: (key: string) => annotations[key],
    getBundleEntityType: () => bundleEntityType,
  };
}

describe('FieldUI.getRouteBundleParameter', () => {
  it('keys the bundle by the entity type bundle key when present', () => {
    const type = entityType({ bundleEntityType: 'node_type' });
    expect(FieldUI.getRouteBundleParameter(type, 'article')).toEqual({
      node_type: 'article',
    });
  });

  it('falls back to "bundle" when the entity type has no bundle entity', () => {
    const type = entityType({ bundleEntityType: null });
    expect(FieldUI.getRouteBundleParameter(type, 'user')).toEqual({
      bundle: 'user',
    });
  });
});

describe('FieldUI.getOverviewRouteInfo', () => {
  it('builds the field overview route when field_ui_base_route is set', () => {
    const type = entityType({
      bundleEntityType: 'node_type',
      annotations: { field_ui_base_route: 'entity.node.edit_form' },
    });
    expect(FieldUI.getOverviewRouteInfo('node', 'article', type)).toEqual({
      routeName: 'entity.node.field_ui_fields',
      routeParameters: { node_type: 'article' },
      options: {},
    });
  });

  it('returns null when the entity type has no field_ui_base_route', () => {
    const type = entityType({ bundleEntityType: 'node_type', annotations: {} });
    expect(FieldUI.getOverviewRouteInfo('node', 'article', type)).toBeNull();
  });
});

describe('FieldUI.getNextDestination', () => {
  it('returns null for an empty destination list', () => {
    expect(FieldUI.getNextDestination([])).toBeNull();
  });

  it('shifts a structured destination and threads remaining ones into the query', () => {
    const result = FieldUI.getNextDestination([
      { route_name: 'a.route', route_parameters: { x: '1' } },
      { route_name: 'b.route' },
    ]);
    expect(result).toEqual({
      routeName: 'a.route',
      routeParameters: { x: '1' },
      options: { query: { destinations: [{ route_name: 'b.route' }] } },
    });
  });

  it('does not add a destinations query when only one destination remains', () => {
    const result = FieldUI.getNextDestination([
      { route_name: 'only.route' },
    ]);
    expect(result).toEqual({
      routeName: 'only.route',
      routeParameters: {},
      options: {},
    });
  });
});
