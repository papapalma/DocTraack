import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { HeaderLogosConfig } from "@/types";

export const DEFAULT_HEADER_LOGOS: HeaderLogosConfig = {
  leftLogo: {
    type: "preset",
    presetId: "ched",
    alt: "Commission on Higher Education (CHED)",
  },
  rightLogo: {
    type: "preset",
    presetId: "unifast",
    alt: "Unified Student Financial Assistance System for Tertiary Education (UniFAST)",
  },
};

const BRANDING_FILE_PATH = path.join(process.cwd(), "storage", "branding.json");

export async function getGlobalBranding(): Promise<HeaderLogosConfig> {
  try {
    if (existsSync(BRANDING_FILE_PATH)) {
      const data = await fs.readFile(BRANDING_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      return {
        leftLogo: parsed.leftLogo || DEFAULT_HEADER_LOGOS.leftLogo,
        rightLogo: parsed.rightLogo || DEFAULT_HEADER_LOGOS.rightLogo,
      };
    }
  } catch (error) {
    console.error("Failed to read global branding config:", error);
  }
  return DEFAULT_HEADER_LOGOS;
}

export async function saveGlobalBranding(config: HeaderLogosConfig): Promise<boolean> {
  try {
    const dir = path.dirname(BRANDING_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(BRANDING_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to save global branding config:", error);
    return false;
  }
}

