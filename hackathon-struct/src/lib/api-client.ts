import { z } from 'zod'
import { contracts } from '@/contracts'
import { isContract, isRegistryNode, type Contract, type ApiResponse } from '@/contracts/_kit'

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export type CallOptions = {
  mock?: boolean
  signal?: AbortSignal
  token?: string
}

export type ApiResult<T> = {
  data: T
  source: 'mock' | 'live'
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')

const USE_MOCKS_DEFAULT =
  process.env.NEXT_PUBLIC_USE_MOCKS === 'true' ||
  process.env.NODE_ENV !== 'production'

function isMockForced(): boolean {
  if (typeof window === 'undefined') return USE_MOCKS_DEFAULT
  const params = new URLSearchParams(window.location.search)
  if (params.get('__mock') === '1') return true
  if (params.get('__mock') === '0') return false
  return USE_MOCKS_DEFAULT
}

export async function call<C extends Contract>(
  contract: C,
  input: z.input<C['input']> = {} as never,
  init?: CallOptions,
): Promise<ApiResult<z.infer<C['output']>>> {
  const shouldMock = init?.mock ?? isMockForced()

  if (shouldMock) {
    const delay = Number(process.env.MOCK_DELAY_MS ?? 200)
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay))
    const mockData = contract.mock(input as never) as z.infer<C['output']>
    return { data: mockData, source: 'mock' }
  }

  const used = new Set<string>()
  const path = contract.path.replace(/:(\w+)/g, (_, k) => {
    used.add(k)
    return encodeURIComponent(String((input as Record<string, unknown>)[k]))
  })

  const rest = Object.fromEntries(
    Object.entries((input ?? {}) as Record<string, unknown>).filter(
      ([k, v]) => !used.has(k) && v !== undefined,
    ),
  )

  const isQuery = contract.method === 'GET' || contract.method === 'DELETE'
  const queryString =
    isQuery && Object.keys(rest).length
      ? `?${new URLSearchParams(Object.entries(rest).map(([k, v]) => [k, String(v)]))}`
      : ''

  const baseUrl = API_BASE_URL.replace(/\/$/, '')
  const fullUrl = `${baseUrl}${path}${queryString}`

  try {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    }
    if (init?.token) {
      headers['authorization'] = `Bearer ${init.token}`
    }

    const res = await fetch(fullUrl, {
      method: contract.method,
      headers,
      body: isQuery ? undefined : JSON.stringify(rest),
      signal: init?.signal,
    })

    if (!res.ok) {
      throw new ApiClientError(`HTTP_${res.status}`, `Request failed with status ${res.status}`)
    }

    const json = await res.json()
    // Support either `{ ok: true, data: T, source }` envelope or direct payload `T`
    if (json && typeof json === 'object' && 'ok' in json) {
      const body = json as ApiResponse<z.infer<C['output']>>
      if (!body.ok) {
        throw new ApiClientError(body.error.code, body.error.message, body.error.fields)
      }
      return { data: body.data, source: body.source ?? 'live' }
    }

    return { data: json as z.infer<C['output']>, source: 'live' }
  } catch (error) {
    if (error instanceof ApiClientError) throw error

    // If external backend is offline during development, fallback gracefully to mock with warning
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[api-client] Backend unreachable at ${fullUrl}. Serving mock data fallback.`, error)
      const mockData = contract.mock(input as never) as z.infer<C['output']>
      return { data: mockData, source: 'mock' }
    }

    throw new ApiClientError('NETWORK_ERROR', (error as Error).message ?? 'Network error')
  }
}

type Client<T> = {
  [K in keyof T]: T[K] extends Contract<infer I, infer O>
    ? (input?: z.input<I>, init?: CallOptions) => Promise<ApiResult<z.infer<O>>>
    : Client<T[K]>
}

const build = (node: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(node).flatMap(([k, v]): [string, unknown][] => {
      if (isContract(v))
        return [[k, (input?: never, init?: CallOptions) => call(v, input as never, init)]]
      if (isRegistryNode(v)) return [[k, build(v)]]
      return []
    }),
  )

export const api = build(contracts) as Client<typeof contracts>
