import { describe, it, expect, vi } from 'vitest';
import { Message, CONTACT_MESSAGE_ENTITY_TYPE } from './message.entity.js';
import { ContactForm } from './contact-form.entity.js';
import type { RecipientUser } from './message.entity.js';

function makeRecipient(): RecipientUser {
  return {
    id: vi.fn(() => 42),
    getEmail: vi.fn(() => 'recipient@example.com'),
    getPreferredLangcode: vi.fn(() => 'de'),
    getAccountName: vi.fn(() => 'recipient'),
    getDisplayName: vi.fn(() => 'Recipient User'),
  };
}

describe('Message entity', () => {
  it('exposes the contact_message entity type id', () => {
    expect(CONTACT_MESSAGE_ENTITY_TYPE).toBe('contact_message');
  });

  it('reads sender/subject/message fields and copy flag', () => {
    const form = new ContactForm({ id: 'feedback' });
    const message = new Message({
      contactForm: form,
      name: 'Jane',
      mail: 'jane@example.com',
      subject: 'Hello',
      message: 'A question',
      copy: true,
    });
    expect(message.getContactForm()).toBe(form);
    expect(message.getSenderName()).toBe('Jane');
    expect(message.getSenderMail()).toBe('jane@example.com');
    expect(message.getSubject()).toBe('Hello');
    expect(message.getMessage()).toBe('A question');
    expect(message.copySender()).toBe(true);
  });

  it('defaults copy to false and coerces setCopySender to boolean', () => {
    const message = new Message({ contactForm: new ContactForm({ id: 'feedback' }) });
    expect(message.copySender()).toBe(false);
    message.setCopySender(true);
    expect(message.copySender()).toBe(true);
  });

  it('is personal only when the bundle id is "personal"', () => {
    const site = new Message({ contactForm: new ContactForm({ id: 'feedback' }) });
    const personal = new Message({ contactForm: new ContactForm({ id: 'personal' }) });
    expect(site.isPersonal()).toBe(false);
    expect(personal.isPersonal()).toBe(true);
  });

  it('returns the personal recipient only for the personal bundle', () => {
    const recipient = makeRecipient();
    const personal = new Message({
      contactForm: new ContactForm({ id: 'personal' }),
      recipient,
    });
    const site = new Message({
      contactForm: new ContactForm({ id: 'feedback' }),
      recipient,
    });
    expect(personal.getPersonalRecipient()).toBe(recipient);
    // Non-personal messages have no recipient even if one was supplied.
    expect(site.getPersonalRecipient()).toBeUndefined();
  });

  it('mutates fields through setters', () => {
    const message = new Message({ contactForm: new ContactForm({ id: 'feedback' }) });
    message.setSenderName('Bob');
    message.setSenderMail('bob@example.com');
    message.setSubject('Subject');
    message.setMessage('Body');
    expect(message.getSenderName()).toBe('Bob');
    expect(message.getSenderMail()).toBe('bob@example.com');
    expect(message.getSubject()).toBe('Subject');
    expect(message.getMessage()).toBe('Body');
  });
});
