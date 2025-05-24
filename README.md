# Ads Management Dashboard

This repository contains a modern ads management admin dashboard built with HTML, Tailwind CSS, and Vue.js for the frontend, and a Cloudflare Worker backend interacting with Cloudflare D1 and KV databases.

## Project Structure


.
├── .github/
│   └── workflows/
│       └── deploy.yml        # (Optional) GitHub Action for automated deployments
├── frontend/
│   └── index.html            # Your Ads Management Dashboard (HTML, Vue.js, Tailwind CSS)
├── backend/
│   ├── src/
│   │   └── index.js          # Your Cloudflare Worker code
│   ├── wrangler.toml         # Cloudflare Worker configuration (D1 & KV bindings)
│   ├── schema.sql            # D1 database schema (SQL for table creation)
│   └── package.json          # Worker dependencies (if any, e.g., for wrangler)
├── .gitignore                # Specifies intentionally untracked files to ignore
└── README.md                 # Project README with setup and deployment instructions


## Features

**Frontend Dashboard:**
* **Modern UI:** Built with Tailwind CSS for a clean and responsive design.
* **Vue.js:** Reactive data management and component-based structure.
* **Sections:** Dashboard (external data), Users, Ads Orders, Ads Report, Invoices.
* **CRUD Operations:** Forms for adding/editing Users, Ads Orders, and Invoices.
* **External Data Integration:** Displays ads data from a Google Sheet via `opensheet.elk.sh`.

**Backend (Cloudflare Worker):**
* **Serverless API:** Handles data interactions for the frontend.
* **Cloudflare D1 Integration:** Manages `users_table`, `ads_order_table`, and `ads_invoices`.
* **Cloudflare KV Integration:** Manages `ads_exchange_rate_table` and `ads_report_sync_key_value`.
* **CORS Handling:** Configured to allow requests from your Cloudflare Pages frontend.

## Setup and Deployment

### Prerequisites

1.  **Cloudflare Account:** You need an active Cloudflare account.
2.  **`wrangler` CLI:** Install Cloudflare's command-line tool:
    ```bash
    npm install -g wrangler
    ```
3.  **Node.js & npm:** Ensure you have Node.js (LTS recommended) and npm installed.
4.  **GitHub Repository:** Create a new empty GitHub repository for this project.

### Backend Setup (Cloudflare Worker, D1, KV)

1.  **Create D1 Database:**
    * Go to your Cloudflare Dashboard.
    * Navigate to "Workers & Pages" -> "D1".
    * Click "Create database". Give it a name (e.g., `ads_management_db`).
    * Once created, copy the **"Database ID"**. You will need this for `backend/wrangler.toml`.

2.  **Create KV Namespace:**
    * Go to your Cloudflare Dashboard.
    * Navigate to "Workers & Pages" -> "KV".
    * Click "Create a namespace". Give it a name (e.g., `ads_data_kv`).
    * Copy the **"ID"** of the created namespace. You will need this for `backend/wrangler.toml`.

3.  **Configure `backend/wrangler.toml`:**
    * Open `backend/wrangler.toml` in your editor.
    * Replace `<YOUR_D1_DATABASE_ID>` with the actual ID of your D1 database.
    * Replace `<YOUR_KV_NAMESPACE_ID>` with the actual ID of your KV namespace.

4.  **Install Worker Dependencies:**
    * Navigate to the `backend/` directory in your terminal:
        ```bash
        cd backend/
        npm install
        ```

5.  **Apply D1 Database Schema:**
    * From the `backend/` directory, execute the SQL schema to create your tables in D1:
        ```bash
        wrangler d1 execute ads_management_db --file=./schema.sql --remote
        ```
        (Replace `ads_management_db` with the `database_name` you used in `wrangler.toml`). The `--remote` flag ensures it applies to your deployed D1 instance.

6.  **Deploy Cloudflare Worker:**
    * From the `backend/` directory, deploy your Worker:
        ```bash
        wrangler deploy
        ```
    * Note the URL of your deployed Worker (e.g., `https://my-ads-backend.<your-worker-subdomain>.workers.dev`). This will be your `API_BASE_URL`.

### Frontend Setup (Cloudflare Pages)

1.  **Update `frontend/index.html`:**
    * Open `frontend/index.html` in your editor.
    * Locate the `API_BASE_URL` constant in the `<script>` section.
    * Replace `"http://localhost:8787/api"` with the URL of your deployed Cloudflare Worker, appending `/api` to it (e.g., `https://my-ads-backend.<your-worker-subdomain>.workers.dev/api`).

2.  **Configure Worker CORS (Crucial for Production):**
    * Open `backend/src/index.js`.
    * In the `corsHeaders` object, change `"Access-Control-Allow-Origin": "*"` to your Cloudflare Pages domain.
        * After deploying your frontend (step 3 below), your Cloudflare Pages site will have a URL like `https://your-app-name.pages.dev`. Use this exact domain.
        * Example: `"Access-Control-Allow-Origin": "https://your-app-name.pages.dev"`
    * Redeploy your Worker after this change: `cd backend/ && wrangler deploy`

3.  **Push to GitHub:**
    * Ensure all your files (including the updated `frontend/index.html` and `backend/src/index.js`) are committed and pushed to your GitHub repository.
    * If you haven't already:
        ```bash
        git add .
        git commit -m "Add complete project code and update API_BASE_URL"
        git branch -M main # If not already on main
        git remote add origin [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git) # Replace with your repo
        git push -u origin main
        ```

4.  **Connect Cloudflare Pages:**
    * Go to your Cloudflare Dashboard -> "Pages".
    * Click "Create a project" -> "Connect to Git".
    * Select your GitHub repository.
    * **Build settings:**
        * **Build command:** Leave empty (or `npm install && npm run build` if you add a Vue build step later).
        * **Build output directory:** Set this to `frontend/`.
    * Click "Deploy site".

Your frontend dashboard will now be deployed and should be able to communicate with your Cloudflare Worker backend!

## Local Development

To develop locally:

1.  **Frontend:** Open `frontend/index.html` directly in your browser. (Note: API calls will fail unless your Worker is also running locally).
2.  **Backend (Worker):**
    * Navigate to the `backend/` directory.
    * Run `npm start` (or `wrangler dev`). This will start a local development server for your Worker (usually on `http://localhost:8787`).
    * Ensure `API_BASE_URL` in `frontend/index.html` is set to `http://localhost:8787/api` for local testing.
    * For local D1 database interactions, `wrangler dev` uses a local SQLite database by default. You can apply the schema locally using `wrangler d1 execute ads_management_db --local --file=./schema.sql`.

## Future Enhancements

* **Authentication:** Implement proper user authentication and authorization (e.g., using Cloudflare Access, Auth0, or a custom JWT flow) in your Worker.
* **Error Handling & UI Feedback:** More sophisticated error messages and loading indicators in the frontend.
* **Input Validation:** Add more robust client-side and server-side validation for all form inputs.
* **Advanced Dashboard Features:** Add charts, filters, and search capabilities to the dashboard.
* **D1 Migrations:** For managing database schema changes over time, look into D1 Migrations.
* **Frontend Build Process:** For larger Vue.js apps, consider using Vite or Vue CLI to compile your frontend for better performance and modularity.
