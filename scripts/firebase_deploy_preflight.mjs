import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PRODUCTION_CONFIRMATION_TOKEN = 'CONFIRM_PRODUCTION_DEPLOY';
const PLACEHOLDER = /^REPLACE_WITH_|PLACEHOLDER|YOUR_/i;

function fail(message) {
  throw new Error(`Firebase deploy preflight failed: ${message}`);
}

function defaultRun(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

export function runFirebaseDeployPreflight(target, dependencies = {}) {
  const exists = dependencies.exists ?? existsSync;
  const readFile = dependencies.readFile ?? ((path) => readFileSync(path, 'utf8'));
  const run = dependencies.run ?? defaultRun;
  const env = dependencies.env ?? process.env;
  if (!['staging', 'production'].includes(target)) fail('target must be staging or production.');
  if (target === 'production' && env.CONFIRM_PRODUCTION_DEPLOY !== PRODUCTION_CONFIRMATION_TOKEN) {
    fail('production confirmation token is required.');
  }
  if (!exists('.firebaserc')) fail('.firebaserc is required and must remain untracked.');
  let aliases;
  try {
    aliases = JSON.parse(readFile('.firebaserc')).projects;
  } catch {
    fail('.firebaserc must contain valid project aliases.');
  }
  const projectId = aliases?.[target];
  if (!projectId) fail(`missing ${target} Firebase alias.`);
  if (PLACEHOLDER.test(projectId)) fail(`${target} Firebase alias is a placeholder.`);
  if (run('git', ['status', '--porcelain']).trim()) fail('working tree must be clean.');
  if (run('git', ['branch', '--show-current']).trim() !== 'main')
    fail('current branch must be main.');
  if (
    run('git', ['rev-parse', 'HEAD']).trim() !== run('git', ['rev-parse', 'origin/main']).trim()
  ) {
    fail('local HEAD must match origin/main.');
  }
  let activeProject;
  try {
    activeProject = run('firebase', ['use']);
  } catch {
    fail('could not determine the active Firebase project.');
  }
  if (!activeProject.includes(projectId))
    fail('active Firebase project does not match the target alias.');
  return { target, projectId };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const result = runFirebaseDeployPreflight(process.argv[2]);
    console.log(`Firebase deploy preflight passed for ${result.target}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
