import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School Timetable - Schedule Management",
  description: "Manage school timetables, teachers, subjects, and schedules with a beautiful calendar interface",
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
