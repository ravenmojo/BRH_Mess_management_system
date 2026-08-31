import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { verifyAdminPassword } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const polls = await prisma.poll.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
      }
    });

    return NextResponse.json(polls);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { month, year, options } = body;

    if (!month || !year || !options || !Array.isArray(options)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Mark previous polls as inactive
    await prisma.poll.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    const newPoll = await prisma.poll.create({
      data: {
        month,
        year,
        isActive: true,
        options: {
          create: options.map((opt: string) => ({ itemName: opt }))
        }
      },
      include: {
        options: true
      }
    });

    return NextResponse.json(newPoll, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Poll ID is required.' }, { status: 400 });
    }

    const updated = await prisma.poll.update({
      where: { id },
      data: { isActive }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
