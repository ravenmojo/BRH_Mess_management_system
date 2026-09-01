import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminContext } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/audit-logger';

// Helper to check if requester is a HIGH tier admin
async function requireHighTierAdmin(request: Request) {
  const adminCtx = await getAdminContext(request);
  if (!adminCtx) return null;
  if (adminCtx.tier !== 'HIGH') return null;
  return adminCtx;
}

// GET: Retrieve list of registered admin users
export async function GET(request: Request) {
  const adminCtx = await getAdminContext(request);
  if (!adminCtx) {
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
        tier: true,
        isMaster: true,
        canManageMess: true,
        canManageMaintenance: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json(admins);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch admin users' }, { status: 500 });
  }
}

// POST: Add new admin user
export async function POST(request: Request) {
  const adminCtx = await requireHighTierAdmin(request);
  if (!adminCtx) {
    return NextResponse.json({ error: 'Unauthorized: Only High-Level Administrators can manage admins.' }, { status: 403 });
  }

  const requesterEmail = adminCtx.email;

  try {
    const body = await request.json();
    const { email, designation, canOverride, tier, isMaster, canManageMess, canManageMaintenance } = body;

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

    const assignedTier = tier === 'LOW' ? 'LOW' : 'HIGH';
    const newAdmin = await prisma.adminUser.create({
      data: {
        email: normalizedEmail,
        designation: designation ? designation.trim() : '',
        canOverride: assignedTier === 'LOW' ? false : Boolean(canOverride),
        tier: assignedTier,
        isMaster: assignedTier === 'HIGH' ? Boolean(isMaster) : false,
        canManageMess: assignedTier === 'LOW' ? Boolean(canManageMess) : true,
        canManageMaintenance: assignedTier === 'LOW' ? Boolean(canManageMaintenance) : true,
      },
    });

    await logAdminAction(
      requesterEmail,
      'REGISTER_ADMIN',
      `Registered administrator account: ${normalizedEmail}${designation ? ` (${designation.trim()})` : ''} as ${assignedTier}${assignedTier === 'HIGH' && isMaster ? ' (Master Admin)' : ''} with ${canOverride ? 'status override' : 'standard'} permissions.`,
      newAdmin.id
    );

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add admin' }, { status: 500 });
  }
}

// PATCH: Update admin designation or permissions
export async function PATCH(request: Request) {
  const adminCtx = await requireHighTierAdmin(request);
  if (!adminCtx) {
    return NextResponse.json({ error: 'Unauthorized: Only High-Level Administrators can manage admins.' }, { status: 403 });
  }

  const requesterEmail = adminCtx.email;

  try {
    const body = await request.json();
    const { id, email, designation, canOverride, tier, isMaster, canManageMess, canManageMaintenance } = body;

    if (!id && !email) {
      return NextResponse.json({ error: 'Admin ID or email is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (designation !== undefined) updateData.designation = designation.trim();
    if (tier !== undefined) {
      updateData.tier = tier === 'LOW' ? 'LOW' : 'HIGH';
      if (updateData.tier === 'LOW') {
        updateData.canOverride = false; // Low tier cannot override
        updateData.isMaster = false; // Low tier cannot be master admin
        if (canManageMess !== undefined) updateData.canManageMess = Boolean(canManageMess);
        if (canManageMaintenance !== undefined) updateData.canManageMaintenance = Boolean(canManageMaintenance);
      } else {
        updateData.canManageMess = true;
        updateData.canManageMaintenance = true;
        if (canOverride !== undefined) updateData.canOverride = Boolean(canOverride);
        if (isMaster !== undefined) updateData.isMaster = Boolean(isMaster);
      }
    } else {
      if (canOverride !== undefined) updateData.canOverride = Boolean(canOverride);
      if (isMaster !== undefined) updateData.isMaster = Boolean(isMaster);
      if (canManageMess !== undefined) updateData.canManageMess = Boolean(canManageMess);
      if (canManageMaintenance !== undefined) updateData.canManageMaintenance = Boolean(canManageMaintenance);
    }

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
    if (tier !== undefined) changes.push(`Tier: ${updateData.tier}`);
    if (updateData.isMaster !== undefined) changes.push(`Master Admin Status: ${updateData.isMaster ? 'Granted' : 'Revoked'}`);
    if (updateData.canOverride !== undefined) changes.push(`Override Permission: ${updateData.canOverride ? 'Granted' : 'Revoked'}`);
    if (updateData.canManageMess !== undefined) changes.push(`Mess Access: ${updateData.canManageMess}`);
    if (updateData.canManageMaintenance !== undefined) changes.push(`Maintenance Access: ${updateData.canManageMaintenance}`);

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
  const adminCtx = await requireHighTierAdmin(request);
  if (!adminCtx) {
    return NextResponse.json({ error: 'Unauthorized: Only High-Level Administrators can manage admins.' }, { status: 403 });
  }

  const requesterEmail = adminCtx.email;

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
