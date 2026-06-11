const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { SECRET } = require("../config");

const router = express.Router();

// ADMINISTRATIVE SYSTEM ENTRY SIGN-IN ENDPOINT
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password specifications required." });
  }

  db.query(
    "SELECT id, username, password, role FROM users WHERE username = ?",
    [username],
    (err, result) => {
      if (err) {
        console.error("MySQL security processing fault:", err);
        return res.status(500).json({ message: "Internal server database configuration breakdown." });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Identity target record absent from system." });
      }

      const userRecord = result[0];

      // Safe matching checks
      if (userRecord.password !== password) {
        return res.status(401).json({ message: "Credential evaluation failure. Incorrect verification signature." });
      }

      // Generate explicit 1-Hour Token session payload mappings
      const token = jwt.sign(
        { id: userRecord.id, role: userRecord.role },
        SECRET,
        { expiresIn: "1h" }
      );

      // Ship session parameters back to browser local storage
      res.json({ 
        token, 
        message: "Identity verified successfully. ERP access allocated." 
      });
    }
  );
});

module.exports = router;