import path from "path";

export type VerifiedImageKind = "png" | "jpeg" | "webp" | "svg";

const IMAGE_METADATA: Record<
  VerifiedImageKind,
  { ext: string; mime: string }
> = {
  png: { ext: ".png", mime: "image/png" },
  jpeg: { ext: ".jpg", mime: "image/jpeg" },
  webp: { ext: ".webp", mime: "image/webp" },
  svg: { ext: ".svg", mime: "image/svg+xml" },
};

const DANGEROUS_SVG_PATTERNS: RegExp[] = [
  /<\s*script\b/i,
  /<\s*\/\s*script\b/i,
  /<\s*foreignObject\b/i,
  /<\s*iframe\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /<\s*meta\b/i,
  /\bon[a-z]+\s*=/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /xlink:href\s*=\s*["']\s*https?:/i,
  /href\s*=\s*["']\s*https?:/i,
];

/**
 * Inspects file magic bytes to determine the true image format regardless of client filename/Content-Type.
 */
export function detectImageKindFromBytes(
  buf: Buffer
): VerifiedImageKind | null {
  if (!buf || buf.length < 4) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "png";
  }

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpeg";
  }

  // WEBP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  // SVG: XML/SVG header text without null bytes
  const head = buf.subarray(0, 1024).toString("utf8");
  if (head.includes("\u0000")) return null;
  const trimmed = head.replace(/^\uFEFF/, "").trimStart().toLowerCase();
  if (
    trimmed.startsWith("<svg") ||
    (trimmed.startsWith("<?xml") && trimmed.includes("<svg"))
  ) {
    return "svg";
  }

  return null;
}

/**
 * Rejects any SVG containing active script execution vectors, foreignObject, or external URI references.
 */
export function validateSafeSvg(buf: Buffer): {
  valid: boolean;
  reason?: string;
} {
  const text = buf.toString("utf8");
  if (text.includes("\u0000")) {
    return { valid: false, reason: "Invalid null byte inside SVG payload." };
  }
  const lower = text.toLowerCase();
  if (!lower.includes("<svg")) {
    return { valid: false, reason: "SVG root element not found." };
  }
  for (const pattern of DANGEROUS_SVG_PATTERNS) {
    if (pattern.test(text)) {
      return {
        valid: false,
        reason:
          "SVG contains disallowed active scripting, event handlers, or external references.",
      };
    }
  }
  return { valid: true };
}

export function getVerifiedImageMetadata(kind: VerifiedImageKind): {
  ext: string;
  mime: string;
} {
  return IMAGE_METADATA[kind];
}

/**
 * Resolves a filename strictly inside baseDir, preventing path traversal and directory escapes.
 */
export function resolveContainedFilePath(
  baseDir: string,
  filename: string
): string | null {
  if (
    !filename ||
    typeof filename !== "string" ||
    filename.includes("\u0000") ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return null;
  }

  const baseName = path.basename(filename);
  if (baseName !== filename) return null;

  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, baseName);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return resolvedTarget;
}

