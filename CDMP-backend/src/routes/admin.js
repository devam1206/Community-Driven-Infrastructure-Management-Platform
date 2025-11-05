const express = require("express");
const router = express.Router();
const authMiddleware = require("../utils/auth");
const db = require("../db");

// Admin middleware - check if user is admin (you can enhance this)
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await db("users").where({ id: req.user.id }).first();
    if (!user || !user.is_admin) {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: "Authorization error" });
  }
};

// Get all complaints for admin review
router.get("/complaints", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, department, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = db("complaints")
      .select(
        'complaints.*',
        'users.username',
        'users.display_name as user_display_name',
        'users.email as user_email',
        'users.avatar_uri as user_avatar_uri'
      )
      .leftJoin('users', 'complaints.user_id', 'users.id')
      .orderBy('complaints.created_at', 'desc');

    if (status) {
      query = query.where('complaints.status', status);
    }

    if (department) {
      query = query.where('complaints.department', department);
    }

    const complaints = await query.limit(limit).offset(offset);
    const totalCount = await db("complaints").count('id as count').first();

    // Get status history for each complaint
    const complaintsWithHistory = await Promise.all(
      complaints.map(async (complaint) => {
        const statusHistory = await db("status_history")
          .where({ complaint_id: complaint.id })
          .orderBy('date', 'asc');

        return {
          id: complaint.id.toString(),
          userId: complaint.user_id,
          userName: complaint.user_display_name,
          userEmail: complaint.user_email,
          imageUri: complaint.image_uri,
          description: complaint.description,
          title: complaint.title,
          category: complaint.category,
          status: complaint.status,
          points: complaint.points,
          submittedDate: complaint.submitted_date,
          department: complaint.department,
          aiCategorized: complaint.ai_categorized,
          location: complaint.location,
          statusHistory: statusHistory.map(sh => ({
            status: sh.status,
            date: sh.date,
            department: sh.department
          }))
        };
      })
    );

    res.json({ 
      success: true, 
      complaints: complaintsWithHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount.count
      }
    });
  } catch (error) {
    console.error("Error fetching complaints for admin:", error);
    res.status(500).json({ success: false, error: "Failed to fetch complaints" });
  }
});

// Get single complaint details for admin
router.get("/complaints/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const complaint = await db("complaints")
      .select(
        'complaints.*',
        'users.username',
        'users.display_name as user_display_name',
        'users.email as user_email',
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
      userId: complaint.user_id,
      userName: complaint.user_display_name,
      userEmail: complaint.user_email,
      imageUri: complaint.image_uri,
      description: complaint.description,
      title: complaint.title,
      category: complaint.category,
      status: complaint.status,
      points: complaint.points,
      submittedDate: complaint.submitted_date,
      department: complaint.department,
      aiCategorized: complaint.ai_categorized,
      location: complaint.location,
      statusHistory: statusHistory.map(sh => ({
        status: sh.status,
        date: sh.date,
        department: sh.department
      }))
    };

    res.json({ success: true, complaint: result });
  } catch (error) {
    console.error("Error fetching complaint details:", error);
    res.status(500).json({ success: false, error: "Failed to fetch complaint" });
  }
});

// Assign department to complaint
router.patch("/complaints/:id/assign-department", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { department } = req.body;
    const complaintId = req.params.id;

    if (!department) {
      return res.status(400).json({ success: false, message: "Department is required" });
    }

    const complaint = await db("complaints").where({ id: complaintId }).first();
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Award 10 points for assignment
    const pointsToAward = 10;
    await db("users")
      .where({ id: complaint.user_id })
      .increment('points', pointsToAward);

    // Update complaint with department and points
    await db("complaints")
      .where({ id: complaintId })
      .update({ 
        department,
        status: 'assigned',
        points: pointsToAward,
        updated_at: db.fn.now()
      });

    // Add status history
    await db("status_history").insert({
      complaint_id: complaintId,
      status: 'assigned',
      department,
      date: db.fn.now()
    });

    // Create notification for user
    await db("notifications").insert({
      user_id: complaint.user_id,
      title: "Complaint Assigned",
      message: `Your complaint has been assigned to ${department}. You earned ${pointsToAward} points!`,
      type: "info",
      complaint_id: complaintId,
      date: db.fn.now()
    });

    res.json({ 
      success: true, 
      message: "Department assigned successfully",
      pointsAwarded: pointsToAward
    });
  } catch (error) {
    console.error("Error assigning department:", error);
    res.status(500).json({ success: false, error: "Failed to assign department" });
  }
});

