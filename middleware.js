// middleware.js
// Intercepta requisicoes / em subdominios ANTES dos arquivos estaticos
// e serve a pagina com OG meta tags dinamicas (empresa/agendamento)

export const config = {
  matcher: ['/'],
};

export default async function middleware(request) {
  const url  = new URL(request.url);
  const host = request.headers.get('host') || '';

  const match = host.match(/^([^.]+)\.agenplus\.com\.br$/i);
  if (!match || match[1] === 'www') return; // nao e subdominio, segue normal

  // Chama api/subdomain-page mantendo os query params (?ag=...)
  const apiUrl = new URL(url);
  apiUrl.pathname = '/api/subdomain-page';

  const res = await fetch(apiUrl.toString(), {
    headers: { host },
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
