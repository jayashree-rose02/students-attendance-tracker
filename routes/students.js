const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// 1. CHOOSE GLOBAL DIRECTORY REGISTER MAPS
router.get("/", verifyToken, (req, res) => {
  db.query("SELECT id, name FROM students ORDER BY id ASC", (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database read fault encountered while analyzing index arrays." });
    }
    res.json(result);
  });
});

// 2. REGISTER NEW PROFILE IDENTITIES
router.post("/", verifyToken, (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Identity label name field structure cannot run blank parameters." });
  }

  db.query(
    "INSERT INTO students (name) VALUES (?)",
    [name.trim()],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed writing new profile onto transactional schemas." });
      }
      res.json({ message: "Student profile cataloged seamlessly.", studentId: result.insertId });
    }
  );
});

// 3. PURGE RECORDS FROM SYSTEM DIRECTORIES
router.delete("/:id", verifyToken, (req, res) => {
  const studentTargetId = req.params.id;

  // Transaction constraints: Cascading delete records across attendance maps prevents query fragmentation
  db.query("DELETE FROM attendance WHERE student_id = ?", [studentTargetId], (cascadeErr) => {
    if (cascadeErr) {
      console.error(cascadeErr);
      return res.status(500).json({ message: "Cascade cleanup handling intercept blocked." });
    }

    db.query("DELETE FROM students WHERE id = ?", [studentTargetId], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Target profile purging sequence failed." });
      }
      res.json({ message: "Student record context and all nested logs purged from live server." });
    });
  });
});

module.exports = router;