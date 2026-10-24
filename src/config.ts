/** Matches Vite `base` (trailing slash stripped for React Router basename). */
export const BASE_URL = (() => {
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') {
    return '/';
  }
  return base.replace(/\/$/, '');
})();

export const VERSION = import.meta.env.VITE_VERSION ?? '0.0.0';

/** Public asset URL under Vite `base`. */
export function publicUrl(path: string) {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, '')}`;
}
