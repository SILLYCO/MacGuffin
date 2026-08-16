import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Asset Tracking | Company Device Inventory",
  description: "Production-ready internal IT asset management software for device and employee tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
