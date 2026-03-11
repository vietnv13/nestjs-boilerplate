# Nginx Setup

This folder contains a ready-to-use Nginx reverse proxy config for:

- API (NestJS) on `127.0.0.1:3000`
- Web (Next.js) on `127.0.0.1:8000`

## Install & Enable (Ubuntu)

1. Install Nginx:

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

2. Copy config and update domain:

```bash
sudo cp deploy/nginx/nestjs-boilerplate.conf /etc/nginx/sites-available/nestjs-boilerplate.conf
sudo sed -i 's/example.com/your-domain.com/g' /etc/nginx/sites-available/nestjs-boilerplate.conf
```

3. Enable site:

```bash
sudo ln -sf /etc/nginx/sites-available/nestjs-boilerplate.conf /etc/nginx/sites-enabled/nestjs-boilerplate.conf
sudo nginx -t
sudo systemctl reload nginx
```

## TLS (Recommended)

Use Certbot (Let’s Encrypt) to enable HTTPS, for example:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```
