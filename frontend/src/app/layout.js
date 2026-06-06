import "monaco-editor/min/vs/editor/editor.main.css";
import "./globals.css";

export const metadata = {
  title: "CodeReview AI",
  description: "AI-powered code review workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
