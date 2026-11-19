import { CODE_TYPE, type CodeType } from './code-type.data';

export type CodeDelimiter = '-' | null;

export type CodeStructure = {
  type: CodeType;
  prefix: string | null;
  padding: number;
  delimiter: CodeDelimiter;
  year: boolean;
  month: boolean;
  day: boolean;
};

/**
 * Shared code formats for HLU.
 * Sequence key = type + year + month + day.
 * Shape: [prefix?][YYYY?][MM?][DD?][padded digits]
 */
export const CODE_STRUCTURE = {
  profileImage: {
    type: CODE_TYPE.PROFILE_IMAGE,
    prefix: 'PI',
    padding: 6,
    delimiter: null as CodeDelimiter,
    year: true,
    month: true,
    day: true,
  },
  coverImage: {
    type: CODE_TYPE.COVER_IMAGE,
    prefix: 'CI',
    padding: 6,
    delimiter: null as CodeDelimiter,
    year: true,
    month: true,
    day: true,
  },
  /** [FN][YYYY][MM][4 digits] */
  fileNo: {
    type: CODE_TYPE.FILE_NO,
    prefix: 'FN',
    padding: 4,
    delimiter: null as CodeDelimiter,
    year: true,
    month: true,
    day: false,
  },
  /** [H][4 digits] e.g. H0001 */
  employeeNo: {
    type: CODE_TYPE.EMPLOYEE_NO,
    prefix: 'H',
    padding: 4,
    delimiter: null as CodeDelimiter,
    year: false,
    month: false,
    day: false,
  },
  /** [PJ][YYYY][4 digits] e.g. PJ20260001 */
  projectNo: {
    type: CODE_TYPE.PROJECT_NO,
    prefix: 'PJ',
    padding: 4,
    delimiter: null as CodeDelimiter,
    year: true,
    month: false,
    day: false,
  },
  /**
   * [township.focalPrefix][YYYY][4 digits] e.g. GN20260001.
   * Prefix is the township focal prefix, passed when the code is generated.
   * Sequence is per prefix and year.
   */
  sessionNo: {
    type: CODE_TYPE.SESSION_NO,
    prefix: null,
    padding: 4,
    delimiter: null as CodeDelimiter,
    year: true,
    month: false,
    day: false,
  },
  /** [MT][YYYY][MM][4 digits] e.g. MT2026110001 */
  meetingNo: {
    type: CODE_TYPE.MEETING_NO,
    prefix: 'MT',
    padding: 4,
    delimiter: null as CodeDelimiter,
    year: true,
    month: true,
    day: false,
  },
} as const satisfies Record<string, CodeStructure>;
