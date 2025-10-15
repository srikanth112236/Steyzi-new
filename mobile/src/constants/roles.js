export const ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  SUPPORT: 'support',
  SALES: 'sales',
  SUB_SALES: 'sub_sales'
};

export const ROLE_ACCESS_MAP = {
  [ROLES.SUPER_ADMIN]: {
    bottomNavItems: [
      'dashboard', 'residents', 'payments', 'settings'
    ],
    routes: [
      '/dashboard', 
      '/residents', 
      '/payments', 
      '/settings',
      '/admin-panel'
    ]
  },
  [ROLES.ADMIN]: {
    bottomNavItems: [
      'dashboard', 'residents', 'payments', 'settings'
    ],
    routes: [
      '/dashboard', 
      '/residents', 
      '/payments', 
      '/settings'
    ]
  },
  [ROLES.SUPPORT]: {
    bottomNavItems: [
      'dashboard', 'residents', 'settings'
    ],
    routes: [
      '/dashboard', 
      '/residents', 
      '/settings'
    ]
  },
  [ROLES.SALES]: {
    bottomNavItems: [
      'dashboard', 'residents', 'payments', 'settings'
    ],
    routes: [
      '/dashboard', 
      '/residents', 
      '/payments', 
      '/settings'
    ]
  },
  [ROLES.SUB_SALES]: {
    bottomNavItems: [
      'dashboard', 'residents', 'settings'
    ],
    routes: [
      '/dashboard', 
      '/residents', 
      '/settings'
    ]
  }
};
