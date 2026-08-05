import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const movies = await prisma.movieScreening.findMany({ orderBy: { showTime: 'desc' }, take: 1 });
    const activities = await prisma.activityParticipant.findMany({ orderBy: { createdAt: 'desc' } });
    const achievements = await prisma.achievement.findMany({ orderBy: { date: 'desc' } });
    
    return NextResponse.json({
      movies,
      activities,
      achievements
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, payload } = body;
    const hallRoll = user.email?.split('@')[0].toUpperCase() || '';
    const studentName = payload.studentName || 'Student'; // Should ideally fetch from profile

    if (type === 'SUGGESTION') {
      const suggestion = await prisma.suggestion.create({
        data: {
          studentName,
          hallRoll,
          category: payload.category,
          content: payload.content
        }
      });
      return NextResponse.json(suggestion);
    } 
    
    if (type === 'WING_FEEDBACK') {
      const feedback = await prisma.wingFeedback.create({
        data: {
          wing: payload.wing,
          representative: payload.representative,
          feedbackContent: payload.content
        }
      });
      return NextResponse.json(feedback);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
