import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({
  region: 'asia-northeast1',
  minInstances: 0,
  maxInstances: 3,
  memory: '256MiB',
  timeoutSeconds: 60,
  concurrency: 20,
});
