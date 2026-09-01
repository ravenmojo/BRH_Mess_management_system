import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminToken, getSuperAdminEmails } from '@/lib/admin-auth';
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

    // 1. Check if the entered string matches the primary administrator master password
    if (expectedMasterPassword && cleanIdentifier === expectedMasterPassword) {
      const token = createAdminToken('admin@kgp', true);
      return NextResponse.json({
        authenticated: true,
        isPasswordLogin: true,
        isMasterAdmin: true,
        token,
        adminEmail: 'admin@kgp',
        adminDesignation: 'System Administrator',
      });
    }

    // 2. Otherwise, treat the input strictly as an admin email requiring OTP verification
    const normalizedEmail = identifier.toLowerCase();

    // Query database for admin registration or check super admin allowlist
    let admin = null;
    try {
      admin = await prisma.adminUser.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbErr) {
      console.error('Error checking AdminUser in DB:', dbErr);
    }

    const isSuper = getSuperAdminEmails().includes(normalizedEmail);

    if (admin || isSuper) {
      const isMaster = Boolean(admin?.isMaster || isSuper);
      const token = createAdminToken(normalizedEmail, isMaster);
      return NextResponse.json({
        isRegisteredAdmin: true,
        isPasswordLogin: false,
        isMaster,
        email: normalizedEmail,
        designation: admin?.designation || (isSuper ? 'System Administrator' : ''),
        canOverride: isSuper ? true : Boolean(admin?.canOverride),
        tier: isSuper ? 'HIGH' : (admin?.tier || 'LOW'),
        canManageMess: isSuper ? true : Boolean(admin?.canManageMess),
        canManageMaintenance: isSuper ? true : Boolean(admin?.canManageMaintenance),
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
