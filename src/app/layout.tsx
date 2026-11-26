import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DownloadProvider } from "@/components/providers/download-provider";
import { PwaProvider } from "@/components/providers/pwa-provider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#1B5E20",
};

export const metadata: Metadata = {
  title: "MinSU DocTrack | TDP Annex Management System",
  description: "Tracked, role-based workflow for Mindoro State University TDP Annexes 1–10",
  applicationName: "MinSU DocTrack",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MinSU DocTrack",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <PwaProvider>
          <DownloadProvider>
            {children}
          </DownloadProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
