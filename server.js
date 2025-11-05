// 📦 الاستدعاءات
const express = require("express");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const XLSX = require("xlsx");

const app = express();
const PORT = process.env.PORT || 3000;

// إعداد الخادم
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 🧩 إنشاء جلسة جديدة
app.post("/create-session", async (req, res) => {
  try {
    const { courseName, section, teacherName, lat, lng, radiusMeters, minutesValid } = req.body;
    const sessionId = Date.now().toString();
    const url = `${req.protocol}://${req.get("host")}/student.html?session=${sessionId}`;
    const qrImage = await QRCode.toDataURL(url);

    res.json({ sessionId, url, qrImage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🧾 تسجيل الحضور
app.post("/record-attendance", (req, res) => {
  const { sessionId, studentId, studentName } = req.body;

  const filePath = path.join(__dirname, "attendance.xlsx");
  let workbook;

  if (fs.existsSync(filePath)) {
    workbook = XLSX.readFile(filePath);
  } else {
    workbook = XLSX.utils.book_new();
  }

  let sheet = workbook.Sheets["Attendance"];
  let data = sheet ? XLSX.utils.sheet_to_json(sheet) : [];

  data.push({
    Time: new Date().toLocaleString(),
    Session: sessionId,
    StudentID: studentId,
    StudentName: studentName
  });

  const newSheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, newSheet, "Attendance");
  XLSX.writeFile(workbook, filePath);

  res.json({ status: "success" });
});

// 📋 عرض جدول الحضور
app.get("/getAttendance", (req, res) => {
  try {
    const filePath = path.join(__dirname, "attendance.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets["Attendance"];
    const data = XLSX.utils.sheet_to_json(sheet);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "فشل تحميل ملف الحضور" });
  }
});

// 🚀 تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});