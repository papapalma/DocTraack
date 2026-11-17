import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { getMobileTicketTracker } from "@/lib/queue";
import { MobileTicketTracker } from "@/components/kiosk/mobile-ticket-tracker";
import { Logo } from "@/components/ui/logo";

export const dynamic = "force-dynamic";

export default async function MobileTicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tracker = await getMobileTicketTracker(token);

  if (!tracker) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
        <div className="apple-shadow w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center">
          <div className="mx-auto flex w-fit items-center gap-3">
            <Logo size="md" />
          </div>
          <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-heading text-xl font-bold text-ink">
            Queue Ticket Not Found
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            This queue link may have expired or belongs to a previous day. Daily walk-in queues reset automatically at midnight.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/kiosk"
              className="inline-flex items-center justify-center rounded-2xl bg-minsu-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-minsu-green-600"
            >
              Return to Walk-In Kiosk
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-ink-muted underline"
            >
              MinSU DocTrack Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <MobileTicketTracker initialTracker={tracker} />;
}

