import { v4 as uuidv4 } from 'uuid';
import { uploadFile, getPublicUrl } from '../config/supabase.js';

export type MediaMeta = {
  url: string;
  type: 'image' | 'video' | 'application';
  thumbnailUrl: string | null;
  order: number;
};

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'public';

export async function uploadMediaFiles(
  files: Express.Multer.File[],
  category: 'posts' | 'services' | 'products'
): Promise<MediaMeta[]> {
  const mediaFiles: MediaMeta[] = [];

  for (const file of files) {
    const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
    const filePath = `${category}/${uuidv4()}.${ext}`;

    const { data, error } = await uploadFile(BUCKET, filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });
    if (error) throw error;

    const publicUrl = getPublicUrl(BUCKET, data?.path || filePath);
    mediaFiles.push({
      url: publicUrl,
      type: file.mimetype.split('/')[0] as 'image' | 'video' | 'application',
      thumbnailUrl: file.mimetype.startsWith('image/') ? publicUrl : null,
      order: 0,
    });
  }

  return mediaFiles;
}