// Update complaint status
router.patch("/complaints/:id/update-status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, department } = req.body;
    const complaintId = req.params.id;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const complaint = await db("complaints").where({ id: complaintId }).first();
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Points allocation based on status progression
    const pointsMap = {
      'submitted': 0,
      'assigned': 10,
      'in-progress': 25,
      'resolved': 50,
      'completed': 100
    };

    const currentPoints = complaint.points || 0;
    const statusPoints = pointsMap[status] || 0;
    const pointsToAdd = Math.max(0, statusPoints - currentPoints);

    // Update complaint
    await db("complaints")
      .where({ id: complaintId })
      .update({ 
        status,
        points: statusPoints,
        department: department || complaint.department,
        updated_at: db.fn.now()
      });

    // Update user points
    if (pointsToAdd > 0) {
      await db("users")
        .where({ id: complaint.user_id })
        .increment('points', pointsToAdd);
    }

    // Add status history
    await db("status_history").insert({
      complaint_id: complaintId,
      status,
      department: department || complaint.department,
      date: db.fn.now()
    });

    // Create notification for user
    const statusMessages = {
      'assigned': 'Your complaint has been assigned and is being reviewed',
      'in-progress': 'Work has started on your complaint',
      'resolved': 'Your complaint has been resolved',
      'completed': 'Your complaint has been completed'
    };

    await db("notifications").insert({
      user_id: complaint.user_id,
      title: `Status Updated: ${status}`,
      message: statusMessages[status] || `Your complaint status has been updated to ${status}`,
      type: pointsToAdd > 0 ? "success" : "info",
      complaint_id: complaintId,
      date: db.fn.now()
    });

    res.json({ 
      success: true, 
      message: "Status updated successfully",
      pointsAwarded: pointsToAdd
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, error: "Failed to update status" });
  }
});

// Reject complaint
router.patch("/complaints/:id/reject", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const complaintId = req.params.id;

    const complaint = await db("complaints").where({ id: complaintId }).first();
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Update complaint status to rejected
    await db("complaints")
      .where({ id: complaintId })
      .update({ 
        status: 'rejected',
        updated_at: db.fn.now()
      });

    // Add status history
    await db("status_history").insert({
      complaint_id: complaintId,
      status: 'rejected',
      department: complaint.department,
      date: db.fn.now()
    });

    // Create notification for user
    await db("notifications").insert({
      user_id: complaint.user_id,
      title: "Complaint Rejected",
      message: "Your complaint has been reviewed and rejected. No points awarded.",
      type: "warning",
      complaint_id: complaintId,
      date: db.fn.now()
    });

    res.json({ 
      success: true, 
      message: "Complaint rejected"
    });
  } catch (error) {
    console.error("Error rejecting complaint:", error);
    res.status(500).json({ success: false, error: "Failed to reject complaint" });
  }
});

// Get dashboard statistics
router.get("/dashboard/stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      totalUsers,
      recentComplaints
    ] = await Promise.all([
      db("complaints").count('id as count').first(),
      db("complaints").where({ status: 'submitted' }).count('id as count').first(),
      db("complaints").where({ status: 'in-progress' }).count('id as count').first(),
      db("complaints").whereIn('status', ['resolved', 'completed']).count('id as count').first(),
      db("users").count('id as count').first(),
      db("complaints")
        .select('id', 'title', 'status', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(5)
    ]);

    // Get complaints by department
    const complaintsByDepartment = await db("complaints")
      .select('department')
      .count('id as count')
      .whereNotNull('department')
      .groupBy('department');

    // Get complaints by status
    const complaintsByStatus = await db("complaints")
      .select('status')
      .count('id as count')
      .groupBy('status');

    res.json({
      success: true,
      stats: {
        total: totalComplaints.count,
        pending: pendingComplaints.count,
        inProgress: inProgressComplaints.count,
        resolved: resolvedComplaints.count,
        totalUsers: totalUsers.count,
        byDepartment: complaintsByDepartment,
        byStatus: complaintsByStatus,
        recentComplaints
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch statistics" });
  }
});

module.exports = router;
