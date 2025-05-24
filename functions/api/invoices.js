// functions/api/invoices.js
export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/').filter(segment => segment);
        const method = request.method;

        const db = env.DB; 

        // Handle requests to /api/invoices
        if (pathSegments.length === 2 && pathSegments[1] === 'invoices') { 
            if (method === 'GET') {
                const { results } = await db.prepare('SELECT * FROM ads_invoices').all();
                return new Response(JSON.stringify(results), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } else if (method === 'POST') {
                const invoice = await request.json();
                // Basic validation
                if (!invoice.date || !invoice.month || !invoice.transaction_id || !invoice.platform) {
                    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
                }
                const { success } = await db.prepare(
                    `INSERT INTO ads_invoices (
                        date, month, transaction_id, platform, attachments
                    ) VALUES (?, ?, ?, ?, ?)`
                ).bind(
                    invoice.date, invoice.month, invoice.transaction_id, invoice.platform, invoice.attachments || null
                ).run();

                if (success) {
                    const { results: newInvoice } = await db.prepare('SELECT * FROM ads_invoices WHERE transaction_id = ? ORDER BY id DESC LIMIT 1').bind(invoice.transaction_id).all();
                    return new Response(JSON.stringify({ message: 'Invoice created successfully', invoice: newInvoice[0] || invoice }), { status: 201 });
                } else {
                    throw new Error('Failed to insert invoice into database.');
                }
            }
        } 
        // Handle requests to /api/invoices/:id
        else if (pathSegments.length === 3 && pathSegments[1] === 'invoices') { 
            const invoiceId = pathSegments[2];
            if (method === 'PUT') {
                const invoice = await request.json();
                 if (!invoice.date || !invoice.month || !invoice.transaction_id || !invoice.platform) {
                    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
                }
                const { success } = await db.prepare(
                    `UPDATE ads_invoices SET 
                        date = ?, month = ?, transaction_id = ?, platform = ?, attachments = ?
                    WHERE id = ?`
                ).bind(
                    invoice.date, invoice.month, invoice.transaction_id, invoice.platform, invoice.attachments || null,
                    invoiceId
                ).run();

                if (success) {
                    const { results: updatedInvoice } = await db.prepare('SELECT * FROM ads_invoices WHERE id = ?').bind(invoiceId).all();
                    return new Response(JSON.stringify({ message: 'Invoice updated successfully', invoice: updatedInvoice[0] || invoice }), { status: 200 });
                } else {
                    throw new Error('Failed to update invoice in database.');
                }
            } else if (method === 'DELETE') {
                const { success } = await db.prepare('DELETE FROM ads_invoices WHERE id = ?').bind(invoiceId).run();
                if (success) {
                    return new Response(JSON.stringify({ message: 'Invoice deleted successfully' }), { status: 200 });
                } else {
                    throw new Error('Failed to delete invoice from database.');
                }
            }
        }

        return new Response(JSON.stringify({ error: 'Method Not Allowed or Invalid Path' }), { status: 405 });

    } catch (error) {
        console.error("API Error (invoices):", error.message, error.stack);
        return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), { status: 500 });
    }
}
