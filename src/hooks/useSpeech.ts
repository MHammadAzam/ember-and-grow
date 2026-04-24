import { useCallback, useEffect, useState } from "react";

/** Browser SpeechSynthesis wrapper. Free, offline, no API key needed. */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return;
    const onEnd = () => setSpeaking(false);
    // No global event; we manage state per-utterance below.
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const speak = useCallback(
    (text: string, opts?: { rate?: number; pitch?: number; voiceLang?: string }) => {
      if (!supported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = opts?.rate ?? 1;
      u.pitch = opts?.pitch ?? 1;
      // Pick a low/warm voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => /en.*(Daniel|Alex|Google.*UK.*Male|Microsoft.*David)/i.test(`${v.name} ${v.lang}`)) ||
        voices.find((v) => v.lang.startsWith(opts?.voiceLang ?? "en"));
      if (preferred) u.voice = preferred;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [supported],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speak, stop, speaking, supported };
}
