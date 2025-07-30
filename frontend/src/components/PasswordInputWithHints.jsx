import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PasswordInputWithHints = ({
  password,
  setPassword,
  showHints = true,
  confirmPassword,
}) => {
  const [touched, setTouched] = useState(false);

  const allowedSymbols = `~!@#$%^&`;

  const rules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: new RegExp(
      `[${allowedSymbols.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}]`
    ).test(password),
  };

  const allPass = Object.values(rules).every(Boolean);
  const passwordsMatch = password === confirmPassword;

  return (
    <div>
      <Input
        id="password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => {
          if (!touched) setTouched(true); // mark touched on first input change
          setPassword(e.target.value);
        }}
        onBlur={() => setTouched(true)}
        className={`h-10
          ${
            (!allPass && touched) || (!passwordsMatch && touched)
              ? "border-red-500 focus-visible:ring-1 focus-visible:ring-red-500 focus-visible:outline-none"
              : ""
          }`}
      />

      {showHints && touched && (
        <ul className="text-xs mt-2 space-y-1">
          <li className={rules.minLength ? "text-green-600" : "text-gray-500"}>
            • At least 8 characters
          </li>
          <li className={rules.hasUpper ? "text-green-600" : "text-gray-500"}>
            • At least 1 uppercase letter
          </li>
          <li className={rules.hasLower ? "text-green-600" : "text-gray-500"}>
            • At least 1 lowercase letter
          </li>
          <li className={rules.hasNumber ? "text-green-600" : "text-gray-500"}>
            • At least 1 number
          </li>
          <li className={rules.hasSymbol ? "text-green-600" : "text-gray-500"}>
            • At least 1 special character ({allowedSymbols})
          </li>
          {!passwordsMatch && (
            <li className="text-red-500">• Passwords must match</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default PasswordInputWithHints;
