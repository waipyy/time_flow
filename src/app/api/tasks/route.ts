
import { getTasks } from '@/lib/data';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tasks = await getTasks();
    return NextResponse.json(tasks, {
        next: {
            tags: ['tasks'],
        }
    });
  } catch (error) {
    console.error('API Error getting tasks:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
