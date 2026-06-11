const express = require("express");
const cors = require("cors");

const app = express();

// ==========================================
// SAAS STYLE INTERCEPTOR MIDDLEWARES
// ==========================================
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Higher limit authorized to process Base64 Profile Avatars safely

// ==========================================
// APPLICATION API ROUTER INJECTIONS
// ==========================================
app.use("/auth", require("./routes/auth"));
app.use("/students", require("./routes/students"));
app.use("/attendance", require("./routes/attendance"));
app.use("/reports", require("./routes/reports"));
app.use("/analytics", require("./routes/analytics"));
app.use("/profile", require("./routes/profile"));

// Root Server Live Test
app.get("/", (req, res) => {
  res.send("🚀 Attendance ERP SaaS Backend Engine Running Smoothly");
});

// Start Server Core
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Production Server live at: http://localhost:${PORT}`);
});