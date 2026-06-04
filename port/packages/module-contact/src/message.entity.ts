/**
 * The contact message content entity. Ports `Drupal\contact\Entity\Message` and
 * `Drupal\contact\MessageInterface`.
 *
 * In Drupal this is a `ContentEntityBase` with `ContentEntityNullStorage` (never
 * persisted — built, validated, mailed, discarded) declared via
 * `#[ContentEntityType(id: 'contact_message')]`, whose bundle is a
 * {@link ContactForm}. This slice models the base fields the mail/handler flow
 * reads (name, mail, subject, message, copy, recipient) plus the personal/site
 * distinction. The typed-data field API and storage live in @drupaljs/entity.
 */

import { PERSONAL_FORM_ID } from './contact-form.entity.js';
import type { ContactFormInterface } from './contact-form.entity.js';

/**
 * The recipient user of a personal contact message. Ports the slice of
 * `Drupal\user\UserInterface` the mail flow reads.
 *
 * TODO(@drupaljs/module-user): replace with the shared UserInterface once it
 * lands.
 */
export interface RecipientUser {
  id(): number | string;
  getEmail(): string | null;
  getPreferredLangcode(): string;
  getAccountName(): string;
  getDisplayName(): string;
}

/** Plain values used to construct a Message. Mirrors the base field set. */
export interface MessageValues {
  /** Bundle: the contact_form id this message belongs to. */
  readonly contactForm: ContactFormInterface;
  readonly langcode?: string;
  readonly name?: string;
  readonly mail?: string;
  readonly subject?: string;
  readonly message?: string;
  readonly copy?: boolean;
  /** Recipient user (personal contact form only). */
  readonly recipient?: RecipientUser;
}

/** Provides an interface defining a contact message entity. */
export interface MessageInterface {
  /** The bundle (contact_form) this message belongs to. */
  getContactForm(): ContactFormInterface;
  getSenderName(): string;
  setSenderName(senderName: string): void;
  getSenderMail(): string;
  setSenderMail(senderMail: string): void;
  getSubject(): string;
  setSubject(subject: string): void;
  getMessage(): string;
  setMessage(message: string): void;
  /** TRUE if a copy should be sent to the sender. */
  copySender(): boolean;
  setCopySender(inform: boolean): void;
  /** TRUE if this is the personal contact form bundle. */
  isPersonal(): boolean;
  /** The user this message is being sent to, or undefined for non-personal. */
  getPersonalRecipient(): RecipientUser | undefined;
}

/** The entity type id, matching `#[ContentEntityType(id: 'contact_message')]`. */
export const CONTACT_MESSAGE_ENTITY_TYPE = 'contact_message';

export class Message implements MessageInterface {
  private readonly _contactForm: ContactFormInterface;
  private _name: string;
  private _mail: string;
  private _subject: string;
  private _message: string;
  private _copy: boolean;
  private readonly _recipient: RecipientUser | undefined;

  constructor(values: MessageValues) {
    this._contactForm = values.contactForm;
    this._name = values.name ?? '';
    this._mail = values.mail ?? '';
    this._subject = values.subject ?? '';
    this._message = values.message ?? '';
    this._copy = values.copy ?? false;
    this._recipient = values.recipient;
  }

  /** Ports Message::isPersonal(): true when bundle == 'personal'. */
  isPersonal(): boolean {
    return this._contactForm.id() === PERSONAL_FORM_ID;
  }

  getContactForm(): ContactFormInterface {
    return this._contactForm;
  }

  getSenderName(): string {
    return this._name;
  }

  setSenderName(senderName: string): void {
    this._name = senderName;
  }

  getSenderMail(): string {
    return this._mail;
  }

  setSenderMail(senderMail: string): void {
    this._mail = senderMail;
  }

  getSubject(): string {
    return this._subject;
  }

  setSubject(subject: string): void {
    this._subject = subject;
  }

  getMessage(): string {
    return this._message;
  }

  setMessage(message: string): void {
    this._message = message;
  }

  copySender(): boolean {
    return this._copy;
  }

  setCopySender(inform: boolean): void {
    this._copy = Boolean(inform);
  }

  /**
   * Ports Message::getPersonalRecipient(): the recipient is only meaningful for
   * the personal contact form bundle.
   */
  getPersonalRecipient(): RecipientUser | undefined {
    return this.isPersonal() ? this._recipient : undefined;
  }
}
