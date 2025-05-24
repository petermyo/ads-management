// functions/api/ads-report-sync-key-value.js
export async function onRequest(context) {
    try {
        const { request, env } = context;
        const method = request.method;

        const db = env.DB; 

        if (method === 'GET') {
            const { results } = await db.prepare('SELECT key_col, value_col FROM ads_report_sync_key_value').all();
            // Convert array of objects { key_col: '...', value_col: '...' } to a single object { 'key': 'value' }
            const keyValueObject = results.reduce((acc, row) => {
                acc[row.key_col] = row.value_col;
                return acc;
            }, {});
            return new Response(JSON.stringify(keyValueObject), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });

    } catch (error) {
        console.error("API Error (report-sync):", error.message, error.stack);
        return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), { status: 500 });
    }
}
