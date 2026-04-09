// Custom API client that replaces @supabase/supabase-js
// Mimics the Supabase query builder API to minimize frontend changes

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================
// Token management
// ============================================
function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ============================================
// Auth state change listeners
// ============================================
type AuthChangeCallback = (event: string, session: any) => void;
const authListeners: Set<AuthChangeCallback> = new Set();

function notifyAuthListeners(event: string, session: any) {
  authListeners.forEach(cb => {
    try { cb(event, session); } catch (e) { console.error('Auth listener error:', e); }
  });
}

// ============================================
// Query Builder (mimics supabase.from(table)...)
// ============================================
interface QueryFilter {
  column: string;
  operator: string;
  value: any;
}

class QueryBuilder {
  private _table: string;
  private _operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'UPSERT' = 'SELECT';
  private _select: string = '*';
  private _data: any = null;
  private _filters: QueryFilter[] = [];
  private _order: { column: string; ascending: boolean } | null = null;
  private _limit: number | null = null;
  private _single: boolean = false;
  private _maybeSingle: boolean = false;
  private _onConflict: string | null = null;

  constructor(table: string) {
    this._table = table;
  }

  select(columns: string = '*') {
    this._operation = 'SELECT';
    this._select = columns;
    return this;
  }

  insert(data: any) {
    this._operation = 'INSERT';
    this._data = data;
    return this;
  }

  update(data: any) {
    this._operation = 'UPDATE';
    this._data = data;
    return this;
  }

  upsert(data: any, options?: { onConflict?: string }) {
    this._operation = 'UPSERT';
    this._data = data;
    this._onConflict = options?.onConflict || 'id';
    return this;
  }

  delete() {
    this._operation = 'DELETE';
    return this;
  }

  eq(column: string, value: any) {
    this._filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: any) {
    this._filters.push({ column, operator: 'neq', value });
    return this;
  }

  gt(column: string, value: any) {
    this._filters.push({ column, operator: 'gt', value });
    return this;
  }

  lt(column: string, value: any) {
    this._filters.push({ column, operator: 'lt', value });
    return this;
  }

