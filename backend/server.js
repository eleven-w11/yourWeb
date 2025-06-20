require('dotenv').config();
console.log("FRONTEND_URL from server.js:", process.env.FRONTEND_URL);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const passport = require("passport");
const jwt = require("jsonwebtoken");

const Message = require("./models/Message");

// Route imports
const signupRoutes = require("./routes/SignUpRoutes");
const signinRoutes = require("./routes/signinRoutes");
const signOutRoutes = require("./routes/signoutRoutes");
const userRoutes = require("./routes/UserProRoutes");
const verifyTokenRoutes = require("./middleware/verifyToken");
const verifyPathRoutes = require("./middleware/verifyPath");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
const server = http.createServer(app);

// Allowed origins
const allowedOrigins = [
    "http://localhost:3000",
    "https://your-web.vercel.app",
    "https://your-web-*.vercel.app" // Wildcard for Vercel preview URLs
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Blocked by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

// Enable preflight for all routes
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// Static files
app.use("/images", express.static("images"));

// Headers for CORS manually
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// // JWT Generator
// const generateJWT = (user) => {
//     return jwt.sign(
//         { id: user.id, email: user.email },
//         process.env.JWT_SECRET,
//         { expiresIn: '1h' }
//     );
// };


// // Redirect after Google Auth success
// app.get('/auth/google/callback-success', (req, res) => {
//     const token = generateJWT(req.user);
//     const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
//     res.redirect(`${frontendUrl}/oauth-success?token=${token}`);
// });

// API Routes
app.use("/api", signupRoutes);
app.use("/api", signinRoutes);
app.use("/api", signOutRoutes);
app.use("/api/user", userRoutes);
app.use("/api/verifytoken", verifyTokenRoutes);
app.use("/api/protected", verifyPathRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api", cartRoutes);
app.use("/api/messages", messageRoutes);
// app.use('/auth/google', googleAuthRoutes);

// Google Signup Fallback (if needed)
app.post("/api/signup/google", async (req, res) => {
    try {
        const { token } = req.body;
        const user = {
            id: "google_" + Date.now(),
            email: "user@example.com",
            name: "Google User"
        };

        const jwtToken = generateJWT(user);

        res.cookie('token', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.json({ success: true, token: jwtToken });
    } catch (err) {
        console.error("Google signup error:", err);
        res.status(500).json({ success: false, message: "Google authentication failed" });
    }
});

// Socket.IO
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
});

io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    socket.on("register", ({ userId }) => {
        socket.join(userId);
        console.log(`🔐 Socket ${socket.id} joined room ${userId}`);
    });

    socket.on("userMessage", async ({ fromUserId, message, timestamp }) => {
        try {
            const saved = await Message.create({
                fromUserId,
                toUserId: null,
                fromAdmin: false,
                message
            });

            const response = saved.toObject();
            response.timestamp = timestamp || saved.timestamp;

            const adminId = "681edcb10cadbac1be3540aa";
            io.to(adminId).emit("receiveMessage", response);
        } catch (err) {
            console.error("❌ userMessage error:", err);
        }
    });

    socket.on("adminMessage", async ({ toUserId, message, timestamp }) => {
        try {
            const saved = await Message.create({
                fromUserId: null,
                toUserId,
                fromAdmin: true,
                message
            });

            const response = saved.toObject();
            response.timestamp = timestamp || saved.timestamp;

            io.to(toUserId).emit("receiveMessage", response);
        } catch (err) {
            console.error("❌ adminMessage error:", err);
        }
    });

    socket.on("disconnect", () => {
        console.log("🔴 Client disconnected:", socket.id);
    });
});

// Test route
app.get("/", (req, res) => {
    res.send("✅ Server is running!");
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Global error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

















