const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const fullName = process.env.ADMIN_FULL_NAME;
        const username = process.env.ADMIN_USERNAME;
        const password = process.env.ADMIN_PASSWORD;

        if (!fullName || !username || !password) {
            throw new Error("Administrator details are missing from .env");
        }

        if (password.length < 12) {
            throw new Error("Administrator password must contain at least 12 characters.");
        }

        const existingAdmin = await User.findOne({
            username: username.toLowerCase()
        });

        if (existingAdmin) {
            console.log("Administrator account already exists. No changes made.");
        } else {
            await User.create({
                fullName,
                username,
                password,
                role: "admin",
                isActive: true
            });

            console.log("Administrator account created successfully.");
        }

    } catch (error) {
        console.error("Account setup failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();