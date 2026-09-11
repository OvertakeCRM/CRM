"use client";

import { useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Mic, Square } from "lucide-react";
import { logActivity } from "@/lib/actions/prospects";

// Minimal ambient type for the non-standard Web Speech API.
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

export default function NoteInput({ prospectId }: { prospectId: string }) {
  const [note, setNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [isPending, startTransition] = useTransition();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceSupported = useSyncExternalStore(
    () => () => {},
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    () => false,
  );

  function toggleRecording() {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
    const SpeechRecognitionImpl = (
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition
    );
    if (!SpeechRecognitionImpl) return;

    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const results = (event as { results: { transcript: string }[][] }).results;
      const transcript = Array.from(results)
        .map((r) => r[0].transcript)
        .join(" ");
      setNote((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function submit() {
    if (!note.trim()) return;
    const text = note.trim();
    startTransition(async () => {
      await logActivity(prospectId, "note", text);
      setNote("");
    });
  }

  return (
    <div>
      <div className="flex items-end gap-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Add a note…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleRecording}
            aria-label={recording ? "Stop recording" : "Dictate note"}
            className={`flex size-11 shrink-0 items-center justify-center rounded-full border ${
              recording ? "border-rose-500 bg-rose-50 text-rose-600" : "border-slate-300 text-slate-600"
            }`}
          >
            {recording ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !note.trim()}
        className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {isPending ? "Saving…" : "Add note"}
      </button>
    </div>
  );
}
