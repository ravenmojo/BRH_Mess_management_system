import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteFromCloudinary } from '@/lib/cloudinary-delete';

let inMemoryFeedbacks: any[] = [
  {
    id: 'fb-1',
    studentName: 'Sourav Roy',
    roomNo: 'A-515',
    email: 'sourav@iitkgp.ac.in',
    comment: 'The Dal served in Tuesday lunch was slightly undercooked.',
    facilityType: 'REGULAR_MESS',
    status: 'RESOLVED',
    remark: 'Issue conveyed to chef. Fresh batch prepared for dinner.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fb-2',
    studentName: 'Rahul Verma',
    roomNo: 'B-312',
    email: 'rahul@iitkgp.ac.in',
    comment: 'Night Canteen Paneer Roll was great! Could you add extra cheese options?',
    facilityType: 'NIGHT_CANTEEN',
    status: 'PENDING',
    remark: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fb-3',
    studentName: 'Amit Kumar',
    roomNo: 'C-201',
    email: 'amit@iitkgp.ac.in',
    comment: 'The flush in C-Block 2nd floor left washroom is leaking.',
    facilityType: 'MAINTENANCE_WASHROOM',
    status: 'PENDING',
    remark: null,
    createdAt: new Date().toISOString(),
  },
];

// Room number validation: A-515 format (Wing A-D, 3-digit room)
function isValidRoomNo(roomNo: string): boolean {
  return /^[A-D]-\d{3}$/.test(roomNo.trim().toUpperCase());
}

const MAINTENANCE_TYPES = [
  'MAINTENANCE_WASHROOM',
  'MAINTENANCE_WATER',
  'MAINTENANCE_ELECTRICAL',
  'MAINTENANCE_CIVIL',
  'MAINTENANCE_CLEANING',
  'MAINTENANCE_OUTDOOR',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const facility = searchParams.get('facility');

  try {
    const whereClause: any = {};
    if (facility) {
      if (facility === 'MAINTENANCE') {
        whereClause.facilityType = { in: MAINTENANCE_TYPES };
      } else {
        whereClause.facilityType = facility;
      }
    }

    const feedbacks = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    if (feedbacks.length === 0) {
      const filtered = facility
        ? facility === 'MAINTENANCE'
          ? inMemoryFeedbacks.filter((f) => f.facilityType.startsWith('MAINTENANCE_'))
          : inMemoryFeedbacks.filter((f) => f.facilityType === facility)
        : inMemoryFeedbacks;
      return NextResponse.json(filtered);
    }

    return NextResponse.json(feedbacks);
  } catch (error) {
    const filtered = facility
      ? facility === 'MAINTENANCE'
        ? inMemoryFeedbacks.filter((f) => f.facilityType.startsWith('MAINTENANCE_'))
        : inMemoryFeedbacks.filter((f) => f.facilityType === facility)
      : inMemoryFeedbacks;
    return NextResponse.json(filtered);
  }
}

export async function POST(request: Request) {
  try {
    const { studentName, comment, facilityType, mediaUrl, roomNo, email, capturedAt } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith('.iitkgp.ac.in') && trimmedEmail !== 'soura7@gmail.com' && trimmedEmail !== 'souradeep.satpathy@gmail.com') {
      return NextResponse.json({ error: 'Only .iitkgp.ac.in emails or super admin are allowed.' }, { status: 403 });
    }

    if (!roomNo || !isValidRoomNo(roomNo)) {
      return NextResponse.json(
        { error: 'Valid Room No. is required (format: A-515, wing A-D, 3-digit room).' },
        { status: 400 }
      );
    }

    if (!comment) {
      return NextResponse.json(
        { error: 'Grievance description is required.' },
        { status: 400 }
      );
    }

    const validFacilities = [
      'REGULAR_MESS', 'NIGHT_CANTEEN',
      'MAINTENANCE_WASHROOM', 'MAINTENANCE_WATER',
      'MAINTENANCE_ELECTRICAL', 'MAINTENANCE_CIVIL', 'MAINTENANCE_CLEANING',
      'MAINTENANCE_OUTDOOR'
    ];
    const finalFacility = validFacilities.includes(facilityType) ? facilityType : 'REGULAR_MESS';

    // --- Rate Limiting ---
    // 1/hour per section type (mess/canteen OR maintenance)
    // 3/day combined across all sections
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
      // Per-hour limit: check same facilityType group
      const isMaintenance = finalFacility.startsWith('MAINTENANCE_');
      const hourWhereClause: any = {
        email: trimmedEmail,
        createdAt: { gte: oneHourAgo },
      };
      if (isMaintenance) {
        hourWhereClause.facilityType = { in: MAINTENANCE_TYPES };
      } else {
        hourWhereClause.facilityType = finalFacility;
      }

      const hourlyCount = await prisma.feedback.count({ where: hourWhereClause });
      if (hourlyCount >= 1) {
        return NextResponse.json(
          { error: 'You can only submit 1 grievance per hour in this section. Please try again later.' },
          { status: 429 }
        );
      }

      // Per-day limit: combined across ALL sections
      const dailyCount = await prisma.feedback.count({
        where: {
          email: trimmedEmail,
          createdAt: { gte: todayStart },
        },
      });
      if (dailyCount >= 3) {
        return NextResponse.json(
          { error: 'Daily limit reached (3 grievances/day across all sections). Please try again tomorrow.' },
          { status: 429 }
        );
      }
    } catch (dbErr) {
      // If DB is unavailable, allow submission (fallback)
      console.warn('Rate limit DB check failed, allowing submission:', dbErr);
    }

    const normalizedRoomNo = roomNo.trim().toUpperCase();
    const finalStudentName = (studentName && studentName.trim()) || 'Anonymous';

    const newFeedback = {
      id: `fb-${Date.now()}`,
      studentName: finalStudentName,
      roomNo: normalizedRoomNo,
      email: trimmedEmail,
      comment,
      facilityType: finalFacility,
      status: 'PENDING',
      remark: null,
      mediaUrl: mediaUrl || null,
      capturedAt: capturedAt || null,
      createdAt: new Date().toISOString(),
    };

    inMemoryFeedbacks.unshift(newFeedback);

    try {
      await prisma.feedback.create({
        data: {
          studentName: finalStudentName,
          hallRoll: normalizedRoomNo, // Legacy field — store roomNo here for backward compat
          roomNo: normalizedRoomNo,
          email: trimmedEmail,
          comment,
          facilityType: finalFacility,
          mediaUrl: mediaUrl || null,
          capturedAt: capturedAt || null,
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

    let mediaUrl: string | null = null;
    const targetInMemory = inMemoryFeedbacks.find((f) => f.id === id);
    if (targetInMemory?.mediaUrl) {
      mediaUrl = targetInMemory.mediaUrl;
    } else {
      try {
        const targetDb = await prisma.feedback.findUnique({ where: { id } });
        if (targetDb?.mediaUrl) mediaUrl = targetDb.mediaUrl;
      } catch (e) {}
    }

    inMemoryFeedbacks = inMemoryFeedbacks.filter((f) => f.id !== id);

    try {
      await prisma.feedback.delete({
        where: { id },
      });
    } catch (dbErr) {
      console.warn('DB bypass for feedback DELETE');
    }

    let cloudinaryNotice: string | null = null;
    if (mediaUrl) {
      const purgeRes = await deleteFromCloudinary(mediaUrl);
      if (!purgeRes.success) {
        cloudinaryNotice = purgeRes.message;
      }
    }

    return NextResponse.json({ message: 'Grievance removed successfully!', cloudinaryNotice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
