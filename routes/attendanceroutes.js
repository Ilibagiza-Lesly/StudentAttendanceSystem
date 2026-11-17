const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Attendance = require("../models/Attendance");
const Student = require("../models/student");
const ClassSession = require("../models/ClassSession");

// ==========================================
// OLD DASHBOARD: GET ATTENDANCE BY DATE
// ==========================================

router.get("/", async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                message: "Please provide an attendance date."
            });
        }

        const records = await Attendance.find({
            date,
            sessionId: null
        }).populate("studentId");

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// OLD DASHBOARD: MARK ATTENDANCE
// ==========================================

router.post("/", async (req, res) => {
    try {
        const { studentId, status, date } = req.body;

        if (!studentId || !date || !["Present", "Absent"].includes(status)) {
            return res.status(400).json({
                message: "Student, date and valid status are required."
            });
        }

        const record = await Attendance.findOneAndUpdate(
            { studentId, date, sessionId: null },
            { studentId, date, status },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.json(record);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ==========================================
// CREATE CLASS SESSION
// ==========================================

router.post("/sessions", async (req, res) => {
    try {
        const { courseUnit, date, startTime, endTime } = req.body;

        if (!courseUnit || !date || !startTime || !endTime) {
            return res.status(400).json({
                message: "Complete all class session details."
            });
        }

        if (startTime >= endTime) {
            return res.status(400).json({
                message: "End time must be later than start time."
            });
        }

        const session = await ClassSession.create({
            courseUnit,
            date,
            startTime,
            endTime,
            lecturerId: req.session.user.id,
            status: "Draft"
        });

        res.status(201).json({
            message: "Class session created.",
            session
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ==========================================
// GET CLASS SESSIONS
// ==========================================

router.get("/sessions", async (req, res) => {
    try {
        const sessions = await ClassSession.find()
            .populate("lecturerId", "fullName")
            .sort({ date: -1, startTime: -1 });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// LOAD STUDENTS FOR A SESSION
// ==========================================

router.get("/sessions/:sessionId/students", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.sessionId)) {
            return res.status(400).json({
                message: "Invalid session ID."
            });
        }

        const session = await ClassSession.findById(req.params.sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        const students = await Student.find().sort({ fullName: 1 });

        const records = await Attendance.find({
            sessionId: session._id
        });

        const statusMap = new Map(
            records.map(record => [
                String(record.studentId),
                record.status
            ])
        );

        res.json({
            session,
            students: students.map(student => ({
                student,
                status: statusMap.get(String(student._id)) || ""
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// MARK ATTENDANCE FOR A SESSION
// ==========================================

router.post("/sessions/:sessionId/mark", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { studentId, status } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(sessionId) ||
            !mongoose.Types.ObjectId.isValid(studentId)
        ) {
            return res.status(400).json({
                message: "Invalid session or student ID."
            });
        }

        if (!["Present", "Absent"].includes(status)) {
            return res.status(400).json({
                message: "Select Present or Absent."
            });
        }

        const session = await ClassSession.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        if (session.status === "Approved") {
            return res.status(400).json({
                message: "Approved attendance cannot be changed."
            });
        }

        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        const record = await Attendance.findOneAndUpdate(
            { sessionId, studentId },
            {
                sessionId,
                studentId,
                date: session.date,
                status,
                markedBy: req.session.user.id
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.json({
            message: "Attendance saved.",
            record
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ==========================================
// APPROVE ATTENDANCE
// ==========================================

router.post("/sessions/:sessionId/approve", async (req, res) => {
    try {
        const session = await ClassSession.findById(req.params.sessionId);

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        if (session.status === "Approved") {
            return res.status(400).json({
                message: "Attendance is already approved."
            });
        }

        const totalStudents = await Student.countDocuments();

        const markedStudents = await Attendance.countDocuments({
            sessionId: session._id
        });

        if (totalStudents === 0 || markedStudents !== totalStudents) {
            return res.status(400).json({
                message: "Mark attendance for every registered student before approval.",
                totalStudents,
                markedStudents
            });
        }

        session.status = "Approved";
        session.approvedAt = new Date();

        await session.save();

        res.json({
            message: "Attendance approved successfully.",
            session
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// APPROVED ATTENDANCE REPORT
// ==========================================

router.get("/sessions/:sessionId/report", async (req, res) => {
    try {
        const session = await ClassSession.findById(req.params.sessionId)
            .populate("lecturerId", "fullName");

        if (!session) {
            return res.status(404).json({
                message: "Session not found."
            });
        }

        if (session.status !== "Approved") {
            return res.status(403).json({
                message: "This session has not been approved."
            });
        }

        const records = await Attendance.find({
            sessionId: session._id
        }).populate("studentId", "fullName regNumber");

        const present = records.filter(r => r.status === "Present").length;
        const absent = records.filter(r => r.status === "Absent").length;

        res.json({
            session,
            records,
            summary: {
                totalStudents: records.length,
                present,
                absent,
                attendanceRate: records.length
                    ? Math.round((present / records.length) * 100)
                    : 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;