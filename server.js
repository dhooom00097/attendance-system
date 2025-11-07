const express = require("express");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const XLSX = require("xlsx");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// مسار ملف الجلسات
const sessionsFile = path.join(__dirname, "sessions.json");

// تحميل الجلسات
let sessions = [];
if (fs.existsSync(sessionsFile)) {
  const data = fs.readFileSync(sessionsFile);
  sessions = JSON.parse(data);
}

// 🔹 إنشاء جلسة جديدة
app.post("/create-session", async (req, res) => {
  const { subject, group, teacher, lat, lng, duration } = req.body;

  if (!subject || !group || !teacher || !lat || !lng || !duration) {
    return res.status(400).json({ error: "البيانات ناقصة" });
  }

  const sessionId = Date.now().toString();
  const expiration = Date.now() + duration * 60000;

  const newSession = { sessionId, subject, group, teacher, lat, lng, expiration, students: [] };
  sessions.push(newSession);
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));

  // ✅ تعديل الرابط إلى رابط Railway
const qrData = `https://attendance-system-production-a0d1.up.railway.app/student.html?sessionId=${sessionId}`;
  const qrCode = await QRCode.toDataURL(qrData);

  res.json({ url: qrData, qr: qrCode });
});

// 🔹 تسجيل حضور طالب
app.post("/mark-attendance", (req, res) => {
  const { sessionId, studentId, studentName } = req.body;

  if (!sessionId || !studentId || !studentName) {
    return res.status(400).json({ error: "البيانات ناقصة" });
  }

  const session = sessions.find((s) => s.sessionId === sessionId);

  if (!session) {
    return res.status(404).json({ error: "الجلسة غير موجودة" });
  }

  if (Date.now() > session.expiration) {
    return res.status(400).json({ error: "انتهى وقت الجلسة" });
  }

  if (session.students.find((s) => s.studentId === studentId)) {
    return res.status(400).json({ error: "الطالب مسجل بالفعل" });
  }

  session.students.push({ studentId, studentName });
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));

  res.json({ status: "success" });
});

// 🔹 عرض جميع الجلسات
app.get("/sessions", (req, res) => {
  res.json(sessions);
});

// تشغيل السيرفر على المنفذ المطلوب
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
