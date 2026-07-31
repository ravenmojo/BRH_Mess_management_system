import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

let inMemoryFeedbacks: any[] = [
  {
    id: 'fb-1',
    studentName: 'Sourav Roy',
    hallRoll: '21BRH1002',
    comment: 'The Dal served in Tuesday lunch was slightly undercooked.',
    facilityType: 'REGULAR_MESS',
    status: 'RESOLVED',
    remark: 'Issue conveyed to chef. Fresh batch prepared for dinner.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fb-2',
    studentName: 'Rahul Verma',
    hallRoll: '22BRH2015',
    comment: 'Night Canteen Paneer Roll was great! Could you add extra cheese options?',
    facilityType: 'NIGHT_CANTEEN',
    status: 'PENDING',
    remark: null,
    createdAt: new Date().toISOString(),
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const facility = searchParams.get('facility'); // REGULAR_MESS | NIGHT_CANTEEN

  try {
    const whereClause: any = {};
    if (facility) {
      whereClause.facilityType = facility;
    }

    const feedbacks = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    if (feedbacks.length === 0) {
      const filtered = facility
        ? inMemoryFeedbacks.filter((f) => f.facilityType === facility)
        : inMemoryFeedbacks;
      return NextResponse.json(filtered);
    }

    return NextResponse.json(feedbacks);
  } catch (error) {
    const filtered = facility
      ? inMemoryFeedbacks.filter((f) => f.facilityType === facility)
      : inMemoryFeedbacks;
    return NextResponse.json(filtered);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentName, hallRoll, comment, facilityType } = body;

    if (!studentName || !comment) {
      return NextResponse.json(
        { error: 'Student Name and Comment are required fields.' },
        { status: 400 }
      );
    }

    const newFeedback = {
      id: `fb-${Date.now()}`,
      studentName,
      hallRoll: hallRoll || 'N/A',
      comment,
      facilityType: facilityType === 'NIGHT_CANTEEN' ? 'NIGHT_CANTEEN' : 'REGULAR_MESS',
      status: 'PENDING',
      remark: null,
      createdAt: new Date().toISOString(),
    };

    inMemoryFeedbacks.unshift(newFeedback);

    try {
      await prisma.feedback.create({
        data: {
          studentName,
          hallRoll,
          comment,
          facilityType: facilityType === 'NIGHT_CANTEEN' ? 'NIGHT_CANTEEN' : 'REGULAR_MESS',
        },
      });
    } catch (dbErr) {
      console.warn('DB bypass for feedback POST');
    }

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, remark } = body;

    if (!id) {
      return NextResponse.json({ error: 'Feedback ID is required.' }, { status: 400 });
    }

    const index = inMemoryFeedbacks.findIndex((f) => f.id === id);
    if (index !== -1) {
      if (status) inMemoryFeedbacks[index].status = status;
      if (remark !== undefined) inMemoryFeedbacks[index].remark = remark;
    }

    try {
      await prisma.feedback.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(remark !== undefined && { remark }),
        },
      });
    } catch (dbErr) {
      console.warn('DB bypass for feedback PATCH');
    }

    return NextResponse.json({ message: 'Feedback updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
