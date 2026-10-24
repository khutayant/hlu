import { BASE_URL } from '../../config';

const BASE = 'hlu';
const API_BASE_PATH = `/api/${BASE}`;
const UI_BASE_PATH = `/ui/${BASE}`;

const isDev = () => {
  return location.port.startsWith('5191');
};

const getApiUrl = () => {
  if (isDev()) {
    const hostname = location.hostname;
    return `http://${hostname}:3300${API_BASE_PATH}/`;
  }

  return `${location.origin}${API_BASE_PATH}/`;
};

export const AppEnv = {
  APP_NAME: 'Heartland Union',
  BASE,
  BASE_URL,
  API_BASE_PATH,
  UI_BASE_PATH,

  TEST_MODE: isDev(),
  API_URL: getApiUrl(),
};
