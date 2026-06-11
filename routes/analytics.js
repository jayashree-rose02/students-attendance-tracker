const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// CALCULATE GLOBAL PERFORMANCE PERCENTAGE SCORINGS PER ID MATCH
router.get("/performance", verifyToken, (req, res) => {
  const dynamicAggregationSql = `
    SELECT 
      s.id,
      s.name,
      COUNT(a.id) AS totalLoggedDays,
      SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS loggedPresentDays
    FROM students s
    LEFT JOIN attendance a ON s.id = a.student_id
    GROUP BY s.id, s.name
    ORDER BY s.name ASC
  `;

  db.query(dynamicAggregationSql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Aggregate metric calculation stream breakdown." });
    }

    // Process calculation arrays accurately
    const formattedAnalysisMatrix = result.map(row => {
      const total = row.totalLoggedDays;
      const present = row.loggedPresentDays;
      
      return {
        id: row.id,
        name: row.name,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0
      };
    });

    res.json(formattedAnalysisMatrix);
  });
});

module.exports = router;