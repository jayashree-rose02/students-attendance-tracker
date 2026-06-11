const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// COMPILE CHOSEN INDIVIDUAL TRACKING SHEETS
router.get("/student/:id", verifyToken, (req, res) => {
  const studentTargetId = req.params.id;

  const comprehensiveReportSql = `
    SELECT 
      s.id AS student_id,
      s.name, 
      a.date, 
      a.status
    FROM students s
    LEFT JOIN attendance a ON s.id = a.student_id
    WHERE s.id = ?
    ORDER BY a.date DESC
  `;

  db.query(comprehensiveReportSql, [studentTargetId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Error parsing historical state array ledger." });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Target profile containing data tracking fields unrecognized." });
    }
    
    res.json(result);
  });
});

module.exports = router;