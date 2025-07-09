// src/components/shadcn-time-picker.jsx
"use client"; // Important for client-side components

import React, { useState } from "react";
import TimePicker from "react-time-picker"; // The core time picker component
import "react-time-picker/dist/TimePicker.css"; // Don't forget to import its CSS in your global CSS file
import "react-clock/dist/Clock.css"; // Also required for the clock display

import { cn } from "@/lib/utils"; // For combining Tailwind classes
import { Input } from "@/components/ui/input"; // Just for example, if you want to mimic shadcn input appearance
import { Label } from "@/components/ui/label"; // If you need a label

// Define the type for the time value (usually string 'HH:MM:SS' or null)
// type ValuePiece = string | null;
// type Value = ValuePiece | [ValuePiece, ValuePiece]; // If it was a range picker

export function ReactTimePicker({
  value, // Current time value (e.g., "10:20")
  onChange, // Callback when time changes
  id = "time-picker-input",
  label = "Select Time",
  className, // For the outer div
  inputClassName, // For the actual react-time-picker wrapper (optional)
  ...props // Any other props to pass to TimePicker
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className={cn("time-picker-custom-wrapper", inputClassName)}>
        <TimePicker
          id={id}
          onChange={onChange}
          value={value}
          clearIcon={null} // Hides the clear button
          // clockIcon={null} // Hides the clock icon if you only want input
          format="HH:mm" // Displays only hours and minutes
          minuteStep={20} // <<< THIS SETS THE 20-MINUTE INTERVAL
          disableClock={true} // Hides the interactive clock dial, uses dropdowns
          hourPlaceholder="HH"
          minutePlaceholder="MM"
          // You might need to add/override more classes here or in global CSS
          // to style the internal parts of react-time-picker
          {...props}
        />
      </div>
    </div>
  );
}
