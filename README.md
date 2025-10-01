# Torrent Wave

A sleek and modern user interface to search for torrents using a Jackett backend.

## Features

- Clean, responsive UI for searching torrents.
- Results displayed in a sortable, paginated table.
- Key information at a glance: size, seeders, peers, and publish date.
- Easy magnet link copying.

## Deployment on a VPS with Nginx (Recommended)

This application is a Single-Page Application (SPA) and is best served by a dedicated web server like Nginx. This method is more performant, secure, and easier to manage.

### Prerequisites

- Node.js & npm (for building the app)
- Git
- Nginx installed and running on your VPS.

### Deployment Steps

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies and build the app:**
    This command installs the necessary tools and then compiles the React application into static HTML, CSS, and JavaScript files in the `dist` directory.
    ```bash
    npm install
    npm run build
    ```

3.  **Configure Jackett API Key:**
    Create a `.env` file in the root of the project **before** building.
    ```ini
    # .env
    VITE_JACKETT_API_KEY=your_jackett_api_key
    ```
    If you change this key, you must run `npm run build` again.

4.  **Configure Nginx:**
    You need to create an Nginx configuration file for your site. This is typically located in `/etc/nginx/sites-available/`.

    Create a new file (e.g., `/etc/nginx/sites-available/your-domain.com`):
    ```bash
    sudo nano /etc/nginx/sites-available/your-domain.com
    ```

    Paste the following configuration. Be sure to replace `your_domain.com` with your actual domain and `/path/to/your/app/dist` with the full, absolute path to the `dist` folder from step 2.

    ```nginx
    server {
        listen 80;
        listen [::]:80;

        server_name your_domain.com;

        # Path to the built application's files
        root /path/to/your/app/dist;
        index index.html;

        # Serve the main app
        location / {
            # This is crucial for single-page applications like React
            try_files $uri $uri/ /index.html;
        }

        # Reverse proxy for Jackett API calls
        # This securely forwards requests from your app to the Jackett container
        location /api/ {
            # Assuming Jackett is running on the same machine (localhost)
            # and its port 9117 is mapped from the Docker container to the host.
            proxy_pass http://127.0.0.1:9117/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```

5.  **Enable the site and restart Nginx:**
    Create a symbolic link to enable your new site configuration.
    ```bash
    sudo ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
    ```
    Test your Nginx configuration for errors and then restart it.
    ```bash
    sudo nginx -t
    sudo systemctl restart nginx
    ```

Your application should now be live on `http://your_domain.com`.

**Security Note:** With this setup, you can and should configure your VPS firewall (e.g., `ufw`) to block all incoming connections on port `9117`. This ensures your Jackett instance is not exposed to the public internet and can only be accessed through your web application's secure proxy.

## Development

To run the application in development mode:

1.  Follow steps 1 and 3 from the deployment guide.
2.  The Vite development server already includes a proxy configuration in `vite.config.ts` that mimics the production Nginx setup. It will forward `/api` requests to `http://localhost:9117`.
3.  Run the development server:
    ```bash
    npm run dev
    ```
    This will start a hot-reloading development server, typically on `http://localhost:5173`.
