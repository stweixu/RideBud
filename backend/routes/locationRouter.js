const express = require("express");
const router = express.Router();

router.get("/:id", (req, res) => {
  res.send(`Location route ${req.params.id}`);
  console.log(`Location route ${req.params.id}`);
});

module.exports = router;
