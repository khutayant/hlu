/** Matches Vite `base` (trailing slash stripped for React Router basename). */
export const BASE_URL = (() => {
  const base = import.meta.env.BASE_URL || '/';
  if (base === '/') {
    return '/';
  }
  return base.replace(/\/$/, '');
})();

export const VERSION = import.meta.env.VITE_VERSION ?? '0.0.0';

const API_BASE = 'hlu';
const API_BASE_PATH = `/api/${API_BASE}`;

/** Local Vite port for hlu-work (matches hlu AppEnv.TEST_MODE pattern). */
export function isDev() {
  return location.port.startsWith('5192');
}

function getApiUrl() {
  if (isDev()) {
    return `http://${location.hostname}:3300${API_BASE_PATH}/`;
  }
  return `${location.origin}${API_BASE_PATH}/`;
}

export const API_URL = getApiUrl();
export const TEST_MODE = isDev();

/** Public asset URL under Vite `base`. */
export function publicUrl(path: string) {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, '')}`;
}
