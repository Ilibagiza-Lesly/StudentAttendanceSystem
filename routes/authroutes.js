const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

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

        // Create a fresh session after successful login
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

// LOGOUT
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