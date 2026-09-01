import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteFromCloudinary } from '@/lib/cloudinary-delete';
import { isAllowedEmail, getAdminContext, verifyCsrfOrigin, getSuperAdminEmails } from '@/lib/admin-auth';
import { logAdminAction } from '@/lib/audit-logger';
import { checkRateLimit } from '@/lib/rate-limiter';
import {
  getCategoryCode,
  formatTicketDate,
  buildTicketNumber,
  ensureTicketNumber,
} from '@/lib/ticket';

// Removed inMemoryFeedbacks dummy data array

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
  const wantsAdmin = searchParams.get('isAdmin') === 'true';
  // Require both the client intent (wantsAdmin) and server-side verification
  const isAdmin = wantsAdmin && (await getAdminContext(request)) !== null;

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

    // Public feed filter: Omit grievances resolved more than 30 days ago, and omit UNREGISTERED/PURGED
    if (!isAdmin && !authorEmail) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      whereClause.AND = [
        { status: { notIn: ['UNREGISTERED', 'PURGED'] } },
        {
          OR: [
            { status: { not: 'RESOLVED' } },
            { resolvedAt: { gte: thirtyDaysAgo } },
            { resolvedAt: null },
          ]
        }
      ];
    }

    // Lazy purge unapproved REGULAR_MESS grievances > 12 hours old
    try {
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const toPurge = await prisma.feedback.findMany({
        where: {
          status: 'UNREGISTERED',
          createdAt: { lt: twelveHoursAgo },
        },
      });

      if (toPurge.length > 0) {
        for (const item of toPurge) {
          if (item.mediaUrl) {
            await deleteFromCloudinary(item.mediaUrl).catch(() => {});
          }
          await prisma.feedback.update({
            where: { id: item.id },
            data: { status: 'PURGED', mediaUrl: null },
          });
        }
      }
    } catch (e) {
      console.error('Lazy purge failed', e);
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
  } catch (error: any) {
    console.error('Database query failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grievances from the database. Please check database permissions (e.g., RLS settings).' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin (CSRF check failed).' }, { status: 403 });
  }
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = checkRateLimit(`feedback_${ip}`, 5, 10 * 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait before submitting again.' }, { status: 429 });
  }

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

    const dateStr = formatTicketDate();
    const catCode = getCategoryCode(finalFacility);
    const ticketPrefix = `${normalizedRoomNo}${catCode}${dateStr}`;
    
    let count = 1;
    const existingCount = await prisma.feedback.count({
      where: {
        ticketNumber: {
          startsWith: ticketPrefix,
        },
      },
    });
    count = existingCount + 1;

    // buildTicketNumber expects a Date object, NOT the already formatted string.
    const generatedTicketNumber = buildTicketNumber(normalizedRoomNo, finalFacility, new Date(), count);

    const newFeedback = await prisma.feedback.create({
      data: {
        ticketNumber: generatedTicketNumber,
        studentName: finalStudentName,
        hallRoll: normalizedRoomNo,
        roomNo: normalizedRoomNo,
        email: trimmedEmail,
        comment,
        facilityType: finalFacility,
        status: finalFacility === 'REGULAR_MESS' ? 'UNREGISTERED' : 'PENDING',
        managerApproved: finalFacility === 'REGULAR_MESS' ? false : true,
        mediaUrl: mediaUrl || null,
        capturedAt: capturedAt || null,
      },
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin (CSRF check failed).' }, { status: 403 });
  }
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
    const adminCtx = await getAdminContext(request);
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const currentItem = await prisma.feedback.findUnique({ where: { id } });
    if (!currentItem) {
      return NextResponse.json({ error: 'Grievance not found.' }, { status: 404 });
    }

    // Check scope for LOW tier admins
    if (adminCtx.tier === 'LOW') {
      if (currentItem.facilityType === 'REGULAR_MESS' && !adminCtx.canManageMess) {
        return NextResponse.json({ error: 'Unauthorized: You do not have permission to manage mess grievances.' }, { status: 403 });
      }
      if (currentItem.facilityType.startsWith('MAINTENANCE') && !adminCtx.canManageMaintenance) {
        return NextResponse.json({ error: 'Unauthorized: You do not have permission to manage maintenance grievances.' }, { status: 403 });
      }
      
      // LOW tier admins cannot override
      if (overriddenBy !== undefined || overriddenReason !== undefined) {
        return NextResponse.json({ error: 'Unauthorized: Low-level admins cannot override responses.' }, { status: 403 });
      }
    }

    const isResolving = status === 'RESOLVED';
    const isPending = status === 'PENDING';
    const adminEmailHeader = adminCtx.email || resolvedByEmail || overriddenBy || 'System Administrator';

    const updateData: any = {};
    if (status) updateData.status = status;

    // Remark update & history recording
    if (remark !== undefined && remark.trim() !== '') {
      const trimmedRemark = remark.trim();
      updateData.remark = trimmedRemark;

      try {
        let existingHistory: any[] = [];
        if (currentItem.remarkHistory) {
          existingHistory = typeof currentItem.remarkHistory === 'string'
            ? JSON.parse(currentItem.remarkHistory)
            : currentItem.remarkHistory;
        }

        const authorName = resolvedBy || resolvedByRole || (adminEmailHeader === 'admin@kgp' ? 'System Administrator' : adminEmailHeader || 'Administrator');

        const newEntry = {
          remark: trimmedRemark,
          author: authorName,
          authorRole: resolvedByRole || authorName,
          createdAt: new Date().toISOString(),
        };

        if (existingHistory.length === 0 || existingHistory[0]?.remark !== trimmedRemark) {
          const updatedHistory = [newEntry, ...existingHistory];
          updateData.remarkHistory = JSON.stringify(updatedHistory);
        }
      } catch (err) {
        console.warn('Failed to update remark history:', err);
      }
    }

    if (isPending) {
      updateData.status = 'PENDING';
      updateData.resolvedAt = null;
      updateData.adminResolved = false;
      updateData.userResolved = false;
      updateData.resolvedBy = null;
      updateData.resolvedByEmail = null;
      updateData.resolvedByRole = null;
    } else if (isResolving) {
      updateData.status = 'RESOLVED';
      updateData.resolvedAt = new Date();
      updateData.adminResolved = true;
      if (resolvedBy !== undefined) updateData.resolvedBy = resolvedBy;
      if (resolvedByEmail !== undefined) updateData.resolvedByEmail = resolvedByEmail;
      if (resolvedByRole !== undefined) updateData.resolvedByRole = resolvedByRole;
    } else {
      if (resolvedBy !== undefined) updateData.resolvedBy = resolvedBy;
      if (resolvedByEmail !== undefined) updateData.resolvedByEmail = resolvedByEmail;
      if (resolvedByRole !== undefined) updateData.resolvedByRole = resolvedByRole;
      if (adminResolved !== undefined) updateData.adminResolved = Boolean(adminResolved);
    }

    // Escalation fields
    if (isEscalated !== undefined) {
      updateData.isEscalated = Boolean(isEscalated);
      updateData.escalatedAt = isEscalated ? new Date() : null;
      if (escalatedBy !== undefined) updateData.escalatedBy = escalatedBy;
      if (escalatedRemark !== undefined) updateData.escalatedRemark = escalatedRemark;
    }

    // Two-way verification & override fields
    if (userResolved !== undefined) updateData.userResolved = Boolean(userResolved);
    if (overriddenBy) {
      updateData.overriddenBy = overriddenBy;
      updateData.overriddenAt = new Date();
      if (overriddenReason !== undefined) updateData.overriddenReason = overriddenReason;
    }

    try {
      const updatedItem = await prisma.feedback.update({
        where: { id },
        data: updateData,
      });

      if (overriddenBy) {
        await logAdminAction(
          adminEmailHeader,
          'OVERRIDE_GRIEVANCE',
          `Overrode grievance status for Ticket #${updatedItem.ticketNumber || id}. Status -> ${status || updatedItem.status}. Note: "${overriddenReason || 'No reason provided'}"`,
          id
        );
      } else if (isEscalated) {
        await logAdminAction(
          adminEmailHeader,
          'ESCALATE_GRIEVANCE',
          `Escalated grievance Ticket #${updatedItem.ticketNumber || id} to high priority. Remark: "${escalatedRemark || 'Urgent resolution required'}"`,
          id
        );
      } else if (isResolving) {
        await logAdminAction(
          adminEmailHeader,
          'RESOLVE_GRIEVANCE',
          `Marked grievance Ticket #${updatedItem.ticketNumber || id} as RESOLVED.${remark ? ` Remark: "${remark}"` : ''}`,
          id
        );
      } else if (status === 'PENDING') {
        await logAdminAction(
          adminEmailHeader,
          'PENDING_GRIEVANCE',
          `Re-opened grievance Ticket #${updatedItem.ticketNumber || id} (status set to PENDING).`,
          id
        );
      } else if (remark !== undefined && !isResolving && !isPending && !isEscalated && !overriddenBy) {
        await logAdminAction(
          adminEmailHeader,
          'UPDATE_REMARK',
          `Updated administrative remark for Ticket #${updatedItem.ticketNumber || id}: "${remark}"`,
          id
        );
      }
    } catch (dbErr: any) {
      console.warn('DB bypass for feedback PATCH:', dbErr);
      return NextResponse.json({ error: 'Database update failed.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Feedback updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin (CSRF check failed).' }, { status: 403 });
  }

  const adminCtx = await getAdminContext(request);
  if (!adminCtx) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  if (adminCtx.tier === 'LOW') {
    return NextResponse.json({ error: 'Unauthorized: Low-level admins cannot delete grievances.' }, { status: 403 });
  }

  const adminEmailHeader = adminCtx.email || 'System Administrator';

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Feedback ID is required.' }, { status: 400 });
    }

    let mediaUrl: string | null = null;
    let ticketNum: string | null = null;

    try {
      const targetDb = await prisma.feedback.findUnique({ where: { id } });
      if (targetDb) {
        mediaUrl = targetDb.mediaUrl || null;
        ticketNum = targetDb.ticketNumber || null;
      }
    } catch (e) {}

    try {
      await prisma.feedback.delete({
        where: { id },
      });
      await logAdminAction(
        adminEmailHeader,
        'DELETE_GRIEVANCE',
        `Deleted grievance record Ticket #${ticketNum || id}.`,
        id
      );
    } catch (dbErr: any) {
      return NextResponse.json({ error: 'Failed to delete grievance from database.' }, { status: 500 });
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
