const en = {
  app: {
    name: 'HLU Work',
    version: 'Version {{version}}',
    versionShort: 'v{{version}}',
  },
  nav: {
    mainPage: 'Main page',
  },
  common: {
    language: 'Language',
    english: 'English',
    myanmar: 'Myanmar',
  },
  mainPage: {
    title: 'Main page',
    description: 'Main page for HLU Work.',
  },
  auth: {
    loginTitle: 'Sign in',
    loginSubtitle: 'Use your HLU account to continue.',
    signIn: 'Sign in',
    signInKeycloak: 'Sign in',
    signOut: 'Sign out',
    account: 'Account',
    loginFailed: 'Sign in failed',
    completingSignIn: 'Completing sign in…',
    callbackMissingParams: 'Missing authorization code from Keycloak.',
    backToLogin: 'Back to sign in',
  },
} as const;

export default en;
