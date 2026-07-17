let accessTokenProvider: (() => Promise<string | null>) | null = null;

export const setAccessTokenProvider = (provider: (() => Promise<string | null>) | null) => {
  accessTokenProvider = provider;
};

// Resolve a bearer token, optionally forcing the provider to run again. Neon
// Auth tokens are short-lived (~15 min) and may not be ready on the first call
// right after a page load or external redirect, so callers can retry.
const resolveToken = async (): Promise<string | null> => {
  try {
    return (await accessTokenProvider?.()) ?? null;
  } catch {
    return null;
  }
};

export const apiRequest = async (path: string, options: any = {}): Promise<any> => {
  const sendRequest = async (token: string | null) => {
    const headers = new Headers(options.headers);

    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (options.auth !== false && token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(path, {
      ...options,
      headers,
      body:
        options.body && typeof options.body !== 'string'
          ? JSON.stringify(options.body)
          : options.body,
    });
  };

  const needsAuth = options.auth !== false;
  let token = needsAuth ? await resolveToken() : null;
  let response = await sendRequest(token);

  // If the call required auth and came back 401, the token may have been
  // missing (not yet ready) or expired. Refresh once and retry before failing.
  if (needsAuth && response.status === 401) {
    const refreshed = await resolveToken();
    if (refreshed && refreshed !== token) {
      token = refreshed;
      response = await sendRequest(token);
    }
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
};

// Upload a file via multipart/form-data. Keeps the same auth/token handling as
// apiRequest but lets the browser set the multipart Content-Type boundary.
export const uploadFile = async (path: string, file: File, options: any = {}) => {
  const headers = new Headers(options.headers);

  if (options.auth !== false) {
    const token = await accessTokenProvider?.();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(path, { method: 'POST', headers, body: formData });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload.error || 'Upload failed');
  }

  return payload;
};
