import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { deleteFromCloudinary } from '@/lib/cloudinary-delete';

export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Check if admin
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    let cloudinaryNotice: string | null = null;
    if (status === 'REJECTED') {
      try {
        const target = await prisma.galleryImage.findUnique({ where: { id } });
        if (target?.url) {
          const purgeRes = await deleteFromCloudinary(target.url);
          if (!purgeRes.success) {
            cloudinaryNotice = purgeRes.message;
          }
        }
      } catch (e) {}
    }

    const image = await prisma.galleryImage.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ ...image, cloudinaryNotice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Check if admin
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(images);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
