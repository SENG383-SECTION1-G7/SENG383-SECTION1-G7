const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  if (process.env.NODE_ENV === 'test') return;

  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

loadDotEnv();

const SERVER_ROOT = path.resolve(__dirname, '..');

function resolveDbPath() {
  // Tests always use an in-memory database so they can never touch local data.
  if (process.env.NODE_ENV === 'test') return ':memory:';

  const configured = process.env.DB_PATH;
  if (!configured) return path.join(SERVER_ROOT, 'data.sqlite');
  if (configured === ':memory:') return configured;
  // Relative paths are resolved against server/, not the current working directory.
  return path.resolve(SERVER_ROOT, configured);
}

function getConfig() {
  return {
    port: Number(process.env.PORT) || 3001,
    dbPath: resolveDbPath(),
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-seng383-g7',
    aiMode: (process.env.AI_MODE || 'mock').toLowerCase(),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  };
}

module.exports = { getConfig };
