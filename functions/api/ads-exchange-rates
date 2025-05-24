// functions/api/ads-exchange-rates.js
export async function onRequest(context) {
    try {
        const { request, env } = context;
        const method = request.method;

        const db = env.DB; 

        if (method === 'GET') {
            const { results } = await db.prepare('SELECT * FROM ads_exchange_rate_table').all();
            return new Response(JSON.stringify(results), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });

    } catch (error) {
        console.error("API Error (exchange-rates):", error.message, error.stack);
        return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), { status: 500 });
    }
}
