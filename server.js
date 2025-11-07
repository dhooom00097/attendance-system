const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const sessionsFile = path.join(__dirname, "sessions.json");

// إنشاء جلسة جديدة
app.post("/create-session", (req, res) => {
  const { subject, sessionNumber, teacher, latitude, longitude, radius, duration } = req.body;

  if (!subject || !sessionNumber || !teacher || !latitude || !longitude || !radius || !duration) {
    return res.status(400).json({ message: "يرجى تعبئة جميع الحقول" });
  }

  const sessionId = Date.now().toString();
  const newSession = {
    id: sessionId,
    subject,
    sessionNumber,
    teacher,
    latitude,
    longitude,
    radius,
    duration,
    attendance: [],
  };

  let sessions = [];
  if (fs.existsSync(sessionsFile)) {
    sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8"));
  }

  sessions.push(newSession);
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));

  res.json({ status: "success", sessionId });
});

// تسجيل حضور الطالب
app.post("/mark-attendance", (req, res) => {
  const { studentId, studentName, sessionId } = req.body;

  if (!studentId || !studentName || !sessionId) {
    return res.status(400).json({ message: "معلومات الحضور غير مكتملة" });
  }

  let sessions = [];
  if (fs.existsSync(sessionsFile)) {
    sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8"));
  }

  const session = sessions.find((s) => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ message: "الجلسة غير موجودة" });
  }

  const alreadyExists = session.attendance.find((a) => a.studentId === studentId);
  if (alreadyExists) {
    return res.json({ status: "exists" });
  }

  session.attendance.push({
    studentId,
    studentName,
    time: new Date().toLocaleString("ar-SA"),
  });

  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));

  res.json({ status: "success" });
});

// عرض جميع الحضور
app.get("/attendance-list", (req, res) => {
  if (!fs.existsSync(sessionsFile)) return res.json([]);
  const sessions = JSON.parse(fs.readFileSync(sessionsFile, "utf8"));
  res.json(sessions);
});

// ✅ تشغيل السيرفر على البورت المناسب (محلي أو Railway)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 السيرفر يعمل بنجاح على المنفذ ${PORT}`));
