// functions/api/ads-orders.js
export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/').filter(segment => segment);
        const method = request.method;

        const db = env.DB; 

        // Handle requests to /api/ads-orders
        if (pathSegments.length === 2 && pathSegments[1] === 'ads-orders') { 
            if (method === 'GET') {
                const { results } = await db.prepare('SELECT * FROM ads_order_table').all();
                return new Response(JSON.stringify(results), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } else if (method === 'POST') {
                const order = await request.json();
                // Basic validation
                if (!order.campaign_name || !order.budget || !order.start_date || !order.end_date) {
                    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
                }
                const created = new Date().toISOString().slice(0, 10);
                const { success } = await db.prepare(
                    `INSERT INTO ads_order_table (
                        created, campaign_name, budget, days, start_date, end_date,
                        platform, objective, auction, estimated_impression, estimated_click, estimated_ctr
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
                ).bind(
                    created, order.campaign_name, order.budget, order.days, order.start_date, order.end_date,
                    order.platform, order.objective, order.auction, order.estimated_impression, order.estimated_click, order.estimated_ctr
                ).run();

                if (success) {
                    const { results: newOrder } = await db.prepare('SELECT * FROM ads_order_table WHERE campaign_name = ? ORDER BY id DESC LIMIT 1').bind(order.campaign_name).all();
                    return new Response(JSON.stringify({ message: 'Ads order created successfully', order: newOrder[0] || order }), { status: 201 });
                } else {
                    throw new Error('Failed to insert ads order into database.');
                }
            }
        } 
        // Handle requests to /api/ads-orders/:id
        else if (pathSegments.length === 3 && pathSegments[1] === 'ads-orders') { 
            const orderId = pathSegments[2];
            if (method === 'PUT') {
                const order = await request.json();
                 if (!order.campaign_name || !order.budget || !order.start_date || !order.end_date) {
                    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
                }
                const { success } = await db.prepare(
                    `UPDATE ads_order_table SET 
                        campaign_name = ?, budget = ?, days = ?, start_date = ?, end_date = ?,
                        platform = ?, objective = ?, auction = ?, estimated_impression = ?, estimated_click = ?, estimated_ctr = ?
                    WHERE id = ?`
                ).bind(
                    order.campaign_name, order.budget, order.days, order.start_date, order.end_date,
                    order.platform, order.objective, order.auction, order.estimated_impression, order.estimated_click, order.estimated_ctr,
                    orderId
                ).run();

                if (success) {
                    const { results: updatedOrder } = await db.prepare('SELECT * FROM ads_order_table WHERE id = ?').bind(orderId).all();
                    return new Response(JSON.stringify({ message: 'Ads order updated successfully', order: updatedOrder[0] || order }), { status: 200 });
                } else {
                    throw new Error('Failed to update ads order in database.');
                }
            } else if (method === 'DELETE') {
                const { success } = await db.prepare('DELETE FROM ads_order_table WHERE id = ?').bind(orderId).run();
                if (success) {
                    return new Response(JSON.stringify({ message: 'Ads order deleted successfully' }), { status: 200 });
                } else {
                    throw new Error('Failed to delete ads order from database.');
                }
            }
        }

        return new Response(JSON.stringify({ error: 'Method Not Allowed or Invalid Path' }), { status: 405 });

    } catch (error) {
        console.error("API Error (ads-orders):", error.message, error.stack);
        return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), { status: 500 });
    }
}
