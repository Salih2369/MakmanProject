const express = require("express");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/export", auth, async (req, res) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="makman-report.csv"');

  res.send(
    `date,branch,visitors,alerts
2026-01-10,العليا,1100,2
2026-01-10,النخيل,650,1
2026-01-10,الملز,520,0
`
  );
});

module.exports = router;
