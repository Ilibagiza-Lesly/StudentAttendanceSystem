const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({

    regNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    fullName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    course: {
        type: String,
        required: true,
        trim: true
    },

    year: {
        type: String,
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Student", studentSchema);