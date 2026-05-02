import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PDF Pro — Fast, Private PDF Tools for Freelancers",
  description:
    "Merge, compress, split, convert PDFs. Your files are processed and immediately deleted. No account required.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#1a1f2e",
          color: "#f0f0f0",
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <Navbar />
        <main style={{ minHeight: "calc(100vh - 56px)" }}>{children}</main>
      </body>
    </html>
  );
}
