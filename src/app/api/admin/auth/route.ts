import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = (body.identifier || body.password || body.email || '').trim();

    if (!identifier) {
      return NextResponse.json({ error: 'Please enter your admin email.' }, { status: 400 });
    }

    const rawExpected = process.env.ADMIN_PASSWORD || '';
    const expectedMasterPassword = rawExpected.replace(/^["']|["']$/g, '').trim();
    const cleanIdentifier = identifier.replace(/^["']|["']$/g, '').trim();

    // 1. Check if the entered string matches the stealth master password
    if (expectedMasterPassword && cleanIdentifier === expectedMasterPassword) {
      return NextResponse.json({
        authenticated: true,
        isMasterAdmin: true,
        adminEmail: 'master.admin@kgp',
        adminDesignation: 'Master Administrator',
      });
    }

    // 2. Otherwise, treat the input as an admin email to verify
    const normalizedEmail = identifier.toLowerCase();

    // Query database for admin registration
    let admin = null;
    try {
      admin = await prisma.adminUser.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbErr) {
      console.error('Error checking AdminUser in DB:', dbErr);
    }

    if (admin) {
      return NextResponse.json({
        isRegisteredAdmin: true,
        email: admin.email,
        designation: admin.designation || '',
      });
    }

    // If not found in admin list
    return NextResponse.json(
      { error: 'Access Denied: This email is not registered as an authorized administrator.' },
      { status: 403 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication error occurred.' }, { status: 500 });
  }
}
