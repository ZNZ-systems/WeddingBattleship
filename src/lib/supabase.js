import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient(editorToken) {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Fail fast to make missing env obvious during development
    // eslint-disable-next-line no-console
    console.error('Missing Supabase env: REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY');
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        'x-editor-token': editorToken,
      },
    },
  });
}


