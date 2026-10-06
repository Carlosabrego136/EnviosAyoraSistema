export type Role = 'admin' | 'worker';

export type Permission =
  | 'content.write'
  | 'content.delete'
  | 'leads.manage'
  | 'settings.write'
  | 'users.manage'
  | 'audit.view';

const MATRIX: Record<Role, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    'content.write',
    'content.delete',
    'leads.manage',
    'settings.write',
    'users.manage',
    'audit.view',
  ]),
  // El trabajador opera el día a día (contenido y solicitudes) pero no administra usuarios ni ajustes.
  worker: new Set<Permission>(['content.write', 'content.delete', 'leads.manage']),
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.has(permission) ?? false;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  worker: 'Trabajador',
};
