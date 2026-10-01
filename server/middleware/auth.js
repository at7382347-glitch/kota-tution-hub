const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const jwt = require('jsonwebtoken');

// Verifying Firebase ID tokens only needs the project ID (no service account).
if (!getApps().length) {
  initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'kota-tution-hub' });
}

const ADMIN_TOKEN_TTL = '12h';

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function signAdminToken() {
  return jwt.sign({ role: 'admin' }, process.env.ADMIN_JWT_SECRET, { expiresIn: ADMIN_TOKEN_TTL });
}

function isValidAdminToken(token) {
  if (!token || !process.env.ADMIN_JWT_SECRET) return false;
  try {
    return jwt.verify(token, process.env.ADMIN_JWT_SECRET).role === 'admin';
  } catch {
    return false;
  }
}

async function getFirebaseUid(token) {
  if (!token) return null;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// Requires a logged-in Firebase user; sets req.firebaseUid
async function requireUser(req, res, next) {
  const uid = await getFirebaseUid(getBearerToken(req));
  if (!uid) return res.status(401).json({ error: 'Please log in again.' });
  req.firebaseUid = uid;
  next();
}

// Requires a valid admin token; sets req.isAdmin
function requireAdmin(req, res, next) {
  if (!isValidAdminToken(getBearerToken(req))) {
    return res.status(401).json({ error: 'Admin session expired. Please log in again.' });
  }
  req.isAdmin = true;
  next();
}

// Accepts either an admin token or a Firebase user token
async function requireUserOrAdmin(req, res, next) {
  const token = getBearerToken(req);
  if (isValidAdminToken(token)) {
    req.isAdmin = true;
    return next();
  }
  const uid = await getFirebaseUid(token);
  if (!uid) return res.status(401).json({ error: 'Please log in again.' });
  req.firebaseUid = uid;
  next();
}

// Ensures :firebaseUid in the URL belongs to the logged-in user (admins may access any)
function requireSelf(req, res, next) {
  if (req.isAdmin || req.params.firebaseUid === req.firebaseUid) return next();
  return res.status(403).json({ error: 'You can only access your own account.' });
}

module.exports = { requireUser, requireAdmin, requireUserOrAdmin, requireSelf, signAdminToken };
