// TestComponent.jsx (or directly in UserProfile if you want to test there)

import React from "react";

const TestComponent = () => {
  return (
    <div className="min-h-screen w-screen bg-gray-100 flex items-center justify-center">
      {/* Outer container for testing mx-auto and overall margins */}
      <div className="bg-blue-200 p-8 m-10 w-3/4 max-w-lg shadow-lg rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-center">
          Margin, Padding, and Auto-Center Test
        </h2>

        {/* Test Block 1: Centering with mx-auto */}
        <div className="bg-green-300 w-1/2 mx-auto p-4 mb-8 text-center text-green-900 font-semibold">
          This box should be centered horizontally within its blue parent. It
          has a width of 50% and padding of p-4.
        </div>

        {/* Test Block 2: Margin (my) and Padding (px) */}
        <div className="bg-red-300 py-6 my-8 px-4 text-red-900">
          <p className="text-lg">This is a test block.</p>
          <p>
            It should have **vertical margin (my-8)** outside it (orange space)
            and **horizontal padding (px-4)** inside it (green space, but within
            red box). The **vertical padding (py-6)** should be visible as extra
            red space above and below the text.
          </p>
        </div>

        {/* Test Block 3: All-around Margin (m) and Padding (p) */}
        <div className="bg-purple-300 m-6 p-8 text-purple-900">
          <p className="text-lg">
            This block has **margin on all sides (m-6)** outside its purple area
            and **padding on all sides (p-8)** inside its purple area.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
