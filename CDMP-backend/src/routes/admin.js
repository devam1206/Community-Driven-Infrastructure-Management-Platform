const express = require("express");
const router = express.Router();
const authMiddleware = require("../utils/auth");
const db = require("../db");
// Helper: calculate department points based on status progression and timeliness
// Basic rule set (can be tuned later):
// assigned: base 5 points
// in-progress: base 10 points
// resolved: base 20 points
// completed: base 30 points
// Bonus: subtract hours between previous status and this status divided by a factor, floor >= 0
async function awardDepartmentPoints(complaintId, department, status) {
  if (!department) return 0;

  const baseMap = {
    'assigned': 5,
    'in-progress': 10,
    'resolved': 20,
    'completed': 30,
    'rejected': 2 // still award small points for processing/decision
  };
  const base = baseMap[status] || 0;
  if (base === 0) return 0;

  // Prevent double award for same complaint/status
  const existing = await db('department_points_history').where({ complaint_id: complaintId, status }).first();
  if (existing) return 0;

  // Get last awarded status for timing bonus
  const last = await db('department_points_history')
    .where({ complaint_id: complaintId })
    .orderBy('date', 'desc')
    .first();

  let bonus = 0;
  if (last) {
    const now = new Date();
    const prev = new Date(last.date);
    const diffHours = Math.max(0, (now.getTime() - prev.getTime()) / (1000 * 60 * 60));
    // Simple decay: faster transitions -> higher bonus. Up to +10 points.
    // Example: within 1h => +10, within 24h => scaled down, beyond 72h => +0
    if (diffHours < 1) bonus = 10; else if (diffHours < 6) bonus = 6; else if (diffHours < 24) bonus = 4; else if (diffHours < 48) bonus = 2; else bonus = 0;
  } else {
    // First award for complaint: small starter bonus
    bonus = 2;
  }

  const total = base + bonus;
  await db('department_points_history').insert({
    complaint_id: complaintId,
    department,
    status,
    points_awarded: total
  });
  return total;
}

// Aggregate leaderboard
async function getDepartmentLeaderboard() {
  const rows = await db('department_points_history')
    .select('department')
    .sum({ total_points: 'points_awarded' })
    .count({ actions: 'id' })
    .groupBy('department')
    .orderBy('total_points', 'desc');
  // Assign rank
  return rows.map((r, idx) => ({
    department: r.department,
    totalPoints: Number(r.total_points) || 0,
    actions: Number(r.actions) || 0,
    rank: idx + 1
  }));
}

// Helper for backfill: compute points using historical dates
function computeDepartmentPointsFromDates(prevDate, currentDate, status) {
  const baseMap = {
    'assigned': 5,
    'in-progress': 10,
    'resolved': 20,
    'completed': 30,
    'rejected': 2
  };
  const base = baseMap[status] || 0;
  if (base === 0) return 0;

  let bonus = 0;
  if (!prevDate) {
    bonus = 2; // starter bonus if no prior award for this complaint
  } else {
    const diffHours = Math.max(0, (new Date(currentDate) - new Date(prevDate)) / (1000 * 60 * 60));
    if (diffHours < 1) bonus = 10;
    else if (diffHours < 6) bonus = 6;
    else if (diffHours < 24) bonus = 4;
    else if (diffHours < 48) bonus = 2;
    else bonus = 0;
  }
  return base + bonus;
}

// Middleware to allow admin users or department users
const adminOrDeptMiddleware = async (req, res, next) => {
  try {
    const user = await db("users").where({ id: req.user.id }).first();
    if (!user) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    req.isAdmin = !!user.is_admin;
    req.isDepartmentUser = !!user.is_department_user;
    req.department = user.department || null;

    // Allow either an admin or a department user
    if (!req.isAdmin && !req.isDepartmentUser) {
      return res.status(403).json({ success: false, message: "Access denied. Admin or department user only." });
    }

    next();
  } catch (_err) {
    res.status(500).json({ success: false, error: "Authorization error" });
  }
};

// Middleware for admin-only actions
const adminOnlyMiddleware = async (req, res, next) => {
  try {
    const user = await db("users").where({ id: req.user.id }).first();
    if (!user || !user.is_admin) {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }
    next();
  } catch (_err) {
    res.status(500).json({ success: false, error: "Authorization error" });
  }
};

