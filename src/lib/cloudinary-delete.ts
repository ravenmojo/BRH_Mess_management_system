import crypto from 'crypto';

export interface CloudinaryPurgeResult {
  success: boolean;
  message: string;
}

/**
 * Automatically purges the physical file from Cloudinary servers using Cloudinary's Admin API.
 * Extracts public_id and resource_type from the Cloudinary media URL and issues a signed destroy call.
 */
export async function deleteFromCloudinary(mediaUrl: string | null | undefined): Promise<CloudinaryPurgeResult> {
  if (!mediaUrl || typeof mediaUrl !== 'string') {
    return { success: false, message: 'No valid media URL provided.' };
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    const notice = 'Cloudinary physical file auto-purge will work in future once API credentials (CLOUDINARY_API_KEY & CLOUDINARY_API_SECRET) are configured.';
    console.warn(`[Cloudinary Purge Notice] ${notice}`);
    return { success: false, message: notice };
  }

  try {
    // Cloudinary URL format:
    // https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/v<version>/<public_id>.<ext>
    const urlParts = mediaUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) {
      return { success: false, message: 'Invalid Cloudinary URL format.' };
    }

    const resourceType = urlParts[uploadIndex - 1] === 'video' ? 'video' : 'image';

    let pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
    // Strip version prefix if present e.g. v1712345678/
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');

    // Remove file extension
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    const publicId = lastDotIndex !== -1 ? pathAfterUpload.substring(0, lastDotIndex) : pathAfterUpload;

    const timestamp = Math.floor(Date.now() / 1000);
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data = await res.json();
    console.log(`[Cloudinary Auto-Purge] Asset "${publicId}" (${resourceType}) result:`, data.result);
    if (data.result === 'ok') {
      return { success: true, message: `Successfully purged asset "${publicId}" from Cloudinary servers.` };
    } else {
      return { success: false, message: `Cloudinary returned result: ${data.result || 'failed'}` };
    }
  } catch (err: any) {
    console.error('[Cloudinary Auto-Purge Error]:', err);
    return { success: false, message: `Cloudinary purge error: ${err.message || err}` };
  }
}
