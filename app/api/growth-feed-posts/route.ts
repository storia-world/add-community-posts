import { NextResponse } from 'next/server';
import { addFakeGrowthFeedPost } from '@/lib/firebase-admin';
import type { GrowthFeedPostInput } from '@/lib/growth-feed-post';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GrowthFeedPostInput;

    if (!body || typeof body.value !== 'number' || typeof body.unit !== 'string') {
      return NextResponse.json({ error: 'Invalid post payload' }, { status: 400 });
    }

    const id = await addFakeGrowthFeedPost(body);
    return NextResponse.json({ id });
  } catch (error) {
    console.error('Error adding growth feed post:', error);
    const message = error instanceof Error ? error.message : 'Unable to add growth feed post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
