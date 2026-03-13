// src/lib/apiErrors.ts
import { NextResponse, type NextRequest } from 'next/server';

import { getRequestId } from '@/lib/requestId';

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'BAD_REQUEST'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'BUDGET_EXCEEDED'
  | 'TURNSTILE_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'EMAIL_NOT_VERIFIED'
  | 'NOT_FOUND'
  | 'ORIGIN_REQUIRED'
  | 'ORIGIN_BLOCKED'
  | 'CONFIG_ERROR'
  | 'INTERNAL';

type ErrorOpts = {
  status: number;
  code: ApiErrorCode;
  message: string;
  requestId?: string;
  /**
   * Extra top-level fields merged into the response body.
   * Use this for structured details: { details: {...} } or any UI-safe metadata.
   */
  extra?: Record<string, unknown>;
  headers?: Record<string, string>;
};

/**
 * Standard error JSON for APIs.
 * Keeps a stable, UI-friendly shape: { error, errorCode, requestId, ... }.
 */
export function jsonError(req: NextRequest, opts: ErrorOpts) {
  const requestId = opts.requestId ?? getRequestId(req.headers);
  return NextResponse.json(
    {
      error: opts.message,
      errorCode: opts.code,
      requestId,
      ...(opts.extra ?? {}),
    },
    {
      status: opts.status,
      headers: {
        'X-Request-ID': requestId,
        ...(opts.headers ?? {}),
      },
    },
  );
}

export function contentLengthBytes(req: NextRequest): number {
  const raw = req.headers.get('content-length');
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
