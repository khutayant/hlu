const mm = {
  app: {
    name: 'Heartland Union',
    version: 'ဗားရှင်း {{version}}',
    versionShort: 'v{{version}}',
  },
  nav: {
    ageForVaccination: 'အသက်အလိုက် ကာကွယ်ဆေး',
  },
  common: {
    language: 'ဘာသာစကား',
    english: 'အင်္ဂလိပ်',
    myanmar: 'မြန်မာ',
    allowed: 'ခွင့်ပြုသည်',
    notAllowed: 'ခွင့်မပြုပါ',
  },
  ageForVaccination: {
    title: 'အသက်အလိုက် ကာကွယ်ဆေး',
    description:
      'ကလေး၏ မွေးနေ့နှင့် ယနေ့ (သို့မဟုတ် ရွေးချယ်ထားသော ရက်စွဲ) ကို နှိုင်းယှဉ်၍ BCG နှင့် MMR ကာကွယ်ဆေး ထိုးသင့်မထိုးသင့် ဆုံးဖြတ်ရန်အတွက် အသုံးပြုနိုင်ပါသည်။',
    todayCardTitle: 'ကာကွယ်ဆေးထိုးမည့်နေ့',
    todayChip: 'ယနေ့',
    todayCardHint: 'ကာကွယ်ဆေးထိုးမည့်နေ့ကို ပြောင်းလဲရွေးချယ်လို့ ရပါသည်။',
    askTrueDob: 'ကလေး၏ မွေးနေ့အမှန်ကို မေးပါ။',
    minus12Lead: 'ကလေး၏မွေးနေ့သည်',
    minus12Rule: 'ဤနေ့ထက် ပို၍စောပါက ဘီစီဂျီ မထိုးရ။',
    mmrLead: 'ကလေး၏မွေးနေ့သည်',
    mmrFrom: 'မှ',
    mmrWithin: 'အတွင်း',
    mmrRule: 'ရှိနေမှသာ MMR ကာကွယ်ဆေးထိုးရမည်။',
    asOfDate: 'တွက်ချက်မည့် ရက်စွဲ',
    asOfHelper: '{{date}} အဖြစ် ပြသသည် (ပုံမှန်: ယနေ့)',
    invalidDate: 'ရက်စွဲ မမှန်ကန်ပါ',
    dob: 'မွေးနေ့',
    dobHelper: 'အရည်အချင်း စစ်ဆေးရန် မွေးနေ့ ထည့်ပါ',
    cutoffs:
      '{{asOf}} အတွက် ကန့်သတ်ချက်များ: BCG မရ — {{noBcg}} နှင့် ယင်းမတိုင်မီ; ကာကွယ်ဆေး လုံးဝ မရ — {{noVaccine}} နှင့် ယင်းမတိုင်မီ။',
    bcgLabel: 'BCG: {{status}}',
    vaccinationLabel: 'ကာကွယ်ဆေး: {{status}}',
    summaryNone:
      'ကာကွယ်ဆေး မရပါ — မွေးနေ့သည် ယနေ့မှ လစဉ် ၆၀ လ နောက်သို့ (သို့မဟုတ် ထိုနေ့) နှင့် တူညီ/စောသည်။',
    summaryNoBcg:
      'BCG မရပါ — မွေးနေ့သည် ယနေ့မှ လစဉ် ၁၂ လ နောက်သို့ (သို့မဟုတ် ထိုနေ့) နှင့် တူညီ/စောသည်။',
    summaryAllowed: 'ကာကွယ်ဆေး လက်ခံနိုင်သည် (BCG အပါအဝင်)။',
  },
} as const;

export default mm;
