/**
 * Assembly and dispatch of contact mail messages. Ports
 * `Drupal\contact\MailHandler` / `MailHandlerInterface` and
 * `MailHandlerException`.
 *
 * The handler decides, given a {@link MessageInterface} and the sending account,
 * which mails to dispatch (to recipients, an optional copy to the sender, and an
 * optional auto-reply for site-wide forms) and logs the outcome. The actual mail
 * formatting/templating is the `hook_mail` implementation's job (see hooks.ts);
 * here we only orchestrate the MailManager calls — faithful to the PHP control
 * flow.
 */

import type { MessageInterface, RecipientUser } from './message.entity.js';

/** Thrown when the message recipient cannot be determined. Ports MailHandlerException. */
export class MailHandlerException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailHandlerException';
  }
}

/**
 * The account sending the contact message. Ports the slice of
 * `Drupal\Core\Session\AccountInterface` + UserInterface the handler uses.
 *
 * TODO(@drupaljs/module-user): replace with shared Account/UserInterface.
 */
export interface SenderAccount {
  id(): number | string;
  isAnonymous(): boolean;
  getEmail(): string | null;
  getAccountName(): string;
}

/**
 * Mail manager collaborator. Ports the single `MailManagerInterface::mail()`
 * call the handler makes.
 *
 * TODO(@drupaljs/mail): replace with the shared MailManagerInterface.
 */
export interface MailManager {
  mail(
    module: string,
    key: string,
    to: string,
    langcode: string,
    params: Record<string, unknown>,
    reply?: string | null,
  ): void;
}

/** Language manager collaborator (current + default language ids). */
export interface LanguageManager {
  getCurrentLanguageId(): string;
  getDefaultLanguageId(): string;
}

/** Logger collaborator. Ports the LoggerChannel slice used here. */
export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface MailHandlerInterface {
  sendMailMessages(message: MessageInterface, sender: SenderAccount): void;
}

export class MailHandler implements MailHandlerInterface {
  constructor(
    private readonly mailManager: MailManager,
    private readonly languageManager: LanguageManager,
    private readonly logger: Logger,
  ) {}

  /**
   * Ports MailHandler::sendMailMessages(). Note: the PHP version clones the
   * sender user and overrides name/mail for anonymous senders; this slice reads
   * those values directly off the message instead (the dispatch decisions and
   * logging are identical).
   */
  sendMailMessages(message: MessageInterface, sender: SenderAccount): void {
    const currentLangcode = this.languageManager.getCurrentLanguageId();
    let recipientLangcode = this.languageManager.getDefaultLanguageId();
    const contactForm = message.getContactForm();

    const params: Record<string, unknown> = {
      contact_message: message,
      sender,
    };

    let to: string;
    let recipient: RecipientUser | undefined;

    if (!message.isPersonal()) {
      // Send to the form recipient(s), using the site's default language.
      params.contact_form = contactForm;
      to = contactForm.getRecipients().join(', ');
    } else {
      recipient = message.getPersonalRecipient();
      if (recipient) {
        to = recipient.getEmail() ?? '';
        recipientLangcode = recipient.getPreferredLangcode();
        params.recipient = recipient;
      } else {
        throw new MailHandlerException('Unable to determine message recipient');
      }
    }

    const senderEmail = sender.isAnonymous() ? message.getSenderMail() : sender.getEmail();
    const keyPrefix = message.isPersonal() ? 'user' : 'page';

    // Send email to the recipient(s).
    this.mailManager.mail(
      'contact',
      `${keyPrefix}_mail`,
      to,
      recipientLangcode,
      params,
      senderEmail,
    );

    // If requested, send a copy to the sender, using the current language.
    if (message.copySender()) {
      this.mailManager.mail(
        'contact',
        `${keyPrefix}_copy`,
        senderEmail ?? '',
        currentLangcode,
        params,
        senderEmail,
      );
    }

    // If configured, send an auto-reply (site-wide forms only).
    if (!message.isPersonal() && contactForm.getReply()) {
      if (!senderEmail) {
        this.logger.error('Error sending auto-reply, missing sender email address in %contact_form', {
          '%contact_form': contactForm.label(),
        });
      } else {
        this.mailManager.mail(
          'contact',
          'page_autoreply',
          senderEmail,
          currentLangcode,
          params,
        );
      }
    }

    // Log the outcome.
    if (!message.isPersonal()) {
      this.logger.info('%sender-name (@sender-from) sent an email regarding %contact_form.', {
        '%sender-name': sender.getAccountName(),
        '@sender-from': senderEmail ?? '',
        '%contact_form': contactForm.label(),
      });
    } else {
      this.logger.info('%sender-name (@sender-from) sent %recipient-name an email.', {
        '%sender-name': sender.getAccountName(),
        '@sender-from': senderEmail ?? '',
        '%recipient-name': recipient!.getAccountName(),
      });
    }
  }
}
