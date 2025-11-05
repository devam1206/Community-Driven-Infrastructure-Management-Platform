# 🚀 Deployment & Configuration Guide

## Quick Configuration

### For Local Development (Emulator)
1. Keep `lib/api.ts` as is:
   ```typescript
   const API_BASE_URL = 'http://localhost:4000';
   ```

2. Start backend:
   ```bash
   cd CDMP-backend
   docker compose up -d
   ```

3. Start frontend:
   ```bash
   cd CDMP
   npx expo start
   ```

### For Physical Device Testing

1. **Find your computer's IP address:**
   - Windows: `ipconfig` → Look for IPv4 Address
   - Mac/Linux: `ifconfig` → Look for inet address

2. **Update API URL** in `lib/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://YOUR_IP_HERE:4000';
   // Example: 'http://192.168.1.100:4000'
   ```

3. **Ensure backend listens on all interfaces** (already configured):
   - Check `CDMP-backend/src/index.js` has: `server.listen(PORT, '0.0.0.0')`

4. **Test on your phone:**
   - Open Expo Go app
   - Scan QR code from `npx expo start`

## Environment Setup

### Backend Configuration

1. **Copy the environment template:**
   ```bash
   cd CDMP-backend
   cp .env.example .env
   ```

2. **Update `.env` with your values:**
   ```properties
   # Development values (current)
   POSTGRES_USER=devuser
   POSTGRES_PASSWORD=devpass
   JWT_SECRET=dev_super_secret_change_me
   
   # Production values (when deploying)
   POSTGRES_USER=your_prod_user
   POSTGRES_PASSWORD=generate_strong_password_here
   JWT_SECRET=generate_long_random_secret_here
   ```

3. **Generate secure production secrets:**
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

## Database Management

### Reset Database (Development Only)
```bash
cd CDMP-backend
docker compose exec postgres psql -U devuser -d community_monitor -c "DELETE FROM notifications; DELETE FROM status_history; DELETE FROM complaints; DELETE FROM users;"
```

### Run Migrations
```bash
cd CDMP-backend/src
npx knex migrate:latest
```

### Seed Database with Test Data
```bash
cd CDMP-backend/src
npx knex seed:run
```

### Update Submission Counts
```bash
docker compose exec postgres psql -U devuser -d community_monitor -c "UPDATE users SET submissions_count = (SELECT COUNT(*) FROM complaints WHERE complaints.user_id = users.id);"
```

## Production Deployment

### Prerequisites
- Node.js backend server (VPS, AWS EC2, Heroku, etc.)
- PostgreSQL database
- Domain with SSL certificate

### Steps:

1. **Update Environment Variables**
   - Set `NODE_ENV=production`
   - Use production database credentials
   - Generate new JWT secret

2. **Update API URL**
   - Change `API_BASE_URL` in `lib/api.ts` to production URL
   - Use HTTPS: `https://api.yourdomain.com`

3. **Build Frontend**
   ```bash
   npx expo build:android  # or build:ios
   ```

4. **Deploy Backend**
   ```bash
   cd CDMP-backend
   npm install --production
   npm start
   ```

5. **Database Migration**
   ```bash
   npx knex migrate:latest --env production
   ```

## Security Notes

⚠️ **Never commit these files:**
- `.env` (contains real credentials)
- `node_modules/`
- Build artifacts

✅ **Safe to commit:**
- `.env.example` (template only)
- Source code
- Documentation

📖 See `SECURITY_CHECKLIST.md` for full security review.

## Troubleshooting

### Backend not accessible from phone
1. Check firewall allows port 4000
2. Verify IP address is correct
3. Ensure phone and computer are on same network
4. Backend must listen on `0.0.0.0`, not `localhost`

### Database connection fails
1. Check Docker is running: `docker compose ps`
2. Verify credentials in `.env` match `docker-compose.yml`
3. Check port 5432 is available

### Authentication errors
1. Ensure JWT_SECRET is set in `.env`
2. Check token expiration (7 days)
3. Clear app storage and re-login

## Support

For issues or questions:
1. Check `SECURITY_CHECKLIST.md`
2. Review `API_TESTING_GUIDE.md`
3. See `INTEGRATION_SUMMARY.md`
