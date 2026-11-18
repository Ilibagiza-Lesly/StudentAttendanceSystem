const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

// LECTURER REGISTRATION
router.post("/register", async (req, res) => {
    try {
        const { fullName, username, password } = req.body;

        if (!fullName || !username || !password) {
            return res.status(400).json({
                message: "Full name, username and password are required."
            });
        }

        if (fullName.trim().length < 2) {
            return res.status(400).json({
                message: "Please enter a valid full name."
            });
        }

        if (username.trim().length < 3) {
            return res.status(400).json({
                message: "Username must contain at least 3 characters."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        const existingUser = await User.findOne({
            username: username.trim().toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "This username is already taken."
            });
        }

        // Public registration can ONLY create lecturer accounts.
        const newLecturer = await User.create({
            fullName: fullName.trim(),
            username: username.trim().toLowerCase(),
            password,
            role: "lecturer",
            isActive: true
        });

        res.status(201).json({
            message: "Lecturer account created successfully. You can now sign in.",
            user: {
                id: newLecturer._id,
                fullName: newLecturer.fullName,
                username: newLecturer.username,
                role: newLecturer.role
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This username is already taken."
            });
        }

        res.status(500).json({
            message: "Registration failed. Please try again."
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required."
            });
        }

        const user = await User.findOne({
            username: username.trim().toLowerCase()
        }).select("+password");

        if (!user || !user.isActive) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        const passwordMatch = await user.comparePassword(password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid username or password."
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                return res.status(500).json({
                    message: "Could not create login session."
                });
            }

            req.session.user = {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                role: user.role
            };

            req.session.save((saveError) => {
                if (saveError) {
                    return res.status(500).json({
                        message: "Could not save login session."
                    });
                }

                res.json({
                    message: "Login successful.",
                    user: req.session.user
                });
            });
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed.",
            error: error.message
        });
    }
});

// CHECK CURRENT LOGIN
router.get("/me", requireAuth, (req, res) => {
    res.json({
        user: req.session.user
    });
});

// EXISTING LOGOUT ROUTE
router.post("/logout", requireAuth, (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: "Could not log out."
            });
        }

        res.clearCookie("attendease.sid");

        res.json({
            message: "Logged out successfully."
        });
    });
});

module.exports = router;