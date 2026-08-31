import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminToken } from '@/lib/admin-auth';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(`auth_${ip}`, 10, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }
    const body = await request.json();
    const identifier = (body.identifier || body.password || body.email || '').trim();

    if (!identifier) {
      return NextResponse.json({ error: 'Please enter your admin email.' }, { status: 400 });
    }

    const rawExpected = process.env.ADMIN_PASSWORD || '';
    const expectedMasterPassword = rawExpected.replace(/^["']|["']$/g, '').trim();
    const cleanIdentifier = identifier.replace(/^["']|["']$/g, '').trim();

    // 1. Check if the entered string matches the primary administrator credential
    if (expectedMasterPassword && cleanIdentifier === expectedMasterPassword) {
      const token = createAdminToken('admin@kgp', true);
      return NextResponse.json({
        authenticated: true,
        isMasterAdmin: true,
        token,
        adminEmail: 'admin@kgp',
        adminDesignation: 'System Administrator',
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
      const token = createAdminToken(admin.email, false);
      return NextResponse.json({
        isRegisteredAdmin: true,
        email: admin.email,
        designation: admin.designation || '',
        canOverride: admin.canOverride,
        token,
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
