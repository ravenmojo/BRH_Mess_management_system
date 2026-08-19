import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPassword } from '@/lib/admin-auth';

// GET: Retrieve list of registered admin users
export async function GET(request: Request) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized: Master admin access required.' }, { status: 401 });
  }

  try {
    const admins = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        designation: true,
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
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized: Master admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, designation } = body;

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
      },
    });

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to add admin' }, { status: 500 });
  }
}

// PATCH: Update admin designation
export async function PATCH(request: Request) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized: Master admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, email, designation } = body;

    if (!id && !email) {
      return NextResponse.json({ error: 'Admin ID or email is required.' }, { status: 400 });
    }

    let updated;
    if (id) {
      updated = await prisma.adminUser.update({
        where: { id },
        data: { designation: designation !== undefined ? designation.trim() : undefined },
      });
    } else {
      updated = await prisma.adminUser.update({
        where: { email: email.trim().toLowerCase() },
        data: { designation: designation !== undefined ? designation.trim() : undefined },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update admin designation' }, { status: 500 });
  }
}

// DELETE: Remove admin user
export async function DELETE(request: Request) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized: Master admin access required.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required.' }, { status: 400 });
    }

    await prisma.adminUser.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Admin removed successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete admin' }, { status: 500 });
  }
}
