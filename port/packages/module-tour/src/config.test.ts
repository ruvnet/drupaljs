import { describe, it, expect } from 'vitest';
import { TOUR_PERMISSIONS, ACCESS_TOUR } from './permissions.js';
import { TOUR_ROUTES } from './routes.js';

describe('tour permissions', () => {
  it('defines the "access tour" permission', () => {
    expect(ACCESS_TOUR).toBe('access tour');
    expect(TOUR_PERMISSIONS[ACCESS_TOUR]?.title).toBeTruthy();
  });
});

describe('tour routes', () => {
  it('defines the tour.tip render route guarded by the access tour permission', () => {
    const route = TOUR_ROUTES['tour.tip'];
    expect(route?.path).toContain('/tour');
    expect(route?.requirements._permission).toBe(ACCESS_TOUR);
  });
});
