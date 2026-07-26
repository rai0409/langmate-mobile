import assert from 'node:assert/strict';
import {
  PRODUCTION_CONFIRMATION_TOKEN,
  runFirebaseDeployPreflight,
} from './firebase_deploy_preflight.mjs';

const aliases = JSON.stringify({
  projects: { staging: 'langmate-staging', production: 'langmate-production' },
});
function dependencies(overrides = {}) {
  const output = {
    'git status --porcelain': '',
    'git branch --show-current': 'main',
    'git rev-parse HEAD': 'sha',
    'git rev-parse origin/main': 'sha',
    'firebase use': 'Active project: langmate-staging',
  };
  return {
    exists: () => true,
    readFile: () => aliases,
    run: (command, args) => output[`${command} ${args.join(' ')}`] ?? '',
    env: {},
    ...overrides,
  };
}
function fails(name, target, overrides) {
  assert.throws(
    () => runFirebaseDeployPreflight(target, dependencies(overrides)),
    /Firebase deploy preflight failed/,
  );
  console.log(`PASS ${name}`);
}

fails('missing environment', undefined);
fails('invalid environment', 'local');
fails('missing .firebaserc', 'staging', { exists: () => false });
fails('missing alias', 'staging', { readFile: () => JSON.stringify({ projects: {} }) });
fails('placeholder alias', 'staging', {
  readFile: () => JSON.stringify({ projects: { staging: 'REPLACE_WITH_STAGING_PROJECT_ID' } }),
});
fails('dirty working tree', 'staging', {
  run: (c, a) => (c === 'git' && a[0] === 'status' ? ' M file' : dependencies().run(c, a)),
});
fails('non-main branch', 'staging', {
  run: (c, a) => (c === 'git' && a[0] === 'branch' ? 'feature/test' : dependencies().run(c, a)),
});
fails('outdated HEAD', 'staging', {
  run: (c, a) =>
    c === 'git' && a.join(' ') === 'rev-parse origin/main' ? 'other' : dependencies().run(c, a),
});
fails('active project mismatch', 'staging', {
  run: (c, a) => (c === 'firebase' ? 'Active project: other' : dependencies().run(c, a)),
});
fails('missing production token', 'production');
fails('invalid production token', 'production', { env: { CONFIRM_PRODUCTION_DEPLOY: 'wrong' } });
assert.deepEqual(runFirebaseDeployPreflight('staging', dependencies()), {
  target: 'staging',
  projectId: 'langmate-staging',
});
console.log('PASS staging success');
assert.deepEqual(
  runFirebaseDeployPreflight(
    'production',
    dependencies({
      env: { CONFIRM_PRODUCTION_DEPLOY: PRODUCTION_CONFIRMATION_TOKEN },
      run: (c, a) =>
        c === 'firebase' ? 'Active project: langmate-production' : dependencies().run(c, a),
    }),
  ),
  { target: 'production', projectId: 'langmate-production' },
);
console.log('PASS production success');
