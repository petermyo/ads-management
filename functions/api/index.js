// /functions/api/index.js
export async function onRequest({ request }) {
  const url = new URL(request.url);

  if (url.pathname === '/api/users') {
    return new Response(JSON.stringify({ users: ['Alice', 'Bob'] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Not Found', { status: 404 });
}
