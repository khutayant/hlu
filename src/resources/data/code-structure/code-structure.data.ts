import { CODE_TYPE, type CodeType } from './code-type.data.js';

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
} as const satisfies Record<string, CodeStructure>;