  in(column: string, values: any[]) {
    this._filters.push({ column, operator: 'in', value: values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this._order = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this._limit = count;
    return this;
  }

  single() {
    this._single = true;
    return this._execute();
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this._execute();
  }

  // When used without .single()/.maybeSingle(), the query auto-executes
  then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    return this._execute().then(resolve, reject);
  }

  private async _execute(): Promise<{ data: any; error: any }> {
    try {
      const body: any = {
        table: this._table,
        operation: this._operation,
        filters: this._filters,
        select: this._select,
        order: this._order,
        limit: this._limit,
        single: this._single,
        maybeSingle: this._maybeSingle,
      };

      if (this._data !== null && this._data !== undefined) {
        body.data = this._data;
      }

      if (this._onConflict) {
        body.onConflict = this._onConflict;
      }

      const res = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const json = await res.json();
      return { data: json.data, error: json.error || null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }
}

// ============================================
// Auth module
// ============================================
const auth = {
  async signUp({ email, password, options }: {
    email: string;
    password: string;
    options?: { data?: Record<string, any>; emailRedirectTo?: string };
  }) {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName: options?.data?.full_name || email.split('@')[0],
          userType: options?.data?.user_type || 'consumer',
        }),
      });
      const json = await res.json();
      if (json.error) {
        return { data: { user: null, session: null }, error: { message: json.error } };
      }
      if (json.data?.session?.access_token) {
        setToken(json.data.session.access_token);
        notifyAuthListeners('SIGNED_IN', json.data.session);
      }
      return { data: json.data, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err.message } };
    }
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.error) {
        return { data: { user: null, session: null }, error: { message: json.error } };
      }
      if (json.data?.session?.access_token) {
        setToken(json.data.session.access_token);
        notifyAuthListeners('SIGNED_IN', json.data.session);
      }
      return { data: json.data, error: null };
    } catch (err: any) {
      return { data: { user: null, session: null }, error: { message: err.message } };
    }
  },

  async signInWithOAuth(_options: any) {
    console.warn('Google OAuth is not available without Supabase. Use email/password login.');
    return { error: { message: 'Google OAuth is not available. Please use email/password login.' } };
  },

  async signOut() {
    setToken(null);
    notifyAuthListeners('SIGNED_OUT', null);
    return { error: null };
  },

  async getUser() {
    const token = getToken();
    if (!token) {
      return { data: { user: null }, error: null };
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      return { data: json.data, error: json.error || null };
    } catch (err: any) {
      return { data: { user: null }, error: { message: err.message } };
    }
  },

  async getSession() {
    const token = getToken();
    if (!token) {
      return { data: { session: null }, error: null };
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/session`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      return { data: json.data, error: json.error || null };
    } catch {
      return { data: { session: null }, error: null };
    }
  },

  async updateUser(attributes: { data?: Record<string, any>, password?: string }) {
    try {
      const res = await fetch(`${API_URL}/api/auth/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(attributes),
      });
      const json = await res.json();
      return { data: json.data, error: json.error || null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },

  onAuthStateChange(callback: AuthChangeCallback) {
    authListeners.add(callback);

    // Immediately check current state
    const token = getToken();
    if (token) {
      auth.getSession().then(({ data }) => {
        if (data?.session) {
          callback('INITIAL_SESSION', data.session);
        }
      });
    } else {
      setTimeout(() => callback('INITIAL_SESSION', null), 0);
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners.delete(callback);
          },
        },
      },
    };
  },

  // Stub for admin API
  admin: {
    async getUserById(userId: string) {
      return { data: null, error: { message: 'Admin API not available' } };
    },
  },

  async rpc(name: string, args?: any) {
    try {
      const res = await fetch(`${API_URL}/api/functions/${name}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(args || {}),
      });
      const json = await res.json();
      return { data: json.data, error: json.error || null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
};

// ============================================
// Storage module
// ============================================
function createStorageBucket(bucket: string) {
  return {
    async upload(filePath: string, file: File, _options?: any) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', filePath.split('/').slice(0, -1).join('/'));
      formData.append('bucket', bucket);

      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const json = await res.json();
      if (json.error) {
        return { data: null, error: json.error };
      }
      return { data: { path: json.data.path }, error: null };
    },

    getPublicUrl(path: string) {
      return {
        data: {
          publicUrl: `${API_URL}/uploads/${path}`,
        },
      };
    },

    async remove(paths: string[]) {
      for (const p of paths) {
        const token = getToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch(`${API_URL}/api/upload`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ filePath: p }),
        });
      }
      return { error: null };
    },
  };
}

const storage = {
  from: createStorageBucket,
};

// ============================================
// Functions module (edge function stubs)
// ============================================
const functions = {
  async invoke(name: string, options?: { body?: any }) {
    try {
      const res = await fetch(`${API_URL}/api/functions/${name}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ body: options?.body }),
      });
      const json = await res.json();
      return { data: json.data, error: json.error || null };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  },
};

// ============================================
// Channel/Realtime stubs (replaced with polling)
// ============================================
function createChannel(_name: string) {
  return {
    on(_event: string, _filter: any, _callback: any) {
      // Realtime is replaced with polling - this is a no-op
      return this;
    },
    subscribe() {
      return this;
    },
  };
}

function removeChannel(_channel: any) {
  // No-op
}

// ============================================
// Export the supabase-compatible client
// ============================================
export const supabase = {
  auth,
  from: (table: string) => new QueryBuilder(table),
  storage,
  functions,
  rpc: (name: string, args?: any) => auth.rpc(name, args),
  channel: createChannel,
  removeChannel,
};

// Type exports to maintain compatibility
export type { QueryBuilder };