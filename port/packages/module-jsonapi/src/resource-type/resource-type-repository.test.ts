import { describe, it, expect } from 'vitest';
import { ResourceType } from './resource-type.js';
import { ResourceTypeRepository } from './resource-type-repository.js';

describe('ResourceTypeRepository', () => {
  const article = new ResourceType({ entityTypeId: 'node', bundle: 'article' });
  const page = new ResourceType({ entityTypeId: 'node', bundle: 'page' });
  const user = new ResourceType({ entityTypeId: 'user', bundle: 'user' });

  it('all() returns every registered resource type', () => {
    const repo = new ResourceTypeRepository([article, page, user]);
    expect(repo.all()).toEqual([article, page, user]);
  });

  it('get(entityType, bundle) returns the matching resource type', () => {
    const repo = new ResourceTypeRepository([article, page, user]);
    expect(repo.get('node', 'page')).toBe(page);
    expect(repo.get('user', 'user')).toBe(user);
  });

  it('getByTypeName(name) returns the matching resource type', () => {
    const repo = new ResourceTypeRepository([article, page, user]);
    expect(repo.getByTypeName('node--article')).toBe(article);
  });

  it('returns null for unknown lookups', () => {
    const repo = new ResourceTypeRepository([article]);
    expect(repo.get('node', 'page')).toBeNull();
    expect(repo.getByTypeName('node--page')).toBeNull();
  });
});
