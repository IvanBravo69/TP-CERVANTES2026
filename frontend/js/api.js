const API = (() => {
  const BASE = 'http://localhost:3000/api';

  function getToken()  { return localStorage.getItem('sb_token'); }
  function getUser()   { return JSON.parse(localStorage.getItem('sb_user') || 'null'); }
  function setSession(token, user) {
    localStorage.setItem('sb_token', token);
    localStorage.setItem('sb_user', JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_user');
  }

  async function request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(BASE + path, opts);

    if (res.status === 401) {
      clearSession();
      window.location.href = '/';
      return null;
    }

    const data = await res.json();
    return { ok: res.ok, status: res.status, ...data };
  }

  return {
    getToken, getUser, setSession, clearSession,
    get:    (path)        => request('GET',    path),
    post:   (path, body)  => request('POST',   path, body),
    put:    (path, body)  => request('PUT',    path, body),
    patch:  (path, body)  => request('PATCH',  path, body),
    delete: (path)        => request('DELETE', path),
  };
})();
