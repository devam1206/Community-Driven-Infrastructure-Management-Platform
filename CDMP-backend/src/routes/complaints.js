const express = require("express");
const router = express.Router();
const authMiddleware = require("../utils/auth");
const db = require("../db");
const { uploadBase64Image } = require("../utils/cloudinary");

// Get all complaints (with optional user filter)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.query;
    
    let query = db("complaints")
      .select(
        'complaints.*',
        'users.username',
        'users.display_name as user_display_name',
        'users.avatar_uri as user_avatar_uri'
      )
      .leftJoin('users', 'complaints.user_id', 'users.id')
      .orderBy('complaints.created_at', 'desc');

    if (userId) {
      query = query.where('complaints.user_id', userId);
    }

    const complaints = await query;

    // Get status history for each complaint
    const complaintsWithHistory = await Promise.all(
      complaints.map(async (complaint) => {
        const statusHistory = await db("status_history")
          .where({ complaint_id: complaint.id })
          .orderBy('date', 'asc');

        return {
          id: complaint.id.toString(),
          imageUri: complaint.image_uri,
          description: complaint.description,
          title: complaint.title,
          category: complaint.category,
          status: complaint.status,
          points: complaint.points,
          submittedDate: complaint.submitted_date,
              department: complaint.department,
              latitude: complaint.latitude,
              longitude: complaint.longitude,
          aiCategorized: complaint.ai_categorized,
          location: complaint.location,
          rejectionReason: complaint.rejection_reason,
          statusHistory: statusHistory.map(sh => ({
            status: sh.status,
            date: sh.date,
            department: sh.department
          }))
        };
      })
    );

    res.json({ success: true, complaints: complaintsWithHistory });
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ success: false, error: "Failed to fetch complaints" });
  }
});

// Get single complaint by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const complaint = await db("complaints")
      .select(
        'complaints.*',
        'users.username',
        'users.display_name as user_display_name',
        'users.avatar_uri as user_avatar_uri'
      )
      .leftJoin('users', 'complaints.user_id', 'users.id')
      .where('complaints.id', req.params.id)
      .first();

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const statusHistory = await db("status_history")
      .where({ complaint_id: complaint.id })
      .orderBy('date', 'asc');

    const result = {
      id: complaint.id.toString(),
      imageUri: complaint.image_uri,
      description: complaint.description,
      title: complaint.title,
      category: complaint.category,
      status: complaint.status,
      points: complaint.points,
      submittedDate: complaint.submitted_date,
      department: complaint.department,
          aiCategorized: complaint.ai_categorized,
          latitude: complaint.latitude,
          longitude: complaint.longitude,
      location: complaint.location,
      rejectionReason: complaint.rejection_reason,
      statusHistory: statusHistory.map(sh => ({
        status: sh.status,
        date: sh.date,
        department: sh.department
      }))
    };

    res.json({ success: true, complaint: result });
  } catch (error) {
    console.error("Error fetching complaint:", error);
    res.status(500).json({ success: false, error: "Failed to fetch complaint" });
  }
});

// Create new complaint
router.post("/", authMiddleware, async (req, res) => {
  try {
  const { title, description, category, location, imageUri, imageBase64, aiCategorized, latitude, longitude } = req.body;
    const userId = req.user.id;

    // Upload image to Cloudinary if base64 data is provided
    let uploadedImageUrl = imageUri;
    if (imageBase64) {
      try {
        uploadedImageUrl = await uploadBase64Image(imageBase64);
        console.log('Image uploaded to Cloudinary:', uploadedImageUrl);
      } catch (uploadError) {
        console.error('Image upload failed, using local URI:', uploadError);
        // Fall back to local URI if upload fails
      }
    }

    // Points are awarded later based on status progression; initial is 0.

    const [newComplaint] = await db("complaints")
      .insert({
        user_id: userId,
        title,
        description,
        category,
        location,
        image_uri: uploadedImageUrl, // Use Cloudinary URL or fall back to local URI
        status: "submitted",
        points: 0, // Points awarded on completion
        ai_categorized: aiCategorized || false,
        latitude: latitude || null,
        longitude: longitude || null,
        submitted_date: db.fn.now()
      })
      .returning('*');

    // Add initial status history
    await db("status_history").insert({
      complaint_id: newComplaint.id,
      status: "submitted",
      date: db.fn.now()
    });

    // Create notification for user
    await db("notifications").insert({
      user_id: userId,
      title: "Submission Received",
      message: `Your complaint "${title}" has been submitted successfully.`,
      type: "success",
      complaint_id: newComplaint.id
    });

    // Update user's submission count
    await db("users")
      .where({ id: userId })
      .increment('submissions_count', 1);

    res.json({ 
      success: true, 
      complaint: {
        id: newComplaint.id.toString(),
        imageUri: newComplaint.image_uri,
        description: newComplaint.description,
        title: newComplaint.title,
        category: newComplaint.category,
        status: newComplaint.status,
        points: newComplaint.points,
        submittedDate: newComplaint.submitted_date,
        department: newComplaint.department,
        latitude: newComplaint.latitude,
        longitude: newComplaint.longitude,
        aiCategorized: newComplaint.ai_categorized,
        location: newComplaint.location
      }
    });
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({ success: false, error: "Failed to create complaint" });
  }
});

// Get leaderboard
router.get("/api/leaderboard", async (req, res) => {
  try {
    const users = await db("users")
      .select('id', 'username', 'display_name', 'avatar_uri', 'points', 'rank', 'submissions_count')
      .orderBy('points', 'desc')
      .limit(50);

    const leaderboard = users.map(user => ({
      id: user.id.toString(),
      username: user.username,
      displayName: user.display_name,
      avatarUri: user.avatar_uri,
      points: user.points,
      rank: user.rank,
      submissions: user.submissions_count
    }));

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ success: false, error: "Failed to fetch leaderboard" });
  }
});

// Get prizes
router.get("/api/prizes", async (req, res) => {
  try {
    const prizes = await db("prizes")
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

// Get notifications for user
router.get("/api/notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await db("notifications")
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

module.exports = router;
