const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// CORE UPSERT PATTERN ENGINE FOR MARKING PRESENT OR ABSENT STATUS
router.post("/", verifyToken, (req, res) => {
  const { student_id, date, status } = req.body;

  if (!student_id || !date || !status) {
    return res.status(400).json({ message: "Missing tracking criteria matrix specifications." });
  }

  // Cross reference query evaluation string logic 
  const checkLogSql = "SELECT id FROM attendance WHERE student_id = ? AND date = ?";
  
  db.query(checkLogSql, [student_id, date], (err, existingRow) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "State lookup conflict inside core log index tables." });
    }

    if (existingRow.length > 0) {
      // Record instance matched -> Execute parameter alteration override
      const updateSql = "UPDATE attendance SET status = ? WHERE student_id = ? AND date = ?";
      db.query(updateSql, [status, student_id, date], (updateErr) => {
        if (updateErr) return res.status(500).json({ message: "Overwrite query update sequence halted." });
        return res.json({ message: "Log metrics status state altered cleanly." });
      });
    } else {
      // Missing history entry block -> Execute initial raw write transaction insert stream
      const insertSql = "INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)";
      db.query(insertSql, [student_id, date, status], (insertErr) => {
        if (insertErr) return res.status(500).json({ message: "Log write transaction initialization faulted." });
        return res.json({ message: "Live timeline status point inserted seamlessly into storage schemas." });
      });
    }
  });
});

// FULL ALL-TIME HISTORICAL SYSTEM LOG MAP EXTRACTIONS
router.get("/history", verifyToken, (req, res) => {
  const comprehensiveHistorySql = `
    SELECT 
      a.id,
      a.student_id,
      s.name,
      a.date,
      a.status
    FROM attendance a
    INNER JOIN students s ON a.student_id = s.id
    ORDER BY a.date DESC, a.id DESC
  `;

  db.query(comprehensiveHistorySql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed compiling deep operational log traces." });
    }
    res.json(result);
  });
});

module.exports = router;