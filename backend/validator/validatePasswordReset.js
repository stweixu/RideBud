// validators/changePasswordValidator.js
const { body } = require("express-validator");

const validatePasswordReset = [
  body("newPassword")
    .notEmpty()
    .withMessage("Password is required")
    .custom((password) => {
      const allowedSymbols = "~!@#$%^&";
      const symbolRegex = new RegExp(
        `[${allowedSymbols.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}]`
      );

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      if (!/[A-Z]/.test(password)) {
        throw new Error("Password must include at least one uppercase letter");
      }
      if (!/[a-z]/.test(password)) {
        throw new Error("Password must include at least one lowercase letter");
      }
      if (!/\d/.test(password)) {
        throw new Error("Password must include at least one number");
      }
      if (!symbolRegex.test(password)) {
        throw new Error(
          `Password must include at least one special symbol: ${allowedSymbols}`
        );
      }
      return true;
    }),
];

module.exports = validatePasswordReset;
