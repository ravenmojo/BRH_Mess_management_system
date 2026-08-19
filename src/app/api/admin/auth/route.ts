import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Admin password is required.' }, { status: 400 });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      return NextResponse.json(
        { error: 'Admin password is not configured on server. Please set ADMIN_PASSWORD in environment variables.' },
        { status: 500 }
      );
    }

    if (password.trim() === expectedPassword.trim()) {
      return NextResponse.json({ success: true, authenticated: true });
    } else {
      return NextResponse.json({ error: 'Incorrect Admin Password. Access Denied.' }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication error' }, { status: 500 });
  }
}
