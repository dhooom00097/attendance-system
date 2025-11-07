const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// ✅ تحديد المسار الكامل لملف الجلسات
const sessionsFile = path.join(__dirname, "sessions.json");
let sessions = [];

// ✅ تحميل الجلسات من الملف بأمان (بدون ما يطيح السيرفر)
try {
  if (fs.existsSync(sessionsFile)) {
    const data = fs.readFileSync(sessionsFile, "utf8");
    sessions = data ? JSON.parse(data) : [];
  } else {
    fs.writeFileSync(sessionsFile, "[]");
  }
} catch (err) {
  console.error("⚠️ خطأ في قراءة ملف الجلسات:", err);
  sessions = [];
}

// ✅ إنشاء جلسة جديدة
app.post("/create-session", (req, res) => {
  try {
    const { subject, sessionId, teacher, lat, lng, radius, duration } = req.body;

    if (!subject || !teacher) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newSession = {
      id: Date.now(),
      subject,
      sessionId: sessionId || Math.floor(Math.random() * 10000),
      teacher,
      lat,
      lng,
      radius,
      duration,
      attendance: [],
      createdAt: new Date().toISOString(),
    };

    const sessionURL = `https://attendance-system-production-a0d1.up.railway.app/student.html?sessionId=${newSession.id}`;
    newSession.url = sessionURL;

    sessions.push(newSession);
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));

    console.log("✅ تم إنشاء الجلسة:", newSession);
    res.json({ url: sessionURL });
  } catch (err) {
    console.error("❌ خطأ أثناء إنشاء الجلسة:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ✅ تسجيل حضور الطالب
app.post("/mark-attendance", (req, res) => {
  try {
    const { studentId, studentName, sessionId } = req.body;
    if (!studentId || !studentName || !sessionId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const session = sessions.find((s) => s.id == sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.attendance.find((s) => s.studentId == studentId)) {
      return res.json({ status: "already" });
    }

    session.attendance.push({
      studentId,
      studentName,
      time: new Date().toISOString(),
    });

    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
    res.json({ status: "success" });
  } catch (err) {
    console.error("❌ خطأ أثناء تسجيل الحضور:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ✅ عرض جميع الجلسات (للأستاذ)
app.get("/attendance-data", (req, res) => {
  res.json(sessions);
});

// ✅ تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`));
