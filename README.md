# Community-Driven Infrastructure Management Platform 🏗️

A full-stack mobile application for reporting and managing community infrastructure issues. Built with React Native, Express.js, and PostgreSQL. Earn points, climb leaderboards, and redeem rewards for making your community better!

## 🏗️ Architecture

### Frontend (React Native)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS)
- **Navigation**: Expo Router
- **State Management**: React Hooks
- **API Integration**: Fetch API with JWT authentication

### Backend (Node.js)
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL 15
- **ORM**: Knex.js 3.1.0
- **Authentication**: JWT + bcrypt
- **Containerization**: Docker & Docker Compose
- **API Style**: RESTful

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Docker Desktop (for backend)
- Expo Go app (for mobile testing)

### 1. Start Backend

```bash
# Navigate to backend directory
cd CDMP-backend

# Copy environment template
cp .env.example .env

# Start PostgreSQL and backend with Docker
docker compose up -d

# Run migrations
cd src
npx knex migrate:latest

# (Optional) Seed database with test data
npx knex seed:run
```

Backend will be available at `http://localhost:4000`

### 2. Start Frontend

```bash
# Navigate to frontend directory (root)
cd CDMP

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npx expo start

# Then press:
# - 'a' for Android
# - 'i' for iOS
# - 'w' for web
# - Scan QR code with Expo Go app
```

## ✨ Features

### 🏠 **Dashboard**
- Real-time points, rank, and submission count
- Track submission progress with visual timelines
- Recent notifications from backend
- User profile with avatar

### 📸 **Submit Reports**
- Upload photos (camera or gallery)
- AI-powered categorization
- Real-time status tracking
- User-specific submission history
- Automatic points allocation

### 🏆 **Leaderboard**
- Live rankings from database
- Top 3 podium display
- See your position highlighted
- Real-time point updates

### 🎁 **Redeem Rewards**
- Browse prizes from catalog
- Exchange points for rewards
- Category filtering
- Availability status

### 👤 **Profile & Settings**
- JWT-based authentication
- Secure login/signup
- View achievements and stats
- Logout functionality
- Edit profile information

## 🗄️ Backend API

### Authentication Endpoints
```
POST   /auth/register      - Create new user account
POST   /auth/login         - Login with email/password
GET    /auth/profile       - Get current user profile (protected)
```

### Complaints/Submissions Endpoints
```
GET    /complaints         - Get all complaints (optional userId filter)
GET    /complaints/:id     - Get single complaint by ID
POST   /complaints         - Create new complaint (protected)
```

### Leaderboard & Rewards
```
GET    /api/leaderboard    - Get user rankings
GET    /api/prizes         - Get available prizes
GET    /api/notifications  - Get user notifications (protected)
```

### Database Schema

**Users Table**
- id, username, display_name, email, password (hashed)
- points, rank, submissions_count
- avatar_uri, shipping_address

**Complaints Table**
- id, user_id, title, description, category
- image_uri, status, location, points
- ai_categorized, submitted_date, department

**Status History Table**
- id, complaint_id, status, date, department

**Prizes Table**
- id, title, description, image_uri
- point_cost, category, available

**Notifications Table**
- id, user_id, title, message, type
- date, complaint_id, read

## 🔐 Security Features

- **Password Security**: bcrypt hashing with 10 rounds
- **JWT Authentication**: 7-day token expiration
- **Environment Variables**: All secrets in `.env` (gitignored)
- **Protected Routes**: Middleware-based authentication
- **SQL Injection Prevention**: Knex.js query builder
- **CORS Enabled**: Cross-origin requests configured

## 📊 Tech Stack Details

### Frontend
- **React Native**: Cross-platform mobile framework
- **Expo SDK 54**: Development and build tools
- **TypeScript**: Type-safe development
- **NativeWind**: Tailwind CSS for React Native
- **Expo Router**: File-based navigation
- **AsyncStorage**: Token persistence
- **Ionicons**: Icon library

### Backend
- **Express.js**: Web application framework
- **PostgreSQL**: Relational database
- **Knex.js**: SQL query builder and migrations
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT authentication
- **CORS**: Cross-origin resource sharing
- **Docker**: Containerization

### DevOps
- **Docker Compose**: Multi-container orchestration
- **pgAdmin**: Database management UI
- **Nodemon**: Auto-restart on changes
- **Git**: Version control

## 📚 Documentation

- **Deployment Guide**: `DEPLOYMENT_GUIDE.md` - Configuration and deployment instructions
- **Security Checklist**: `SECURITY_CHECKLIST.md` - Pre-deployment security review
- **Quick Start**: `QUICK_START.md` - Immediate next steps
- **Full Documentation**: `APP_DOCUMENTATION.md` - Complete feature details

## 🎨 Project Structure

