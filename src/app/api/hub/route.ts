import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const movies = await prisma.movieScreening.findMany({ orderBy: { showTime: 'desc' } });
    const activities = await prisma.activityParticipant.findMany({ orderBy: { createdAt: 'desc' } });
    const achievements = await prisma.achievement.findMany({ orderBy: { date: 'desc' } });
    const emergencyContacts = await prisma.emergencyContact.findMany({ orderBy: { order: 'asc' } });
    const suggestions = await prisma.suggestion.findMany({ orderBy: { createdAt: 'desc' } });
    
    return NextResponse.json({
      movies,
      activities,
      achievements,
      emergencyContacts,
      suggestions
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, payload } = body;

    if (type === 'MOVIE') {
      const movie = await prisma.movieScreening.create({
        data: {
          title: payload.title,
          posterUrl: payload.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
          showTime: payload.showTime ? new Date(payload.showTime) : new Date(),
          venue: payload.venue || 'Common Room',
        }
      });
      return NextResponse.json(movie);
    }

    if (type === 'ACTIVITY') {
      const activity = await prisma.activityParticipant.create({
        data: {
          studentName: payload.studentName,
          hallRoll: payload.hallRoll || '21CS10001',
          activity: payload.activity,
        }
      });
      return NextResponse.json(activity);
    }

    if (type === 'ACHIEVEMENT') {
      const achievement = await prisma.achievement.create({
        data: {
          studentName: payload.studentName,
          hallRoll: payload.hallRoll || '21EE10002',
          title: payload.title,
          description: payload.description,
          category: payload.category || 'GENERAL',
          date: payload.date ? new Date(payload.date) : new Date(),
        }
      });
      return NextResponse.json(achievement);
    }

    if (type === 'EMERGENCY_CONTACT') {
      const contact = await prisma.emergencyContact.create({
        data: {
          role: payload.role,
          name: payload.name,
          phone: payload.phone,
          order: payload.order || 0,
        }
      });
      return NextResponse.json(contact);
    }

    if (type === 'SUGGESTION') {
      const email = (payload.email || '').trim().toLowerCase();
      
      if (!email) {
        return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
      }
      if (!email.endsWith('.iitkgp.ac.in') && email !== 'soura7@gmail.com' && email !== 'souradeep.satpathy@gmail.com') {
        return NextResponse.json({ error: 'Only .iitkgp.ac.in emails are allowed.' }, { status: 403 });
      }
      if (!payload.content?.trim()) {
        return NextResponse.json({ error: 'Suggestion content is required.' }, { status: 400 });
      }

      const category = payload.category || 'OTHER';
      const studentName = payload.studentName || 'Boarder';

      // Rate limit: 1 suggestion per category per day per email
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const existingToday = await prisma.suggestion.count({
          where: {
            hallRoll: email, // We use hallRoll to store email for suggestions
            category,
            createdAt: { gte: todayStart },
          },
        });

        if (existingToday >= 1) {
          return NextResponse.json(
            { error: `You have already submitted a suggestion in the "${category}" category today. Try a different category or come back tomorrow.` },
            { status: 429 }
          );
        }
      } catch (dbErr) {
        console.warn('Rate limit DB check failed for suggestions, allowing submission.');
      }

      const suggestion = await prisma.suggestion.create({
        data: {
          studentName,
          hallRoll: email, // Store email here for rate limiting lookups
          category,
          content: payload.content
        }
      });
      return NextResponse.json(suggestion);
    } 

    if (type === 'SEED_ALL') {
      // Bulk seed dummy data across all sub-sections
      await prisma.movieScreening.deleteMany();
      await prisma.activityParticipant.deleteMany();
      await prisma.achievement.deleteMany();
      await prisma.emergencyContact.deleteMany();

      const seedMovies = await prisma.movieScreening.createMany({
        data: [
          {
            title: 'Interstellar - BROS Special Screening',
            posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
            showTime: new Date(Date.now() + 86400000 * 2), // 2 days later
            venue: 'BRH Common Room',
          },
          {
            title: '3 Idiots - Weekend Movie Night',
            posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
            showTime: new Date(Date.now() + 86400000 * 5),
            venue: 'Open Air Theatre Ground',
          }
        ]
      });

      const seedActivities = await prisma.activityParticipant.createMany({
        data: [
          { studentName: 'Aarav Sharma', hallRoll: '22CS10012', activity: 'Inter-Hall Music Jam (Vocalist)' },
          { studentName: 'Rohan Verma', hallRoll: '21ME30045', activity: 'Table Tennis Tournament (Single Finalist)' },
          { studentName: 'Aditya Patel', hallRoll: '23EC10088', activity: 'Fine Arts Wall Painting Drive' },
          { studentName: 'Vikram Singh', hallRoll: '22CH10009', activity: 'Hall Chess Championship (Runner-Up)' }
        ]
      });

      const seedAchievements = await prisma.achievement.createMany({
        data: [
          {
            studentName: 'BROS Robotics Team',
            hallRoll: 'BRH-ROBO-01',
            title: 'Gold Medal - Inter-Hall Tech Meet Robotics',
            description: 'Secured 1st position among 22 halls in autonomous rover obstacle course navigation.',
            category: 'SPORTS_TECH',
            date: new Date(Date.now() - 86400000 * 10),
          },
          {
            studentName: 'Kartik Aryan & Team',
            hallRoll: '21CS30099',
            title: 'Champions - Inter-Hall Dramatics Competition',
            description: 'Awarded Best Play and Best Script for annual stage production.',
            category: 'CULTURAL',
            date: new Date(Date.now() - 86400000 * 20),
          }
        ]
      });

      const seedContacts = await prisma.emergencyContact.createMany({
        data: [
          { role: 'Hall President', name: 'Aarav Sharma', phone: '+91 99999 00001', order: 1 },
          { role: 'Mess Secretary', name: 'Rohan Verma', phone: '+91 99999 00002', order: 2 },
          { role: 'Maintenance Secy', name: 'Vikram Singh', phone: '+91 99999 00003', order: 3 },
          { role: 'Warden Office', name: 'Prof. Rajesh Kumar', phone: '+91 99999 00004', order: 4 },
          { role: 'BC Roy Hospital', name: 'Emergency Control Desk', phone: '03222-200000', order: 5 },
          { role: 'Main Gate Security', name: 'Security Control Room', phone: '03222-200001', order: 6 },
        ]
      });

      return NextResponse.json({
        message: 'Successfully populated all sub-sections!',
        count: {
          movies: seedMovies.count,
          activities: seedActivities.count,
          achievements: seedAchievements.count,
          contacts: seedContacts.count,
        }
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and Type are required.' }, { status: 400 });
    }

    if (type === 'MOVIE') {
      await prisma.movieScreening.delete({ where: { id } });
    } else if (type === 'ACTIVITY') {
      await prisma.activityParticipant.delete({ where: { id } });
    } else if (type === 'ACHIEVEMENT') {
      await prisma.achievement.delete({ where: { id } });
    } else if (type === 'EMERGENCY_CONTACT') {
      await prisma.emergencyContact.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


