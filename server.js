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

// قراءة الجلسات
function readSessions() {
  if (!fs.existsSync(sessionsFile)) return [];
  return JSON.parse(fs.readFileSync(sessionsFile, "utf8") || "[]");
}

// حفظ الجلسات
function saveSessions(sessions) {
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
}

// إنشاء جلسة جديدة
app.post("/create-session", (req, res) => {
  const { subject, sessionNumber, teacher, latitude, longitude, radius, duration } = req.body;
  if (!subject || !sessionNumber || !teacher)
    return res.status(400).json({ status: "error", message: "البيانات غير مكتملة" });

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
    students: [],
  };
  sessions.push(newSession);
  saveSessions(sessions);
  res.json({ status: "success", sessionId });
});

// تسجيل حضور الطالب
app.post("/mark-attendance", (req, res) => {
  const { studentId, studentName, sessionId } = req.body;
  if (!studentId || !studentName || !sessionId)
    return res.status(400).json({ status: "error", message: "البيانات غير مكتملة" });

  const sessions = readSessions();
  const session = sessions.find((s) => s.sessionId === sessionId);
  if (!session)
    return res.status(404).json({ status: "error", message: "الجلسة غير موجودة" });

  if (session.students.find((s) => s.studentId === studentId))
    return res.json({ status: "error", message: "تم تسجيل الحضور مسبقاً" });

  session.students.push({
    studentId,
    studentName,
    time: new Date().toLocaleString("ar-SA"),
  });
  saveSessions(sessions);
  res.json({ status: "success" });
});

// عرض الجلسات
app.get("/attendance", (req, res) => {
  res.json(readSessions());
});

// ✅ هذا الجزء الجديد: عرض أي ملف HTML تلقائياً
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname));

// عرض الصفحة الرئيسية
app.get("/", (req, res) => {
  const indexPath1 = path.join(__dirname, "index.html");
  const indexPath2 = path.join(__dirname, "public", "index.html");

  if (fs.existsSync(indexPath1)) {
    res.sendFile(indexPath1);
  } else if (fs.existsSync(indexPath2)) {
    res.sendFile(indexPath2);
  } else {
    res.status(404).send("index.html غير موجود 🔴");
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
