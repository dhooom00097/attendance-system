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

// 🧾 قراءة الجلسات من الملف
function readSessions() {
  if (!fs.existsSync(sessionsFile)) return [];
  return JSON.parse(fs.readFileSync(sessionsFile, "utf8"));
}

// 💾 حفظ الجلسات في الملف
function saveSessions(sessions) {
  fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
}

// 🧠 إنشاء جلسة جديدة
app.post("/create-session", (req, res) => {
  try {
    const { subject, sessionNumber, teacher, latitude, longitude, radius, duration } = req.body;

    if (!subject || !sessionNumber || !teacher) {
      return res.status(400).json({ status: "error", message: "البيانات المطلوبة غير مكتملة." });
    }

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
  } catch (err) {
    console.error("❌ خطأ في إنشاء الجلسة:", err);
    res.status(500).json({ status: "error", message: "حدث خطأ في السيرفر." });
  }
});

// 👨‍🎓 تسجيل حضور الطالب
app.post("/mark-attendance", (req, res) => {
  try {
    const { studentId, studentName, sessionId } = req.body;

    if (!studentId || !studentName || !sessionId) {
      return res.status(400).json({ status: "error", message: "البيانات المطلوبة غير مكتملة." });
    }

    const sessions = readSessions();
    const session = sessions.find((s) => s.sessionId === sessionId);

    if (!session) {
      return res.status(404).json({ status: "error", message: "لم يتم العثور على الجلسة." });
    }

    if (session.students.find((s) => s.studentId === studentId)) {
      return res.json({ status: "error", message: "تم تسجيل الحضور مسبقًا." });
    }

    session.students.push({
      studentId,
      studentName,
      time: new Date().toLocaleString("ar-SA"),
    });

    saveSessions(sessions);
    res.json({ status: "success" });
  } catch (err) {
    console.error("❌ خطأ في تسجيل الحضور:", err);
    res.status(500).json({ status: "error", message: "حدث خطأ في السيرفر." });
  }
});

// 📋 عرض جميع الجلسات والحضور
app.get("/attendance", (req, res) => {
  try {
    const sessions = readSessions();
    res.json(sessions);
  } catch (err) {
    console.error("❌ خطأ في قراءة الجلسات:", err);
    res.status(500).json({ status: "error", message: "حدث خطأ في السيرفر." });
  }
});

// 🏠 عرض الصفحة الرئيسية والملفات الثابتة
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🌍 تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 السيرفر يعمل الآن على المنفذ ${PORT}`);
});
