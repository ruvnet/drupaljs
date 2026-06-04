import { describe, it, expect } from 'vitest';
import * as contact from './index.js';

describe('@drupaljs/module-contact barrel', () => {
  it('re-exports the public API surface', () => {
    expect(typeof contact.ContactForm).toBe('function');
    expect(typeof contact.Message).toBe('function');
    expect(typeof contact.MailHandler).toBe('function');
    expect(typeof contact.MailHandlerException).toBe('function');
    expect(typeof contact.AccessResult).toBe('function');
    expect(typeof contact.ContactFormAccessControlHandler).toBe('function');
    expect(typeof contact.ContactPageAccess).toBe('function');
    expect(typeof contact.registerContactHooks).toBe('function');
    expect(contact.MODULE_NAME).toBe('contact');
    expect(contact.CONTACT_FORM_ENTITY_TYPE).toBe('contact_form');
    expect(contact.CONTACT_MESSAGE_ENTITY_TYPE).toBe('contact_message');
    expect(contact.PERSONAL_FORM_ID).toBe('personal');
    expect(Object.keys(contact.contactPermissions)).toHaveLength(3);
    expect(Object.keys(contact.contactRoutes)).toHaveLength(7);
  });
});
