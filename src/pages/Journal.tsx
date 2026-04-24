import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Square, Trash2, Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getJournalIndex, saveJournalIndex, type JournalEntry, type Mood,
} from "@/lib/habitStore";
import { putVideo, getVideo, deleteVideo } from "@/lib/videoStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_SECONDS = 60;
const MOODS: { mood: Mood; emoji: string }[] = [
  { mood: "sad", emoji: "😔" },
  { mood: "neutral", emoji: "😐" },
  { mood: "happy", emoji: "😃" },
];

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>(getJournalIndex);
  const [recording, setRecording] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<Mood>("neutral");

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setPreviewing(true);
        // Save Blob aside; persist on user confirm
        (window as Window & { __pendingBlob?: Blob }).__pendingBlob = blob;
        stopStream();
      };
      recorderRef.current = rec;
      rec.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      tickRef.current = window.setInterval(() => {
        const e = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(e);
        if (e >= MAX_SECONDS) stopRecording();
      }, 250);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Camera/mic permission denied.";
      setError(msg);
      toast.error(msg);
      stopStream();
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  async function confirmSave() {
    const blob = (window as Window & { __pendingBlob?: Blob }).__pendingBlob;
    if (!blob) return;
    const id = crypto.randomUUID();
    const blobKey = `journal_${id}`;
    try {
      await putVideo(blobKey, blob);
      const entry: JournalEntry = {
        id,
        createdAt: new Date().toISOString(),
        durationSec: elapsed,
        note: note.trim() || undefined,
        mood,
        blobKey,
        mimeType: blob.type,
        sizeBytes: blob.size,
      };
      const next = [entry, ...entries];
      setEntries(next);
      saveJournalIndex(next);
      toast.success("Entry forged into the chronicle.");
    } catch (e) {
      console.error(e);
      toast.error("Could not save video locally.");
    }
    discardPreview();
  }

  function discardPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewing(false);
    setNote("");
    setMood("neutral");
    setElapsed(0);
    delete (window as Window & { __pendingBlob?: Blob }).__pendingBlob;
  }

  async function playEntry(entry: JournalEntry) {
    const blob = await getVideo(entry.blobKey);
    if (!blob || !playbackRef.current) {
      toast.error("Video not found.");
      return;
    }
    const url = URL.createObjectURL(blob);
    playbackRef.current.src = url;
    playbackRef.current.play().catch(() => {});
    playbackRef.current.onended = () => URL.revokeObjectURL(url);
  }

  async function removeEntry(entry: JournalEntry) {
    await deleteVideo(entry.blobKey);
    const next = entries.filter((e) => e.id !== entry.id);
    setEntries(next);
    saveJournalIndex(next);
  }

  const totalMb = (entries.reduce((a, e) => a + e.sizeBytes, 0) / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 relative overflow-hidden"
      >
        <div
          className="absolute -top-12 -right-10 w-44 h-44 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--gradient-forest)" }}
        />
        <div className="relative">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Living Chronicle</p>
          <h1 className="font-display text-2xl text-gradient-forest">Video Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Speak to the camera. Watch yourself transform across the seasons.
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            {entries.length} entries · {totalMb} MB stored on this device
          </p>
        </div>
      </motion.div>

      {/* Recorder */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
          {previewing && previewUrl ? (
            <video
              src={previewUrl}
              controls
              className="w-full h-full object-cover bg-black"
            />
          ) : (
            <video
              ref={videoRef}
              muted
              playsInline
              className={cn(
                "w-full h-full object-cover bg-black",
                !recording && "opacity-0",
              )}
            />
          )}
          {recording && (
            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-destructive/90 px-3 py-1 text-xs text-destructive-foreground">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              REC {elapsed}s / {MAX_SECONDS}s
            </div>
          )}
          {!recording && !previewing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Camera className="w-10 h-10 mb-2 opacity-60" />
              <p className="text-sm">Tap below to record (max {MAX_SECONDS}s)</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {!previewing ? (
          <Button
            onClick={recording ? stopRecording : startRecording}
            className={cn("w-full gap-2", recording && "bg-destructive hover:bg-destructive/90")}
          >
            {recording ? <Square className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {recording ? "Stop" : "Record"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Mood</p>
              <div className="flex gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.mood}
                    onClick={() => setMood(m.mood)}
                    className={cn(
                      "flex-1 rounded-xl border py-2 text-xl",
                      mood === m.mood ? "border-primary bg-primary/10" : "border-border",
                    )}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A note for your future self (optional)"
              className="w-full rounded-xl border border-border bg-card/60 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={confirmSave} className="flex-1">Save to chronicle</Button>
              <Button onClick={discardPreview} variant="ghost">Discard</Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden playback element */}
      <video ref={playbackRef} controls className="w-full rounded-xl bg-black" hidden={false} />

      {/* History */}
      <div className="space-y-2">
        <AnimatePresence>
          {entries.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-xl p-3 flex items-center gap-3"
            >
              <button
                onClick={() => playEntry(e)}
                className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center text-primary"
              >
                <Play className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {new Date(e.createdAt).toLocaleString([], {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                  {" · "}{e.durationSec}s
                </p>
                {e.note && <p className="text-xs text-muted-foreground truncate">{e.note}</p>}
              </div>
              <span className="text-lg">{MOODS.find((m) => m.mood === e.mood)?.emoji ?? ""}</span>
              <button
                onClick={() => removeEntry(e)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {entries.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No entries yet — record your first chapter.
          </p>
        )}
      </div>
    </div>
  );
}
