/**
 * Contact module hook implementations, registered through `@drupaljs/hook`.
 *
 * Ports selected implementations from `Drupal\contact\Hook\ContactHooks`. In
 * Drupal these are `#[Hook(...)]`-attributed methods discovered by scanning;
 * here we register them explicitly via ModuleHandler::implement(), the
 * TS-idiomatic equivalent (see @drupaljs/hook's module docblock).
 *
 * Scope (self-contained logic only):
 * - `hook_help` for the contact help page,
 * - `hook_entity_type_alter` (adds the user `contact-form` link template),
 * - `hook_entity_extra_field_info` (pseudo form fields per contact_message
 *   bundle, plus the user `contact` settings element),
 * - `hook_menu_local_tasks_alter` (hides the Contact tab when the target user
 *   has no email).
 * Render/mail-template hooks (`hook_mail`) are owned by MailHandler's
 * collaborators and out of this slice.
 */

import type { ModuleHandlerInterface } from '@drupaljs/hook';

/** The module machine name. */
export const MODULE_NAME = 'contact';

/**
 * Ports the `help.page.contact` branch of ContactHooks::help(). Returns the
 * "About" help text for the contact module's help page, or null for other
 * routes. (Markup simplified; the informational content matches Drupal.)
 */
export function contactHelp(routeName: string): string | null {
  switch (routeName) {
    case 'help.page.contact':
      return (
        'The Contact module allows visitors to contact registered users on your ' +
        'site, using the personal contact form, and also allows you to set up ' +
        'site-wide contact forms.'
      );
    default:
      return null;
  }
}

/**
 * Ports ContactHooks::entityTypeAlter(): sets the `contact-form` link template
 * on the user entity type. Modelled as a mutation of an entity-types map keyed
 * by entity type id, where each value exposes a `setLinkTemplate` method
 * (matching EntityTypeInterface).
 */
export interface AlterableEntityType {
  setLinkTemplate(key: string, path: string): void;
}

export function contactEntityTypeAlter(
  entityTypes: Record<string, AlterableEntityType>,
): void {
  entityTypes.user?.setLinkTemplate('contact-form', '/user/{user}/contact');
}

/**
 * Ports ContactHooks::entityExtraFieldInfo(). For each contact_message bundle it
 * declares the pseudo form fields (sender name/email, recipient for the personal
 * bundle, preview, copy), plus the user `contact` settings form element.
 *
 * @param bundles The contact_message bundle ids (Drupal reads these from the
 *   entity-type bundle info; in this slice they are supplied explicitly).
 */
export function contactEntityExtraFieldInfo(
  bundles: readonly string[],
): Record<string, Record<string, unknown>> {
  const fields: Record<string, Record<string, unknown>> = { contact_message: {}, user: {} };

  for (const bundle of bundles) {
    const form: Record<string, unknown> = {
      name: { label: 'Sender name', description: 'Text', weight: -50 },
      mail: { label: 'Sender email', description: 'Email', weight: -40 },
    };
    if (bundle === 'personal') {
      form.recipient = { label: 'Recipient username', description: 'User', weight: -30 };
    }
    form.preview = { label: 'Preview sender message', description: 'Preview', weight: 40 };
    form.copy = { label: 'Send copy to sender', description: 'Option', weight: 50 };
    fields.contact_message![bundle] = { form };
  }

  fields.user!.user = {
    form: {
      contact: {
        label: 'Contact settings',
        description: 'Contact module form element.',
        weight: 5,
      },
    },
  };

  return fields;
}

/**
 * Local-task descriptor slice used by hook_menu_local_tasks_alter. Ports the
 * `$data['tabs'][0][$href]` shape the contact hook inspects.
 */
export interface LocalTask {
  /** The route name for the tab. */
  readonly route: string;
  /** Resolver for the contacted user's email, given the tab's route params. */
  getRecipientEmail(): string | null;
}

/**
 * Ports ContactHooks::menuLocalTasksAlter(): on the user canonical route, drops
 * the personal Contact tab when the contacted user has no email. Returns the
 * filtered task list (pure — the PHP unsets from `$data` by reference).
 */
export function contactMenuLocalTasksAlter(
  tasks: readonly LocalTask[],
  routeName: string,
): LocalTask[] {
  if (routeName !== 'entity.user.canonical') {
    return [...tasks];
  }
  return tasks.filter(
    (task) =>
      !(task.route === 'entity.user.contact_form' && !task.getRecipientEmail()),
  );
}

/**
 * Registers the contact module's hook implementations on a ModuleHandler.
 *
 * @param moduleHandler The handler to register on.
 * @param bundles A provider of the currently-defined contact_message bundles,
 *   used by the entity_extra_field_info hook (Drupal reads these from config).
 */
export function registerContactHooks(
  moduleHandler: ModuleHandlerInterface,
  bundles: () => readonly string[] = () => ['personal'],
): void {
  moduleHandler.implement(MODULE_NAME, 'help', (routeName: string) =>
    contactHelp(routeName),
  );
  moduleHandler.implement(
    MODULE_NAME,
    'entity_type_alter',
    (entityTypes: Record<string, AlterableEntityType>) =>
      contactEntityTypeAlter(entityTypes),
  );
  moduleHandler.implement(MODULE_NAME, 'entity_extra_field_info', () =>
    contactEntityExtraFieldInfo(bundles()),
  );
  moduleHandler.implement(
    MODULE_NAME,
    'menu_local_tasks_alter',
    (tasks: readonly LocalTask[], routeName: string) =>
      contactMenuLocalTasksAlter(tasks, routeName),
  );
}
