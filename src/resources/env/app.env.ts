import { BASE_URL } from '../../config';

const isDev = () => {
  return location.port.startsWith('5191');
};

const getApiUrl = () => {
  if (isDev()) {
    const hostname = location.hostname;
    return `http://${hostname}:9000/api/`;
  }

  return `${location.origin}/api/`;
};

export const AppEnv = {
  APP_NAME: 'Heartland Union',
  BASE_URL,

  TEST_MODE: isDev(),
  API_URL: getApiUrl(),
};
