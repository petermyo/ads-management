// functions/api/login.js
export async function onRequest(context) {
    try {
        const { request, env } = context;
        const { username, password } = await request.json();

        // Ensure your D1 binding is named 'DB' in Cloudflare Pages settings
        const db = env.DB; 

        // IMPORTANT: In a real application, hash and salt passwords (e.g., bcrypt)
        // Never store or compare plain text passwords in production.
        const { results } = await db.prepare('SELECT id, username, password FROM users_table WHERE username = ? AND password = ?')
                                    .bind(username, password)
                                    .all();

        if (results.length > 0) {
            const user = results[0];
            // Generate a simple session token (UUID for demo purposes)
            // In a real app, this would be a cryptographically signed JWT
            const sessionToken = crypto.randomUUID(); 

            // Store the session token in the user's record (or a dedicated sessions table)
            // This allows us to validate the token later.
            await db.prepare('UPDATE users_table SET sessions = ? WHERE id = ?')
                    .bind(sessionToken, user.id)
                    .run();

            return new Response(JSON.stringify({ message: 'Login successful', token: sessionToken }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
                status: 401, // Unauthorized
                headers: { 'Content-Type': 'application/json' },
            });
        }

    } catch (error) {
        console.error("Login API Error:", error.message, error.stack);
        return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
