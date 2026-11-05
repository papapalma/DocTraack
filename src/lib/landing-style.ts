import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { DEFAULT_STYLE_SETTINGS, LandingStyleSettings } from "@/types/landing";

const STYLE_SETTINGS_FILE = path.join(process.cwd(), "storage", "landing-style.json");

interface PersistedStyles {
  published: LandingStyleSettings;
  draft: LandingStyleSettings;
}

const DEFAULT_PERSISTED: PersistedStyles = {
  published: DEFAULT_STYLE_SETTINGS,
  draft: DEFAULT_STYLE_SETTINGS,
};

export async function getLandingStyles(): Promise<PersistedStyles> {
  try {
    if (existsSync(STYLE_SETTINGS_FILE)) {
      const data = await fs.readFile(STYLE_SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return {
        published: { ...DEFAULT_STYLE_SETTINGS, ...(parsed.published || {}) },
        draft: { ...DEFAULT_STYLE_SETTINGS, ...(parsed.draft || {}) },
      };
    }
  } catch (error) {
    console.error("Failed to read landing style settings from storage:", error);
  }
  return DEFAULT_PERSISTED;
}

export async function saveDraftLandingStyle(style: Partial<LandingStyleSettings>): Promise<LandingStyleSettings> {
  const current = await getLandingStyles();
  const updatedDraft: LandingStyleSettings = {
    ...current.draft,
    ...style,
  };

  const toSave: PersistedStyles = {
    published: current.published,
    draft: updatedDraft,
  };

  try {
    const dir = path.dirname(STYLE_SETTINGS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(STYLE_SETTINGS_FILE, JSON.stringify(toSave, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write draft landing style to storage:", error);
  }

  return updatedDraft;
}

export async function publishLandingStyle(): Promise<LandingStyleSettings> {
  const current = await getLandingStyles();
  const toSave: PersistedStyles = {
    published: { ...current.draft },
    draft: { ...current.draft },
  };

  try {
    const dir = path.dirname(STYLE_SETTINGS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(STYLE_SETTINGS_FILE, JSON.stringify(toSave, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to publish landing style to storage:", error);
  }

  return toSave.published;
}

export async function resetLandingStyle(): Promise<LandingStyleSettings> {
  const toSave: PersistedStyles = {
    published: DEFAULT_STYLE_SETTINGS,
    draft: DEFAULT_STYLE_SETTINGS,
  };

  try {
    const dir = path.dirname(STYLE_SETTINGS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(STYLE_SETTINGS_FILE, JSON.stringify(toSave, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to reset landing style in storage:", error);
  }

  return DEFAULT_STYLE_SETTINGS;
}

