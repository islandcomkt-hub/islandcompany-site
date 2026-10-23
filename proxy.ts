import { NextResponse, type NextRequest } from 'next/server';
import { adminConfigured, adminFromAuthorization } from './lib/admin-auth';
// Protege a Island Base e a API interna com senha (Basic Auth). Falha fechada se não configurada.
export function proxy(request: NextRequest) {
  if (!adminConfigured()) return new NextResponse('Island Base não configurada', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  if (adminFromAuthorization(request.headers.get('authorization'))) return NextResponse.next();
  return new NextResponse('Acesso restrito', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Island Base", charset="UTF-8"', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}
export const config = { matcher: ['/base', '/base/:path*', '/api/base', '/api/base/:path*'] };
