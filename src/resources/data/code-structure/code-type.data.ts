export const CODE_TYPE = {
  PROFILE_IMAGE: 'PROFILE_IMAGE',
  COVER_IMAGE: 'COVER_IMAGE',
  FILE_NO: 'FILE_NO',
} as const;

export type CodeType = (typeof CODE_TYPE)[keyof typeof CODE_TYPE];
