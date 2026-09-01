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

    // Auto-prune to keep DB disk space bounded (Max ~2,000 logs)
    // Runs periodically (~10% chance per action) to avoid slowing down every request
    if (Math.random() < 0.10) {
      const MAX_LOGS = 2000;
      const thresholdLog = await prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: MAX_LOGS,
        take: 1,
        select: { createdAt: true },
      });

      if (thresholdLog.length > 0) {
        await prisma.adminAuditLog.deleteMany({
          where: { createdAt: { lte: thresholdLog[0].createdAt } },
        });
      }
    }
  } catch (err) {
    console.error('Failed to record admin audit log:', err);
  }
}
