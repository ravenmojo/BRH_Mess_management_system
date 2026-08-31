import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteFromCloudinary } from '@/lib/cloudinary-delete';
import { isAllowedEmail, verifyAdminPassword } from '@/lib/admin-auth';
import {
  getCategoryCode,
  formatTicketDate,
  buildTicketNumber,
  ensureTicketNumber,
} from '@/lib/ticket';

let inMemoryFeedbacks: any[] = [
  {
    id: 'fb-1',
    ticketNumber: 'A-000MS1908261',
    studentName: 'Demo Student A',
    roomNo: 'A-100',
    email: 'demo.student.a@example.iitkgp.ac.in',
    comment: 'The Dal served in Tuesday lunch was slightly undercooked.',
    facilityType: 'REGULAR_MESS',
    status: 'RESOLVED',
    remark: 'Issue conveyed to chef. Fresh batch prepared for dinner.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fb-2',
    ticketNumber: 'B-000NC1908261',
    studentName: 'Demo Student B',
    roomNo: 'B-100',
    email: 'demo.student.b@example.iitkgp.ac.in',
    comment: 'Night Canteen Paneer Roll was great! Could you add extra cheese options?',
    facilityType: 'NIGHT_CANTEEN',
    status: 'PENDING',
    remark: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fb-3',
    ticketNumber: 'C-000WR1908261',
    studentName: 'Demo Student C',
    roomNo: 'C-100',
    email: 'demo.student.c@example.iitkgp.ac.in',
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
  const search = searchParams.get('search')?.trim().toLowerCase();
  const authorEmail = searchParams.get('authorEmail')?.trim().toLowerCase();
  // Server-side admin verification instead of trusting a client query param
  const isAdmin = verifyAdminPassword(request);

  try {
    const whereClause: any = {};

    if (authorEmail) {
      // Universal student lookup across all categories
      whereClause.email = authorEmail;
    } else if (facility) {
      if (facility === 'MAINTENANCE') {
        whereClause.facilityType = { in: MAINTENANCE_TYPES };
      } else {
        whereClause.facilityType = facility;
      }
    }

    // Public feed filter: Omit grievances resolved more than 30 days ago
    if (!isAdmin && !authorEmail) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      whereClause.OR = [
        { status: { not: 'RESOLVED' } },
        { resolvedAt: { gte: thirtyDaysAgo } },
        { resolvedAt: null },
      ];
    }

    const orderByClause: any[] = isAdmin
      ? [{ isEscalated: 'desc' }, { escalatedAt: 'desc' }, { createdAt: 'desc' }]
      : [{ createdAt: 'desc' }];

    const feedbacks = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: orderByClause,
    });

    // Background 45-day auto-purge & statistics accumulator (non-blocking)
    (async () => {
      try {
        const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
        const purgeCandidates = await prisma.feedback.findMany({
          where: {
            status: 'RESOLVED',
            resolvedAt: { lt: fortyFiveDaysAgo },
          },
          take: 10,
        });

        for (const item of purgeCandidates) {
          const diffMinutes = item.resolvedAt && item.createdAt
            ? Math.max(0, Math.round((new Date(item.resolvedAt).getTime() - new Date(item.createdAt).getTime()) / (1000 * 60)))
            : 0;

          await prisma.grievanceStatSummary.upsert({
            where: { category: item.facilityType },
            create: {
              category: item.facilityType,
              totalSubmitted: 1,
              totalResolved: 1,
              totalTwoWayVerified: item.adminResolved && item.userResolved ? 1 : 0,
              totalEscalated: item.isEscalated ? 1 : 0,
              totalResolutionTimeMinutes: BigInt(diffMinutes),
            },
            update: {
              totalSubmitted: { increment: 1 },
              totalResolved: { increment: 1 },
              totalTwoWayVerified: { increment: item.adminResolved && item.userResolved ? 1 : 0 },
              totalEscalated: { increment: item.isEscalated ? 1 : 0 },
              totalResolutionTimeMinutes: { increment: BigInt(diffMinutes) },
            },
          });

          if (item.mediaUrl) {
            await deleteFromCloudinary(item.mediaUrl).catch(() => {});
          }

          await prisma.feedback.delete({ where: { id: item.id } }).catch(() => {});
        }
      } catch (purgeErr) {}
    })();

    let sanitizedFeedbacks = feedbacks.map((fb, idx) => ({
      ...fb,
      ticketNumber: fb.ticketNumber || ensureTicketNumber(fb, idx + 1),
    }));

    if (search) {
      sanitizedFeedbacks = sanitizedFeedbacks.filter(
        (f) =>
          (f.ticketNumber && f.ticketNumber.toLowerCase().includes(search)) ||
          (f.roomNo && f.roomNo.toLowerCase().includes(search)) ||
          (f.studentName && f.studentName.toLowerCase().includes(search)) ||
          (f.comment && f.comment.toLowerCase().includes(search))
      );
    }

    return NextResponse.json(sanitizedFeedbacks);
  } catch (error) {
    let filtered = authorEmail
      ? inMemoryFeedbacks.filter((f) => f.email === authorEmail)
      : facility
        ? facility === 'MAINTENANCE'
          ? inMemoryFeedbacks.filter((f) => f.facilityType.startsWith('MAINTENANCE_'))
          : inMemoryFeedbacks.filter((f) => f.facilityType === facility)
        : inMemoryFeedbacks;

    if (search) {
      filtered = filtered.filter(
        (f) =>
          (f.ticketNumber && f.ticketNumber.toLowerCase().includes(search)) ||
          (f.roomNo && f.roomNo.toLowerCase().includes(search)) ||
          (f.studentName && f.studentName.toLowerCase().includes(search)) ||
          (f.comment && f.comment.toLowerCase().includes(search))
      );
    }

    const sanitized = filtered.map((f, idx) => ({
      ...f,
      ticketNumber: f.ticketNumber || ensureTicketNumber(f, idx + 1),
    }));

    return NextResponse.json(sanitized);
  }
}

