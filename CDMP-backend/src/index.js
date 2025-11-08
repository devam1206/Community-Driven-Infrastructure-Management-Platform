// Load environment variables from .env (if present)
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const adminRoutes = require("./routes/admin");
const testDBConnection = require("./test");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
// Increase body size limit to 50MB for image uploads (base64 images are larger)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/complaints", complaintRoutes);
app.use("/admin", adminRoutes);

// Additional routes for leaderboard, prizes, notifications
app.get("/api/leaderboard", async (req, res) => {
  try {
    const users = await require("./db")("users")
      .select('id', 'username', 'display_name', 'avatar_uri', 'points', 'submissions_count')
      .where('is_admin', false) // Exclude admin users from leaderboard
      .andWhere('is_department_user', false) // Exclude department accounts from leaderboard
      .orderBy('points', 'desc')
      .limit(50);

    // Assign ranks based on order
    const leaderboard = users.map((user, index) => ({
      id: user.id.toString(),
      username: user.username,
      displayName: user.display_name,
      avatarUri: user.avatar_uri,
      points: user.points,
      rank: index + 1, // Rank is position in sorted list
      submissions: user.submissions_count
    }));

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ success: false, error: "Failed to fetch leaderboard" });
  }
});

app.get("/api/prizes", async (req, res) => {
  try {
    const prizes = await require("./db")("prizes")
      .where({ available: true })
      .orderBy('point_cost', 'asc');

    const result = prizes.map(prize => ({
      id: prize.id.toString(),
      title: prize.title,
      description: prize.description,
      imageUri: prize.image_uri,
      pointCost: prize.point_cost,
      category: prize.category,
      available: prize.available
    }));

    res.json({ success: true, prizes: result });
  } catch (error) {
    console.error("Error fetching prizes:", error);
    res.status(500).json({ success: false, error: "Failed to fetch prizes" });
  }
});

app.get("/api/notifications", require("./utils/auth"), async (req, res) => {
  try {
    const notifications = await require("./db")("notifications")
      .where({ user_id: req.user.id })
      .orderBy('date', 'desc')
      .limit(20);

    const result = notifications.map(notif => ({
      id: notif.id.toString(),
      title: notif.title,
      message: notif.message,
      date: notif.date,
      type: notif.type,
      submissionId: notif.complaint_id ? notif.complaint_id.toString() : undefined,
      read: notif.read
    }));

    res.json({ success: true, notifications: result });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});

testDBConnection();

// WebSockets for real-time updates
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(4000, '0.0.0.0', () => console.log("Backend running on port 4000 - accessible from network"));
