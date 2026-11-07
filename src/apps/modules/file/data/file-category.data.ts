/** Category codes used by the file / profile apps (auto-created on first lookup). */
export const FILE_CATEGORY = {
  FILE_CATEGORIES: {
    code: 'FILE_CATEGORIES',
    name: 'File categories',
    description: null,
    parentCode: null,
  },
  PROFILE_IMAGE: {
    code: 'PROFILE_IMAGE',
    name: 'Profile image',
    description: 'Account-owner profile avatar uploads',
    parentCode: 'FILE_CATEGORIES',
  },
  COVER_IMAGE: {
    code: 'COVER_IMAGE',
    name: 'Cover image',
    description: 'Account-owner cover image uploads',
    parentCode: 'FILE_CATEGORIES',
  },
} as const;

export type FileCategoryCode = keyof typeof FILE_CATEGORY;

export function isFileCategoryCode(value: string): value is FileCategoryCode {
  return value in FILE_CATEGORY;
}
