import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const loadEnvFile = async (file) => {
  if (!existsSync(file)) return;

  const content = await readFile(file, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim().replace(/^["']|["']$/g, '');
    process.env[key.trim()] ||= value;
  }
};

await loadEnvFile('.dev.vars');
await loadEnvFile('.env');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required in .dev.vars, .env, or the shell environment.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const migrations = [
  '001_initial_neon.sql',
  '002_product_sort_order.sql',
  '003_kes_currency.sql',
];

const splitStatements = (content) => {
  const statements = [];
  let current = '';
  let quote = null;
  let inDollarBlock = false;
  let inLineComment = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content.slice(index, index + 2);

    if (!quote && !inDollarBlock && next === '--') {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (!quote && next === '$$') {
      inDollarBlock = !inDollarBlock;
      current += next;
      index += 1;
      continue;
    }

    if (!inDollarBlock && (char === "'" || char === '"')) {
      quote = quote === char ? null : quote || char;
    }

    if (char === ';' && !quote && !inDollarBlock) {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
      continue;
    }

    current += char;
  }

  const statement = current.trim();
  if (statement) statements.push(statement);
  return statements;
};

for (const migration of migrations) {
  const path = join('migrations', migration);
  const statements = splitStatements(await readFile(path, 'utf8'));
  console.log(`Applying ${migration}`);
  for (const statement of statements) {
    await sql.query(statement);
  }
}

console.log('Migrations applied.');
