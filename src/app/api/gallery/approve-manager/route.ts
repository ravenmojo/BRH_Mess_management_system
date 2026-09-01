import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { verifyCsrfOrigin } from '@/lib/admin-auth';

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin (CSRF check failed).' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = checkRateLimit(`gallery_manager_approve_${ip}`, 10, 5 * 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const { galleryId, password } = await request.json();

    if (!galleryId || !password) {
      return NextResponse.json({ error: 'Gallery ID and password are required.' }, { status: 400 });
    }

    const correctPassword = process.env.MESS_MANAGER_PASSWORD || 'mess033@BRH';

    if (password !== correctPassword) {
      return NextResponse.json({ error: 'Incorrect mess manager password.' }, { status: 401 });
    }

    const image = await prisma.galleryImage.findUnique({ where: { id: galleryId } });

    if (!image) {
      return NextResponse.json({ error: 'Gallery submission not found.' }, { status: 404 });
    }

    if (image.managerApproved) {
      return NextResponse.json({ error: 'This submission is already countersigned by the mess manager.' }, { status: 400 });
    }

    const updated = await prisma.galleryImage.update({
      where: { id: galleryId },
      data: { managerApproved: true },
    });

    return NextResponse.json({ success: true, updated }, { status: 200 });
  } catch (error: any) {
    console.error('Gallery manager approval error:', error);
    return NextResponse.json({ error: 'Failed to process manager approval.' }, { status: 500 });
  }
}
