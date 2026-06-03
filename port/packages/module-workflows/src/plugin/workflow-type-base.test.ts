import { describe, it, expect } from 'vitest';
import { TestWorkflowType } from './test-workflow-type.js';

/**
 * Exercises the ported WorkflowTypeBase state/transition machine via a concrete
 * test plugin. Mirrors core's WorkflowTypeStateTransitionOperationsTest /
 * WorkflowTest assertions.
 */
function newType(required: string[] = []): TestWorkflowType {
  const t = new TestWorkflowType({ id: 'test', label: 'Test', required_states: required });
  t.setConfiguration({});
  return t;
}

describe('WorkflowTypeBase — states', () => {
  it('adds states with auto-incrementing weight and keeps them ksorted', () => {
    const t = newType();
    t.addState('z', 'Zed').addState('a', 'Alpha');
    expect(t.hasState('z')).toBe(true);
    // ksort means config keys are ordered; getStates sorts by weight then label.
    const ids = t.getStates().map((s) => s.id());
    expect(ids).toEqual(['z', 'a']); // weights 0 then 1
    expect(t.getState('z').weight()).toBe(0);
    expect(t.getState('a').weight()).toBe(1);
  });

  it('rejects duplicate state IDs', () => {
    const t = newType();
    t.addState('draft', 'Draft');
    expect(() => t.addState('draft', 'Again')).toThrow(/already exists/);
  });

  it('rejects invalid state IDs', () => {
    const t = newType();
    expect(() => t.addState('Bad Id', 'X')).toThrow(/lowercase letters, numbers, and underscores/);
  });

  it('throws on unknown getState / setStateLabel / setStateWeight', () => {
    const t = newType();
    expect(() => t.getState('nope')).toThrow(/does not exist/);
    expect(() => t.setStateLabel('nope', 'x')).toThrow(/does not exist/);
    expect(() => t.setStateWeight('nope', 1)).toThrow(/does not exist/);
  });

  it('rejects non-numeric state weight', () => {
    const t = newType();
    t.addState('draft', 'Draft');
    // @ts-expect-error testing runtime guard
    expect(() => t.setStateWeight('draft', 'heavy')).toThrow(/must be numeric/);
  });

  it('updates state label and weight', () => {
    const t = newType();
    t.addState('draft', 'Draft');
    t.setStateLabel('draft', 'Working').setStateWeight('draft', 5);
    expect(t.getState('draft').label()).toBe('Working');
    expect(t.getState('draft').weight()).toBe(5);
  });

  it('getInitialState returns the lowest-sorted state', () => {
    const t = newType();
    t.addState('b', 'Bravo').addState('a', 'Alpha');
    t.setStateWeight('b', -5);
    expect(t.getInitialState().id()).toBe('b');
  });

  it('refuses to delete the only state', () => {
    const t = newType();
    t.addState('only', 'Only');
    expect(() => t.deleteState('only')).toThrow(/only state/);
  });

  it('deleting a state removes transitions to it and prunes it from "from"', () => {
    const t = newType();
    t.addState('draft', 'Draft').addState('review', 'Review').addState('published', 'Published');
    t.addTransition('publish', 'Publish', ['draft', 'review'], 'published');
    t.addTransition('to_review', 'To review', ['draft'], 'review');
    // Deleting 'review': removes the transition whose "to" is review, and prunes
    // 'review' from the 'publish' transition's "from" list.
    t.deleteState('review');
    expect(t.hasTransition('to_review')).toBe(false);
    expect(t.hasState('review')).toBe(false);
    expect(t.getTransition('publish').from().map((s) => s.id())).toEqual(['draft']);
  });
});

