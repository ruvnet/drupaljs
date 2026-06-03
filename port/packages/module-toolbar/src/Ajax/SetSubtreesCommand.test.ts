import { describe, it, expect } from 'vitest';
import { SetSubtreesCommand } from './SetSubtreesCommand.js';

describe('SetSubtreesCommand', () => {
  it('renders the setToolbarSubtrees command with stringified subtrees', () => {
    const cmd = new SetSubtreesCommand({ 'system-admin': '<div>tree</div>', node: 42 });
    expect(cmd.render()).toEqual({
      command: 'setToolbarSubtrees',
      subtrees: { 'system-admin': '<div>tree</div>', node: '42' },
    });
  });

  it('renders an empty object when there are no subtrees', () => {
    expect(new SetSubtreesCommand({}).render()).toEqual({
      command: 'setToolbarSubtrees',
      subtrees: {},
    });
  });
});
