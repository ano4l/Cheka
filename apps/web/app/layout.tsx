import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cheka | Know Before You Sign",
  description:
    "Cheka turns dense contracts into plain-language summaries with AI-powered risk scoring, red flags, and follow-up answers — built for South Africa and Kenya.",
  metadataBase: new URL("https://cheka.app"),
  openGraph: {
    title: "Cheka | Know Before You Sign",
    description:
      "AI-powered contract intelligence for everyday people. Upload a PDF, DOCX, or image — get a plain-language summary, risk score, and red flags in seconds.",
    type: "website",
  },
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
