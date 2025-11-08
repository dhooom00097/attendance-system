// ✅ استيراد المكتبات الأساسية
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

// ✅ المنفذ (Railway يوفّره تلقائيًا)
const PORT = process.env.PORT || 3000;

// ✅ إعداد الميدل وير
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // مجلد الصفحات

// ✅ ملف تخزين الجلسات
const sessionsFile = path.join(__dirname, "sessions.json");

// ✅ تحميل الجلسات من الملف
function loadSessions() {
  try {
    if (!fs.existsSync(sessionsFile)) return [];
    const data = fs.readFileSync(sessionsFile);
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ خطأ أثناء قراءة الجلسات:", err);
    return [];
  }
}

// ✅ حفظ الجلسات في الملف
function saveSessions(sessions) {
  try {
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error("❌ خطأ أثناء حفظ الجلسات:", err);
  }
}

// ✅ إنشاء جلسة حضور جديدة
app.post("/create-session", (req, res) => {
  const sessionData = req.body;
  if (!sessionData.sessionId || !sessionData.teacher) {
    return res.status(400).json({ status: "error", message: "بيانات الجلسة ناقصة" });
  }

  const sessions = loadSessions();
  sessions.push(sessionData);
  saveSessions(sessions);

  res.json({ status: "success", message: "✅ تم إنشاء الجلسة بنجاح" });
});

// ✅ تسجيل حضور الطالب
app.post("/mark-attendance", (req, res) => {
  const { sessionId, studentId, studentName } = req.body;

  if (!sessionId || !studentId || !studentName) {
    return res.status(400).json({ status: "error", message: "بيانات ناقصة" });
  }

  const sessions = loadSessions();
  const session = sessions.find(s => s.sessionId === sessionId);

  if (!session) {
    return res.status(404).json({ status: "error", message: "الجلسة غير موجودة" });
  }

  session.attendance = session.attendance || [];

  const alreadyExists = session.attendance.find(a => a.studentId === studentId);
  if (alreadyExists) {
    return res.json({ status: "duplicate", message: "⚠️ الطالب مسجل مسبقًا" });
  }

  session.attendance.push({
    studentId,
    studentName,
    time: new Date().toLocaleString("ar-SA")
  });

  saveSessions(sessions);
  res.json({ status: "success", message: "✅ تم تسجيل الحضور بنجاح" });
});

// ✅ استرجاع كل بيانات الحضور (للجدول)
app.get("/getAttendance", (req, res) => {
  const sessions = loadSessions();
  const allAttendance = [];

  sessions.forEach(session => {
    if (session.attendance && Array.isArray(session.attendance)) {
      session.attendance.forEach(a => {
        allAttendance.push({
          Time: a.time || "-",
          Session: session.sessionId || "-",
          ID: a.studentId || "-",
          Name: a.studentName || "-",
          Teacher: session.teacher || "-"
        });
      });
    }
  });

  // ✅ إرجاع النتيجة كـ JSON صافي
  res.json(allAttendance);
});

// ✅ الصفحة الرئيسية الافتراضية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 Attendance server running on port ${PORT}`);
});
