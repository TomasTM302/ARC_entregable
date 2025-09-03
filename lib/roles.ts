export type AppRole = 'admin' | 'resident' | 'vigilante' | 'mantenimiento'

export const dbRoleFromAppRole = (role: AppRole): string => {
  switch (role) {
    case 'admin':
      return 'admin'
    case 'resident':
      return 'Residente'
    case 'vigilante':
      return 'Vigilante'
    case 'mantenimiento':
      return 'Mantenimiento'
    default:
      return role
  }
}

export const appRoleFromDbRole = (role: string): AppRole => {
  switch (role.toLowerCase()) {
    case 'administrador':
      return 'admin'
    case 'residente':
      return 'resident'
    case 'vigilante':
      return 'vigilante'
    case 'mantenimiento':
      return 'mantenimiento'
    default:
      return role as AppRole
  }
}
