// /functions/api/index.js
export async function onRequest({ request }) {
  const url = new URL(request.url);


  return new Response('API Page', { status: 404 });
}
