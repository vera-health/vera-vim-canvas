import type { Metadata } from "next";
import Script from "next/script";
import { GlobalErrorHandler } from "@/components/GlobalErrorHandler";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vera — EHR Assistant",
  description: "Vera AI assistant for EHR workflows via Vim Canvas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 h-screen overflow-hidden">
        <Script
          src="https://connect.getvim.com/vim-os-sdk/v2.x.x/vim-sdk.js"
          strategy="beforeInteractive"
        />
        <GlobalErrorHandler />
        {children}
      </body>
    </html>
  );
}
