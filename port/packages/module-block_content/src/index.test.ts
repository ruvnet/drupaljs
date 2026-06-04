import { describe, it, expect } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  installBlockContentModule,
  BlockContent,
  BlockContentType,
  allPermissions,
  getRoutes,
} from './index.js';

describe('@drupaljs/module-block_content public API', () => {
  it('re-exports the entities, permissions and routes', () => {
    expect(typeof BlockContent).toBe('function');
    expect(typeof BlockContentType).toBe('function');
    expect(getRoutes()['block_content.add_form']).toBeDefined();
    expect(allPermissions()['access block library']).toBeDefined();
  });

  it('installBlockContentModule wires hooks into the module handler', () => {
    const mh = new ModuleHandler();
    mh.setModuleList({ block_content: { name: 'block_content' } });
    installBlockContentModule(mh);
    expect(mh.hasImplementations('theme')).toBe(true);
    expect(mh.hasImplementations('entity_type_alter')).toBe(true);
  });

  it('end-to-end: a reusable block built from a type yields per-type permissions', () => {
    const type = new BlockContentType({ id: 'basic', label: 'Basic' });
    const block = new BlockContent({ type: type.getId(), info: 'Hi' });
    expect(block.bundle()).toBe('basic');
    expect(allPermissions([type])['create basic block content']).toBeDefined();
  });
});
