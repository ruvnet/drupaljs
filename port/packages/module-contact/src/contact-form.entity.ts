/**
 * The contact form config entity. Ports `Drupal\contact\Entity\ContactForm`
 * and `Drupal\contact\ContactFormInterface`.
 *
 * In Drupal this is a `ConfigEntityBundleBase` (the bundle of `contact_message`)
 * declared via the `#[ConfigEntityType]` attribute. This slice models the
 * config-exported fields (id, label, recipients, reply, weight, message,
 * redirect) and the getter/setter contract; storage and the full config-entity
 * lifecycle live in @drupaljs/entity / @drupaljs/config.
 */

/**
 * A redirect target. Ports the slice of `Drupal\Core\Url` getRedirectUrl()
 * returns: either a user-input path or the `<front>` route.
 *
 * TODO(@drupaljs/link): replace with the shared Url type once it lands.
 */
export interface RedirectUrl {
  /** When set, a user-input path such as "/thanks". */
  readonly path?: string;
  /** When set, a route name such as "<front>". */
  readonly route?: string;
}

/** Plain values used to construct a ContactForm. Mirrors `config_export`. */
export interface ContactFormValues {
  readonly id: string;
  readonly label?: string;
  readonly recipients?: readonly string[];
  readonly reply?: string;
  readonly weight?: number;
  readonly message?: string;
  readonly redirect?: string;
}

/** Provides an interface defining a contact form entity. */
export interface ContactFormInterface {
  /** The config entity machine id. Ports ConfigEntityInterface::id(). */
  id(): string;
  /** The human-readable label. Ports EntityInterface::label(). */
  label(): string | null;
  /** Returns the message to be displayed to the user after submission. */
  getMessage(): string;
  /** Returns the list of recipient email addresses. */
  getRecipients(): readonly string[];
  /** Returns the redirect path string. */
  getRedirectPath(): string;
  /** Returns the redirect target (front page when no path configured). */
  getRedirectUrl(): RedirectUrl;
  /** Returns the auto-reply message. */
  getReply(): string;
  /** Returns the weight (used for sorting). */
  getWeight(): number;
  setMessage(message: string): this;
  setRecipients(recipients: readonly string[]): this;
  setRedirectPath(redirect: string): this;
  setReply(reply: string): this;
  setWeight(weight: number): this;
}

/** The entity type id, matching `#[ConfigEntityType(id: 'contact_form')]`. */
export const CONTACT_FORM_ENTITY_TYPE = 'contact_form';

/** The bundle id reserved for the personal contact form. */
export const PERSONAL_FORM_ID = 'personal';

export class ContactForm implements ContactFormInterface {
  private readonly _id: string;
  private _label: string | null;
  private _message: string;
  private _recipients: readonly string[];
  private _redirect: string;
  private _reply: string;
  private _weight: number;

  constructor(values: ContactFormValues) {
    this._id = values.id;
    this._label = values.label ?? null;
    this._message = values.message ?? '';
    this._recipients = values.recipients ?? [];
    this._redirect = values.redirect ?? '';
    this._reply = values.reply ?? '';
    this._weight = values.weight ?? 0;
  }

  id(): string {
    return this._id;
  }

  label(): string | null {
    return this._label;
  }

  getMessage(): string {
    return this._message;
  }

  setMessage(message: string): this {
    this._message = message;
    return this;
  }

  getRecipients(): readonly string[] {
    return this._recipients;
  }

  setRecipients(recipients: readonly string[]): this {
    this._recipients = recipients;
    return this;
  }

  getRedirectPath(): string {
    return this._redirect;
  }

  /**
   * Ports ContactForm::getRedirectUrl(): a configured path resolves to a
   * user-input URL, otherwise the `<front>` route.
   */
  getRedirectUrl(): RedirectUrl {
    return this._redirect ? { path: this._redirect } : { route: '<front>' };
  }

  setRedirectPath(redirect: string): this {
    this._redirect = redirect;
    return this;
  }

  getReply(): string {
    return this._reply;
  }

  setReply(reply: string): this {
    this._reply = reply;
    return this;
  }

  getWeight(): number {
    return this._weight;
  }

  setWeight(weight: number): this {
    this._weight = weight;
    return this;
  }
}
