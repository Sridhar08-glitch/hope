import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Holora Admin Dashboard",
  description: "Admin console for Holora Performance",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: "radial-gradient(circle at top right, #0f172a, #020617)", margin: 0, padding: 0, overflowX: "hidden", minHeight: "100vh" }}>{children}</body>
    </html>
  );
}
