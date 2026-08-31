import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPassword } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/audit-logger';

// GET: Retrieve list of registered admin users
export async function GET(request: Request) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: 'Unauthorized: Administrator access required.' }, { status: 401 });
  }

  try {
    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        designation: true,
        canOverride: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(admins);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch admin users' }, { status: 500 });
  }
}

// POST: Add new admin user
export async function POST(request: Request) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: 'Unauthorized: Administrator access required.' }, { status: 401 });
  }

  const requesterEmail = request.headers.get('x-admin-email') || 'System Administrator';

  try {
    const body = await request.json();
    const { email, designation, canOverride } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid admin email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already exists
    const existing = await prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'This email is already registered as an admin.' }, { status: 409 });
    }

    const newAdmin = await prisma.adminUser.create({
      data: {
        email: normalizedEmail,
        designation: designation ? designation.trim() : '',
        canOverride: Boolean(canOverride),
      },
    });

    await logAdminAction(
      requesterEmail,
      'REGISTER_ADMIN',
      `Registered administrator account: ${normalizedEmail}${designation ? ` (${designation.trim()})` : ''} with ${canOverride ? 'status override' : 'standard'} permissions.`,
      newAdmin.id
    );

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add admin' }, { status: 500 });
  }
}

// PATCH: Update admin designation or permissions
export async function PATCH(request: Request) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: 'Unauthorized: Administrator access required.' }, { status: 401 });
  }

  const requesterEmail = request.headers.get('x-admin-email') || 'System Administrator';

  try {
    const body = await request.json();
    const { id, email, designation, canOverride } = body;

    if (!id && !email) {
      return NextResponse.json({ error: 'Admin ID or email is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (designation !== undefined) updateData.designation = designation.trim();
    if (canOverride !== undefined) updateData.canOverride = Boolean(canOverride);

    let updated;
    if (id) {
      updated = await prisma.adminUser.update({
        where: { id },
        data: updateData,
      });
    } else {
      updated = await prisma.adminUser.update({
        where: { email: email.trim().toLowerCase() },
        data: updateData,
      });
    }

    const changes: string[] = [];
    if (designation !== undefined) changes.push(`Designation: "${designation.trim()}"`);
    if (canOverride !== undefined) changes.push(`Override Permission: ${canOverride ? 'Granted' : 'Revoked'}`);

    await logAdminAction(
      requesterEmail,
      'UPDATE_ADMIN',
      `Updated admin (${updated.email}): ${changes.join(', ')}`,
      updated.id
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update admin' }, { status: 500 });
  }
}

// DELETE: Remove admin user
export async function DELETE(request: Request) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: 'Unauthorized: Administrator access required.' }, { status: 401 });
  }

  const requesterEmail = request.headers.get('x-admin-email') || 'System Administrator';

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required.' }, { status: 400 });
    }

    const targetUser = await prisma.adminUser.findUnique({ where: { id } });

    await prisma.adminUser.delete({
      where: { id },
    });

    await logAdminAction(
      requesterEmail,
      'REVOKE_ADMIN',
      `Revoked administrator access for ${targetUser?.email || id}.`,
      id
    );

    return NextResponse.json({ success: true, message: 'Admin removed successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete admin' }, { status: 500 });
  }
}
