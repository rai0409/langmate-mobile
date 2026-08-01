import assert from 'node:assert/strict';
import {
  STAGING_DEPLOY_CONFIRMATION_TOKEN,
  STAGING_PREREQUISITES_CONFIRMATION_TOKEN,
  runFirebaseStagingDeploy,
} from './firebase_deploy_staging.mjs';

const projectId = 'langmate-staging-from-preflight';
const deployTarget = 'firestore:rules,storage,functions';
const validEnv = {
  CONFIRM_STAGING_DEPLOY: STAGING_DEPLOY_CONFIRMATION_TOKEN,
  CONFIRM_STAGING_FIREBASE_PREREQUISITES: STAGING_PREREQUISITES_CONFIRMATION_TOKEN,
};

function harness(overrides = {}) {
  const calls = [];
  const logs = [];
  return {
    calls,
    logs,
    dependencies: {
      preflight: (target) => {
        calls.push(['preflight', target]);
        return { target, projectId };
      },
      run: (command, args) => calls.push(['run', command, args]),
      env: validEnv,
      log: (message) => logs.push(message),
      ...overrides,
    },
  };
}

function assertBlocked(name, env) {
  const test = harness({ env });
  assert.throws(() => runFirebaseStagingDeploy(test.dependencies));
  assert.deepEqual(test.calls, []);
  console.log(`PASS ${name}`);
}

assertBlocked('CI rejects all processing', { ...validEnv, CI: 'true' });
assertBlocked('missing deploy confirmation rejects all processing', {
  CONFIRM_STAGING_FIREBASE_PREREQUISITES: STAGING_PREREQUISITES_CONFIRMATION_TOKEN,
});
assertBlocked('invalid deploy confirmation rejects all processing', {
  ...validEnv,
  CONFIRM_STAGING_DEPLOY: 'incorrect',
});
assertBlocked('missing prerequisites confirmation rejects all processing', {
  CONFIRM_STAGING_DEPLOY: STAGING_DEPLOY_CONFIRMATION_TOKEN,
});
assertBlocked('invalid prerequisites confirmation rejects all processing', {
  ...validEnv,
  CONFIRM_STAGING_FIREBASE_PREREQUISITES: 'incorrect',
});

const success = harness();
runFirebaseStagingDeploy(success.dependencies);
assert.deepEqual(success.calls, [
  ['preflight', 'staging'],
  ['run', 'npm', ['--prefix', 'functions', 'run', 'build']],
  ['run', 'firebase', ['deploy', '--only', deployTarget, '--project', projectId]],
]);
assert.deepEqual(success.logs, [
  'Firebase staging deploy completed.',
  `project ID: ${projectId}`,
  `deploy target: ${deployTarget}`,
]);
assert.equal(
  success.logs.some((message) => message.includes(STAGING_DEPLOY_CONFIRMATION_TOKEN)),
  false,
);
assert.equal(
  success.logs.some((message) => message.includes(STAGING_PREREQUISITES_CONFIRMATION_TOKEN)),
  false,
);
const [, buildCommand, buildArgs] = success.calls[1];
const [, deployCommand, deployArgs] = success.calls[2];
assert.equal(buildCommand, 'npm');
assert.deepEqual(buildArgs, ['--prefix', 'functions', 'run', 'build']);
assert.equal(deployCommand, 'firebase');
assert.deepEqual(deployArgs, ['deploy', '--only', deployTarget, '--project', projectId]);
assert.equal(deployArgs.includes('hosting'), false);
assert.equal(deployArgs.includes('firestore:indexes'), false);
assert.equal(deployArgs.includes('production'), false);
console.log('PASS staging deploy command success contract');

const preflightFailureCalls = [];
const preflightFailure = harness({
  preflight: () => {
    preflightFailureCalls.push('preflight');
    throw new Error('preflight failed');
  },
  run: (command) => preflightFailureCalls.push(command),
});
assert.throws(() => runFirebaseStagingDeploy(preflightFailure.dependencies), /preflight failed/);
assert.deepEqual(preflightFailureCalls, ['preflight']);
console.log('PASS preflight failure blocks build and deploy');

const buildFailureCalls = [];
const buildFailure = harness({
  run: (command, args) => {
    buildFailureCalls.push([command, args]);
    if (command === 'npm') throw new Error('build failed');
    throw new Error(`unexpected command: ${command} ${args.join(' ')}`);
  },
});
assert.throws(() => runFirebaseStagingDeploy(buildFailure.dependencies), /build failed/);
assert.deepEqual(buildFailureCalls, [['npm', ['--prefix', 'functions', 'run', 'build']]]);
console.log('PASS build failure blocks deploy');

const deployFailure = harness({
  run: (command, args) => {
    if (command === 'firebase') throw new Error('deploy failed');
    assert.equal(command, 'npm');
    assert.deepEqual(args, ['--prefix', 'functions', 'run', 'build']);
  },
});
assert.throws(() => runFirebaseStagingDeploy(deployFailure.dependencies), /deploy failed/);
assert.deepEqual(deployFailure.logs, []);
console.log('PASS deploy failure propagates without success log');