```
CDMP/
├── app/                        # React Native screens
│   ├── (tabs)/                 # Tab navigation screens
│   │   ├── index.tsx          # Home/Dashboard
│   │   ├── submissions.tsx    # Submit & view complaints
│   │   ├── leaderboard.tsx    # Rankings
│   │   ├── rewards.tsx        # Prize catalog
│   │   └── profile.tsx        # User profile
│   ├── auth.tsx               # Login/Signup
│   └── _layout.tsx            # Root layout
├── components/                 # Reusable components
│   ├── ui/                    # UI primitives
│   ├── NotificationCard.tsx
│   ├── StatusTimeline.tsx
│   └── ...
├── lib/                       # Utilities
│   ├── api.ts                # API service layer
│   ├── types.ts              # TypeScript interfaces
│   └── theme.ts              # Theme configuration
└── CDMP-backend/              # Backend server
    ├── src/
    │   ├── routes/           # API endpoints
    │   │   ├── auth.js      # Authentication routes
    │   │   └── complaints.js # Complaint CRUD + extras
    │   ├── migrations/       # Database migrations
    │   ├── seeds/           # Test data
    │   ├── utils/           # Middleware & helpers
    │   ├── db.js            # Database connection
    │   └── index.js         # Express server
    ├── docker-compose.yml    # Docker configuration
    ├── Dockerfile
    └── .env                 # Environment variables (gitignored)
```

## 📱 Screens

1. **Home/Dashboard** - Points, rank, submission tracking
2. **Submissions** - Upload and manage reports
3. **Leaderboard** - View national rankings
4. **Rewards** - Redeem prizes
5. **Profile** - Account settings and achievements

## 🎯 Current Status

✅ Full-stack application complete
✅ PostgreSQL database integrated  
✅ JWT authentication implemented
✅ User-specific submissions tracking
✅ Real-time leaderboard system
✅ Docker containerization ready
✅ RESTful API with 8+ endpoints
✅ All screens connected to backend
✅ Dark mode supported  
✅ Security measures in place
✅ Ready for deployment!  

## 🧪 Testing

### Backend Testing
```bash
# Test authentication
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test leaderboard
curl http://localhost:4000/api/leaderboard
```

### Frontend Testing
1. Create a new account via signup
2. Submit a complaint with photo
3. View submission in "Submissions" tab
4. Check updated stats on home page
5. View leaderboard rankings
6. Browse rewards catalog

### Database Management
```bash
# View all users
docker compose exec postgres psql -U devuser -d community_monitor \
  -c "SELECT id, username, points, submissions_count FROM users;"

# View all complaints
docker compose exec postgres psql -U devuser -d community_monitor \
  -c "SELECT id, title, status, user_id FROM complaints;"

# Reset database (development only)
docker compose exec postgres psql -U devuser -d community_monitor \
  -c "DELETE FROM notifications; DELETE FROM status_history; DELETE FROM complaints; DELETE FROM users;"
```

## ⚙️ Configuration

### For Physical Device Testing

1. **Find your IP address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Update API URL** in `lib/api.ts`:
   ```typescript
   const API_BASE_URL = 'http://YOUR_IP:4000';
   ```

3. **Restart Expo:**
   ```bash
   npx expo start -c
   ```

### Environment Variables

Backend `.env` file (already configured):
```env
# Database
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpass
POSTGRES_DB=community_monitor

# JWT
JWT_SECRET=your_secret_key

# Server
DB_HOST=localhost
DB_PORT=5432
```

## 🚀 Deployment

See `DEPLOYMENT_GUIDE.md` for complete deployment instructions including:
- Production environment setup
- SSL/HTTPS configuration
- Database migration
- Mobile app building
- Security best practices

## 🏃‍♂️ Development Workflow

1. **Start Backend** (Docker containers)
   ```bash
   cd CDMP-backend
   docker compose up -d
   ```

2. **Start Frontend** (Expo dev server)
   ```bash
   cd CDMP
   npx expo start
   ```

3. **Make Changes**
   - Frontend: Files auto-reload
   - Backend: Nodemon auto-restarts

4. **Test on Device**
   - Scan QR code with Expo Go
   - Or use emulator/simulator

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "Your message"
   git push
   ```

## 📖 Learn More

### Technologies Used
- [Expo Documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [NativeWind](https://www.nativewind.dev/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Knex.js](http://knexjs.org/)
- [Docker](https://www.docker.com/)

### Project Documentation
- `DEPLOYMENT_GUIDE.md` - Setup and deployment
- `SECURITY_CHECKLIST.md` - Security review
- `API_TESTING_GUIDE.md` - API endpoint testing
- `APP_DOCUMENTATION.md` - Feature documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is built for educational purposes.

## 🙏 Acknowledgments

- Expo team for the amazing framework
- NativeWind for Tailwind CSS integration
- PostgreSQL community for robust database
- Docker for containerization

---

**Built with ❤️ for better communities**

## 📞 Support

For issues or questions:
- Check documentation in `/docs` folder
- Review `SECURITY_CHECKLIST.md` for security concerns
- See `DEPLOYMENT_GUIDE.md` for deployment help
- Open an issue on GitHub

### Quick Links
- 📱 Frontend: React Native + Expo
- 🔧 Backend: Express.js + PostgreSQL
- 🐳 Docker: Full containerization
- 🔐 Security: JWT + bcrypt
- 📊 Database: 5 tables, full schema

