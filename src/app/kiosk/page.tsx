import type { KioskDisplayMode } from "@/types/queue";
import { getPublicKioskState } from "@/lib/queue";
import { KioskShell } from "@/components/kiosk/kiosk-shell";

export const dynamic = "force-dynamic";

const VALID_MODES = new Set<KioskDisplayMode>([
  "UNIFIED",
  "CHECK_IN_ONLY",
  "DISPLAY_ONLY",
]);

export default async function KioskPage({
  searchParams,
}: {
  searchParams: Promise<{ campus?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const requestedMode = params.mode?.toUpperCase() as KioskDisplayMode | undefined;
  const modeOverride =
    requestedMode && VALID_MODES.has(requestedMode) ? requestedMode : null;

  const initialState = await getPublicKioskState(params.campus || null);

  return (
    <KioskShell
      initialState={initialState}
      initialModeOverride={modeOverride}
    />
  );
}

