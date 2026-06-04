import { describe, it, expect } from 'vitest';
import { USER_ROUTES } from './routes.js';

describe('user module routes', () => {
  it('defines the canonical user-facing routes', () => {
    expect(USER_ROUTES['user.register'].path).toBe('/user/register');
    expect(USER_ROUTES['user.logout'].path).toBe('/user/logout');
    expect(USER_ROUTES['entity.user.canonical'].path).toBe('/user/{user}');
    expect(USER_ROUTES['entity.user.collection'].path).toBe('/admin/people');
  });

  it('attaches access requirements ported from the routing.yml', () => {
    expect(USER_ROUTES['entity.user.collection'].requirements).toMatchObject({
      _permission: 'administer users',
    });
    expect(USER_ROUTES['user.logout'].requirements).toMatchObject({
      _user_is_logged_in: 'TRUE',
      _csrf_token: 'TRUE',
    });
  });

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(USER_ROUTES)).toBe(true);
  });
});
