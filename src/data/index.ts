import { localApi } from './local';
import { createSupabaseApi } from './supabase';
import type { Api } from './types';

// Expo only inlines these when each is written out in full like this.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// The one place the app chooses its backend: Supabase when configured (see
// .env.example), otherwise demo data kept in the browser.
export const api: Api = supabaseUrl && supabaseKey ? createSupabaseApi(supabaseUrl, supabaseKey) : localApi;

export * from './types';
