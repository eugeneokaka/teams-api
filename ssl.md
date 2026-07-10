# Deploying a NestJS API with HTTPS on AWS EC2 Using Nginx and Certbot

This guide documents the process of configuring HTTPS for a NestJS application hosted on an AWS EC2 Ubuntu instance using:

- AWS EC2
- Ubuntu
- Nginx
- Let's Encrypt
- Certbot
- Namecheap DNS
- aws elastic ip

---

# Architecture

```
Internet
    │
https://teamapi.eugenecode.xyz
    │
    ▼
Nginx (Ports 80 & 443)
    │
    ▼
http://localhost:3000
    │
    ▼
NestJS Application
```

Nginx is responsible for:

- Receiving HTTP/HTTPS traffic
- Handling SSL/TLS certificates
- Forwarding requests to the NestJS application running on port 3000

---

# Prerequisites

Before configuring HTTPS, ensure you have:

- An EC2 Ubuntu instance
- Node.js installed
- Git installed
- Your NestJS application cloned
- Dependencies installed (`npm install`)
- Environment variables configured
- Your application running locally on port 3000
- ip from elasitc ip
  
Example:

```bash
npm run build
npm run start:prod
```

---

# Step 1 - Create a Subdomain

In Namecheap:

Domain List

→ Manage

→ Advanced DNS

Add an **A Record**.

Example:

| Type | Host | Value |
|------|------|-------|
| A Record | teamapi | Your EC2 Elastic IP |

After a few minutes verify DNS:

```bash
nslookup teamapi.eugenecode.xyz
```

You should receive your EC2 public IP.

---

# Step 2 - Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

Start Nginx:

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

Verify:

```bash
sudo systemctl status nginx
```

---

# Step 3 - Configure Nginx

Create a configuration file.

```bash
sudo nano /etc/nginx/sites-available/teamapi
```

Paste:

```nginx
server {
    listen 80;
    server_name teamapi.eugenecode.xyz;

    location / {
        proxy_pass http://localhost:3000;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and exit.

---

# Step 4 - Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/teamapi /etc/nginx/sites-enabled/
```

Disable the default site if necessary:

```bash
sudo rm /etc/nginx/sites-enabled/default
```

---

# Step 5 - Test the Configuration

```bash
sudo nginx -t
```

Expected output:

```
syntax is ok
test is successful
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

---

# Step 6 - Verify the API

Test locally:

```bash
curl http://localhost:3000
```

If your application uses authentication, you may receive:

```json
{
  "code": "UNAUTHORIZED",
  "message": "Unauthorized"
}
```

This is actually a good sign—it means the application is running.

Now test through Nginx:

```
http://teamapi.eugenecode.xyz
```

If the request reaches your NestJS application, everything is configured correctly.

---

# Step 7 - Install Certbot

```bash
sudo apt update

sudo apt install certbot python3-certbot-nginx -y
```

---

# Step 8 - Request an SSL Certificate

Run:

```bash
sudo certbot --nginx -d teamapi.eugenecode.xyz
```

During setup:

- Enter your email
- Accept the Terms of Service
- Allow Certbot to redirect HTTP to HTTPS

Example output:

```
Successfully received certificate.

Successfully deployed certificate.

Congratulations!
You have successfully enabled HTTPS on
https://teamapi.eugenecode.xyz
```

---

# Step 9 - Verify HTTPS

Visit:

```
https://teamapi.eugenecode.xyz
```

If your API requires authentication, receiving an Unauthorized response is normal.

The important thing is that the browser shows a secure connection.

---

# Why HTTPS Works on the Domain but Not the IP

This is expected.

The SSL certificate is issued for:

```
teamapi.eugenecode.xyz
```

NOT

```
16.xxx.xxx.xxx
```

When visiting the server by IP address, browsers display a certificate warning because the certificate does not match the IP.

Always access your API using the domain.

Correct:

```
https://teamapi.eugenecode.xyz
```

Incorrect:

```
https://16.xxx.xxx.xxx
```

---

# Security Group Configuration

Recommended inbound rules:

| Port | Purpose |
|------|---------|
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS |

Remove port **3000** from the Security Group after Nginx is working.

Only Nginx should be publicly accessible.

---

# Automatic Certificate Renewal

Certbot automatically installs a renewal timer.

Verify:

```bash
systemctl list-timers
```

Test renewal:

```bash
sudo certbot renew --dry-run
```

---

# Production Architecture

```
Internet
      │
      ▼
https://teamapi.eugenecode.xyz
      │
      ▼
Nginx
(80 / 443)
      │
      ▼
localhost:3000
      │
      ▼
NestJS API
      │
      ▼
Database
```

---

# Next Steps

- Install PM2
- Run NestJS with PM2
- Configure PM2 to start on boot
- Deploy the frontend to Vercel
- Configure CORS
- Point the frontend to:

```
https://teamapi.eugenecode.xyz
```

Your production deployment is now secure and ready for use.