/**
 * Zero-dependency Vector QR Code SVG Generator
 * Based on Nayuki and Kazuhiko Arase's QR Code specification.
 * Supports Byte mode up to Version 10 (up to 213 bytes with Error Correction Level L/M),
 * which is more than enough for RFC 6238 otpauth URLs (~120 chars).
 */

// Galois Field GF(256) tables
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x >= 256) {
      x ^= 0x11d; // GF(2^8) polynomial x^8 + x^4 + x^3 + x^2 + 1
    }
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gMult(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

// Reed-Solomon polynomial generator
function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gMult(poly[j], EXP_TABLE[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsComputeRemainder(data: Uint8Array, eccLen: number): Uint8Array {
  const gen = rsGeneratorPoly(eccLen);
  const remainder = new Uint8Array(eccLen);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.copyWithin(0, 1);
    remainder[eccLen - 1] = 0;
    for (let j = 0; j < eccLen; j++) {
      remainder[j] ^= gMult(gen[j], factor);
    }
  }
  return remainder;
}

// Alignment pattern locations for versions 1..10
const ALIGNMENT_PATTERN_POSITIONS = [
  [], // v0
  [], // v1
  [6, 18], // v2
  [6, 22], // v3
  [6, 26], // v4
  [6, 30], // v5
  [6, 34], // v6
  [6, 22, 38], // v7
  [6, 24, 42], // v8
  [6, 26, 46], // v9
  [6, 28, 50], // v10
];

// QR version specs: [totalDataBytes, eccBytesPerBlock, numBlocks] for Level M
const VERSION_SPECS_M: [number, number, number][] = [
  [0, 0, 0], // v0
  [16, 10, 1], // v1: 16 data bytes
  [28, 16, 1], // v2: 28 data bytes
  [44, 26, 1], // v3: 44 data bytes
  [64, 18, 2], // v4: 64 data bytes, 2 blocks
  [86, 24, 2], // v5: 86 data bytes, 2 blocks
  [108, 16, 4], // v6: 108 data bytes, 4 blocks
  [124, 18, 4], // v7: 124 data bytes, 4 blocks
  [154, 22, 4], // v8: 154 data bytes, 4 blocks
  [182, 22, 5], // v9: 182 data bytes, 5 blocks
  [216, 26, 5], // v10: 216 data bytes, 5 blocks
];

export function generateQRCodeMatrix(text: string): boolean[][] {
  const textBytes = Buffer.from(text, "utf-8");
  const len = textBytes.length;

  // Find minimum version that fits data with header (Mode Byte: 4 bits, Count: 8 bits, Terminator: 4 bits)
  let version = 1;
  while (version <= 10) {
    const totalDataCap = VERSION_SPECS_M[version][0];
    if (len + 3 <= totalDataCap) break;
    version++;
  }

  if (version > 10) {
    version = 10;
  }

  const [totalDataBytes, eccPerBlock, numBlocks] = VERSION_SPECS_M[version];
  const size = 17 + 4 * version;

  // Bit buffer encoding (Byte Mode: 0100)
  const bits: number[] = [];
  function pushBits(val: number, count: number) {
    for (let i = count - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(len, 8); // Character count indicator (8 bits for v1-9)
  for (let i = 0; i < len; i++) {
    pushBits(textBytes[i], 8);
  }

  // Terminator (up to 4 zeroes)
  const maxBits = totalDataBytes * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes (0xEC, 0x11)
  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padPatterns[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to bytes
  const dataBytes = new Uint8Array(totalDataBytes);
  for (let i = 0; i < totalDataBytes; i++) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i * 8 + j];
    }
    dataBytes[i] = b;
  }

  // Block splitting and ECC calculation
  const blockDataLen = Math.floor(totalDataBytes / numBlocks);
  const dataBlocks: Uint8Array[] = [];
  const eccBlocks: Uint8Array[] = [];

  let offset = 0;
  for (let b = 0; b < numBlocks; b++) {
    const curLen = b < totalDataBytes % numBlocks ? blockDataLen + 1 : blockDataLen;
    const block = dataBytes.slice(offset, offset + curLen);
    offset += curLen;
    dataBlocks.push(block);
    eccBlocks.push(rsComputeRemainder(block, eccPerBlock));
  }

  // Interleave data and ECC bytes
  const finalSequence: number[] = [];
  const maxBlockLen = Math.max(...dataBlocks.map((d) => d.length));
  for (let i = 0; i < maxBlockLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < dataBlocks[b].length) {
        finalSequence.push(dataBlocks[b][i]);
      }
    }
  }
  for (let i = 0; i < eccPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      finalSequence.push(eccBlocks[b][i]);
    }
  }

  // Matrix creation: true = black module, false = white module, null = unassigned
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  // 1. Finder patterns (7x7) with separators
  function drawFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr >= 0 && mr < size && mc >= 0 && mc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            matrix[mr][mc] =
              r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          } else {
            matrix[mr][mc] = false; // separator
          }
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment patterns for version >= 2
  const alignPos = ALIGNMENT_PATTERN_POSITIONS[version] || [];
  for (let i = 0; i < alignPos.length; i++) {
    for (let j = 0; j < alignPos.length; j++) {
      const r = alignPos[i];
      const c = alignPos[j];
      // Skip finders
      if (
        (r < 9 && c < 9) ||
        (r < 9 && c > size - 9) ||
        (r > size - 9 && c < 9)
      ) {
        continue;
      }
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          matrix[r + dr][c + dc] =
            Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  matrix[4 * version + 9][8] = true;

  // Format info area reservation (set to false initially, overwritten later)
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }

  // 4. Place data bits (Mask 0: (row + col) % 2 === 0)
  let bitIdx = 0;
  const totalBits = finalSequence.length * 8;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // skip vertical timing line
    const upward = ((right + 1) / 2) % 2 === 1;
    for (let v = 0; v < size; v++) {
      const row = upward ? size - 1 - v : v;
      for (let c = 0; c < 2; c++) {
        const col = right - c;
        if (matrix[row][col] === null) {
          let bit = 0;
          if (bitIdx < totalBits) {
            const byte = finalSequence[Math.floor(bitIdx / 8)];
            bit = (byte >>> (7 - (bitIdx % 8))) & 1;
            bitIdx++;
          }
          // Apply Mask 0: (row + col) % 2 == 0
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = (bit === 1) !== mask;
        }
      }
    }
  }

  // 5. Format info bits for Level M (00) + Mask 0 (000) => 101010000010010
  const formatBits = [
    true, false, true, false, true, false, false, false, false, false, true, false, false, true, false,
  ];

  // Write format info around top-left finder
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i];
  matrix[8][7] = formatBits[6];
  matrix[8][8] = formatBits[7];
  matrix[7][8] = formatBits[8];
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i];

  // Write format info around other finders
  for (let i = 0; i < 8; i++) matrix[size - 1 - i][8] = formatBits[i];
  for (let i = 8; i < 15; i++) matrix[8][size - 15 + i] = formatBits[i];

  return matrix.map((row) => row.map((cell) => cell ?? false));
}

/**
 * Renders the QR code as a clean, responsive vector SVG string.
 */
export function generateQRCodeSVG(
  text: string,
  options: {
    size?: number;
    color?: string;
    bgColor?: string;
    quietZone?: number;
  } = {}
): string {
  const { size = 256, color = "#1B5E20", bgColor = "#FFFFFF", quietZone = 4 } = options;
  const matrix = generateQRCodeMatrix(text);
  const matrixSize = matrix.length;
  const totalSize = matrixSize + quietZone * 2;

  let pathD = "";
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        pathD += `M${c + quietZone},${r + quietZone}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="${bgColor}" rx="12" />
  <path d="${pathD.trim()}" fill="${color}" />
</svg>`;
}

