# Deployment Guide for traintally.com

## Option 1: Cloudflare Pages (Recommended)

### Step 1: Prepare Your Repository
1. Push your code to a GitHub repository
2. Ensure all files are committed and pushed

### Step 2: Set Up Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to "Pages" in the sidebar
3. Click "Create a project"
4. Choose "Connect to Git"
5. Select your GitHub repository

### Step 3: Configure Build Settings
- **Framework preset**: None
- **Build command**: `npm run build`
- **Build output directory**: `public`
- **Root directory**: `/` (leave empty)

### Step 4: Environment Variables
Add these environment variables in Cloudflare Pages:
- `NODE_VERSION`: `18` (or your preferred version)

### Step 5: Deploy
1. Click "Save and Deploy"
2. Wait for the build to complete
3. Your site will be available at a `.pages.dev` URL

### Step 6: Connect Custom Domain
1. In your Pages project, go to "Custom domains"
2. Click "Set up a custom domain"
3. Enter `traintally.com`
4. Follow the DNS configuration instructions

## Option 2: Cloudflare Workers (Alternative)

### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare
```bash
wrangler login
```

### Step 3: Get Your Zone ID
1. Go to Cloudflare Dashboard
2. Select your domain (traintally.com)
3. Copy the Zone ID from the right sidebar

### Step 4: Update Configuration
1. Edit `wrangler.toml`
2. Replace `your-zone-id-here` with your actual Zone ID

### Step 5: Deploy
```bash
wrangler deploy --env production
```

## Option 3: Traditional Hosting (VPS/Server)

### Step 1: Set Up Server
1. Get a VPS (DigitalOcean, Linode, AWS, etc.)
2. Install Node.js 18+ and npm
3. Set up nginx as reverse proxy

### Step 2: Deploy Application
```bash
# Clone your repository
git clone <your-repo-url>
cd tally-train

# Install dependencies
npm install

# Set up PM2 for process management
npm install -g pm2

# Start the application
pm2 start index.js --name "tally-train"
pm2 startup
pm2 save
```

### Step 3: Configure Nginx
Create `/etc/nginx/sites-available/traintally.com`:
```nginx
server {
    listen 80;
    server_name traintally.com www.traintally.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 4: Enable Site and SSL
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/traintally.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Set up SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d traintally.com -d www.traintally.com
```

## DNS Configuration

### For Cloudflare Pages/Workers:
1. Go to Cloudflare DNS settings for traintally.com
2. Add these records:
   - Type: `A`, Name: `@`, Value: `192.0.2.1` (dummy IP)
   - Type: `CNAME`, Name: `www`, Value: `traintally.com`

### For Traditional Hosting:
1. Point your domain to your server's IP address
2. Add A records for both `@` and `www`

## Environment Variables

Create a `.env` file for production:
```env
NODE_ENV=production
PORT=3000
```

## Monitoring and Maintenance

### For PM2 (Traditional Hosting):
```bash
# Monitor logs
pm2 logs tally-train

# Restart application
pm2 restart tally-train

# Monitor resources
pm2 monit
```

### For Cloudflare:
- Monitor through Cloudflare Dashboard
- Set up alerts for errors
- Use Cloudflare Analytics

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Environment Variables**: Don't commit sensitive data
3. **Rate Limiting**: Consider adding rate limiting for Socket.IO
4. **CORS**: Ensure CORS is properly configured
5. **Input Validation**: Validate all user inputs

## Troubleshooting

### Common Issues:
1. **Socket.IO not working**: Check CORS settings and proxy configuration
2. **Domain not loading**: Verify DNS settings and SSL certificate
3. **Build failures**: Check Node.js version and dependencies
4. **Performance issues**: Monitor server resources and optimize as needed

### Logs:
- Check application logs for errors
- Monitor server resources (CPU, memory, disk)
- Review Cloudflare analytics for traffic patterns 