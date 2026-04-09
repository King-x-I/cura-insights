
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): { [key: string]: string };
  }

  export const env: Env;
}

declare module 'http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare module '@supabase/supabase-js' {
  export * from '@supabase/supabase-js';
}

declare module 'std/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}
