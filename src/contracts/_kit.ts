import { z } from 'zod'

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
export type AuthLevel = 'public' | 'user' | 'admin'

export interface Contract<
  I extends z.ZodTypeAny = z.ZodTypeAny,
  O extends z.ZodTypeAny = z.ZodTypeAny,
> {
  method: Method
  /** Route path on the Python backend (e.g. `/api/tts/generate`). `:param` segments are substituted from input. */
  path: string
  auth: AuthLevel
  input: I
  output: O
  /** Deterministic realistic mock fallback used when backend is offline or mock mode is enabled. */
  mock: (input: z.infer<I>) => z.infer<O>
  summary?: string
}

export const defineContract = <I extends z.ZodTypeAny, O extends z.ZodTypeAny>(
  c: Contract<I, O>,
): Contract<I, O> => c

/** Standard API envelope: `{ ok: true, data: T, source: 'mock' | 'live' }` or error */
export type ApiOk<T> = { ok: true; data: T; source: 'mock' | 'live' }
export type ApiErr = {
  ok: false
  error: { code: ErrorCode; message: string; fields?: Record<string, string[]> }
}
export type ApiResponse<T> = ApiOk<T> | ApiErr

export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  CONTRACT_VIOLATION: 500,
} as const
export type ErrorCode = keyof typeof ERROR_STATUS

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message ?? code)
    this.name = 'ApiError'
  }
}

/** Runtime guard used by the typed API client and /dev/api contract explorer. */
export const isContract = (v: unknown): v is Contract =>
  typeof v === 'object' &&
  v !== null &&
  'method' in v &&
  'path' in v &&
  'input' in v &&
  'output' in v &&
  'mock' in v

export const isRegistryNode = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  if ('_zod' in v || '~standard' in v) return false
  const proto = Object.getPrototypeOf(v)
  return proto === null || proto === Object.prototype
}
