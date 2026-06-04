import { defineWorkspace } from 'vitest/config';

// Each package is auto-discovered as a Vitest project via its own config or the
// default glob. Agents add packages under packages/* — no edits needed here.
export default defineWorkspace([
  'packages/*',
]);
