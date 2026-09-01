import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const [allFeedbacks, historicalSummaries] = await Promise.all([
      prisma.feedback.findMany({
        select: {
          id: true,
          facilityType: true,
          status: true,
          adminResolved: true,
          userResolved: true,
          isEscalated: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      prisma.grievanceStatSummary.findMany()
    ]);

    // Grouping by category
    const statsByCategory: Record<string, {
      totalSubmitted: number;
      totalResolved: number;
      totalTwoWayVerified: number;
      totalEscalated: number;
      totalResolutionMinutes: number;
      resolvedCountWithTime: number;
    }> = {};

    // 1. Ingest historical summaries
    for (const h of historicalSummaries) {
      if (!statsByCategory[h.category]) {
        statsByCategory[h.category] = {
          totalSubmitted: 0,
          totalResolved: 0,
          totalTwoWayVerified: 0,
          totalEscalated: 0,
          totalResolutionMinutes: 0,
          resolvedCountWithTime: 0,
        };
      }
      statsByCategory[h.category].totalSubmitted += h.totalSubmitted;
      statsByCategory[h.category].totalResolved += h.totalResolved;
      statsByCategory[h.category].totalTwoWayVerified += h.totalTwoWayVerified;
      statsByCategory[h.category].totalEscalated += h.totalEscalated;
      statsByCategory[h.category].totalResolutionMinutes += Number(h.totalResolutionTimeMinutes);
      statsByCategory[h.category].resolvedCountWithTime += h.totalResolved;
    }

    // 2. Ingest active DB records
    let overallSubmitted = 0;
    let overallResolved = 0;
    let overallEscalated = 0;
    let overallTwoWayVerified = 0;
    let overallResolutionMinutes = 0;
    let overallResolvedCountWithTime = 0;

    for (const fb of allFeedbacks) {
      const cat = fb.facilityType;
      if (!statsByCategory[cat]) {
        statsByCategory[cat] = {
          totalSubmitted: 0,
          totalResolved: 0,
          totalTwoWayVerified: 0,
          totalEscalated: 0,
          totalResolutionMinutes: 0,
          resolvedCountWithTime: 0,
        };
      }

      statsByCategory[cat].totalSubmitted += 1;
      overallSubmitted += 1;

      if (fb.isEscalated) {
        statsByCategory[cat].totalEscalated += 1;
        overallEscalated += 1;
      }

      if (fb.status === 'RESOLVED') {
        statsByCategory[cat].totalResolved += 1;
        overallResolved += 1;

        if (fb.adminResolved && fb.userResolved) {
          statsByCategory[cat].totalTwoWayVerified += 1;
          overallTwoWayVerified += 1;
        }

        if (fb.resolvedAt && fb.createdAt) {
          const diffMinutes = Math.max(0, (new Date(fb.resolvedAt).getTime() - new Date(fb.createdAt).getTime()) / (1000 * 60));
          statsByCategory[cat].totalResolutionMinutes += diffMinutes;
          statsByCategory[cat].resolvedCountWithTime += 1;
          overallResolutionMinutes += diffMinutes;
          overallResolvedCountWithTime += 1;
        }
      }
    }

    // Compute formatted averages
    const categoryStats = Object.entries(statsByCategory).map(([category, s]) => {
      const avgMinutes = s.resolvedCountWithTime > 0 ? Math.round(s.totalResolutionMinutes / s.resolvedCountWithTime) : 0;
      const resolutionRate = s.totalSubmitted > 0 ? Math.round((s.totalResolved / s.totalSubmitted) * 100) : 0;
      const twoWayRate = s.totalResolved > 0 ? Math.round((s.totalTwoWayVerified / s.totalResolved) * 100) : 0;

      const avgHours = (avgMinutes / 60).toFixed(1);

      return {
        category,
        totalSubmitted: s.totalSubmitted,
        totalResolved: s.totalResolved,
        totalTwoWayVerified: s.totalTwoWayVerified,
        totalEscalated: s.totalEscalated,
        resolutionRatePercent: resolutionRate,
        twoWayRatePercent: twoWayRate,
        avgResolutionHours: avgHours,
        avgResolutionMinutes: avgMinutes,
      };
    });

    const overallAvgHours = overallResolvedCountWithTime > 0
      ? (overallResolutionMinutes / overallResolvedCountWithTime / 60).toFixed(1)
      : '0.0';
    const overallResolutionRate = overallSubmitted > 0
      ? Math.round((overallResolved / overallSubmitted) * 100)
      : 0;

    return NextResponse.json({
      overall: {
        totalSubmitted: overallSubmitted,
        totalResolved: overallResolved,
        totalEscalated: overallEscalated,
        totalTwoWayVerified: overallTwoWayVerified,
        resolutionRatePercent: overallResolutionRate,
        avgResolutionHours: overallAvgHours,
      },
      categoryStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
