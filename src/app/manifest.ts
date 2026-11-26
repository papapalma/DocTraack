import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "MinSU DocTrack — TDP Annex Management System",
    short_name: "MinSU DocTrack",
    description:
      "Tracked, role-based workflow for Mindoro State University Tulong Dunong Program (TDP) Annexes 1–10, Student Portal, and Walk-In Queue.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F6F8F6",
    theme_color: "#1B5E20",
    categories: ["education", "productivity", "government"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Staff & Admin Dashboard",
        short_name: "Dashboard",
        description: "Open the operational TDP Annex dashboard",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Student Scholarship Portal",
        short_name: "Portal",
        description: "Browse TDP calls and track scholarship applications",
        url: "/portal",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Walk-In Queue Kiosk",
        short_name: "Kiosk",
        description: "Launch self-service check-in and live queue display",
        url: "/kiosk",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Account & App Settings",
        short_name: "Settings",
        description: "Manage PWA installation, alerts, and 2FA security",
        url: "/settings",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
