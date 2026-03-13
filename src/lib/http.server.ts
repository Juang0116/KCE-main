import { NextResponse } from 'next/server';

/**
 * Small response helper for API routes.
 *
 * - Adds `requestId` to JSON bodies when provided.
 * - Mirrors requestId into `x-request-id` header for traceability.
 */
export function json(
  data: unknown,
  statusOrInit: number | ResponseInit = 200,
  requestId?: string,
  extraHeaders?: HeadersInit,
) {
  // Only attach requestId to plain objects.
  const body =
    requestId && data && typeof data === 'object' && !Array.isArray(data)
      ? ({ requestId, ...(data as Record<string, unknown>) } as Record<string, unknown>)
      : data;

  // Support both legacy `status: number` and `ResponseInit`.
  const init: ResponseInit =
    typeof statusOrInit === 'number' ? { status: statusOrInit } : statusOrInit;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    ...(extraHeaders as Record<string, string> | undefined),
  };
  if (requestId) headers['x-request-id'] = requestId;

  return NextResponse.json(body as any, {
    ...init,
    headers,
  });
}
