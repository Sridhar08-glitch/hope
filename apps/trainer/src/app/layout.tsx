import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Holora Trainer Dashboard",
  description: "Trainer console for Holora Performance",
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
      <body style={{ backgroundColor: "#150926", margin: 0, padding: 0, overflowX: "hidden" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
