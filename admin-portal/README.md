# Government Admin Portal - CDMP

A web-based admin portal for government officials to manage community infrastructure complaints.

## 🚀 Quick Start

### 1. Ensure Backend is Running

```bash
cd CDMP-backend
docker compose up -d
```

Backend must be running at `http://localhost:4000`

### 2. Open Admin Portal

Simply open `index.html` in your web browser:

```bash
# Windows
start admin-portal/index.html

# Mac
open admin-portal/index.html

# Linux
xdg-open admin-portal/index.html
```

Or use a local server:
```bash
cd admin-portal
python -m http.server 8080
# Then visit http://localhost:8080
```

### 3. Login with Admin Credentials

**Test Admin Account:**
- Email: Your registered user email (first user is set as admin)
- Password: Your password

The system checks `is_admin` flag in the users table.

## 📋 Features

### Dashboard
- **Statistics Overview**: Total, Pending, In Progress, Resolved complaints
- **Real-time Data**: Auto-updating complaint counts
- **Filter Options**: By status and department

### Complaint Management
- **View All Complaints**: Paginated list with details
- **Filter & Search**: By status, department
- **Detailed View**: Full complaint information with images
- **User Information**: Submitter details

### Department Assignment
Assign complaints to 20 municipal departments:
- Water Supply and Sewerage
- Roads and Traffic
- Solid Waste Management
- Environment and Garden
- Building and Construction
- Licensing and Health
- Fire Brigade
- Public Works
- Property Tax
- Social Development and Welfare
- Transport and Public Services
- Education
- Urban Planning
- Health and Sanitation
- Parks and Recreation
- Drainage Department
- Electricity and Street Lighting
- Disaster Management
- Encroachment and Illegal Structures
- Animal Control and Veterinary Services

### Status Management with Points
Update complaint status and automatically award points to users:
- **Assigned**: 10 points
- **In Progress**: 25 points
- **Resolved**: 50 points
- **Completed**: 100 points

### Notifications
- Automatic notifications sent to users when:
  - Department is assigned
  - Status is updated
  - Points are awarded

## 🔧 API Endpoints

All admin endpoints require authentication with `is_admin = true`.

### Dashboard Statistics
```
GET /admin/dashboard/stats
```
Returns total complaints, pending, in-progress, resolved counts, and breakdown by department/status.

### Get All Complaints
```
GET /admin/complaints?status=submitted&department=Roads
```
Query Parameters:
- `status` (optional): Filter by status
- `department` (optional): Filter by department
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### Get Single Complaint
```
GET /admin/complaints/:id
```
Returns detailed complaint information including user details and full status history.

### Assign Department
```
PATCH /admin/complaints/:id/assign-department
Body: { "department": "Roads and Traffic" }
```
Assigns complaint to a department and updates status to "assigned".

### Update Status
```
PATCH /admin/complaints/:id/update-status
Body: { 
  "status": "in-progress",
  "department": "Roads and Traffic" 
}
```
Updates complaint status and awards points to user based on new status.

## 🛠️ Configuration

### Change API URL

Edit `index.html` and update:
```javascript
const API_BASE_URL = 'http://localhost:4000';
```

For production, change to your production API URL.

### Create Admin Users

Admin access is controlled by `is_admin` flag in the database:

```sql
-- Set user as admin
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';

-- Remove admin access
UPDATE users SET is_admin = false WHERE email = 'user@example.com';
```

Or via Docker:
```bash
docker compose exec postgres psql -U devuser -d community_monitor \
  -c "UPDATE users SET is_admin = true WHERE email = 'admin@example.com';"
```

## 🎨 User Interface

### Login Screen
- Email and password authentication
- Admin role verification
- Error handling

### Dashboard
- 4 statistics cards (Total, Pending, In Progress, Resolved)
- Filter controls for status and department
- Responsive table with all complaints
- Real-time data updates

### Complaint Modal
- Full-screen image view
- Complete complaint details
- User information
- Status history timeline
- Department assignment dropdown
- Status update buttons with point values
- Visual feedback for current status

## 📱 Workflow Example

1. **User submits complaint** via mobile app
   - Status: "submitted"
   - Points: 0

2. **Admin reviews complaint**
   - Views details in admin portal
   - Reads description, location, sees photo

3. **Admin assigns to department**
   - Selects appropriate department (e.g., "Roads and Traffic")
   - Status automatically becomes "assigned"
   - User gets notification
   - User receives 10 points

4. **Department starts work**
   - Admin clicks "Mark as In Progress"
   - Status: "in-progress"
   - User receives 25 points total
   - User gets notification

5. **Work completed**
   - Admin clicks "Mark as Resolved"
   - Status: "resolved"
   - User receives 50 points total
   - User gets notification

6. **Final verification**
   - Admin clicks "Mark as Completed"
   - Status: "completed"
   - User receives 100 points total
   - User sees progress in mobile app

## 🔐 Security

- JWT token-based authentication
- Admin role verification on every request
- Tokens stored in localStorage
- Automatic logout on authentication failure
- CORS configured for security

## 📊 Data Flow

```
Mobile App (User) → Submit Complaint
                     ↓
              Backend API (PostgreSQL)
                     ↓
Admin Portal (Government) → Review & Assign
                     ↓
              Update Status & Award Points
                     ↓
Mobile App (User) ← Notifications & Points Update
```

## 🚀 Production Deployment

### 1. Host the Portal

Option A: Static hosting (GitHub Pages, Netlify, Vercel)
- Simply upload `index.html`
- Update API_BASE_URL to production API

Option B: Include in backend
```javascript
// In your Express app
app.use('/admin', express.static('admin-portal'));
```

### 2. Update API URL
```javascript
const API_BASE_URL = 'https://your-api-domain.com';
```

### 3. Enable HTTPS
Ensure your backend API has SSL certificate for secure admin access.

### 4. Access Control
- Use strong passwords for admin accounts
- Regularly audit admin user list
- Implement IP whitelisting if needed
- Consider adding 2FA for admin accounts

## 📝 Notes

- Admin portal is a Single Page Application (SPA)
- No build process needed - just open HTML file
- Works with modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design for desktop and tablet
- Mobile-friendly but optimized for desktop use

## 🆘 Troubleshooting

### "Failed to fetch" error
- Check if backend is running: `docker compose ps`
- Verify API URL in `index.html`
- Check CORS settings in backend

### "Access denied. Admin only" error
- Verify user has `is_admin = true` in database
- Check JWT token is valid
- Try logging out and logging in again

### Department not saving
- Ensure backend has restarted after adding admin routes
- Check browser console for errors
- Verify request payload in Network tab

## 📞 Support

For issues:
1. Check backend logs: `docker compose logs backend`
2. Check browser console (F12)
3. Verify database state: `docker compose exec postgres psql -U devuser -d community_monitor`

---

**Built for efficient government complaint management** 🏛️
