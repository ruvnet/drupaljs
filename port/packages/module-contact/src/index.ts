/**
 * @drupaljs/module-contact — TypeScript port of Drupal core's `contact` module.
 *
 * A faithful, minimal vertical slice of the contact subsystem:
 * - Entities: {@link ContactForm} (config bundle entity) and {@link Message}
 *   (content entity), with their interfaces.
 * - Permissions ({@link contactPermissions}) and routes ({@link contactRoutes}).
 * - Access: {@link ContactFormAccessControlHandler},
 *   {@link ContactPageAccess}, and {@link AccessResult}.
 * - Service: {@link MailHandler} (assembly/dispatch of contact mail) +
 *   {@link MailHandlerException}.
 * - Hook implementations registered via `@drupaljs/hook`
 *   ({@link registerContactHooks}).
 *
 * Reference: drupal-core/core/modules/contact.
 */

// Permissions
export {
  ContactPermission,
  contactPermissions,
  type PermissionDefinition,
  type ContactPermissionName,
} from './permissions.js';

// Routing
export {
  contactRoutes,
  type RouteDefinition,
  type RouteRequirements,
} from './routing.js';

// Contact form (config bundle entity)
export {
  ContactForm,
  CONTACT_FORM_ENTITY_TYPE,
  PERSONAL_FORM_ID,
  type ContactFormInterface,
  type ContactFormValues,
  type RedirectUrl,
} from './contact-form.entity.js';

// Message (content entity)
export {
  Message,
  CONTACT_MESSAGE_ENTITY_TYPE,
  type MessageInterface,
  type MessageValues,
  type RecipientUser,
} from './message.entity.js';

// Access control
export {
  AccessResult,
  ContactFormAccessControlHandler,
  ContactPageAccess,
  type AccessAccount,
  type AccessOperation,
  type ContactAccount,
  type ContactUserData,
  type ContactSettings,
} from './contact-access.js';

// Mail handler service
export {
  MailHandler,
  MailHandlerException,
  type MailHandlerInterface,
  type MailManager,
  type LanguageManager,
  type Logger,
  type SenderAccount,
} from './mail-handler.js';

// Hooks
export {
  MODULE_NAME,
  contactHelp,
  contactEntityTypeAlter,
  contactEntityExtraFieldInfo,
  contactMenuLocalTasksAlter,
  registerContactHooks,
  type AlterableEntityType,
  type LocalTask,
} from './hooks.js';
