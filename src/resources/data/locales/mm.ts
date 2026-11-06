const mm = {
  app: {
    name: 'HLU Work',
    version: 'ဗားရှင်း {{version}}',
    versionShort: 'v{{version}}',
  },
  nav: {
    mainPage: 'ပင်မစာမျက်နှာ',
  },
  common: {
    language: 'ဘာသာစကား',
    english: 'အင်္ဂလိပ်',
    myanmar: 'မြန်မာ',
  },
  mainPage: {
    title: 'ပင်မစာမျက်နှာ',
    description: 'HLU Work ပင်မစာမျက်နှာ။',
  },
  auth: {
    loginTitle: 'အကောင့်ဝင်ရန်',
    loginSubtitle: 'ဆက်လက်လုပ်ဆောင်ရန် HLU အကောင့်ဖြင့် ဝင်ပါ။',
    signIn: 'ဝင်ရန်',
    signInKeycloak: 'ဝင်ရန်',
    signOut: 'ထွက်ရန်',
    account: 'အကောင့်',
    loginFailed: 'အကောင့်ဝင်ခြင်း မအောင်မြင်ပါ',
    completingSignIn: 'အကောင့်ဝင်နေသည်…',
    callbackMissingParams: 'Keycloak မှ authorization code မရရှိပါ။',
    backToLogin: 'ပြန်ဝင်ရန်',
  },
} as const;

export default mm;