export async function POST(request: Request) {
  try {
    const { studentName, comment, facilityType, mediaUrl, roomNo, email, capturedAt } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isAllowedEmail(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Grievance submission is restricted to IIT KGP students (@kgpian.iitkgp.ac.in or @iitkgp.ac.in).' },
        { status: 403 }
      );
    }

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return NextResponse.json({ error: 'Comment description is required.' }, { status: 400 });
    }

    if (!roomNo || !isValidRoomNo(roomNo)) {
      return NextResponse.json({ error: 'Please enter a valid room number (e.g. A-515, B-201).' }, { status: 400 });
    }

    const normalizedRoomNo = roomNo.trim().toUpperCase();
    const finalFacility = facilityType || 'REGULAR_MESS';
    const finalStudentName = studentName && studentName.trim() ? studentName.trim() : 'Anonymous';

    const categoryCode = getCategoryCode(finalFacility);
    const dateStr = formatTicketDate();
    const ticketPrefix = buildTicketNumber(normalizedRoomNo, categoryCode, dateStr);

    let count = 1;
    try {
      const existingCount = await prisma.feedback.count({
        where: {
          roomNo: normalizedRoomNo,
          facilityType: finalFacility,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });
      count = existingCount + 1;
    } catch (e) {
      const matchingInMemory = inMemoryFeedbacks.filter(
        (f) =>
          f.roomNo === normalizedRoomNo &&
          f.facilityType === finalFacility &&
          formatTicketDate(new Date(f.createdAt)) === dateStr
      );
      count = matchingInMemory.length + 1;
    }

    let generatedTicketNumber = `${ticketPrefix}${count}`;

    while (inMemoryFeedbacks.some((f) => f.ticketNumber === generatedTicketNumber)) {
      count++;
      generatedTicketNumber = `${ticketPrefix}${count}`;
    }

    const newFeedback = {
      id: `fb-${Date.now()}`,
      ticketNumber: generatedTicketNumber,
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
          ticketNumber: generatedTicketNumber,
          studentName: finalStudentName,
          hallRoll: normalizedRoomNo,
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
    const {
      id,
      status,
      remark,
      resolvedBy,
      resolvedByEmail,
      resolvedByRole,
      isEscalated,
      escalatedBy,
      escalatedRemark,
      isStudentAuthor,
      authorEmail,
      adminResolved,
      userResolved,
      overriddenBy,
      overriddenReason,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Feedback ID is required.' }, { status: 400 });
    }

    // Student author self-resolution flow
    if (isStudentAuthor) {
      if (!authorEmail) {
        return NextResponse.json({ error: 'Verified author email is required.' }, { status: 400 });
      }

      const existing = await prisma.feedback.findUnique({ where: { id } });
      if (existing && existing.email && existing.email.toLowerCase() !== authorEmail.toLowerCase()) {
        return NextResponse.json({ error: 'Unauthorized: Email does not match grievance author.' }, { status: 403 });
      }

      const updateData: any = {
        userResolved: true,
        status: 'RESOLVED',
        resolvedAt: existing?.resolvedAt || new Date(),
      };

      if (!existing?.resolvedBy) {
        updateData.resolvedBy = 'Boarder (Author)';
        updateData.resolvedByEmail = authorEmail;
        updateData.resolvedByRole = 'Boarder';
      }

      await prisma.feedback.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ message: 'Grievance marked as resolved by author!' });
    }

    // Admin updates require admin authorization
    if (!verifyAdminPassword(request)) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const isResolving = status === 'RESOLVED';
    const resolutionTimestamp = isResolving ? new Date() : (status === 'PENDING' ? null : undefined);

    const updateData: any = {};
    if (status) updateData.status = status;
    if (remark !== undefined) updateData.remark = remark;
    if (resolvedBy !== undefined) updateData.resolvedBy = resolvedBy;
    if (resolvedByEmail !== undefined) updateData.resolvedByEmail = resolvedByEmail;
    if (resolvedByRole !== undefined) updateData.resolvedByRole = resolvedByRole;
    if (resolutionTimestamp !== undefined) updateData.resolvedAt = resolutionTimestamp;

    // Escalation fields
    if (isEscalated !== undefined) {
      updateData.isEscalated = Boolean(isEscalated);
      updateData.escalatedAt = isEscalated ? new Date() : null;
      if (escalatedBy) updateData.escalatedBy = escalatedBy;
      if (escalatedRemark !== undefined) updateData.escalatedRemark = escalatedRemark;
    }

    // Two-way verification & override fields
    if (adminResolved !== undefined) updateData.adminResolved = Boolean(adminResolved);
    if (userResolved !== undefined) updateData.userResolved = Boolean(userResolved);
    if (overriddenBy) {
      updateData.overriddenBy = overriddenBy;
      updateData.overriddenAt = new Date();
      if (overriddenReason !== undefined) updateData.overriddenReason = overriddenReason;
    }

    const index = inMemoryFeedbacks.findIndex((f) => f.id === id);
    if (index !== -1) {
      Object.assign(inMemoryFeedbacks[index], updateData);
    }

    try {
      await prisma.feedback.update({
        where: { id },
        data: updateData,
      });
    } catch (dbErr) {
      console.warn('DB bypass for feedback PATCH:', dbErr);
    }

    return NextResponse.json({ message: 'Feedback updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

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
