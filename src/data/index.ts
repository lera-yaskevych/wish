import { localApi } from './local';
import type { Api } from './types';

// The one place the app chooses its backend. Screens only ever talk to `api`,
// so swapping the on-device store for a real server is a change to this line.
export const api: Api = localApi;

export * from './types';
