# Torrent Wave

A sleek and modern user interface to search for torrents using a Prowlarr backend.

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
- Docker and a running Prowlarr container.

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

3.  **Configure Prowlarr API Key:**
    Create a `.env` file in the root of the project **before** building. This file tells the application which API key to use.
    ```ini
    # .env
    VITE_PROWLARR_API_KEY=your_prowlarr_api_key
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

        # Reverse proxy for Prowlarr API calls
        # This securely forwards requests from your app to the Prowlarr container
        location /prowlarr/ {
            # IMPORTANT: This address should point to where your Prowlarr container is accessible
            # from your Nginx server. '127.0.0.1:9696' is correct if your Docker container has
            # port 9696 published to the host machine's localhost interface.
            proxy_pass http://127.0.0.1:9696/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
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

### Troubleshooting

#### 500 Internal Server Error (on API calls)

This almost always means Nginx cannot communicate with your Prowlarr container at the `proxy_pass` address.

1.  **Confirm Prowlarr is running:**
    ```bash
    docker ps
    ```
    Make sure your Prowlarr container is listed and has a port mapping like `127.0.0.1:9696->9696/tcp` under the `PORTS` column.

2.  **Test the connection from your server:**
    Run this command on your VPS:
    ```bash
    curl http://127.0.0.1:9696
    ```
    - If you get HTML back, the connection is working.
    - If you get `Connection refused` or the command hangs, Prowlarr is not accessible at that address.

3.  **The Fix:**
    Ensure your `docker run` command for Prowlarr correctly publishes the port. Use the `-p` flag to map the host's port to the container's port. For better security, bind it to localhost:
    ```bash
    docker run ... -p 127.0.0.1:9696:9696 ... <prowlarr_image_name>
    ```
    If you have to restart your Prowlarr container with the correct port mapping, no changes are needed to Nginx.

## Development

To run the application in development mode:

1.  Follow steps 1 and 3 from the deployment guide.
2.  The Vite development server includes a proxy configuration in `vite.config.ts`. It will forward `/prowlarr` requests to `http://localhost:9696`.
3.  Run the development server:
    ```bash
    npm run dev
    ```
    This will start a hot-reloading development server, typically on `http://localhost:5173`.