import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import "monaco-editor/min/vs/editor/editor.main.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "CodeReview AI",
  description: "AI-powered code review workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full flex flex-col font-sans text-slate-200">
        <Script id="suppress-monaco-errors" strategy="afterInteractive">
          {`
            window.addEventListener('unhandledrejection', function(event) {
              const msg = event.reason && event.reason.message;
              const name = event.reason && event.reason.name;
              if (
                (msg && msg.includes('Missing requestHandler')) ||
                name === 'Canceled' ||
                event.reason === 'Canceled'
              ) {
                event.preventDefault();
                event.stopImmediatePropagation();
              }
            }, { capture: true });
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
