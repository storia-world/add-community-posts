import { NextResponse } from 'next/server';

const DEFAULT_BUCKET = 'storia-b8f37.appspot.com';
const DEFAULT_FOLDER = 'dummy-data-images';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder')?.trim() || DEFAULT_FOLDER;
  const normalizedFolder = folder.replace(/^\/+|\/+$/g, '');
  const bucket = searchParams.get('bucket')?.trim() || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || DEFAULT_BUCKET;

  try {
    const listUrl = new URL(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o`);
    listUrl.searchParams.set('prefix', normalizedFolder ? `${normalizedFolder}/` : '');
    listUrl.searchParams.set('alt', 'json');

    const response = await fetch(listUrl.toString(), {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Firebase Storage listing failed with status ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];
    const images = items
      .filter((item: { name?: string }) => item.name && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(item.name))
      .map((item: { name?: string }) => {
        const encodedName = encodeURIComponent(item.name || '');
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedName}?alt=media&thumb=200`;
      });

    return NextResponse.json({ images, folder: normalizedFolder, bucket });
  } catch (error) {
    console.error('Unable to load profile images', error);
    return NextResponse.json(
      {
        images: [],
        folder: normalizedFolder,
        bucket,
        error: 'Unable to load profile images',
      },
      { status: 500 },
    );
  }
}
