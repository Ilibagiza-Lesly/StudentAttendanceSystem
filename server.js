const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");

dotenv.config();

const connectDB = require("./config/database");
const { requireAuth } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SESSION CONFIGURATION
app.use(session({
    name: "attendease.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: "sessions"
    }),

    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 8
    }
}));

// PREVENT PAGE CACHING
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});

// AUTHENTICATION ROUTES
app.use("/api/auth", require("./routes/authroutes"));

// MAIN WEBSITE LINK
// Always show login when opening the homepage.
app.get("/", (req, res) => {
    res.redirect("/login");
});

// LOGIN PAGE
app.get("/login", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "login.html")
    );
});

app.get("/login.html", (req, res) => {
    res.redirect("/login");
});

// DASHBOARD - LOGIN REQUIRED
app.get("/dashboard", requireAuth, (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

// PROTECT DIRECT DASHBOARD ACCESS
app.get("/index.html", requireAuth, (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

// STUDENT ROUTES - LOGIN REQUIRED
app.use(
    "/api/students",
    requireAuth,
    require("./routes/studentroutes")
);

// ATTENDANCE ROUTES - LOGIN REQUIRED
app.use(
    "/api/attendance",
    requireAuth,
    require("./routes/attendanceroutes")
);

// STATIC FILES
app.use(express.static(
    path.join(__dirname, "public"),
    {
        index: false
    }
));

// UNKNOWN PAGE
app.use((req, res) => {
    res.status(404).send("Page not found.");
});

// START SERVER
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log("--------------------------------");
            console.log("AttendEase is running!");
            console.log(`Website: http://localhost:${PORT}`);
            console.log(`Login: http://localhost:${PORT}/login`);
            console.log("--------------------------------");
        });

    } catch (error) {
        console.error(
            "Could not start AttendEase:",
            error.message
        );

        process.exit(1);
    }
}

startServer();