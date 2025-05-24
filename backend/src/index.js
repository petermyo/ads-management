// This is the Cloudflare Worker script (src/index.js)

// Define CORS headers to allow your frontend to access the Worker
// IMPORTANT: In production, replace "*" with your Cloudflare Pages domain (e.g., "https://your-app.pages.dev")
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Headers": "Content-Type", // Allow Content-Type header for POST/PUT requests
};

// Handle OPTIONS requests for CORS preflight
function handleOptions(request) {
    if (request.headers.get("Origin") !== null &&
        request.headers.get("Access-Control-Request-Method") !== null &&
        request.headers.get("Access-Control-Request-Headers") !== null) {
        // Handle CORS preflight request.
        return new Response(null, {
            headers: corsHeaders
        });
    } else {
        // Handle standard OPTIONS request.
        return new Response(null, {
            headers: {
                "Allow": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
            },
        });
    }
}

// Function to generate a simple unique ID (for mock data before D1 auto-increment)
// D1 typically handles auto-incrementing IDs, but for simplicity and consistency
// with initial mock data, we'll generate one for new entries.
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Main Worker event listener
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        // Handle CORS preflight requests
        if (method === "OPTIONS") {
            return handleOptions(request);
        }

        // Add CORS headers to all responses
        const responseHeaders = new Headers(corsHeaders);

        // --- D1 Database Operations (DB binding: env.DB) ---
        // You need to bind your D1 database to 'DB' in your Cloudflare Worker settings.

        // API for Users
        if (path.startsWith("/api/users")) {
            const userId = path.split('/').pop(); // Extracts ID if present (e.g., /api/users/123)

            if (method === "GET") {
                try {
                    const { results } = await env.DB.prepare("SELECT * FROM users_table").all();
                    return new Response(JSON.stringify(results), {
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 500,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "POST") {
                try {
                    const user = await request.json();
                    const created = Date.now();
                    const id = generateUniqueId(); // Generate ID for new entry
                    const { success } = await env.DB.prepare(
                        "INSERT INTO users_table (id, created, username, password, email, sessions) VALUES (?, ?, ?, ?, ?, ?)"
                    ).bind(id, created, user.username, user.password, user.email, user.sessions || 0).run();

                    if (success) {
                        return new Response(JSON.stringify({ id, ...user, created }), {
                            status: 201, // Created
                            headers: { "Content-Type": "application/json", ...responseHeaders }
                        });
                    } else {
                        throw new Error("Failed to insert user.");
                    }
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400, // Bad Request
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "PUT" && userId) {
                try {
                    const user = await request.json();
                    // Only update password if provided in the payload
                    const updateQuery = user.password ?
                        "UPDATE users_table SET username = ?, password = ?, email = ? WHERE id = ?" :
                        "UPDATE users_table SET username = ?, email = ? WHERE id = ?";
                    const bindParams = user.password ?
                        [user.username, user.password, user.email, userId] :
                        [user.username, user.email, userId];

                    const { success } = await env.DB.prepare(updateQuery).bind(...bindParams).run();

                    if (success) {
                        return new Response(JSON.stringify({ message: "User updated successfully" }), {
                            status: 200, // OK
                            headers: { "Content-Type": "application/json", ...responseHeaders }
                        });
                    } else {
                        // Check if user exists before throwing generic error
                        const existingUser = await env.DB.prepare("SELECT id FROM users_table WHERE id = ?").bind(userId).first();
                        if (!existingUser) {
                            throw new Error("User not found.");
                        } else {
                            throw new Error("Failed to update user.");
                        }
                    }
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "DELETE" && userId) {
                try {
                    const { success } = await env.DB.prepare("DELETE FROM users_table WHERE id = ?").bind(userId).run();
                    if (success) {
                        return new Response(JSON.stringify({ message: "User deleted successfully" }), {
                            status: 200,
                            headers: { "Content-Type": "application/json", ...responseHeaders }
                        });
                    } else {
                        throw new Error("Failed to delete user or user not found.");
                    }
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            }
        }

        // API for Ads Orders
        if (path.startsWith("/api/ads-orders")) {
            const orderId = path.split('/').pop();

            if (method === "GET") {
                try {
                    const { results } = await env.DB.prepare("SELECT * FROM ads_order_table").all();
                    return new Response(JSON.stringify(results), {
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 500,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "POST") {
                try {
                    const order = await request.json();
                    const created = Date.now();
                    const id = generateUniqueId();
                    const { success } = await env.DB.prepare(
                        "INSERT INTO ads_order_table (id, created, start_date, end_date, campaign_name, budget, days, platform, objective, auction, estimated_impression, estimated_click, estimated_ctr) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                    ).bind(
                        id, created, order.start_date, order.end_date, order.campaign_name, order.budget, order.days,
                        order.platform, order.objective, order.auction, order.estimated_impression, order.estimated_click, order.estimated_ctr
                    ).run();

                    if (success) {
                        return new Response(JSON.stringify({ id, ...order, created }), {
                            status: 201,
                            headers: { "Content-Type": "application/json", ...responseHeaders }
                        });
                    } else {
                        throw new Error("Failed to insert ads order.");
                    }
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "PUT" && orderId) {
                try {
                    const order = await request.json();
                    const { success } = await env.DB.prepare(
                        "UPDATE ads_order_table SET start_date = ?, end_date = ?, campaign_name = ?, budget = ?, days = ?, platform = ?, objective = ?, auction = ?, estimated_impression = ?, estimated_click = ?, estimated_ctr = ? WHERE id = ?"
                    ).bind(
                        order.start_date, order.end_date, order.campaign_name, order.budget, order.days,
                        order.platform, order.objective, order.auction, order.estimated_impression, order.estimated_click, order.estimated_ctr,
                        orderId
                    ).run();

                    if (success) {
                        return new Response(JSON.stringify({ message: "Ads order updated successfully" }), {
                            status: 200,
                            headers: { "Content-Type": "application/json", ...responseHeaders }
                        });
                    } else {
                        const existingOrder = await env.DB.prepare("SELECT id FROM ads_order_table WHERE id = ?").bind(orderId).first();
                        if (!existingOrder) {
                            throw new Error("Ads order not found.");
                        } else {
                            throw new Error("Failed to update ads order.");
                        }
                    }
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "DELETE" && orderId) {
                try {
                    const { success } = await env.DB.prepare("DELETE FROM ads_order_table WHERE id = ?").bind(orderId).run();
                    if (success) {
                        return new Response(JSON.stringify({ message: "Ads order deleted successfully" }), {
                            status: 200,
                            headers: { "Content-Type": "application/json", ...responseHeaders }
                        });
                    } else {
                        throw new Error("Failed to delete ads order or order not found.");
                    }
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            }
        }

        // API for Invoices
        if (path.startsWith("/api/invoices")) {
            const invoiceId = path.split('/').pop();

            if (method === "GET") {
                try {
                    const { results } = await env.DB.prepare("SELECT * FROM ads_invoices").all();
                    return new Response(JSON.stringify(results), {
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 500,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "POST") {
                try {
                    const invoice = await request.json();
                    const id = generateUniqueId();
                    const { success } = await env.DB.prepare(
                        "INSERT INTO ads_invoices (id, date, month, transaction_id, platform, attachments) VALUES (?, ?, ?, ?, ?, ?)"
                    ).bind(id, invoice.date, invoice.month, invoice.transaction_id, invoice.platform, invoice.attachments).run();

                    if (success) {
                        return new Response(JSON.stringify({ id, ...invoice }), {
                            status: 201,
                            headers: { "Content-Type": "application/json", ...responseHeaders }
                        });
                    } else {
                        throw new Error("Failed to insert invoice.");
                    }
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "PUT" && invoiceId) {
                try {
                    const invoice = await request.json();
                    const { success } = await env.DB.prepare(
                        "UPDATE ads_invoices SET date = ?, month = ?, transaction_id = ?, platform = ?, attachments = ? WHERE id = ?"
                    ).bind(invoice.date, invoice.month, invoice.transaction_id, invoice.platform, invoice.attachments, invoiceId).run();

                    if (success) {
                        return new Response(JSON.stringify({ message: "Invoice updated successfully" }), {
                            status: 200,
                            headers: { "Content-Type": "application/json", ...responseHeaders }
                        });
                    } else {
                        const existingInvoice = await env.DB.prepare("SELECT id FROM ads_invoices WHERE id = ?").bind(invoiceId).first();
                        if (!existingInvoice) {
                            throw new Error("Invoice not found.");
                        } else {
                            throw new Error("Failed to update invoice.");
                        }
                    }
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "DELETE" && invoiceId) {
                try {
                    const { success } = await env.DB.prepare("DELETE FROM ads_invoices WHERE id = ?").bind(invoiceId).run();
                    if (success) {
                        return new Response(JSON.stringify({ message: "Invoice deleted successfully" }), {
                            status: 200,
                            headers: { "Content-Type": "application/json", ...responseHeaders }
                        });
                    } else {
                        throw new Error("Failed to delete invoice or invoice not found.");
                    }
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            }
        }

        // --- KV Store Operations (KV binding: env.KV_DATA) ---
        // You need to bind your KV namespace to 'KV_DATA' in your Cloudflare Worker settings.

        // API for Ads Exchange Rate (KV)
        if (path === "/api/ads-exchange-rates") {
            if (method === "GET") {
                try {
                    // KV stores strings. Store/retrieve as JSON string.
                    const ratesJson = await env.KV_DATA.get("ads_exchange_rate_table");
                    const rates = ratesJson ? JSON.parse(ratesJson) : [];
                    return new Response(JSON.stringify(rates), {
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 500,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "POST") { // For updating the whole table (e.g., batch update)
                try {
                    const newRates = await request.json();
                    await env.KV_DATA.put("ads_exchange_rate_table", JSON.stringify(newRates));
                    return new Response(JSON.stringify({ message: "Exchange rates updated successfully" }), {
                        status: 200,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            }
        }

        // API for Ads Report Sync Key-Value (KV)
        if (path === "/api/ads-report-sync-key-value") {
            if (method === "GET") {
                try {
                    const syncDataJson = await env.KV_DATA.get("ads_report_sync_key_value");
                    const syncData = syncDataJson ? JSON.parse(syncDataJson) : {};
                    return new Response(JSON.stringify(syncData), {
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 500,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            } else if (method === "POST") { // For updating the whole object
                try {
                    const newSyncData = await request.json();
                    await env.KV_DATA.put("ads_report_sync_key_value", JSON.stringify(newSyncData));
                    return new Response(JSON.stringify({ message: "Report sync data updated successfully" }), {
                        status: 200,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                } catch (err) {
                    return new Response(JSON.stringify({ error: err.message }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", ...responseHeaders }
                    });
                }
            }
        }

        // Fallback for unknown routes
        return new Response(JSON.stringify({ message: "Not Found" }), {
            status: 404,
            headers: { "Content-Type": "application/json", ...responseHeaders }
        });
    },
};
