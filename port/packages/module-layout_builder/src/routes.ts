/**
 * Ports `layout_builder.routing.yml` as structured route data.
 *
 * Drupal routes map a path to a controller/form, a title, and access
 * requirements (here `_layout_builder_access`). The PHP controllers/forms are
 * out of scope for this vertical slice; the route table itself — paths,
 * parameters, defaults and the access op — is the portable contract.
 *
 * TODO(@drupaljs/routing): hand these definitions to the shared Route /
 * RouteCollection types from @drupaljs/routing once controllers are ported.
 */

/** Layout-builder access operation gating a route. */
export type LayoutBuilderAccessOp = 'view' | 'add_block';

export interface LayoutBuilderRoute {
  readonly name: string;
  readonly path: string;
  /** Required `_layout_builder_access` operation. */
  readonly access: LayoutBuilderAccessOp;
  /** True for admin-theme routes (`_admin_route: TRUE`). */
  readonly adminRoute: boolean;
  /** Route default values (controller, form, title or null placeholders). */
  readonly defaults: Readonly<Record<string, string | null>>;
}

export const ROUTES: readonly LayoutBuilderRoute[] = [
  {
    name: 'layout_builder.choose_section',
    path: '/layout_builder/choose/section/{section_storage_type}/{section_storage}/{delta}',
    access: 'view',
    adminRoute: true,
    defaults: {
      _controller: 'ChooseSectionController::build',
      _title: 'Choose a layout for this section',
    },
  },
  {
    name: 'layout_builder.add_section',
    path: '/layout_builder/add/section/{section_storage_type}/{section_storage}/{delta}/{plugin_id}',
    access: 'view',
    adminRoute: true,
    defaults: { _controller: 'AddSectionController::build' },
  },
  {
    name: 'layout_builder.configure_section',
    path: '/layout_builder/configure/section/{section_storage_type}/{section_storage}/{delta}/{plugin_id}',
    access: 'view',
    adminRoute: true,
    defaults: {
      _title: 'Configure section',
      _form: 'ConfigureSectionForm',
      plugin_id: null,
    },
  },
  {
    name: 'layout_builder.remove_section',
    path: '/layout_builder/remove/section/{section_storage_type}/{section_storage}/{delta}',
    access: 'view',
    adminRoute: true,
    defaults: { _form: 'RemoveSectionForm' },
  },
  {
    name: 'layout_builder.choose_block',
    path: '/layout_builder/choose/block/{section_storage_type}/{section_storage}/{delta}/{region}',
    access: 'view',
    adminRoute: true,
    defaults: { _controller: 'ChooseBlockController::build', _title: 'Choose a block' },
  },
  {
    name: 'layout_builder.add_block',
    path: '/layout_builder/add/block/{section_storage_type}/{section_storage}/{delta}/{region}/{plugin_id}',
    access: 'add_block',
    adminRoute: true,
    defaults: { _form: 'AddBlockForm', _title: 'Configure block' },
  },
  {
    name: 'layout_builder.update_block',
    path: '/layout_builder/update/block/{section_storage_type}/{section_storage}/{delta}/{region}/{uuid}',
    access: 'view',
    adminRoute: true,
    defaults: { _form: 'UpdateBlockForm', _title: 'Configure block' },
  },
  {
    name: 'layout_builder.move_block_form',
    path: '/layout_builder/move/block/{section_storage_type}/{section_storage}/{delta}/{region}/{uuid}',
    access: 'view',
    adminRoute: true,
    defaults: { _title_callback: 'MoveBlockForm::title', _form: 'MoveBlockForm' },
  },
  {
    name: 'layout_builder.remove_block',
    path: '/layout_builder/remove/block/{section_storage_type}/{section_storage}/{delta}/{region}/{uuid}',
    access: 'view',
    adminRoute: true,
    defaults: { _form: 'RemoveBlockForm' },
  },
] as const;

/** Looks up a route definition by name. */
export function getRoute(name: string): LayoutBuilderRoute | undefined {
  return ROUTES.find((route) => route.name === name);
}
