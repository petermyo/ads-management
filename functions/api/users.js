// functions/api/users.js
export async function onRequest(context) {
    try {
        const { request, env } = context;
        const url = new URL(request.url);
        // Path segments will be like ["api", "users"] or ["api", "users", "123"]
        const pathSegments = url.pathname.split('/').filter(segment => segment);
        const method = request.method;

        // Ensure your D1 binding is named 'DB' in wrangler.toml and Cloudflare Pages settings
        const db = env.DB; 

        // Handle requests to /api/users
        if (pathSegments.length === 2 && pathSegments[1] === 'users') { 
            if (method === 'GET') {
                const { results } = await db.prepare('SELECT * FROM users_table').all();
                return new Response(JSON.stringify(results), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } else if (method === 'POST') {
                const user = await request.json();
                // Basic validation
                if (!user.username || !user.password || !user.email) {
                    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
                }
                const created = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
                const { success } = await db.prepare(
                    'INSERT INTO users_table (created, username, password, email, sessions) VALUES (?, ?, ?, ?, ?)'
                ).bind(created, user.username, user.password, user.email, 0).run();

                if (success) {
                    // Fetch the newly created user (or return a simplified confirmation)
                    const { results: newUsers } = await db.prepare('SELECT * FROM users_table WHERE username = ? ORDER BY id DESC LIMIT 1').bind(user.username).all();
                    return new Response(JSON.stringify({ message: 'User added successfully', user: newUsers[0] || user }), { status: 201 });
                } else {
                    throw new Error('Failed to insert user into database.');
                }
            }
        } 
        // Handle requests to /api/users/:id
        else if (pathSegments.length === 3 && pathSegments[1] === 'users') { 
            const userId = pathSegments[2];
            if (method === 'PUT') {
                const user = await request.json();
                // Basic validation
                if (!user.username || !user.email) {
                     return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
                }
                // Only update password if provided
                let statement;
                let bindParams;
                if (user.password) {
                    statement = 'UPDATE users_table SET username = ?, password = ?, email = ?, sessions = ? WHERE id = ?';
                    bindParams = [user.username, user.password, user.email, user.sessions, userId];
                } else {
                    statement = 'UPDATE users_table SET username = ?, email = ?, sessions = ? WHERE id = ?';
                    bindParams = [user.username, user.email, user.sessions, userId];
                }

                const { success } = await db.prepare(statement).bind(...bindParams).run();

                if (success) {
                    // Fetch updated user to return consistent data
                    const { results: updatedUser } = await db.prepare('SELECT * FROM users_table WHERE id = ?').bind(userId).all();
                    return new Response(JSON.stringify({ message: 'User updated successfully', user: updatedUser[0] || user }), { status: 200 });
                } else {
                    throw new Error('Failed to update user in database.');
                }
            } else if (method === 'DELETE') {
                const { success } = await db.prepare('DELETE FROM users_table WHERE id = ?').bind(userId).run();
                if (success) {
                    return new Response(JSON.stringify({ message: 'User deleted successfully' }), { status: 200 });
                } else {
                    throw new Error('Failed to delete user from database.');
                }
            }
        }

        // Fallback for unmatched methods/paths
        return new Response(JSON.stringify({ error: 'Method Not Allowed or Invalid Path' }), { status: 405 });

    } catch (error) {
        console.error("API Error (users):", error.message, error.stack);
        return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), { status: 500 });
    }
}
