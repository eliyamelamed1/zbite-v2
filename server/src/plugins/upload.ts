import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { MultipartFile } from '@fastify/multipart';
import { env } from '../config/env';

const uploadsDir = env.UPLOADS_DIR || path.join(__dirname, '../../uploads');

// Ensure upload directories exist
['avatars', 'recipes', 'recipes/steps', 'recipes/seed', 'reports'].forEach((dir) => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

export async function saveFile(file: MultipartFile, folder: string): Promise<string> {
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.filename);
  const filename = unique + ext;
  const dest = path.join(uploadsDir, folder, filename);

  await pipeline(file.file, fs.createWriteStream(dest));

  return `/uploads/${folder}/${filename}`;
}

export { uploadsDir };
