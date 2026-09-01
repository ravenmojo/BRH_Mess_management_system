import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limiter';
import { verifyCsrfOrigin } from '@/lib/admin-auth';

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin (CSRF check failed).' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = checkRateLimit(`manager_approve_${ip}`, 10, 5 * 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const { feedbackId, password } = await request.json();

    if (!feedbackId || !password) {
      return NextResponse.json({ error: 'Feedback ID and password are required.' }, { status: 400 });
    }

    const correctPassword = process.env.MESS_MANAGER_PASSWORD || 'mess033@BRH';

    if (password !== correctPassword) {
      return NextResponse.json({ error: 'Invalid manager password.' }, { status: 401 });
    }

    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return NextResponse.json({ error: 'Grievance not found.' }, { status: 404 });
    }

    if (feedback.status !== 'UNREGISTERED') {
      return NextResponse.json({ error: 'This grievance does not require manager approval or is already processed.' }, { status: 400 });
    }

    const updated = await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        managerApproved: true,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, updated }, { status: 200 });
  } catch (error: any) {
    console.error('Manager approval error:', error);
    return NextResponse.json({ error: 'Failed to process manager approval.' }, { status: 500 });
  }
}
