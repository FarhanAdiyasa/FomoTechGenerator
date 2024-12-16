import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fomo Tech Generator",
  description:
    "Let’s see what you’re really “missing out on” with the ultimate Tech FOMO test.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
