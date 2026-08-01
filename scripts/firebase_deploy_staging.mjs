import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runFirebaseDeployPreflight } from './firebase_deploy_preflight.mjs';

export const STAGING_DEPLOY_CONFIRMATION_TOKEN = 'CONFIRM_STAGING_DEPLOY';
export const STAGING_PREREQUISITES_CONFIRMATION_TOKEN = 'CONFIRM_STAGING_FIREBASE_PREREQUISITES';

function defaultRun(command, args) {
  return execFileSync(command, args, { stdio: 'inherit' });
}

export function runFirebaseStagingDeploy(dependencies = {}) {
  const preflight = dependencies.preflight ?? runFirebaseDeployPreflight;
  const run = dependencies.run ?? defaultRun;
  const env = dependencies.env ?? process.env;
  const log = dependencies.log ?? console.log;

  if (env.CI) throw new Error('Firebase staging deploy is not allowed in CI.');
  if (env.CONFIRM_STAGING_DEPLOY !== STAGING_DEPLOY_CONFIRMATION_TOKEN) {
    throw new Error('staging deploy confirmation token is required.');
  }
  if (env.CONFIRM_STAGING_FIREBASE_PREREQUISITES !== STAGING_PREREQUISITES_CONFIRMATION_TOKEN) {
    throw new Error('staging Firebase prerequisites confirmation token is required.');
  }

  const { projectId } = preflight('staging');
  run('npm', ['--prefix', 'functions', 'run', 'build']);
  const deployTarget = 'firestore:rules,storage,functions';
  run('firebase', ['deploy', '--only', deployTarget, '--project', projectId]);
  log('Firebase staging deploy completed.');
  log(`project ID: ${projectId}`);
  log(`deploy target: ${deployTarget}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    runFirebaseStagingDeploy();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
