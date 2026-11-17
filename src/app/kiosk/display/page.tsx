import { getPublicKioskState } from "@/lib/queue";
import { KioskShell } from "@/components/kiosk/kiosk-shell";

export const dynamic = "force-dynamic";

export default async function KioskDisplayPage({
  searchParams,
}: {
  searchParams: Promise<{ campus?: string }>;
}) {
  const params = await searchParams;
  const initialState = await getPublicKioskState(params.campus || null);

  return (
    <KioskShell
      initialState={initialState}
      initialModeOverride="DISPLAY_ONLY"
    />
  );
}

