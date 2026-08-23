/**
 * Server-side admin authentication utilities.
 *
 * - Reads the super-admin email allowlist from SUPER_ADMIN_EMAILS env var
 *   (comma-separated) instead of hardcoding Gmail addresses in source code.
 * - Provides a helper to verify the administrative password from request headers
 *   for protecting admin-only API routes.
 */

/**
 * Returns the list of super-admin emails allowed to bypass the
 * `.iitkgp.ac.in` domain restriction. Read from `SUPER_ADMIN_EMAILS`
 * environment variable (comma-separated, trimmed, lowercased).
 *
 * Example env value: "alice@gmail.com, bob@outlook.com"
 */
export function getSuperAdminEmails(): string[] {
  const raw = process.env.SUPER_ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Checks whether the given email is allowed to use the platform.
 * Allowed if it ends with `.iitkgp.ac.in` OR is in the super-admin allowlist.
 */
export function isAllowedEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (normalized.endsWith('.iitkgp.ac.in')) return true;
  return getSuperAdminEmails().includes(normalized);
}

/**
 * Verifies that a request carries a valid admin password.
 * The password is sent via the `x-admin-password` header and compared
 * against `process.env.ADMIN_PASSWORD`.
 *
 * @returns `true` if the password matches, `false` otherwise.
 */
export function verifyAdminPassword(request: Request): boolean {
  const rawExpected = process.env.ADMIN_PASSWORD || '';
  const expectedPassword = rawExpected.replace(/^["']|["']$/g, '').trim();
  if (!expectedPassword) return false;

  const rawHeader = request.headers.get('x-admin-password') || '';
  const headerPassword = rawHeader.replace(/^["']|["']$/g, '').trim();
  return headerPassword === expectedPassword;
}
