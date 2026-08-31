'use client';

import { createBrowserClient } from '@supabase/ssr';

declare global{interface Window{__SCENEZY_CONFIG__?:{supabaseUrl:string;supabaseAnonKey:string}}}

export function createSupabaseBrowserClient() {
  const config=window.__SCENEZY_CONFIG__;
  if(!config?.supabaseUrl||!config.supabaseAnonKey)throw new Error('Supabase browser configuration is missing');
  return createBrowserClient(
    config.supabaseUrl,
    config.supabaseAnonKey
  );
}
