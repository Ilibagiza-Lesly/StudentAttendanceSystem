const mongoose = require("mongoose");

const classSessionSchema = new mongoose.Schema({

    courseUnit: {
        type: String,
        required: true,
        trim: true
    },

    date: {
        type: String,
        required: true
    },

    startTime: {
        type: String,
        required: true
    },

    endTime: {
        type: String,
        required: true
    },

    lecturerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    status: {
        type: String,
        enum: ["Draft", "Approved"],
        default: "Draft"
    },

    approvedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});

// Organise sessions by date and course unit
classSessionSchema.index({
    date: 1,
    courseUnit: 1
});

module.exports = mongoose.model("ClassSession", classSessionSchema);