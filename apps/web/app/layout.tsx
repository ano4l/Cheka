import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cheka | Know Before You Sign",
  description:
    "Cheka helps people understand contracts with plain-language summaries, risk insights, and red flags before they sign.",
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
