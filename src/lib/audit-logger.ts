import { prisma } from '@/lib/prisma';

export interface AuditLogEntry {
  adminEmail: string;
  action: string;
  details: string;
  targetId?: string | null;
}

export async function logAdminAction(
  adminEmail: string,
  action: string,
  details: string,
  targetId?: string | null
) {
  try {
    const email = adminEmail && adminEmail.trim() ? adminEmail.trim() : 'System Administrator';
    await prisma.adminAuditLog.create({
      data: {
        adminEmail: email,
        action,
        details,
        targetId: targetId || null,
      },
    });
  } catch (err) {
    console.error('Failed to record admin audit log:', err);
  }
}
