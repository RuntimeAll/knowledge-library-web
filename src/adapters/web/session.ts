import type { SessionPort } from '../../core/ports';
// Memory only. Authentication and persistence will be implemented against the agreed contract.
export function createSession(): SessionPort {
  let token: string | undefined;
  return { read: () => token, write: (value) => { token = value; }, clear: () => { token = undefined; } };
}
