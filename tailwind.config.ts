import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { primary: "#287FFF", brand: "#287FFF", ink: "#16243A", muted: "#718096", line: "#E9EEF5", canvas: "#F7F9FC" }, boxShadow: { card: "0 3px 18px rgba(24,45,80,.045)" }, borderRadius: { card: "14px" } } },
  plugins: []
};
export default config;
