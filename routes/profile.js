const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// RETRIEVE AUTHORIZED MASTER SYSTEM USER METRICS
router.get("/", verifyToken, (req, res) => {
  // Pull parameters directly mapped from verifyToken payload parsing loops
  const authorizedAdminId = req.user.id;

  db.query(
    "SELECT id, username, role, image FROM users WHERE id = ?",
    [authorizedAdminId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Profile tracking metadata read fault." });
      }
      if (result.length === 0) {
        return res.status(404).json({ message: "Administrative context node dropped or unrecognized." });
      }
      res.json(result[0]); // Return the complete record object cleanly
    }
  );
});

// PERSIST MASTER ACCOUNT BASE64 IMAGERY STREAM MAPS 
router.post("/image", verifyToken, (req, res) => {
  const authorizedAdminId = req.user.id;
  const { image } = req.body; // Captures base64 payload strings flawlessly 

  if (!image) {
    return res.status(400).json({ message: "Image stream asset target execution data empty." });
  }

  db.query(
    "UPDATE users SET image = ? WHERE id = ?",
    [image, authorizedAdminId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed writing base64 image data onto MySQL cell space." });
      }
      res.json({ message: "Enterprise identity profile avatar committed to live storage rows." });
    }
  );
});

module.exports = router;