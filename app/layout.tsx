import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "React RabbitMQ Realtime Viewer",
  description: "A Next.js page that streams RabbitMQ messages in realtime.",
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
