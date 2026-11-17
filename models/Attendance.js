const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({

    // The student whose attendance is being recorded
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },

    // The class session this attendance belongs to
    // Optional temporarily to preserve older records
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassSession",
        default: null
    },

    // Lecturer who marked the attendance
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    date: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["Present", "Absent"],
        required: true
    }

}, {
    timestamps: true
});

// Each student can have only one record per class session.
// Legacy records without a sessionId are temporarily excluded.
attendanceSchema.index(
    { sessionId: 1, studentId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            sessionId: { $type: "objectId" }
        }
    }
);

module.exports = mongoose.model("Attendance", attendanceSchema);