import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { isAllowedEmail } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pollId, pollOptionId, email: bodyEmail } = body;

    let voterEmail = bodyEmail;

    if (!voterEmail) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        voterEmail = user.email;
      }
    }

    if (!voterEmail) {
      return NextResponse.json({ error: 'Email verification is required to vote.' }, { status: 401 });
    }

    if (!isAllowedEmail(voterEmail)) {
      return NextResponse.json({ error: 'Only .iitkgp.ac.in emails are allowed.' }, { status: 403 });
    }

    const rollNo = voterEmail.split('@')[0].toUpperCase();

    if (!pollId || !pollOptionId) {
      return NextResponse.json({ error: 'pollId and pollOptionId are required.' }, { status: 400 });
    }

    // Check if the poll is active
    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll || !poll.isActive) {
      return NextResponse.json({ error: 'This poll is no longer active.' }, { status: 400 });
    }

    // Check if user already voted with this email for the current poll options
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_rollNo: {
          pollId,
          rollNo
        }
      }
    });

    if (existingVote) {
      return NextResponse.json({ error: 'You have already cast your vote for this poll using this email ID!' }, { status: 400 });
    }

    const newVote = await prisma.pollVote.create({
      data: {
        pollId,
        pollOptionId,
        rollNo
      }
    });

    return NextResponse.json({ message: 'Vote cast successfully!', vote: newVote }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
