import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleHandler } from '@drupaljs/hook';
import {
  registerUserHooks,
  userLogin,
  userLogout,
  userRoleInsert,
  USER_MODULE,
  type UserHookServices,
} from './hooks.js';
import { User } from './entity/user.js';

function makeServices(): UserHookServices & {
  themeManager: { resetActiveTheme: ReturnType<typeof vi.fn> };
  messenger: { addStatus: ReturnType<typeof vi.fn> };
  actionStorage: { ensureRoleActions: ReturnType<typeof vi.fn> };
} {
  return {
    themeManager: { resetActiveTheme: vi.fn() },
    messenger: { addStatus: vi.fn() },
    actionStorage: { ensureRoleActions: vi.fn() },
  };
}

describe('user hooks — direct behavior', () => {
  it('user_login resets the theme and warns when timezone is unset', () => {
    const svc = makeServices();
    userLogin(new User({ uid: 1 }), svc, null);
    expect(svc.themeManager.resetActiveTheme).toHaveBeenCalledOnce();
    expect(svc.messenger.addStatus).toHaveBeenCalledOnce();
  });

  it('user_login does not warn when a timezone is set', () => {
    const svc = makeServices();
    userLogin(new User({ uid: 1 }), svc, 'UTC');
    expect(svc.themeManager.resetActiveTheme).toHaveBeenCalledOnce();
    expect(svc.messenger.addStatus).not.toHaveBeenCalled();
  });

  it('user_logout resets the active theme', () => {
    const svc = makeServices();
    userLogout(new User({ uid: 1 }), svc);
    expect(svc.themeManager.resetActiveTheme).toHaveBeenCalledOnce();
  });

  it('user_role_insert creates actions for normal roles but skips locked roles', () => {
    const svc = makeServices();
    userRoleInsert({ id: () => 'editor' }, svc);
    expect(svc.actionStorage.ensureRoleActions).toHaveBeenCalledWith('editor');

    svc.actionStorage.ensureRoleActions.mockClear();
    userRoleInsert({ id: () => 'authenticated' }, svc);
    userRoleInsert({ id: () => 'anonymous' }, svc);
    expect(svc.actionStorage.ensureRoleActions).not.toHaveBeenCalled();
  });
});

describe('user hooks — registration via @drupaljs/hook', () => {
  let handler: ModuleHandler;
  let svc: ReturnType<typeof makeServices>;

  beforeEach(() => {
    handler = new ModuleHandler();
    handler.setModuleList({ user: { name: USER_MODULE } });
    svc = makeServices();
    registerUserHooks(handler, svc);
  });

  it('registers user_login / user_logout / user_role_insert under the "user" module', () => {
    expect(handler.hasImplementations('user_login')).toBe(true);
    expect(handler.hasImplementations('user_logout')).toBe(true);
    expect(handler.hasImplementations('user_role_insert')).toBe(true);
    expect(handler.getImplementations('user_login')).toEqual(['user']);
  });

  it('invokes the registered user_login implementation through the handler', () => {
    handler.invokeAll('user_login', [new User({ uid: 2 }), null]);
    expect(svc.themeManager.resetActiveTheme).toHaveBeenCalledOnce();
    expect(svc.messenger.addStatus).toHaveBeenCalledOnce();
  });

  it('invokes user_role_insert through the handler', () => {
    handler.invoke('user', 'user_role_insert', [{ id: () => 'editor' }]);
    expect(svc.actionStorage.ensureRoleActions).toHaveBeenCalledWith('editor');
  });
});
