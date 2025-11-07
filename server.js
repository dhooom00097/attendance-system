const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const sessionsFile = path.join(__dirname, "sessions.json");
let sessions = [];

if (fs.existsSync(sessionsFile)) {
  sessions = JSON.parse(fs.readFileSync(sessionsFile));
}

// ✅ إنشاء جلسة جديدة
app.post("/create-session", (req, res) => {
  try {
    const { subject, sessionId, teacher, lat, lng, radius, duration } = req.body;

    if (!subject || !sessionId || !teacher) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newSession = {
      id: Date.now(),
      subject,
      sessionId,
      teacher,
      lat,
      lng,
      radius,
      duration,
      createdAt: new Date().toISOString(),
    };

    // 🔗 توليد رابط الطالب الصحيح
    const sessionURL = `https://attendance-system-production-a0d1.up.railway.app/student.html?sessionId=${newSession.id}`;
    newSession.url = sessionURL;

    // حفظ الجلسة في ملف
    sessions.push(newSession);
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));

    console.log("✅ Session created:", newSession);
    res.json({ url: sessionURL });
  } catch (err) {
    console.error("❌ Error creating session:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ تسجيل حضور الطالب
app.post("/mark-attendance", (req, res) => {
  try {
    const { studentId, studentName, sessionId } = req.body;
    if (!studentId || !studentName || !sessionId)
      return res.status(400).json({ error: "Missing fields" });

    const session = sessions.find((s) => s.id == sessionId);
    if (!session)
      return res.status(404).json({ error: "Session not found" });

    if (!session.attendance) session.attendance = [];
    const already = session.attendance.find((s) => s.studentId == studentId);
    if (already)
      return res.json({ status: "already" });

    session.attendance.push({
      studentId,
      studentName,
      time: new Date().toISOString(),
    });

    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
    res.json({ status: "success" });
  } catch (err) {
    console.error("❌ Error in attendance:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ✅ عرض جدول الحضور
app.get("/attendance-data", (req, res) => {
  res.json(sessions);
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
