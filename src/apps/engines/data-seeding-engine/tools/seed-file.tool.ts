import { readdir, readFile } from 'fs/promises';
import { join, relative, sep } from 'path';

export type SeedMode = 'upsert' | 'insert';

export type SeedDocument = {
  absolutePath: string;
  /** Path relative to `res/seed`, using `/`. */
  relativePath: string;
  /** First folder under `res/seed`, or the file name when the file sits at the root. */
  entityKey: string;
  mode: SeedMode;
  rows: Record<string, unknown>[];
};

const UPSERT_SUFFIX = '.upsert.json';
const INSERT_SUFFIX = '.insert.json';

/** `CategoryMaster` / `category_master` → `category-master`. */
export function toEntityKey(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

/**
 * Load every `*.upsert.json` and `*.insert.json` under `seedDir`.
 * Blank files are skipped. Upsert files for an entity come before insert files.
 */
export async function loadSeedDocuments(
  seedDir: string,
): Promise<{ documents: SeedDocument[]; skippedEmpty: string[] }> {
  let names: string[];
  try {
    names = await collectFiles(seedDir);
  } catch (error) {
    if (isEnoent(error)) {
      return { documents: [], skippedEmpty: [] };
    }
    throw error;
  }

  const documents: SeedDocument[] = [];
  const skippedEmpty: string[] = [];

  for (const absolutePath of names) {
    const mode = seedMode(absolutePath);
    if (!mode) {
      continue;
    }

    const relativePath = relative(seedDir, absolutePath).split(sep).join('/');
    const text = (await readFile(absolutePath, 'utf8')).trim();
    if (!text) {
      skippedEmpty.push(relativePath);
      continue;
    }

    documents.push({
      absolutePath,
      relativePath,
      entityKey: entityKeyFromRelative(relativePath),
      mode,
      rows: parseSeedRows(relativePath, text),
    });
  }

  documents.sort((a, b) => {
    if (a.entityKey !== b.entityKey) {
      return a.entityKey.localeCompare(b.entityKey);
    }
    if (a.mode !== b.mode) {
      return a.mode === 'upsert' ? -1 : 1;
    }
    return a.relativePath.localeCompare(b.relativePath);
  });

  return { documents, skippedEmpty };
}

function seedMode(filePath: string): SeedMode | null {
  if (filePath.endsWith(UPSERT_SUFFIX)) {
    return 'upsert';
  }
  if (filePath.endsWith(INSERT_SUFFIX)) {
    return 'insert';
  }
  return null;
}

function entityKeyFromRelative(relativePath: string): string {
  const [folder, file] = relativePath.split('/');
  if (file) {
    return folder;
  }
  return folder.replace(/\.upsert\.json$/, '').replace(/\.insert\.json$/, '');
}

function parseSeedRows(
  relativePath: string,
  text: string,
): Record<string, unknown>[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${relativePath}: invalid JSON (${message})`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${relativePath}: seed file must be a JSON array`);
  }

  return parsed.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new Error(`${relativePath}: row ${index} must be an object`);
    }
    return row as Record<string, unknown>;
  });
}

async function collectFiles(dir: string): Promise<string[]> {
  const found: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await collectFiles(full)));
    } else if (entry.isFile()) {
      found.push(full);
    }
  }
  return found;
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}
