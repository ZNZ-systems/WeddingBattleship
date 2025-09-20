import { neon, neonConfig } from '@neondatabase/serverless';

const SUPABASE_INSTANCE_KEY = '__wb_supabase_client__';

// Cache HTTP connections between calls in the browser
// Note: fetchConnectionCache is now always true by default in newer versions

export function getSupabaseClient(editorToken) {
  const connectionString = process.env.REACT_APP_NEON_DATABASE_URL;

  if (!connectionString) {
    // eslint-disable-next-line no-console
    console.error('Missing Neon env: REACT_APP_NEON_DATABASE_URL');
  }

  if (typeof window !== 'undefined' && window[SUPABASE_INSTANCE_KEY]) {
    return window[SUPABASE_INSTANCE_KEY];
  }

  const sql = neon(connectionString);

  // Minimal adapter to preserve used Supabase API surface in App.js
  const client = {
    from(tableName) {
      if (tableName !== 'plans') {
        throw new Error('Only the "plans" table is supported by this client');
      }

      return {
        select(/* columns */) {
          return {
            eq(column, value) {
              if (column !== 'slug') {
                throw new Error('Only eq("slug", value) is supported for select');
              }
              return {
                async maybeSingle() {
                  try {
                    const rows = await sql`SELECT data FROM public.plans WHERE slug = ${value} LIMIT 1`;
                    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
                    if (!row) return { data: null, error: null };
                    return { data: { data: row.data }, error: null };
                  } catch (e) {
                    return { data: null, error: e };
                  }
                }
              };
            }
          };
        },

        async upsert(payload /*, options */) {
          try {
            await sql`
              INSERT INTO public.plans (slug, editor_token, data)
              VALUES (${payload.slug}, ${payload.editor_token}, ${payload.data})
              ON CONFLICT (slug)
              DO UPDATE SET data = EXCLUDED.data
              WHERE public.plans.editor_token = EXCLUDED.editor_token
            `;
            return { error: null };
          } catch (e) {
            return { error: e };
          }
        }
      };
    }
  };

  if (typeof window !== 'undefined') {
    window[SUPABASE_INSTANCE_KEY] = client;
  }

  return client;
}



