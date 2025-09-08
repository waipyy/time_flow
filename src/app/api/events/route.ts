
import { getEvents } from '@/lib/data';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const events = await getEvents();
    return NextResponse.json(events, {
        next: {
            tags: ['events'],
        }
    });
  } catch (error) {
    console.error('API Error getting events:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
