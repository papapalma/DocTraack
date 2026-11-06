import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import {
  CertificateTemplateConfig,
  DEFAULT_CERTIFICATE_TEMPLATE,
} from "./certificate";

const TEMPLATE_FILE_PATH = path.join(process.cwd(), "storage", "certificate-template.json");

export async function getCertificateTemplate(): Promise<CertificateTemplateConfig> {
  try {
    if (existsSync(TEMPLATE_FILE_PATH)) {
      const data = await fs.readFile(TEMPLATE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_CERTIFICATE_TEMPLATE,
        ...parsed,
      };
    }
  } catch (err) {
    console.error("Error reading certificate template:", err);
  }
  return { ...DEFAULT_CERTIFICATE_TEMPLATE };
}

export async function saveCertificateTemplate(config: CertificateTemplateConfig): Promise<void> {
  const dir = path.dirname(TEMPLATE_FILE_PATH);
  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(TEMPLATE_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
}