// Get all complaints for admin review
router.get("/complaints", authMiddleware, adminOrDeptMiddleware, async (req, res) => {
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

    // If the requester is a department user, restrict to their department
    if (!req.isAdmin) {
      query = query.where('complaints.department', req.department);
    } else if (department) {
      query = query.where('complaints.department', department);
    }

    const complaints = await query.limit(limit).offset(offset);
    // Count should reflect the same visibility rules
    let countQuery = db("complaints");
    if (!req.isAdmin) {
      countQuery = countQuery.where('department', req.department);
    }
    if (status) countQuery = countQuery.where('status', status);
    const totalCount = await countQuery.count('id as count').first();

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
          latitude: complaint.latitude,
          longitude: complaint.longitude,
          rejectionReason: complaint.rejection_reason,
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
router.get("/complaints/:id", authMiddleware, adminOrDeptMiddleware, async (req, res) => {
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

    // If department user, ensure they can only access complaints for their department
    if (!req.isAdmin && complaint.department !== req.department) {
      return res.status(403).json({ success: false, message: "Access denied to this complaint" });
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
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      rejectionReason: complaint.rejection_reason,
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
router.patch("/complaints/:id/assign-department", authMiddleware, adminOnlyMiddleware, async (req, res) => {
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

  // Award department points (assigned)
  const deptPoints = await awardDepartmentPoints(complaintId, department, 'assigned');

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
      pointsAwarded: pointsToAward,
      departmentPointsAwarded: deptPoints
    });
  } catch (error) {
    console.error("Error assigning department:", error);
    res.status(500).json({ success: false, error: "Failed to assign department" });
  }
});

// Update complaint status
router.patch("/complaints/:id/update-status", authMiddleware, adminOrDeptMiddleware, async (req, res) => {
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

    // If department user, ensure they can only update complaints for their own department
    if (!req.isAdmin) {
      if (complaint.department !== req.department) {
        return res.status(403).json({ success: false, message: "Access denied to update this complaint" });
      }
      // Ensure the department in the body (if provided) matches their department
      if (department && department !== req.department) {
        return res.status(403).json({ success: false, message: "Cannot change department" });
      }
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

  // Department points award for progression
  const deptPoints = await awardDepartmentPoints(complaintId, department || complaint.department, status);

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
      pointsAwarded: pointsToAdd,
      departmentPointsAwarded: deptPoints
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, error: "Failed to update status" });
  }
});

// Reject complaint
router.patch("/complaints/:id/reject", authMiddleware, adminOrDeptMiddleware, async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { reason } = req.body || {};

    const complaint = await db("complaints").where({ id: complaintId }).first();
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Department users can only reject complaints in their department
    if (!req.isAdmin && complaint.department !== req.department) {
      return res.status(403).json({ success: false, message: "Access denied to reject this complaint" });
    }

    // Update complaint status to rejected (and optional reason)
    await db("complaints")
      .where({ id: complaintId })
      .update({ 
        status: 'rejected',
        rejection_reason: reason || null,
        updated_at: db.fn.now()
      });

    // Add status history
    await db("status_history").insert({
      complaint_id: complaintId,
      status: 'rejected',
      department: complaint.department,
      date: db.fn.now()
    });

    const deptPoints = await awardDepartmentPoints(complaintId, complaint.department, 'rejected');

    // Create notification for user
    await db("notifications").insert({
      user_id: complaint.user_id,
      title: "Complaint Rejected",
      message: reason ? `Your complaint was rejected: ${reason}` : "Your complaint has been reviewed and rejected. No points awarded.",
      type: "warning",
      complaint_id: complaintId,
      date: db.fn.now()
    });

    res.json({ 
      success: true, 
      message: "Complaint rejected",
      rejectionReason: reason || null,
      departmentPointsAwarded: deptPoints
    });
  } catch (error) {
    console.error("Error rejecting complaint:", error);
    res.status(500).json({ success: false, error: "Failed to reject complaint" });
  }
});

