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
  {
    id: 'fb-3',
    studentName: 'Amit Kumar',
    hallRoll: '20BRH3045',
    comment: 'The flush in C-Block 2nd floor left washroom is leaking.',
    facilityType: 'MAINTENANCE_WASHROOM',
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
    const { studentName, hallRoll, comment, facilityType, mediaUrl, roomNo, email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('.iitkgp.ac.in') && trimmedEmail !== 'soura7@gmail.com' && trimmedEmail !== 'souradeep.satpathy@gmail.com') {
      return NextResponse.json({ error: 'Only .iitkgp.ac.in emails or super admin are allowed.' }, { status: 403 });
    }

    if (!studentName || !hallRoll || !comment) {
      return NextResponse.json(
        { error: 'Student Name, Roll Number, and Comment are required fields.' },
        { status: 400 }
      );
    }

    const validFacilities = [
      'REGULAR_MESS', 'NIGHT_CANTEEN',
      'MAINTENANCE_WASHROOM', 'MAINTENANCE_WATER',
      'MAINTENANCE_ELECTRICAL', 'MAINTENANCE_CIVIL', 'MAINTENANCE_CLEANING'
    ];
    const finalFacility = validFacilities.includes(facilityType) ? facilityType : 'REGULAR_MESS';

    const newFeedback = {
      id: `fb-${Date.now()}`,
      studentName,
      hallRoll: hallRoll,
      comment,
      facilityType: finalFacility,
      status: 'PENDING',
      remark: null,
      mediaUrl: mediaUrl || null,
      createdAt: new Date().toISOString(),
    };

    inMemoryFeedbacks.unshift(newFeedback);

    try {
      await prisma.feedback.create({
        data: {
          studentName,
          hallRoll,
          roomNo,
          email,
          comment,
          facilityType: finalFacility,
          mediaUrl: mediaUrl || null,
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Feedback ID is required.' }, { status: 400 });
    }

    inMemoryFeedbacks = inMemoryFeedbacks.filter((f) => f.id !== id);

    try {
      await prisma.feedback.delete({
        where: { id },
      });
    } catch (dbErr) {
      console.warn('DB bypass for feedback DELETE');
    }

    return NextResponse.json({ message: 'Complaint removed successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
