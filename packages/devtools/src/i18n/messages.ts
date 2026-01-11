/**
 * Default translations for devtools components
 *
 * Merge into your next-intl messages:
 * ```ts
 * import { devtoolsMessages } from '@nextstack/devtools'
 *
 * const messages = {
 *   ...devtoolsMessages.en,
 *   // your other messages
 * }
 * ```
 */
export const devtoolsMessages = {
  en: {
    devMode: {
      title: 'Development Mode',
      branch: 'Branch',
      database: 'Database',
      user: 'User',
      environment: 'Environment',
      development: 'Development',
      staging: 'Staging',
      production: 'Production',
      local: 'Local',
      remote: 'Remote',
      notLoggedIn: 'Not logged in',
      expand: 'Expand dev info',
      collapse: 'Collapse dev info',
    },
    devLogin: {
      title: 'Development Login',
      subtitle: 'Quick access to test accounts',
      loginAs: 'Login as {name}',
      loggingIn: 'Logging in...',
      customLogin: 'Custom Login',
      email: 'Email',
      password: 'Password',
      login: 'Login',
      error: 'Login failed',
      onlyLocalhost: 'Dev login is only available on localhost',
      role: 'Role',
      noUsers: 'No test users configured',
    },
  },
  nl: {
    devMode: {
      title: 'Ontwikkelmodus',
      branch: 'Branch',
      database: 'Database',
      user: 'Gebruiker',
      environment: 'Omgeving',
      development: 'Ontwikkeling',
      staging: 'Staging',
      production: 'Productie',
      local: 'Lokaal',
      remote: 'Remote',
      notLoggedIn: 'Niet ingelogd',
      expand: 'Ontwikkelinfo uitklappen',
      collapse: 'Ontwikkelinfo inklappen',
    },
    devLogin: {
      title: 'Ontwikkel Login',
      subtitle: 'Snelle toegang tot testaccounts',
      loginAs: 'Inloggen als {name}',
      loggingIn: 'Inloggen...',
      customLogin: 'Aangepaste Login',
      email: 'E-mail',
      password: 'Wachtwoord',
      login: 'Inloggen',
      error: 'Inloggen mislukt',
      onlyLocalhost: 'Dev login is alleen beschikbaar op localhost',
      role: 'Rol',
      noUsers: 'Geen testgebruikers geconfigureerd',
    },
  },
}

export type DevtoolsMessages = typeof devtoolsMessages.en
