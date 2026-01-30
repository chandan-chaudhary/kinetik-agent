import { Prisma } from '@prisma/client';

export function handleError(error: unknown) {
  // log error for server-side debugging
  try {
    console.error('Handled error:', error);
  } catch {
    // Ignore logging errors
  }

  // Prisma known request errors (e.g. record not found)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // other known request errors -> Bad Request
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validation error thrown by Prisma client
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generic error instance
  if (error instanceof Error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Fallback
  return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
