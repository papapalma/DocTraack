import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Walk-In Kiosk & Queue Display | MinSU DocTrack",
  description:
    "Mindoro State University Tulong Dunong Program self-service walk-in queueing terminal and live lobby display.",
};

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-page text-ink antialiased selection:bg-minsu-green-100 selection:text-minsu-green-900">
      {children}
    </div>
  );
}

