// middlewares/validate.js
const { validationResult } = require("express-validator");

const validate = (validationRules) => {
  return async (req, res, next) => {
    // Run the validation rules against the request
    await Promise.all(validationRules.map((rule) => rule.run(req)));

    // Check if there were any validation errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // If there are errors, return a response with the error details
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // If there are no errors, proceed to the next middleware
    next();
  };
};

module.exports = validate;
