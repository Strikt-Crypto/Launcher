import type { Metadata } from "next";
import { DM_Mono, Inter, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/Shell";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-outfit" });
const display = Inter({ subsets: ["latin"], variable: "--font-fraunces" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm" });

export const metadata: Metadata = {
  title: "Launcher",
  description: "Internal tool for token launches.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-desk font-sans text-ink antialiased">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
