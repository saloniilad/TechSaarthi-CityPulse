import express from "express";
import { User } from "../models/user.models.js";
import { StaffAssignment } from "../models/staffAssignment.models.js";
import { Incident } from "../models/incident.models.js";

const router = express.Router();

// GET /api/v1/staff - Get all staff members
router.get("/", async (req, res) => {
  try {
    const { workCategory, workLocation } = req.query;

    const filter = {
      role: "staff"
    };

    if (workCategory) filter.workCategory = workCategory;
    if (workLocation) filter.workLocation = workLocation;

    const staff = await User.find(filter).select("-password");

    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch staff"
    });
  }
});

// GET /api/v1/staff/assignments/:email - Get assignments by email
router.get("/assignments/email/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { status } = req.query;

    const filter = {
      staffEmail: email.toLowerCase()
    };

    // Filter by status if provided (e.g., "Assigned,In Progress")
    if (status) {
      const statusArray = status.split(',').map(s => s.trim());
      filter.assignmentStatus = { $in: statusArray };
    }

    const assignments = await StaffAssignment.find(filter)
      .populate('incidentId', 'code description')
      .populate('assignedBy', 'name email')
      .sort({ assignedAt: -1 });

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments by email:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assignments"
    });
  }
});

// GET /api/v1/staff/assignments/staff/:staffId - Get assignments by staff ID
router.get("/assignments/staff/:staffId", async (req, res) => {
  try {
    const { staffId } = req.params;
    const { status } = req.query;

    const filter = {
      staffId: staffId
    };

    // Filter by status if provided
    if (status) {
      const statusArray = status.split(',').map(s => s.trim());
      filter.assignmentStatus = { $in: statusArray };
    }

    const assignments = await StaffAssignment.find(filter)
      .populate('incidentId', 'code description')
      .populate('assignedBy', 'name email')
      .sort({ assignedAt: -1 });

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Error fetching assignments by staff ID:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assignments"
    });
  }
});

// PATCH /api/v1/staff/assignments/:assignmentId/status - Update assignment status
// PATCH /api/v1/staff/assignments/:assignmentId/status - Update assignment status
router.patch("/assignments/:assignmentId/status", async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ["Assigned", "In Progress", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const updateData = {
      assignmentStatus: status
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === "Completed") {
      updateData.completedAt = new Date();
    }

    // Find and update the assignment
    const assignment = await StaffAssignment.findByIdAndUpdate(
      assignmentId,
      updateData,
      { new: true }
    ).populate('incidentId');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    // If assignment is completed, update the incident status to "Resolved"
    if (status === "Completed" && assignment.incidentId) {
      try {
        const updatedIncident = await Incident.findByIdAndUpdate(
          assignment.incidentId._id,
          { status: "Resolved" },
          { new: true }
        );

        if (updatedIncident) {
          console.log(`✅ Incident #${updatedIncident._id} "${updatedIncident.title}" marked as Resolved`);
        }
      } catch (incidentError) {
        console.error('Error updating incident status:', incidentError);
        // Continue anyway - assignment was updated successfully
      }
    }

    res.status(200).json({
      success: true,
      data: assignment,
      message: "Assignment and incident status updated successfully"
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update assignment status"
    });
  }
});

export default router;