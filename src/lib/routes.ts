export const Routes = {
  Root: '/',

  // Product routes
  Generate: '/generate',
  IosAppIconGenerator: '/ios-app-icon-generator',
  AndroidAppIconGenerator: '/android-app-icon-generator',
  XcodeAppiconsetGenerator: '/xcode-appiconset-generator',
  FaviconGenerator: '/favicon-generator',
  AppIconResizer: '/app-icon-resizer',
  AndroidMipmapGenerator: '/android-mipmap-generator',
  Guides: '/guides',
  Tools: '/#tools',
  Gallery: '/#gallery',
  IosAppIconSizes: '/ios-app-icon-sizes',
  AndroidAppIconSizes: '/android-app-icon-sizes',
  AndroidAdaptiveIconSafeZone: '/android-adaptive-icon-safe-zone',
  FaviconSizes: '/favicon-sizes',
  PwaIconSizes: '/pwa-icon-sizes',
  XcodeAppiconsetGuide: '/xcode-appiconset-guide',
  Features: '/#features',
  Faqs: '/#faqs',
  Pricing: '/pricing',

  // Auth routes
  Auth: '/auth',
  Login: '/auth/login',
  Register: '/auth/register',
  AuthError: '/auth/error',
  ForgotPassword: '/auth/forgot-password',
  ResetPassword: '/auth/reset-password',

  // Legal routes
  TermsOfService: '/terms',
  PrivacyPolicy: '/privacy',
  CookiePolicy: '/cookie',

  // Payment routes
  Payment: '/settings/payment',

  // Dashboard routes
  Dashboard: '/dashboard',
  DashboardProjects: '/dashboard/projects',
  DashboardHistory: '/dashboard/history',
  DashboardCredits: '/dashboard/credits',

  // Settings routes
  Settings: '/settings',
  SettingsProfile: '/settings/profile',
  SettingsBilling: '/settings/billing',
  SettingsCredits: '/settings/credits',
  SettingsSecurity: '/settings/security',
  SettingsFiles: '/settings/files',
  SettingsApiKeys: '/settings/apikeys',
  SettingsNotifications: '/settings/notifications',

  // Admin routes
  Admin: '/admin',
  AdminUsers: '/admin/users',
  AdminGenerations: '/admin/generations',
  AdminOrders: '/admin/orders',
} as const;

/** Default login redirect route */
export const DEFAULT_LOGIN_REDIRECT = Routes.DashboardProjects;
