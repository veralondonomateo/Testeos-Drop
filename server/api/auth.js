import { all, one, run } from '../db.js';
import { SESSION_DAYS } from '../config.js';
import { id, token, nowISO, hashPassword, verifyPassword, clean } from '../lib/util.js';
import { HttpError, unauthorized } from '../lib/http.js';

export const COOKIE_NAME = 'ds_session';

export function createSession(userId) {
  const t = token();
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  run('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?,?,?,?)',
    [t, userId, nowISO(), expires]);
  return t;
}

export function userFromToken(t) {
  if (!t) return null;
  const s = one('SELECT * FROM sessions WHERE token = ?', [t]);
  if (!s) return null;
  if (new Date(s.expires_at) < new Date()) {
    run('DELETE FROM sessions WHERE token = ?', [t]);
    return null;
  }
  return one('SELECT id, email, name, role FROM users WHERE id = ?', [s.user_id]);
}

export function login(email, password) {
  const user = one('SELECT * FROM users WHERE email = ?', [clean(email, 160).toLowerCase()]);
  if (!user || !verifyPassword(String(password ?? ''), user.password_hash)) {
    throw new HttpError(401, 'Correo o contraseña incorrectos');
  }
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token: createSession(user.id) };
}

export const logout = (t) => run('DELETE FROM sessions WHERE token = ?', [t]);

export function listUsers() {
  return all('SELECT id, email, name, role, created_at FROM users ORDER BY created_at');
}

export function createUser({ email, name, password, role = 'staff' }) {
  const mail = clean(email, 160).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) throw new HttpError(400, 'Correo inválido');
  if (String(password ?? '').length < 6) throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres');
  if (one('SELECT id FROM users WHERE email = ?', [mail])) throw new HttpError(400, 'Ese correo ya está registrado');
  const user = {
    id: id('usr'), email: mail, name: clean(name, 80) || mail.split('@')[0],
    role: ['owner', 'staff'].includes(role) ? role : 'staff',
    password_hash: hashPassword(password), created_at: nowISO(),
  };
  run('INSERT INTO users (id,email,name,role,password_hash,created_at) VALUES (?,?,?,?,?,?)',
    [user.id, user.email, user.name, user.role, user.password_hash, user.created_at]);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function requireAuth(ctx) {
  if (!ctx.user) throw unauthorized();
  return ctx.user;
}
