import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SwRegister } from "@/components/SwRegister";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anspannung",
  description: "Private PWA zum Tracken von Anspannungslevel und Gewohnheiten",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Anspannung",
  },
  icons: {
    apple: "/icon-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F5F8FC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${inter.variable} min-h-screen bg-[#F5F8FC] font-sans text-[#1E2A38] antialiased`}
      >
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
