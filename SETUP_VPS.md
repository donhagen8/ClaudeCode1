# VPS Setup — Hetzner CX22 for Stirling-PDF

## 1. Provision the server

In the Hetzner Cloud Console:
- Type: **CX22** (2 vCPU, 4 GB RAM, 40 GB SSD) — ~$4–6/month
- Image: **Ubuntu 22.04**
- Location: pick the region closest to your users
- Add your SSH public key during setup

SSH in:
```bash
ssh root@YOUR_SERVER_IP
```

## 2. Initial server hardening

```bash
apt update && apt upgrade -y
apt install -y ufw curl git

# Create a non-root user (optional but recommended)
adduser pdfpro
usermod -aG sudo pdfpro
```

## 3. Install Docker and docker-compose

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

## 4. Deploy Stirling-PDF

```bash
mkdir -p /opt/pdfpro && cd /opt/pdfpro

# Copy docker-compose.yml from this repo, or paste it directly:
cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  stirling-pdf:
    image: frooodle/s-pdf:latest
    ports:
      - "8080:8080"
    environment:
      - DOCKER_ENABLE_SECURITY=false
      - INSTALL_BOOK_AND_ADVANCED_HTML_OPS=false
    volumes:
      - stirling-data:/usr/share/tessdata
    restart: unless-stopped
    mem_limit: 2g

volumes:
  stirling-data:
EOF

docker compose up -d

# Confirm it's running
docker compose ps
curl -s http://localhost:8080 | head -5
```

Stirling-PDF UI should be accessible at `http://YOUR_SERVER_IP:8080`.

## 5. Firewall — UFW rules

Allow only SSH, HTTP, HTTPS, and the Stirling-PDF port.

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Stirling-PDF — restrict to Vercel's IP ranges only
# Get current Vercel outbound IPs from: https://vercel.com/docs/edge-network/regions
# Example (replace with actual Vercel IPs):
ufw allow from 76.76.21.21 to any port 8080
ufw allow from 76.76.21.22 to any port 8080
# Add all Vercel IP ranges here...

# For local dev, also allow your own IP:
# ufw allow from YOUR_HOME_IP to any port 8080

ufw enable
ufw status
```

> **Note:** During development, you can temporarily open 8080 to all:
> `ufw allow 8080/tcp` — **close this before going to production.**

## 6. Temp file cleanup cron

```bash
crontab -e
```

Add this line:
```
*/5 * * * * find /tmp/pdfpro-* -mmin +5 -exec rm -rf {} + 2>/dev/null
```

## 7. Configure environment variables in Vercel

In the Vercel dashboard → your project → Settings → Environment Variables:

```
STIRLING_PDF_URL = http://YOUR_SERVER_IP:8080
```

All other env vars (Supabase, Stripe, Resend) go here too.

## 8. Verify the full stack

```bash
# From your local machine, confirm Stirling-PDF answers:
curl -X GET http://YOUR_SERVER_IP:8080/api/v1/info/status

# Should return: {"status":"UP"}
```

Then deploy the Next.js app to Vercel and test an end-to-end merge.

## 9. Optional: LibreOffice for Word/Excel conversion

If Stirling-PDF's built-in LibreOffice support is insufficient:

```bash
apt install -y libreoffice libreoffice-writer libreoffice-calc
libreoffice --version
```

Stirling-PDF Docker image already ships with LibreOffice — this is only needed if you run conversions outside the container.

## 10. Keeping Stirling-PDF updated

```bash
cd /opt/pdfpro
docker compose pull
docker compose up -d
```
