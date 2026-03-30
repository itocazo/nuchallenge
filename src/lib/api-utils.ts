import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ZodError } from 'zod';

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function zodErrorResponse(error: ZodError) {
  return NextResponse.json(
    { error: 'Validation failed', details: error.flatten().fieldErrors },
    { status: 400 }
  );
}

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) {
    throw new AuthError('Unauthorized');
  }
  return user;
}

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return errorResponse('Unauthorized', 401);
  }
  if (error instanceof ZodError) {
    return zodErrorResponse(error);
  }
  console.error('API Error:', error);
  return errorResponse('Internal server error', 500);
}
