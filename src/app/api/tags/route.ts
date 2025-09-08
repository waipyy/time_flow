
import { getTags } from '@/lib/data';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tags = await getTags();
    return NextResponse.json(tags);
  } catch (error) {
    console.error('API Error getting tags:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
