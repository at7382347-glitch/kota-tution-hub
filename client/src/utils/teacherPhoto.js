import { API_BASE } from '../api';

// Build a loadable image URL from the teacher object.
// - Full http(s) URLs (Cloudinary) are returned as-is.
// - Legacy relative paths (/uploads/...) are resolved against the API server.
// - Returns null when there is no photo, so callers can show the initial instead.
export function resolveTeacherPhotoUrl(teacher) {
  const raw = teacher?.teacherProfile?.profilePhoto || teacher?.photoURL || '';

  if (typeof raw !== 'string') return null;
  const url = raw.trim();
  if (!url) return null;

  if (/^https?:\/\//i.test(url)) return url;
  if (!API_BASE) return null;

  return `${API_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}
