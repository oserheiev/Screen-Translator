import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { load as yamlLoad } from 'js-yaml';

// Must match AppLanguage in electron/types.ts
const APP_LANGUAGES = [
  'English', 'Russian', 'Ukrainian', 'Spanish', 'French', 'German',
  'Italian', 'Portuguese', 'Chinese (Simplified)', 'Japanese', 'Korean', 'Polish',
];

function getArg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required argument --${name}`);
  }
  return process.argv[i + 1];
}

const version = getArg('version');
const dir = getArg('dir', '.release-notes');
const jsonPath = getArg('file', 'src/whatsnew.json');

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`Invalid version: ${version}`);
}

const fragmentFiles = readdirSync(dir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));

const bullets = [];
for (const file of fragmentFiles) {
  const path = join(dir, file);
  const parsed = yamlLoad(readFileSync(path, 'utf8'));
  if (parsed === null || parsed === undefined) continue; // fragment intentionally empty (no user-facing change)
  if (!Array.isArray(parsed)) {
    throw new Error(`${path} must be a YAML list of bullets, got: ${typeof parsed}`);
  }
  for (const bullet of parsed) {
    if (typeof bullet !== 'object' || bullet === null || Array.isArray(bullet)) {
      throw new Error(`${path}: each bullet must be an object, got: ${JSON.stringify(bullet)}`);
    }
    if (typeof bullet.English !== 'string' || !bullet.English.trim()) {
      throw new Error(`${path}: every bullet needs a non-empty "English" key, got: ${JSON.stringify(bullet)}`);
    }
    for (const key of Object.keys(bullet)) {
      if (!APP_LANGUAGES.includes(key)) {
        throw new Error(`${path}: unknown language key "${key}" — must be one of ${APP_LANGUAGES.join(', ')}`);
      }
      if (typeof bullet[key] !== 'string' || !bullet[key].trim()) {
        throw new Error(`${path}: language key "${key}" must be a non-empty string, got: ${JSON.stringify(bullet[key])}`);
      }
    }
  }
  bullets.push(...parsed);
}

const entries = JSON.parse(readFileSync(jsonPath, 'utf8'));
if (!Array.isArray(entries)) throw new Error(`${jsonPath} does not contain a JSON array`);
if (entries.some(e => e.version === version)) {
  throw new Error(`Entry for v${version} already exists in ${jsonPath}`);
}

entries.unshift({ version, bullets });
writeFileSync(jsonPath, JSON.stringify(entries, null, 2) + '\n');

for (const file of fragmentFiles) {
  unlinkSync(join(dir, file));
}

console.log(`Compiled ${bullets.length} bullet(s) from ${fragmentFiles.length} fragment(s) into v${version} entry in ${jsonPath}; fragments removed.`);
