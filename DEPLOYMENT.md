# Deployment Guide for Positive Energy Remix App

## Render Deployment Configuration

### Environment Variables for Render

Set these environment variables in your Render dashboard:

```
DATABASE_URL=postgresql://positive_nrg_user:McXmTUP4JfY8E42NHPcq1DofimcxYQVA@dpg-d3od0gripnbc73ft5cgg-a.frankfurt-postgres.render.com/positive_nrg
ADMIN_EMAIL=admin@positivenrg.com
ADMIN_PASSWORD=SecurePassword123!
JWT_SECRET=super-secret-jwt-key-change-this-in-production
GEMINI_API_KEY=AIzaSyA1883Y6gFZrwLPpfAQdeHFtWvIo6y2svw
GEMINI_MODEL=gemini-2.5-flash
NODE_ENV=production
PORT=10000
```

### Build Configuration

**Build Command:**
```bash
pnpm install && pnpm db:generate && pnpm build
```

**Start Command:**
```bash
pnpm start
```

**Root Directory:**
Leave empty (uses project root)

### Render Service Settings

- **Instance Type:** Starter (0.5 CPU, 512 MB)
- **Region:** Frankfurt (EU Central)
- **Auto-Deploy:** On Commit
- **Branch:** main

### Database Setup

The app uses the existing PostgreSQL database:
- **Host:** dpg-d3od0gripnbc73ft5cgg-a.frankfurt-postgres.render.com
- **Database:** positive_nrg
- **User:** positive_nrg_user

### Pre-Deploy Steps

1. Ensure all environment variables are set
2. Database schema is automatically applied via Prisma
3. Seed data is created during first deployment

### Post-Deploy Verification

1. Visit your deployed URL
2. Test the `/test` route to verify database connection
3. Create a user account
4. Test chat functionality with companions

### Troubleshooting

**Common Issues:**

1. **Build Failures:**
   - Check that all environment variables are set
   - Verify Node.js version (18+)
   - Ensure pnpm is available

2. **Database Connection Issues:**
   - Verify DATABASE_URL is correct
   - Check database credentials
   - Ensure database is accessible from Render

3. **AI Integration Issues:**
   - Verify GEMINI_API_KEY is set correctly
   - Check API key permissions
   - Test with a simple request

### Performance Optimization

- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies
- Monitor database query performance

### Security Considerations

- Use strong JWT secrets in production
- Implement rate limiting
- Add CORS configuration
- Use HTTPS only
- Regular security updates

### Monitoring

- Set up logging for errors
- Monitor database performance
- Track API usage
- Monitor user engagement metrics

## Local Development

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Set up database
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in UI mode
pnpm test:ui
```

## Database Management

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes
pnpm db:push

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```
