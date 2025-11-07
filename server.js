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

// 📂 دالة قراءة الجلسات من ملف JSON
function readSessions() {
  try {
    if (!fs.existsSync(sessionsFile)) return [];
    const data = fs.readFileSync(sessionsFile, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("خطأ في قراءة الملف:", err);
    return [];
  }
}

// 💾 دالة حفظ الجلسات
function saveSessions(sessions) {
  try {
    fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
  } catch (err) {
    console.error("خطأ في حفظ الملف:", err);
  }
}

// 🧠 إنشاء جلسة جديدة
app.post("/create-session", (req, res) => {
  try {
    const { subject, sessionNumber, teacher, latitude, longitude, radius, duration } = req.body;

    if (!subject || !sessionNumber || !teacher) {
      return res.status(400).json({ status: "error", message: "البيانات غير مكتملة" });
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
    console.error("خطأ أثناء إنشاء الجلسة:", err);
    res.status(500).json({ status: "error", message: "خطأ في السيرفر" });
  }
});

// 👨‍🎓 تسجيل حضور طالب
app.post("/mark-attendance", (req, res) => {
  try {
    const { studentId, studentName, sessionId } = req.body;

    if (!studentId || !studentName || !sessionId) {
      return res.status(400).json({ status: "error", message: "البيانات غير مكتملة" });
    }

    const sessions = readSessions();
    const session = sessions.find((s) => s.sessionId === sessionId);
    if (!session) {
      return res.status(404).json({ status: "error", message: "الجلسة غير موجودة" });
    }

    if (session.students.find((s) => s.studentId === studentId)) {
      return res.json({ status: "error", message: "تم تسجيل الحضور مسبقاً" });
    }

    session.students.push({
      studentId,
      studentName,
      time: new Date().toLocaleString("ar-SA"),
    });

    saveSessions(sessions);
    res.json({ status: "success" });
  } catch (err) {
    console.error("خطأ أثناء تسجيل الحضور:", err);
    res.status(500).json({ status: "error", message: "خطأ في السيرفر" });
  }
});

// 📊 استرجاع جميع الجلسات والحضور
app.get("/attendance", (req, res) => {
  try {
    const sessions = readSessions();
    res.json(sessions);
  } catch (err) {
    console.error("خطأ أثناء قراءة الجلسات:", err);
    res.status(500).json({ status: "error", message: "خطأ في السيرفر" });
  }
});

// 🏠 عرض الصفحات الثابتة
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/student", (req, res) => {
  res.sendFile(path.join(__dirname, "student.html"));
});

app.get("/attendance-page", (req, res) => {
  res.sendFile(path.join(__dirname, "attendance.html"));
});

// 🚀 تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
