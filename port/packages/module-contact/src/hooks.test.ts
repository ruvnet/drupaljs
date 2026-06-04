import { describe, it, expect, vi } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  MODULE_NAME,
  contactHelp,
  contactEntityTypeAlter,
  contactEntityExtraFieldInfo,
  contactMenuLocalTasksAlter,
  registerContactHooks,
  type AlterableEntityType,
  type LocalTask,
} from './hooks.js';

describe('contact hook_help', () => {
  it('returns about text for the contact help page', () => {
    expect(contactHelp('help.page.contact')).toContain('Contact module');
  });

  it('returns null for unrelated routes', () => {
    expect(contactHelp('help.page.node')).toBeNull();
  });
});

describe('contact hook_entity_type_alter', () => {
  it('adds the contact-form link template to the user entity type', () => {
    const user: AlterableEntityType = { setLinkTemplate: vi.fn() };
    contactEntityTypeAlter({ user });
    expect(user.setLinkTemplate).toHaveBeenCalledWith(
      'contact-form',
      '/user/{user}/contact',
    );
  });

  it('is a no-op when there is no user entity type', () => {
    expect(() => contactEntityTypeAlter({})).not.toThrow();
  });
});

describe('contact hook_entity_extra_field_info', () => {
  it('declares sender name/email, preview and copy pseudo-fields per bundle', () => {
    const info = contactEntityExtraFieldInfo(['feedback']);
    const form = (info.contact_message!.feedback as { form: Record<string, unknown> }).form;
    expect(Object.keys(form).sort()).toEqual(
      ['copy', 'mail', 'name', 'preview'].sort(),
    );
  });

  it('adds the recipient pseudo-field only for the personal bundle', () => {
    const info = contactEntityExtraFieldInfo(['feedback', 'personal']);
    const feedbackForm = (info.contact_message!.feedback as { form: Record<string, unknown> })
      .form;
    const personalForm = (info.contact_message!.personal as { form: Record<string, unknown> })
      .form;
    expect(feedbackForm.recipient).toBeUndefined();
    expect(personalForm.recipient).toBeDefined();
  });

  it('declares the user contact settings element', () => {
    const info = contactEntityExtraFieldInfo([]);
    const userForm = (info.user!.user as { form: Record<string, unknown> }).form;
    expect(userForm.contact).toEqual({
      label: 'Contact settings',
      description: 'Contact module form element.',
      weight: 5,
    });
  });
});

describe('contact hook_menu_local_tasks_alter', () => {
  const withEmail: LocalTask = {
    route: 'entity.user.contact_form',
    getRecipientEmail: () => 'u@example.com',
  };
  const withoutEmail: LocalTask = {
    route: 'entity.user.contact_form',
    getRecipientEmail: () => null,
  };
  const otherTab: LocalTask = {
    route: 'entity.user.edit_form',
    getRecipientEmail: () => null,
  };

  it('hides the contact tab when the target user has no email', () => {
    const result = contactMenuLocalTasksAlter([withoutEmail, otherTab], 'entity.user.canonical');
    expect(result).toEqual([otherTab]);
  });

  it('keeps the contact tab when the target user has an email', () => {
    const result = contactMenuLocalTasksAlter([withEmail], 'entity.user.canonical');
    expect(result).toEqual([withEmail]);
  });

  it('leaves tasks untouched on other routes', () => {
    const result = contactMenuLocalTasksAlter([withoutEmail], 'some.other.route');
    expect(result).toEqual([withoutEmail]);
  });
});

describe('registerContactHooks (integration with @drupaljs/hook)', () => {
  it('registers the contact hooks so the module handler invokes them', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ contact: { name: 'contact' } });
    registerContactHooks(handler, () => ['personal']);

    expect(handler.hasImplementations('help', MODULE_NAME)).toBe(true);
    expect(handler.hasImplementations('entity_type_alter', MODULE_NAME)).toBe(true);
    expect(handler.hasImplementations('entity_extra_field_info', MODULE_NAME)).toBe(true);
    expect(handler.hasImplementations('menu_local_tasks_alter', MODULE_NAME)).toBe(true);

    expect(handler.invoke('contact', 'help', ['help.page.contact'])).toContain(
      'Contact module',
    );
  });

  it('drives hook_entity_type_alter through the alter() pipeline', () => {
    const handler = new ModuleHandler();
    handler.setModuleList({ contact: { name: 'contact' } });
    registerContactHooks(handler);

    const user: AlterableEntityType = { setLinkTemplate: vi.fn() };
    handler.alter('entity_type', { user });
    expect(user.setLinkTemplate).toHaveBeenCalledWith(
      'contact-form',
      '/user/{user}/contact',
    );
  });
});
