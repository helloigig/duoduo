import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
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

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata = {
  metadataBase: new URL("https://www.duoduo.global"),
  title: "duoduo — Product Engineering Studio",
  description:
    "duoduo is a product engineering studio founded by two designers who also write production code, carrying products from brand and experience through to launch.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "duoduo — Product Engineering Studio",
    url: "https://www.duoduo.global/",
    siteName: "duoduo",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}>
        <PageShell>
          <TransitionLayout>{children}</TransitionLayout>
        </PageShell>
      </body>
    </html>
  );
}
