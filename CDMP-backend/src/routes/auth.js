const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
// Use JWT secret from environment. Do NOT hard-code secrets.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET is not set. Set it in CDMP-backend/.env or environment variables.");
}

// Register
router.post("/register", async (req, res) => {
  const { username, displayName, email, password } = req.body;

  try {
    const existingUser = await db("users").where({ email }).first();
    if (existingUser)
      return res.status(400).json({ success: false, message: "Email already exists" });

    const existingUsername = await db("users").where({ username }).first();
    if (existingUsername)
      return res.status(400).json({ success: false, message: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db("users").insert({ 
      username,
      display_name: displayName,
      email, 
      password: hashedPassword 
    }).returning(['id', 'username', 'display_name', 'email', 'points', 'rank', 'submissions_count']);

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, error: "Server misconfiguration" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ 
      success: true, 
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        points: user.points,
        rank: user.rank,
        submissions: user.submissions_count
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db("users").where({ email }).first();
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    if (!JWT_SECRET) {
      console.error("JWT_SECRET not set - refusing to sign token");
      return res.status(500).json({ success: false, error: "Server misconfiguration" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        avatarUri: user.avatar_uri,
        points: user.points,
        rank: user.rank,
        submissions: user.submissions_count,
        shippingAddress: user.shipping_address,
        // include admin/department info so admin-portal can adapt
        is_admin: !!user.is_admin,
        department: user.department || null,
        is_department_user: !!user.is_department_user
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Get current user profile
router.get("/profile", require("../utils/auth"), async (req, res) => {
  try {
    const user = await db("users").where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Calculate rank by counting users with more points (excluding admins)
    const rank = await db("users")
      .where('points', '>', user.points)
      .where('is_admin', false)
      .count('* as count')
      .first();
    
    const userRank = parseInt(rank.count) + 1;

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        avatarUri: user.avatar_uri,
        points: user.points,
        rank: userRank,
        submissions: user.submissions_count,
        shippingAddress: user.shipping_address
        ,
        is_admin: !!user.is_admin,
        department: user.department || null,
        is_department_user: !!user.is_department_user
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = router;
