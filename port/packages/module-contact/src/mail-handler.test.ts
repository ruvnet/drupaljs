import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MailHandler,
  MailHandlerException,
  type MailManager,
  type LanguageManager,
  type Logger,
  type SenderAccount,
} from './mail-handler.js';
import { Message } from './message.entity.js';
import { ContactForm } from './contact-form.entity.js';
import type { RecipientUser } from './message.entity.js';

function makeMailManager(): MailManager {
  return { mail: vi.fn() };
}

function makeLanguageManager(): LanguageManager {
  return {
    getCurrentLanguageId: vi.fn(() => 'en'),
    getDefaultLanguageId: vi.fn(() => 'en'),
  };
}

function makeLogger(): Logger {
  return { info: vi.fn(), error: vi.fn() };
}

function authenticatedSender(email: string | null = 'sender@example.com'): SenderAccount {
  return {
    id: () => 1,
    isAnonymous: () => false,
    getEmail: () => email,
    getAccountName: () => 'sender',
  };
}

function anonymousSender(): SenderAccount {
  return {
    id: () => 0,
    isAnonymous: () => true,
    getEmail: () => null,
    getAccountName: () => 'Anonymous',
  };
}

function makeRecipient(email: string | null = 'recipient@example.com'): RecipientUser {
  return {
    id: () => 42,
    getEmail: () => email,
    getPreferredLangcode: () => 'de',
    getAccountName: () => 'recipient',
    getDisplayName: () => 'Recipient User',
  };
}

describe('MailHandler.sendMailMessages — site-wide form', () => {
  let mail: MailManager;
  let lang: LanguageManager;
  let logger: Logger;

  beforeEach(() => {
    mail = makeMailManager();
    lang = makeLanguageManager();
    logger = makeLogger();
  });

  it('sends page_mail to all joined recipients in the default language', () => {
    const form = new ContactForm({
      id: 'feedback',
      label: 'Feedback',
      recipients: ['a@example.com', 'b@example.com'],
    });
    const message = new Message({ contactForm: form, subject: 'Hi', message: 'Body' });
    new MailHandler(mail, lang, logger).sendMailMessages(message, authenticatedSender());

    expect(mail.mail).toHaveBeenCalledWith(
      'contact',
      'page_mail',
      'a@example.com, b@example.com',
      'en',
      expect.objectContaining({ contact_form: form, contact_message: message }),
      'sender@example.com',
    );
  });

  it('sends a copy to the sender when copy is requested', () => {
    const form = new ContactForm({ id: 'feedback', recipients: ['a@example.com'] });
    const message = new Message({ contactForm: form, copy: true });
    new MailHandler(mail, lang, logger).sendMailMessages(message, authenticatedSender());

    expect(mail.mail).toHaveBeenCalledWith(
      'contact',
      'page_copy',
      'sender@example.com',
      'en',
      expect.any(Object),
      'sender@example.com',
    );
  });

  it('does not send a copy when copy is not requested', () => {
    const form = new ContactForm({ id: 'feedback', recipients: ['a@example.com'] });
    const message = new Message({ contactForm: form, copy: false });
    new MailHandler(mail, lang, logger).sendMailMessages(message, authenticatedSender());

    const keys = (mail.mail as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[1]);
    expect(keys).not.toContain('page_copy');
  });

  it('sends an auto-reply when the form configures a reply and sender has an email', () => {
    const form = new ContactForm({
      id: 'feedback',
      recipients: ['a@example.com'],
      reply: 'Thanks!',
    });
    const message = new Message({ contactForm: form });
    new MailHandler(mail, lang, logger).sendMailMessages(message, authenticatedSender());

    expect(mail.mail).toHaveBeenCalledWith(
      'contact',
      'page_autoreply',
      'sender@example.com',
      'en',
      expect.any(Object),
    );
  });

  it('logs an error (and skips auto-reply) when reply is set but sender has no email', () => {
    const form = new ContactForm({
      id: 'feedback',
      recipients: ['a@example.com'],
      reply: 'Thanks!',
    });
    const message = new Message({ contactForm: form });
    new MailHandler(mail, lang, logger).sendMailMessages(message, anonymousSender());

    const keys = (mail.mail as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[1]);
    expect(keys).not.toContain('page_autoreply');
    expect(logger.error).toHaveBeenCalled();
  });

  it('uses the anonymous sender mail from the message as the reply-to', () => {
    const form = new ContactForm({ id: 'feedback', recipients: ['a@example.com'] });
    const message = new Message({ contactForm: form, mail: 'anon@example.com' });
    new MailHandler(mail, lang, logger).sendMailMessages(message, anonymousSender());

    expect(mail.mail).toHaveBeenCalledWith(
      'contact',
      'page_mail',
      'a@example.com',
      'en',
      expect.any(Object),
      'anon@example.com',
    );
  });

  it('logs an informational entry for site-wide messages', () => {
    const form = new ContactForm({ id: 'feedback', label: 'Feedback', recipients: ['a@example.com'] });
    const message = new Message({ contactForm: form });
    new MailHandler(mail, lang, logger).sendMailMessages(message, authenticatedSender());
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('sent an email regarding'),
      expect.any(Object),
    );
  });
});

describe('MailHandler.sendMailMessages — personal form', () => {
  it('sends user_mail to the recipient in their preferred language', () => {
    const mail = makeMailManager();
    const lang = makeLanguageManager();
    const logger = makeLogger();
    const recipient = makeRecipient();
    const message = new Message({
      contactForm: new ContactForm({ id: 'personal' }),
      recipient,
    });
    new MailHandler(mail, lang, logger).sendMailMessages(message, authenticatedSender());

    expect(mail.mail).toHaveBeenCalledWith(
      'contact',
      'user_mail',
      'recipient@example.com',
      'de',
      expect.objectContaining({ recipient }),
      'sender@example.com',
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('an email.'),
      expect.any(Object),
    );
  });

  it('throws MailHandlerException when a personal message has no recipient', () => {
    const handler = new MailHandler(makeMailManager(), makeLanguageManager(), makeLogger());
    const message = new Message({ contactForm: new ContactForm({ id: 'personal' }) });
    expect(() => handler.sendMailMessages(message, authenticatedSender())).toThrow(
      MailHandlerException,
    );
  });

  it('never sends an auto-reply for personal forms', () => {
    const mail = makeMailManager();
    const message = new Message({
      contactForm: new ContactForm({ id: 'personal' }),
      recipient: makeRecipient(),
    });
    new MailHandler(mail, makeLanguageManager(), makeLogger()).sendMailMessages(
      message,
      authenticatedSender(),
    );
    const keys = (mail.mail as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[1]);
    expect(keys).not.toContain('page_autoreply');
  });
});
