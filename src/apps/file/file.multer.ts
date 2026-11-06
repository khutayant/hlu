import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { AppEnv } from '../../resources/env/app.env.js';

export const uploadFileMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      mkdirSync(AppEnv.TEMP_DIR, { recursive: true });
      cb(null, AppEnv.TEMP_DIR);
    },
    filename: (_req, _file, cb) => {
      cb(null, uuidv4());
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
};
