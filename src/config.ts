export const BASE_URL = '/ui/hlu';
export const VERSION = import.meta.env.VITE_VERSION ?? '0.0.0';

/** Public asset URL under Vite `base` (works for /ui/hlu and local base). */
export function publicUrl(path: string) {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, '')}`;
}
