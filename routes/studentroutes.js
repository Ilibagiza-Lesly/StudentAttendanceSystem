const express = require("express");
const router = express.Router();

const Student = require("../models/student");
const Attendance = require("../models/attendance");

// GET ALL STUDENTS
router.get("/", async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ADD STUDENT
router.post("/", async (req, res) => {
    try {
        const student = new Student(req.body);
        const savedStudent = await student.save();

        res.status(201).json(savedStudent);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Registration number or email already exists."
            });
        }

        res.status(400).json({ message: error.message });
    }
});

// UPDATE STUDENT
router.put("/:id", async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedStudent) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        res.json(updatedStudent);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Registration number or email already exists."
            });
        }

        res.status(400).json({ message: error.message });
    }
});

// DELETE STUDENT
router.delete("/:id", async (req, res) => {
    try {
        const deletedStudent = await Student.findByIdAndDelete(req.params.id);

        if (!deletedStudent) {
            return res.status(404).json({
                message: "Student not found."
            });
        }

        // Remove attendance records belonging to this student
        await Attendance.deleteMany({
            studentId: req.params.id
        });

        res.json({
            message: "Student deleted successfully."
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;