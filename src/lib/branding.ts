import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { HeaderLogosConfig, LogoLibraryItem } from "@/types";

export const DEFAULT_HEADER_LOGOS: HeaderLogosConfig = {
  leftLogo: {
    type: "custom",
    url: "/api/media/logo/logo-1793718455151-d1b4dffbe4e2.png",
    alt: "Institutional Left Seal",
  },
  rightLogo: {
    type: "custom",
    url: "/api/media/logo/logo-1793718328666-3e70a8323e95.png",
    alt: "Institutional Right Seal",
  },
  library: [],
};

const BRANDING_FILE_PATH = path.join(process.cwd(), "storage", "branding.json");
const UPLOADS_DIR = path.join(process.cwd(), "storage", "uploads", "logos");

export async function getGlobalBranding(): Promise<HeaderLogosConfig> {
  try {
    let current: HeaderLogosConfig = { ...DEFAULT_HEADER_LOGOS };

    if (existsSync(BRANDING_FILE_PATH)) {
      const data = await fs.readFile(BRANDING_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      current = {
        leftLogo: parsed.leftLogo || DEFAULT_HEADER_LOGOS.leftLogo,
        rightLogo: parsed.rightLogo || DEFAULT_HEADER_LOGOS.rightLogo,
        library: Array.isArray(parsed.library) ? parsed.library : [],
      };
    }

    const libraryUrls = new Set((current.library || []).map((item) => item.url));
    let libraryChanged = false;
    const library = [...(current.library || [])];

    // Auto-index existing uploads on disk into the library
    if (existsSync(UPLOADS_DIR)) {
      const files = await fs.readdir(UPLOADS_DIR);
      for (const file of files) {
        const url = `/api/media/logo/${file}`;
        if (!libraryUrls.has(url)) {
          const stats = await fs.stat(path.join(UPLOADS_DIR, file)).catch(() => null);
          const isLeft = current.leftLogo?.url === url;
          const isRight = current.rightLogo?.url === url;
          let label = "Institutional Custom Logo";
          if (isLeft) label = "Institutional Left Seal";
          else if (isRight) label = "Institutional Right Seal";

          library.push({
            id: `logo-${path.parse(file).name}`,
            name: label,
            url,
            uploadedAt: stats?.birthtime.toISOString() || new Date().toISOString(),
            originalName: file,
            positionPreference: isLeft ? "left" : isRight ? "right" : "both",
          });
          libraryUrls.add(url);
          libraryChanged = true;
        }
      }
    }

    // Also verify leftLogo and rightLogo are indexed in library
    if (current.leftLogo?.type === "custom" && current.leftLogo.url && !libraryUrls.has(current.leftLogo.url)) {
      library.push({
        id: "active-left-logo",
        name: "Active Left Seal",
        url: current.leftLogo.url,
        uploadedAt: new Date().toISOString(),
        positionPreference: "left",
      });
      libraryUrls.add(current.leftLogo.url);
      libraryChanged = true;
    }

    if (current.rightLogo?.type === "custom" && current.rightLogo.url && !libraryUrls.has(current.rightLogo.url)) {
      library.push({
        id: "active-right-logo",
        name: "Active Right Seal",
        url: current.rightLogo.url,
        uploadedAt: new Date().toISOString(),
        positionPreference: "right",
      });
      libraryUrls.add(current.rightLogo.url);
      libraryChanged = true;
    }

    current.library = library;

    if (libraryChanged || !existsSync(BRANDING_FILE_PATH)) {
      await saveGlobalBranding(current);
    }

    return current;
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

export async function addLogoToLibrary(item: LogoLibraryItem): Promise<boolean> {
  try {
    const current = await getGlobalBranding();
    const existingIndex = (current.library || []).findIndex((l) => l.url === item.url || l.id === item.id);
    const library = [...(current.library || [])];
    if (existingIndex >= 0) {
      library[existingIndex] = { ...library[existingIndex], ...item };
    } else {
      library.unshift(item);
    }
    return await saveGlobalBranding({
      ...current,
      library,
    });
  } catch (error) {
    console.error("Failed to add logo to library:", error);
    return false;
  }
}

export async function removeLogoFromLibrary(idOrUrl: string): Promise<boolean> {
  try {
    const current = await getGlobalBranding();
    const library = (current.library || []).filter(
      (item) => item.id !== idOrUrl && item.url !== idOrUrl
    );
    return await saveGlobalBranding({
      ...current,
      library,
    });
  } catch (error) {
    console.error("Failed to remove logo from library:", error);
    return false;
  }
}
