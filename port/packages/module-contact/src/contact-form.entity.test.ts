import { describe, it, expect } from 'vitest';
import {
  ContactForm,
  CONTACT_FORM_ENTITY_TYPE,
  PERSONAL_FORM_ID,
} from './contact-form.entity.js';

describe('ContactForm entity', () => {
  it('exposes the contact_form entity type id and personal bundle id', () => {
    expect(CONTACT_FORM_ENTITY_TYPE).toBe('contact_form');
    expect(PERSONAL_FORM_ID).toBe('personal');
  });

  it('applies the same property defaults as the PHP entity', () => {
    const form = new ContactForm({ id: 'feedback' });
    expect(form.id()).toBe('feedback');
    expect(form.label()).toBeNull();
    expect(form.getMessage()).toBe('');
    expect(form.getRecipients()).toEqual([]);
    expect(form.getRedirectPath()).toBe('');
    expect(form.getReply()).toBe('');
    expect(form.getWeight()).toBe(0);
  });

  it('reads the config-exported values when provided', () => {
    const form = new ContactForm({
      id: 'feedback',
      label: 'Website feedback',
      recipients: ['admin@example.com', 'team@example.com'],
      reply: 'Thanks for reaching out.',
      weight: 3,
      message: 'Your message has been sent.',
      redirect: '/thank-you',
    });
    expect(form.label()).toBe('Website feedback');
    expect(form.getRecipients()).toEqual(['admin@example.com', 'team@example.com']);
    expect(form.getReply()).toBe('Thanks for reaching out.');
    expect(form.getWeight()).toBe(3);
    expect(form.getMessage()).toBe('Your message has been sent.');
    expect(form.getRedirectPath()).toBe('/thank-you');
  });

  it('returns the <front> route when no redirect path is configured', () => {
    const form = new ContactForm({ id: 'feedback' });
    expect(form.getRedirectUrl()).toEqual({ route: '<front>' });
  });

  it('returns a user-input url when a redirect path is configured', () => {
    const form = new ContactForm({ id: 'feedback', redirect: '/thanks' });
    expect(form.getRedirectUrl()).toEqual({ path: '/thanks' });
  });

  it('returns $this from setters for fluent chaining (ports ActionMethod setters)', () => {
    const form = new ContactForm({ id: 'feedback' });
    const chained = form
      .setMessage('Sent')
      .setRecipients(['a@b.com'])
      .setRedirectPath('/done')
      .setReply('Auto reply')
      .setWeight(5);
    expect(chained).toBe(form);
    expect(form.getMessage()).toBe('Sent');
    expect(form.getRecipients()).toEqual(['a@b.com']);
    expect(form.getRedirectUrl()).toEqual({ path: '/done' });
    expect(form.getReply()).toBe('Auto reply');
    expect(form.getWeight()).toBe(5);
  });
});
