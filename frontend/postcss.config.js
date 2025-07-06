// postcss.config.js
export default {
  plugins: {
    // This is the crucial part that tells PostCSS to use the Tailwind CSS plugin
    tailwindcss: {},
    // If you're also using Autoprefixer (highly recommended for browser compatibility)
    autoprefixer: {},
  },
};
