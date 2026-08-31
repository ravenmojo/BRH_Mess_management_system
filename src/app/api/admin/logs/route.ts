import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPassword } from '@/lib/admin-auth';

// GET: Retrieve list of admin audit action logs
export async function GET(request: Request) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: 'Unauthorized: Administrator access required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { details: { contains: q, mode: 'insensitive' } },
        { adminEmail: { contains: q, mode: 'insensitive' } },
      ];
    }

    const logs = await prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 150,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
