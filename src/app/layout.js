import { Geist, Geist_Mono, Syne } from "next/font/google";
import "./globals.css";
import PageShell from "@/components/PageShell";
import TransitionLayout from "@/components/TransitionLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "DuoDuo Studio",
  description: "High-End Portfolio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${syne.variable}`}>
        <PageShell>
          <TransitionLayout>{children}</TransitionLayout>
        </PageShell>
      </body>
    </html>
  );
}
