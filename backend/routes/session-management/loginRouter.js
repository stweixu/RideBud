const express = require("express");
const router = express.Router();
const { loginUserController } = require("../../controller/loginController");

router.post("/", loginUserController); // Login route

module.exports = router;
