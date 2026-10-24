const en = {
  app: {
    name: 'Heartland Union',
    version: 'Version {{version}}',
    versionShort: 'v{{version}}',
  },
  nav: {
    ageForVaccination: 'Age for vaccination',
  },
  common: {
    language: 'Language',
    english: 'English',
    myanmar: 'Myanmar',
    allowed: 'allowed',
    notAllowed: 'not allowed',
    close: 'Close',
  },
  ageForVaccination: {
    title: 'Age for vaccination',
    description:
      "Compare the child's date of birth with today (or a selected date) to help decide whether BCG and MMR vaccines should be given.",
    todayCardTitle: 'Vaccination Date',
    todayChip: 'Today',
    todayCardHint: 'You can change the vaccination date.',
    askTrueDob: "Ask for the child's true date of birth.",
    minus12Lead: "If the child's date of birth is",
    minus12Rule: 'earlier than this day, do not give BCG.',
    myanmarEraTitle: 'မြန်မာသက္ကရာဇ်',
    showMyanmarDate: 'Show Myanmar calendar date',
    mmrLead: "The child's date of birth is",
    mmrFrom: 'from',
    mmrWithin: 'until',
    mmrRule: 'Only then give MMR vaccine.',
    asOfDate: 'As-of date',
    asOfHelper: 'Shown as {{date}} (default: today)',
    invalidDate: 'Invalid date',
    dob: 'Date of birth',
    dobHelper: 'Enter DOB to evaluate eligibility',
    cutoffs:
      'Cutoffs as of {{asOf}}: no BCG on/before {{noBcg}}; no vaccination on/before {{noVaccine}}.',
    bcgLabel: 'BCG: {{status}}',
    vaccinationLabel: 'Vaccination: {{status}}',
    summaryNone:
      'No vaccination — DOB is on or before today minus 60 months.',
    summaryNoBcg: 'No BCG — DOB is on or before today minus 12 months.',
    summaryAllowed: 'Vaccination allowed, including BCG.',
  },
} as const;

export default en;
