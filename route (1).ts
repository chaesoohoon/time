@import "tailwindcss";

:root {
  --background: #f2f4f6;
  --foreground: #191f28;
}

@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter), var(--font-noto-sans-kr), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  
  --color-toss-blue: #3182f6;
  --color-toss-blue-hover: #1b64da;
  --color-toss-blue-light: #e8f3ff;
  --color-toss-bg: #f2f4f6;
  --color-toss-gray-primary: #191f28;
  --color-toss-gray-secondary: #4e5968;
  --color-toss-gray-tertiary: #8b95a1;
  --color-toss-border: #e5e8eb;
  
  --shadow-toss: 0 4px 16px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06);
}

body {
  background: var(--background);
  color: var(--foreground);
}

button,
select,
input {
  font: inherit;
}

::selection {
  background: #3182f6;
  color: #ffffff;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #e5e8eb;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
