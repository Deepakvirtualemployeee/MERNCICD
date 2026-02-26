const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Ensure uploads directory exists.
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Basic middleware.
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// Multer storage config to keep original extension.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname) || "";
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

// Accept only images up to 5MB.
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

// Mongoose model.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.post("/api/register", upload.single("avatar"), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    const avatarFile = req.file;
    if (!avatarFile) {
      return res.status(400).json({ error: "avatar image is required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      avatarUrl: `/uploads/${avatarFile.filename}`,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    next(err);
  }
});

// Global error handler to surface Multer errors cleanly.
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message?.includes("image")) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "User with this email already exists" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("Missing MONGO_URI in environment");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

start();
