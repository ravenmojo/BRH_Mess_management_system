import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!user.email?.endsWith('.iitkgp.ac.in') && user.email !== 'soura7@gmail.com') {
      return NextResponse.json({ error: 'Only .iitkgp.ac.in emails or the super admin are allowed.' }, { status: 403 });
    }

    const rollNo = user.email.split('@')[0].toUpperCase();

    const body = await request.json();
    const { pollId, pollOptionId } = body;

    if (!pollId || !pollOptionId) {
      return NextResponse.json({ error: 'pollId and pollOptionId are required.' }, { status: 400 });
    }

    // Check if the poll is active
    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll || !poll.isActive) {
      return NextResponse.json({ error: 'This poll is no longer active.' }, { status: 400 });
    }

    // Check if user already voted
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_rollNo: {
          pollId,
          rollNo
        }
      }
    });

    if (existingVote) {
      // User already voted, update it? Or reject?
      // Let's allow them to change their vote if it's active.
      const updatedVote = await prisma.pollVote.update({
        where: { id: existingVote.id },
        data: { pollOptionId }
      });
      return NextResponse.json({ message: 'Vote updated', vote: updatedVote });
    }

    const newVote = await prisma.pollVote.create({
      data: {
        pollId,
        pollOptionId,
        rollNo
      }
    });

    return NextResponse.json({ message: 'Vote cast successfully', vote: newVote }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
