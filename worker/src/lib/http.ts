import type { Env } from '../env'

export function corsHeaders(origin: string | null, env: Env) {
  const allowedOrigin = origin === env.ALLOWED_ORIGIN ? env.ALLOWED_ORIGIN : env.ALLOWED_ORIGIN

  return {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-headers': 'content-type, authorization, x-browser-id, x-preview-token',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-credentials': 'false',
  }
}

export function json<T>(body: T, init: ResponseInit = {}, request: Request, env: Env) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(request.headers.get('origin'), env),
      ...init.headers,
    },
  })
}
