import { type Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config: Config = {
darkMode: "class", // ✅ array ki jagah string
content: [
"./app/**/*.{js,ts,jsx,tsx,mdx}",
"./components/**/*.{js,ts,jsx,tsx,mdx}",
"./ui/**/*.{js,ts,jsx,tsx,mdx}",
"./pages/**/*.{js,ts,jsx,tsx,mdx}",
"./src/**/*.{js,ts,jsx,tsx,mdx}",
],
theme: {
extend: {
colors: {
background: "var(--background)",
foreground: "var(--foreground)",
primary: "var(--primary)",
"primary-foreground": "var(--primary-foreground)",
secondary: "var(--secondary)",
"secondary-foreground": "var(--secondary-foreground)",
muted: "var(--muted)",
"muted-foreground": "var(--muted-foreground)",
accent: "var(--accent)",
"accent-foreground": "var(--accent-foreground)",
destructive: "var(--destructive)",
"destructive-foreground": "var(--destructive-foreground)",
border: "var(--border)",
input: "var(--input)",
ring: "var(--ring)",
sidebar: "var(--sidebar)",
"sidebar-foreground": "var(--sidebar-foreground)",
"sidebar-primary": "var(--sidebar-primary)",
"sidebar-primary-foreground": "var(--sidebar-primary-foreground)",
"sidebar-accent": "var(--sidebar-accent)",
"sidebar-accent-foreground": "var(--sidebar-accent-foreground)",
"sidebar-border": "var(--sidebar-border)",
"sidebar-ring": "var(--sidebar-ring)",
},
borderRadius: {
sm: "var(--radius-sm)",
md: "var(--radius-md)",
lg: "var(--radius-lg)",
xl: "var(--radius-xl)",
},
},
},
plugins: [animate],
}

export default config
