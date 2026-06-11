const jwt = require("jsonwebtoken");
const { SECRET } = require("../config");

module.exports = (req, res, next) => {
  // Capture authorization string from incoming pipeline header
  const authHeader = req.headers["authorization"];
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access Denied. Authorization validation token absent." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify signatures and map internal properties directly onto the active req state context
    const verifiedUserPayload = jwt.verify(token, SECRET);
    req.user = verifiedUserPayload; 
    next(); // Pass operational control cleanly over to target controller
  } catch (err) {
    return res.status(401).json({ message: "Authorization failed. Token session corrupted or expired." });
  }
};