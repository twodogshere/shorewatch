import { kv } from '@vercel/kv';

/**
 * Vercel KV Redis client wrapper
 * Provides singleton instance for all KV operations across the app
 */
export { kv };
export default kv;
