/**
 * Utility functions for displaying administrator identity across the app.
 * Rule: First priority is Designation. If designation is not present, fallback to Email.
 */

export function formatAdminDisplayName(
  designation?: string | null,
  email?: string | null,
  fallback: string = 'Administrator'
): string {
  if (designation && designation.trim()) {
    const trimmed = designation.trim();
    // If formatted as "email@domain.com (Designation)", extract "Designation"
    const match = trimmed.match(/\(([^)]+)\)$/);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
    // If designation doesn't look like a raw email address, use it directly
    if (!trimmed.includes('@')) {
      return trimmed;
    }
  }

  if (email && email.trim()) {
    const trimmed = email.trim();
    const match = trimmed.match(/\(([^)]+)\)$/);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
    return trimmed;
  }

  return fallback;
}

export function formatResolvedByAttribution(
  role?: string | null,
  resolvedBy?: string | null,
  email?: string | null
): string {
  return formatAdminDisplayName(role || resolvedBy, email, 'Administration');
}
