import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { deleteFromCloudinary } from '@/lib/cloudinary-delete';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Auto-purge Mess Duty Gallery images older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    try {
      const expiredImages = await prisma.galleryImage.findMany({
        where: { createdAt: { lt: thirtyDaysAgo } }
      });
      if (expiredImages.length > 0) {
        for (const img of expiredImages) {
          if (img.url) {
            deleteFromCloudinary(img.url).catch(() => {});
          }
        }
        await prisma.galleryImage.deleteMany({
          where: { createdAt: { lt: thirtyDaysAgo } }
        });
      }
    } catch (purgeErr) {
      console.warn('Gallery 30-day auto-purge check warning:', purgeErr);
    }

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
    const body = await request.json();
    const { url, caption, category, uploaderName, uploaderRollNo, capturedAt } = body;

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
        capturedAt: capturedAt || null,
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

    let cloudinaryNotice: string | null = null;
    try {
      const target = await prisma.galleryImage.findUnique({ where: { id } });
      if (target?.url) {
        const purgeRes = await deleteFromCloudinary(target.url);
        if (!purgeRes.success) {
          cloudinaryNotice = purgeRes.message;
        }
      }
    } catch (e) {}

    await prisma.galleryImage.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted successfully', cloudinaryNotice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
