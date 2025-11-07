// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.set("trust proxy", true);

const PORT = process.env.PORT || 3000;
const sessionsFile = path.join(__dirname, "sessions.json");

function readSessions() {
  if (!fs.existsSync(sessionsFile)) return [];
  return JSON.parse(fs.readFileSync(sessionsFile, "utf8"));
}

function saveSessions(sessions) {
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
}

// 🧾 إنشاء جلسة جديدة
app.post("/create-session", (req, res) => {
  try {
    const { subject, sessionNumber, teacher, latitude, longitude, radius, duration } = req.body;

    if (!subject || !sessionNumber || !teacher)
      return res.status(400).json({ status: "error", message: "Missing required fields" });

    const sessions = readSessions();
    const sessionId = Date.now().toString();

    const newSession = {
      sessionId,
      subject,
      sessionNumber,
      teacher,
      latitude,
      longitude,
      radius,
      duration,
      createdAt: new Date(),
      students: []
    };

    sessions.push(newSession);
    saveSessions(sessions);

    res.json({ status: "success", sessionId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// 🧍 تسجيل حضور طالب
app.post("/mark-attendance", (req, res) => {
  try {
    const { studentId, studentName, sessionId } = req.body;
    if (!studentId || !studentName || !sessionId)
      return res.status(400).json({ status: "error", message: "Missing data" });

    const sessions = readSessions();
    const session = sessions.find(s => s.sessionId === sessionId);

    if (!session)
      return res.status(404).json({ status: "error", message: "Session not found" });

    // تأكد ما يسجل مرتين
    if (session.students.find(s => s.studentId === studentId))
      return res.json({ status: "error", message: "Already marked" });

    session.students.push({
      studentId,
      studentName,
      time: new Date().toLocaleString()
    });

    saveSessions(sessions);

    res.json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// 📊 عرض كل الحضور
app.get("/attendance", (req, res) => {
  try {
    const sessions = readSessions();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

// 🌍 تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