describe('WorkflowTypeBase — transitions', () => {
  it('adds a transition and exposes from/to', () => {
    const t = newType();
    t.addState('draft', 'Draft').addState('published', 'Published');
    t.addTransition('publish', 'Publish', ['draft'], 'published');
    const tr = t.getTransition('publish');
    expect(tr.label()).toBe('Publish');
    expect(tr.from().map((s) => s.id())).toEqual(['draft']);
    expect(tr.to().id()).toBe('published');
  });

  it('rejects duplicate transition IDs and invalid IDs', () => {
    const t = newType();
    t.addState('draft', 'Draft').addState('published', 'Published');
    t.addTransition('publish', 'Publish', ['draft'], 'published');
    expect(() => t.addTransition('publish', 'X', ['draft'], 'published')).toThrow(/already exists/);
    expect(() => t.addTransition('Bad Id', 'X', ['draft'], 'published')).toThrow(/lowercase/);
  });

  it('rejects a transition to a non-existent state', () => {
    const t = newType();
    t.addState('draft', 'Draft');
    expect(() => t.addTransition('publish', 'Publish', ['draft'], 'ghost')).toThrow(/does not exist/);
  });

  it('rolls back the transition when a from-state is invalid', () => {
    const t = newType();
    t.addState('draft', 'Draft').addState('published', 'Published');
    expect(() => t.addTransition('publish', 'Publish', ['ghost'], 'published')).toThrow(/does not exist/);
    expect(t.hasTransition('publish')).toBe(false);
  });

  it('forbids two transitions sharing the same from->to pair', () => {
    const t = newType();
    t.addState('draft', 'Draft').addState('published', 'Published');
    t.addTransition('publish', 'Publish', ['draft'], 'published');
    expect(() => t.addTransition('publish2', 'Publish 2', ['draft'], 'published')).toThrow(/already allows/);
  });

  it('sorts and de-keys the "from" state IDs', () => {
    const t = newType();
    t.addState('a', 'A').addState('b', 'B').addState('c', 'C');
    t.addTransition('go', 'Go', ['c', 'a'], 'b');
    expect(t.getTransition('go').from().map((s) => s.id())).toEqual(['a', 'c']);
  });

  it('queries transitions by state and direction', () => {
    const t = newType();
    t.addState('draft', 'Draft').addState('published', 'Published');
    t.addTransition('publish', 'Publish', ['draft'], 'published');
    expect(t.getTransitionsForState('draft').map((x) => x.id())).toEqual(['publish']);
    expect(t.getTransitionsForState('published').map((x) => x.id())).toEqual([]);
    expect(t.getTransitionsForState('published', 'to').map((x) => x.id())).toEqual(['publish']);
  });

  it('resolves transition from-state to-state and reports existence', () => {
    const t = newType();
    t.addState('draft', 'Draft').addState('published', 'Published');
    t.addTransition('publish', 'Publish', ['draft'], 'published');
    expect(t.hasTransitionFromStateToState('draft', 'published')).toBe(true);
    expect(t.getTransitionFromStateToState('draft', 'published').id()).toBe('publish');
    expect(t.hasTransitionFromStateToState('published', 'draft')).toBe(false);
    expect(() => t.getTransitionFromStateToState('published', 'draft')).toThrow(/does not exist/);
  });

  it('updates label, weight, and from-states; rejects bad weights', () => {
    const t = newType();
    t.addState('draft', 'Draft').addState('review', 'Review').addState('published', 'Published');
    t.addTransition('publish', 'Publish', ['draft'], 'published');
    t.setTransitionLabel('publish', 'Go live').setTransitionWeight('publish', 7);
    t.setTransitionFromStates('publish', ['draft', 'review']);
    const tr = t.getTransition('publish');
    expect(tr.label()).toBe('Go live');
    expect(tr.weight()).toBe(7);
    expect(tr.from().map((s) => s.id())).toEqual(['draft', 'review']);
    // @ts-expect-error runtime guard
    expect(() => t.setTransitionWeight('publish', 'x')).toThrow(/must be numeric/);
  });

  it('deletes a transition', () => {
    const t = newType();
    t.addState('draft', 'Draft').addState('published', 'Published');
    t.addTransition('publish', 'Publish', ['draft'], 'published');
    t.deleteTransition('publish');
    expect(t.hasTransition('publish')).toBe(false);
    expect(() => t.deleteTransition('publish')).toThrow(/does not exist/);
  });
});
