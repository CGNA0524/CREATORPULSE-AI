import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CreatorPulse AI — Influencer Marketing ROI & Budget Optimization Platform",
  description: "Enterprise analytics, scientific budget optimization using SciPy, and evidence-grounded AI decision support for digital marketing teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
