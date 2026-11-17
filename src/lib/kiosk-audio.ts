"use client";

let sharedAudioContext: AudioContext | null = null;
let audioUnlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtx();
  }
  return sharedAudioContext;
}

/**
 * Unlocks Web Audio API on an explicit user tap/click so later automated
 * queue call chimes can play cleanly on unattended lobby TV displays.
 */
export async function unlockKioskAudio(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    audioUnlocked = ctx.state === "running";
    return audioUnlocked;
  } catch {
    return false;
  }
}

export function isKioskAudioUnlocked(): boolean {
  if (!sharedAudioContext) return audioUnlocked;
  return sharedAudioContext.state === "running" || audioUnlocked;
}

/**
 * Plays a gentle, non-startling institutional two-tone bell chime (G5 -> C6)
 * using Web Audio oscillators with soft exponential decay.
 */
export async function playQueueChime(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    if (ctx.state !== "running") return false;
    audioUnlocked = true;

    const now = ctx.currentTime;
    const playTone = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + startOffset);

      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.22, now + startOffset + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    playTone(783.99, 0, 0.42); // G5
    playTone(1046.5, 0.16, 0.62); // C6
    return true;
  } catch {
    return false;
  }
}

function formatTicketForSpeech(ticketNumber: string): string {
  return ticketNumber
    .replaceAll("-", " ")
    .split("")
    .map((ch) => {
      if (ch === "0") return "zero";
      return ch;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Announces a called queue ticket via Web Audio chime + Web Speech synthesis.
 * Designed to trigger on the exact frame the Called card updates visually.
 */
export async function announceQueueTicket(
  ticketNumber: string,
  counterName: string | null | undefined,
  options: { enableChime?: boolean; enableVoice?: boolean } = {}
): Promise<void> {
  const { enableChime = true, enableVoice = true } = options;

  if (enableChime) {
    await playQueueChime();
  }

  if (
    enableVoice &&
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  ) {
    try {
      window.speechSynthesis.cancel();
      const spokenTicket = formatTicketForSpeech(ticketNumber);
      const target = counterName ? ` at ${counterName}` : "";
      const utterance = new SpeechSynthesisUtterance(
        `Now serving ticket ${spokenTicket}${target}`
      );
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      utterance.volume = 0.95;

      // Slight delay so the two-tone chime lands cleanly before speech begins
      window.setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          // Speech synthesis blocked or unavailable
        }
      }, enableChime ? 520 : 0);
    } catch {
      // Ignore speech synthesis errors on restricted browsers
    }
  }
}

