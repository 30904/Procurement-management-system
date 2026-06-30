# Deploy — DigitalOcean droplet (https://pms.idms-atp.com)

> **Related:** [TECHNICAL_GUIDE.md §14](../docs/TECHNICAL_GUIDE.md#14-production-deployment) · [MPBCDC terminology](../docs/MPBCDC_TERMINOLOGY_MAPPING.md) · [RFQ setup](../docs/RFQ_IMPLEMENTATION.md#4-seed--permissions)

Production layout: **Nginx** serves the React build and proxies **`/api`** to Node on **port 5020**.

## 1. Server prerequisites

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Use Node 18+ if your droplet image is older than the repo `engines` field allows.

## 2. Clone and install

```bash
sudo mkdir -p /var/www/pms
sudo chown $USER:$USER /var/www/pms
cd /var/www/pms
git clone <your-repo-url> .
cd frontend && npm ci && npm run build
cd ../backend && npm ci --omit=dev
```

## 3. Environment files

**Frontend** (values baked at build time):

```bash
cp frontend/.env.production.example frontend/.env.production
cd frontend && npm run build
```

`VITE_API_BASE_URL` stays **empty** so the browser calls `https://pms.idms-atp.com/api/...`.

**Backend** on the droplet:

```bash
cp backend/.env.production.example backend/.env
nano backend/.env
```

Set at minimum:

| Variable | Value |
|----------|--------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `PORT` | `5020` |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Long random secret |
| `PUBLIC_APP_URL` | `https://pms.idms-atp.com` |
| `CORS_ORIGIN` | `https://pms.idms-atp.com` |
| `TRUST_PROXY` | `1` |
| `SERVE_FRONTEND` | `0` (Nginx serves static files) |

## 4. Start API with PM2

```bash
mkdir -p logs
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

Verify: `curl -s http://127.0.0.1:5020/api/health`

## 5. Nginx

```bash
sudo cp deploy/nginx-pms.idms-atp.com.conf /etc/nginx/sites-available/pms
sudo ln -sf /etc/nginx/sites-available/pms /etc/nginx/sites-enabled/pms
sudo rm -f /etc/nginx/sites-enabled/default
sudo certbot --nginx -d pms.idms-atp.com
sudo nginx -t && sudo systemctl reload nginx
```

Update `root` in the Nginx config if your path is not `/var/www/pms/frontend/dist`.

## 6. Updates (redeploy)

```bash
cd /var/www/pms
git pull
cd frontend && npm ci && npm run build
cd ../backend && npm ci --omit=dev
pm2 restart pms-api
```

## Alternative: Node serves everything

If you skip Nginx static hosting, set `SERVE_FRONTEND=1` in backend `.env`, build frontend into `frontend/dist`, and proxy **all** traffic from Nginx to port 5020.

## Health checks

- API: `https://pms.idms-atp.com/api/health`
- App: `https://pms.idms-atp.com/login`