// Get dashboard statistics
router.get("/dashboard/stats", authMiddleware, adminOrDeptMiddleware, async (req, res) => {
  try {
    // Build base queries; department users will see only their department
    const baseComplaints = () => {
      let q = db('complaints');
      if (!req.isAdmin) q = q.where('department', req.department);
      return q;
    };

    const [
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      totalUsers,
      recentComplaints
    ] = await Promise.all([
      baseComplaints().count('id as count').first(),
      baseComplaints().where({ status: 'submitted' }).count('id as count').first(),
      baseComplaints().where({ status: 'in-progress' }).count('id as count').first(),
      baseComplaints().whereIn('status', ['resolved', 'completed']).count('id as count').first(),
      db("users").count('id as count').first(),
      baseComplaints()
        .select('id', 'title', 'status', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(5)
    ]);

    // Get complaints by department (only meaningful for admins)
    const complaintsByDepartment = req.isAdmin
      ? await db("complaints")
          .select('department')
          .count('id as count')
          .whereNotNull('department')
          .groupBy('department')
      : [];

    // Get complaints by status
    const complaintsByStatus = await baseComplaints()
      .select('status')
      .count('id as count')
      .groupBy('status');

    // Department leaderboard (global for admin, single department slice for dept users)
    const leaderboard = await getDepartmentLeaderboard();
    let myDepartment = null;
    let myDepartmentStats = null;
    if (!req.isAdmin && req.department) {
      myDepartment = req.department;
      myDepartmentStats = leaderboard.find(l => l.department === req.department) || null;
    }

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
        recentComplaints,
        leaderboard: req.isAdmin ? leaderboard : undefined,
        myDepartment: myDepartment,
        myDepartmentStats: myDepartmentStats
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch statistics" });
  }
});

// Explicit leaderboard endpoint for admin or department view
router.get('/leaderboard', authMiddleware, adminOrDeptMiddleware, async (req, res) => {
  try {
    const data = await getDepartmentLeaderboard();
    if (req.isAdmin) {
      return res.json({ success: true, leaderboard: data });
    }
    // Department user gets only their entry plus rank context
    const mine = data.find(d => d.department === req.department) || null;
    res.json({ success: true, leaderboard: mine ? [mine] : [], totalDepartments: data.length });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// Backfill department points history from existing complaints and status history (Admin only)
router.post('/leaderboard/backfill', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  try {
    // Consider only statuses that award department points
    const eligibleStatuses = new Set(['assigned', 'in-progress', 'resolved', 'completed', 'rejected']);

    // Fetch complaints that have a department assigned (only those can award department points)
    const complaints = await db('complaints')
      .select('id', 'department')
      .whereNotNull('department');

    let processed = 0;
    let inserted = 0;

    for (const c of complaints) {
      processed += 1;

      // Existing awards for this complaint (to keep idempotency)
      const existing = await db('department_points_history')
        .where({ complaint_id: c.id })
        .orderBy('date', 'asc');

      const awardedStatuses = new Set(existing.map(e => e.status));
      let prevAwardDate = existing.length > 0 ? existing[existing.length - 1].date : null;

      // Pull status history chronologically
      const history = await db('status_history')
        .where({ complaint_id: c.id })
        .orderBy('date', 'asc');

      for (const h of history) {
        if (!eligibleStatuses.has(h.status)) continue;
        if (awardedStatuses.has(h.status)) continue; // already awarded for this status

        const dept = h.department || c.department;
        if (!dept) continue;

        const points = computeDepartmentPointsFromDates(prevAwardDate, h.date, h.status);
        if (points <= 0) continue;

        // Insert with the historical date
        await db('department_points_history').insert({
          complaint_id: c.id,
          department: dept,
          status: h.status,
          points_awarded: points,
          date: h.date
        }).catch((err) => {
          // Unique violation or other minor issues should not break the whole backfill
          if (err && err.code !== '23505') {
            throw err;
          }
        });

        awardedStatuses.add(h.status);
        prevAwardDate = h.date;
        inserted += 1;
      }
    }

    const leaderboard = await getDepartmentLeaderboard();
    res.json({ success: true, complaintsProcessed: processed, rowsInserted: inserted, leaderboard });
  } catch (err) {
    console.error('Error backfilling department points:', err);
    res.status(500).json({ success: false, error: 'Backfill failed' });
  }
});

module.exports = router;
