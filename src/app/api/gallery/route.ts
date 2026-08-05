import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const images = await prisma.galleryImage.findMany({
      where: {
        status: 'APPROVED',
        ...(category ? { category } : {})
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(images);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    // Public upload allowed; no auth check required for POST

    const body = await request.json();
    const { url, caption, category, uploaderName, uploaderRollNo } = body;

    if (!url) {
      return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });
    }

    if (!uploaderName || !uploaderRollNo) {
      return NextResponse.json({ error: 'Name and Roll No are required' }, { status: 400 });
    }

    const image = await prisma.galleryImage.create({
      data: {
        url,
        caption,
        category: category || 'GENERAL',
        uploaderName,
        uploaderRollNo,
        status: 'PENDING'
      }
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.galleryImage.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
