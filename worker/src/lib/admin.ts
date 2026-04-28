import type { Env } from '../env'

export function assertAdmin(request: Request, env: Env) {
  return request.headers.get('authorization') === `Bearer ${env.ADMIN_TOKEN}`
}
