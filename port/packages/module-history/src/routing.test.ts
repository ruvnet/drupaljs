import { describe, it, expect } from 'vitest';
import { historyRoutes } from './routing.js';

describe('historyRoutes', () => {
  it('defines the three history.routing.yml routes', () => {
    expect(Object.keys(historyRoutes).sort()).toEqual([
      'history.get_last_node_view',
      'history.new_comments_node_links',
      'history.read_node',
    ]);
  });

  it('guards the timestamps endpoint with "access content"', () => {
    expect(historyRoutes['history.get_last_node_view']!.requirements.permission).toBe(
      'access content',
    );
  });

  it('requires node.view access and a numeric node slug for read_node', () => {
    const route = historyRoutes['history.read_node']!;
    expect(route.path).toBe('/history/{node}/read');
    expect(route.requirements.entityAccess).toBe('node.view');
    expect(route.requirements.slugPatterns?.node).toBe('\\d+');
  });
});
