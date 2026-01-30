// Type declarations for importing CSS files in TypeScript/Next.js
// Allows side-effect imports like `import './globals.css'` without ts(2882)
declare module "*.css";
declare module "*.scss";
declare module "*.sass";
declare module "*.module.css";
declare module "*.module.scss";
declare module "*.module.sass";

// You can extend this file with other asset types if needed (images, fonts, etc.)
