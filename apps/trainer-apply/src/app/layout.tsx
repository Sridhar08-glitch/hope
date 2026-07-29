import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apply as Trainer - Holora",
  description: "Apply to become a trainer on the Holora platform",
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
      <body
        style={{ backgroundColor: "#150926" }}
        className="min-h-screen text-white antialiased"
      >
        {children}
      </body>
    </html>
  );
}
