export type Role = 'admin' | 'student' | 'curator' | 'analyst';

export const STAFF_ROLES: readonly Role[] = ['admin', 'curator', 'analyst'] as const;

export const ALL_ROLES: readonly Role[] = ['admin', 'student', 'curator', 'analyst'] as const;
