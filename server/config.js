import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

const rawDataPath = process.env.DATA_PATH || './data';

export const DATA_PATH = path.isAbsolute(rawDataPath) 
    ? rawDataPath 
    : path.resolve(PROJECT_ROOT, rawDataPath);

export const OBJECTS_PATH = path.join(DATA_PATH, 'objects');
export const TAGS_FILE = path.join(DATA_PATH, 'config/tags.yaml');
export const USERS_FILE = path.join(DATA_PATH, 'config/users.yaml');

console.log('--- Config Configuration ---');
console.log('Project Root:', PROJECT_ROOT);
console.log('Raw Data Path:', rawDataPath);
console.log('DATA_PATH:', DATA_PATH);
