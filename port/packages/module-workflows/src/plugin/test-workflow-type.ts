/**
 * Minimal concrete workflow type plugin used to exercise {@link WorkflowTypeBase}.
 *
 * Mirrors core's test plugin (tests/modules/workflow_type_test). A real type
 * plugin (e.g. content_moderation's ContentModeration) would add bundle/entity
 * configuration on top of the base state/transition machine.
 */

import { WorkflowTypeBase } from './workflow-type-base.js';

export class TestWorkflowType extends WorkflowTypeBase {}
