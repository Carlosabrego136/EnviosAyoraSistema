export type Role = 'admin' | 'worker' | 'recolector';

export type Permission =
  | 'content.write'
  | 'content.delete'
  | 'leads.manage'
  | 'settings.write'
  | 'users.manage'
  | 'audit.view'
  | 'folios.operate'
  | 'folios.manage';

const MATRIX: Record<Role, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    'content.write',
    'content.delete',
    'leads.manage',
    'settings.write',
    'users.manage',
    'audit.view',
    'folios.operate',
    'folios.manage',
  ]),
  // El trabajador opera el día a día (contenido y solicitudes) pero no administra usuarios ni ajustes.
  worker: new Set<Permission>(['content.write', 'content.delete', 'leads.manage']),
  // El recolector (sesión general del mostrador) solo captura y atiende folios: no ve nada más del panel.
  recolector: new Set<Permission>(['folios.operate']),
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.has(permission) ?? false;
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  worker: 'Trabajador',
  recolector: 'Recolector',
};
