# Deployment Guide for traintally.com

## Option 1: Cloudflare Pages (Now Recommended!)

### Step 1: Prepare Your Repository
1. ✅ **Repository Ready**: Your code is already pushed to [https://github.com/gauchogel/traintally.git](https://github.com/gauchogel/traintally.git)
2. ✅ **Files Committed**: All files are committed and pushed to the main branch

### Step 2: Set Up Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to "Pages" in the sidebar
3. Click "Create a project"
4. Choose "Connect to Git"
5. Select your repository: `gauchogel/traintally`

### Step 3: Configure Build Settings
- **Framework preset**: None
- **Build command**: `npm run build`
- **Build output directory**: `public`
- **Root directory**: `/` (leave empty)

### Step 4: Environment Variables
Add this environment variable:
- `NODE_VERSION`: `18`

### Step 5: Deploy
1. Click "Save and Deploy"
2. Wait for the build to complete
3. Your site will be available at a `.pages.dev` URL

### Step 6: Connect Custom Domain
1. In your Pages project, go to "Custom domains"
2. Click "Set up a custom domain"
3. Enter `traintally.com`
4. Follow the DNS configuration instructions

## Option 2: Traditional Hosting (VPS/Server)

### Step 1: Set Up VPS/Server
1. Get a VPS (DigitalOcean, Linode, AWS, etc.)
2. Install Node.js 18+ and npm
3. Set up nginx as reverse proxy

### Step 2: Deploy Application
```bash
# Clone your repository
git clone https://github.com/gauchogel/traintally.git
cd traintally

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

## Option 2: Railway/Render/Heroku (Platform as a Service)

### Step 1: Connect Repository
1. Go to [Railway](https://railway.app) or [Render](https://render.com)
2. Connect your GitHub repository: `gauchogel/traintally`
3. Set build command: `npm install`
4. Set start command: `npm start`

### Step 2: Environment Variables
Add these environment variables:
- `NODE_ENV`: `production`
- `PORT`: `3000`

### Step 3: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your app will be available at the provided URL

### Step 4: Connect Custom Domain
1. Add your custom domain: `traintally.com`
2. Update DNS settings as instructed

## Option 3: Cloudflare Workers (Advanced)

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

### Step 4: Create wrangler.toml
Create a new `wrangler.toml` file:
```toml
name = "tally-train"
main = "index.js"
compatibility_date = "2024-01-01"

[env.production]
name = "tally-train"
route = "traintally.com/*"
zone_id = "your-zone-id-here"
```

### Step 5: Deploy
```bash
wrangler deploy --env production
```

## Option 4: Cloudflare Pages (Static Only - Limited Functionality)

**⚠️ Note**: This option will NOT work for your real-time Socket.IO application. Only use if you want to serve static files only.

### Step 1: Set Up Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to "Pages" in the sidebar
3. Click "Create a project"
4. Choose "Connect to Git"
5. Select your repository: `gauchogel/traintally`

### Step 2: Configure Build Settings
- **Framework preset**: None
- **Build command**: `npm run build`
- **Build output directory**: `public`
- **Root directory**: `/` (leave empty)

### Step 3: Environment Variables
Add this environment variable:
- `NODE_VERSION`: `18`

### Step 4: Deploy
1. Click "Save and Deploy"
2. Wait for the build to complete
3. Your site will be available at a `.pages.dev` URL

### Step 5: Connect Custom Domain
1. In your Pages project, go to "Custom domains"
2. Click "Set up a custom domain"
3. Enter `traintally.com`
4. Follow the DNS configuration instructions

## DNS Configuration

### For Traditional Hosting:
1. Point your domain to your server's IP address
2. Add A records for both `@` and `www`

### For Platform as a Service:
1. Follow the platform's DNS configuration instructions
2. Usually involves adding CNAME records

### For Cloudflare Workers:
1. Go to Cloudflare DNS settings for traintally.com
2. Add these records:
   - Type: `A`, Name: `@`, Value: `192.0.2.1` (dummy IP)
   - Type: `CNAME`, Name: `www`, Value: `traintally.com`

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

### For Platform as a Service:
- Monitor through the platform's dashboard
- Set up alerts for errors
- Use platform analytics

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
- Review platform analytics for traffic patterns 