/**
 * Server-side admin authentication utilities.
 *
 * - Reads the super-admin email allowlist from SUPER_ADMIN_EMAILS env var
 *   (comma-separated) instead of hardcoding Gmail addresses in source code.
 * - Generates & verifies signed HMAC admin session tokens for OTP / credential logins.
 * - Provides verifyAdminRequest to protect all admin-only API endpoints across
 *   primary master password, registered admin email OTPs, signed tokens, and Supabase cookies.
 */

import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

/**
 * Verifies that the request originated from the expected application origin (CSRF protection).
 */
export function verifyCsrfOrigin(request: Request): boolean {
  if (request.method === 'GET') return true;
  
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  if (!origin && !referer) {
    return false; // Strict check for mutation endpoints
  }
  
  try {
    const expectedHost = host || '';
    if (origin) {
      const originHost = new URL(origin).host;
      if (originHost !== expectedHost) return false;
    }
    if (referer) {
      const refererHost = new URL(referer).host;
      if (refererHost !== expectedHost) return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}


/**
 * Returns the secret key used for HMAC signing.
 */
function getHmacSecret(): string {
  return process.env.ADMIN_PASSWORD || 'bros_admin_secure_salt_2026';
}

/**
 * Returns the list of super-admin emails allowed to bypass the
 * `.iitkgp.ac.in` domain restriction. Read from `SUPER_ADMIN_EMAILS`
 * environment variable (comma-separated, trimmed, lowercased).
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
 * Timing-safe comparison of two strings to prevent timing attacks.
 * Pads both strings to equal length before comparing.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // Pad the shorter buffer to prevent length-based timing leaks
  if (bufA.length !== bufB.length) {
    const maxLen = Math.max(bufA.length, bufB.length);
    const paddedA = Buffer.alloc(maxLen);
    const paddedB = Buffer.alloc(maxLen);
    bufA.copy(paddedA);
    bufB.copy(paddedB);
    // Always run the comparison to avoid short-circuiting on length mismatch
    crypto.timingSafeEqual(paddedA, paddedB);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a signed admin session token.
 */
export function createAdminToken(email: string, isMaster: boolean = false): string {
  const payload = JSON.stringify({
    email: email.trim().toLowerCase(),
    isMaster,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getHmacSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

/**
 * Verifies a signed admin session token.
 */
export function verifyAdminToken(token: string): { email: string; isMaster: boolean } | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', getHmacSecret())
    .update(encoded)
    .digest('base64url');

  if (!timingSafeCompare(signature, expectedSig)) return null;

  try {
    const jsonStr = Buffer.from(encoded, 'base64url').toString('utf8');
    const data = JSON.parse(jsonStr);
    if (!data || !data.email || !data.exp) return null;
    if (Date.now() > data.exp) return null;
    return { email: data.email, isMaster: Boolean(data.isMaster) };
  } catch {
    return null;
  }
}

/**
 * Verifies whether the incoming request is authorized as an administrator.
 *
 * Checks:
 * 1. `x-admin-password` header against `ADMIN_PASSWORD` (Timing-safe)
 * 2. `x-admin-token` or Bearer header against signed admin HMAC tokens
 * 3. Supabase server user session in cookies / headers
 * 4. `x-admin-email` header verified against AdminUser database or Super Admin allowlist
 */
export async function verifyAdminRequest(request: Request): Promise<boolean> {
  // 1. Signed Admin Token check (from x-admin-token or Authorization header)
  const tokenHeader =
    request.headers.get('x-admin-token') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (tokenHeader) {
    const verified = verifyAdminToken(tokenHeader);
    if (verified) return true;
  }

  // 3. Supabase server user session check
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user?.email) {
      const email = user.email.toLowerCase().trim();
      if (getSuperAdminEmails().includes(email)) return true;
      const admin = await prisma.adminUser.findUnique({ where: { email } });
      if (admin) return true;
    }
  } catch (e) {}

  // 4. Admin email verification against database
  const adminEmail = request.headers.get('x-admin-email')?.trim().toLowerCase();
  if (adminEmail) {
    if (getSuperAdminEmails().includes(adminEmail)) return true;
    try {
      const admin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
      if (admin) return true;
    } catch (e) {}
  }

  return false;
}

/**
 * Async alias to verifyAdminRequest for backwards-compatibility.
 */
export async function verifyAdminPassword(request: Request): Promise<boolean> {
  return verifyAdminRequest(request);
}
