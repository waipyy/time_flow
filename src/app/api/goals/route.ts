
import { getGoals } from '@/lib/data';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const goals = await getGoals();
    return NextResponse.json(goals);
  } catch (error) {
    console.error('API Error getting goals:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
