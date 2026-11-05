import { createApiClient } from '../../api/client';
import { createSession } from './session';
import { network } from './network';
export const apiBase = import.meta.env.VITE_API_BASE_URL || '';
export const session = createSession();
export const api = createApiClient(apiBase, network, session);
export const navigation = { about: () => uni.navigateTo({ url: '/pages/about/index' }), back: () => uni.navigateBack() };
