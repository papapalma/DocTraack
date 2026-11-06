export interface MinsuCampusConfig {
  key: string;
  label: string;
  heiName: string;
  heiAddress: string;
  defaultBatches: number[];
}

export const MINSU_CAMPUSES: MinsuCampusConfig[] = [
  {
    key: "Main Campus - Victoria",
    label: "Main Campus (Victoria / Alcate)",
    heiName: "MINDORO STATE UNIVERSITY - MAIN CAMPUS",
    heiAddress: "Alcate, Victoria, Oriental Mindoro",
    defaultBatches: [1, 2, 3],
  },
  {
    key: "Calapan City Campus",
    label: "Calapan City Campus",
    heiName: "MINDORO STATE UNIVERSITY - CALAPAN CITY CAMPUS",
    heiAddress: "Masipit, Calapan City, Oriental Mindoro",
    defaultBatches: [4, 5, 6],
  },
  {
    key: "Bongabong Campus",
    label: "Bongabong Campus",
    heiName: "MINDORO STATE UNIVERSITY - BONGABONG CAMPUS",
    heiAddress: "Labasan, Bongabong, Oriental Mindoro",
    defaultBatches: [7, 8, 9],
  },
];

export function getMinsuCampusConfig(campusName?: string | null): MinsuCampusConfig {
  if (!campusName) return MINSU_CAMPUSES[0];

  const lower = campusName.toLowerCase().trim();

  if (lower.includes("calapan")) {
    return MINSU_CAMPUSES[1];
  }
  if (lower.includes("bongabong")) {
    return MINSU_CAMPUSES[2];
  }
  if (lower.includes("main") || lower.includes("victoria") || lower.includes("alcate")) {
    return MINSU_CAMPUSES[0];
  }

  const direct = MINSU_CAMPUSES.find(
    (c) =>
      c.key.toLowerCase() === lower ||
      c.label.toLowerCase() === lower ||
      c.heiName.toLowerCase() === lower
  );

  return direct || MINSU_CAMPUSES[0];
}

