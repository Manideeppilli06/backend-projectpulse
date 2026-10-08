const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const TOKEN_KEY = 'pp_token';
export const USER_KEY = 'pp_user';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('pp:unauthorized'));
    }
    const message =
      (data && typeof data === 'object' && data.error) ||
      (response.status === 400 ? 'Please check the details you entered' : 'Something went wrong');
    throw new ApiError(response.status, message);
  }

  return data;
}