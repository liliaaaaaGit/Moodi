"use client";

import { clsx } from "clsx";
import { Loader2, Mic, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_SECONDS = 60;

type VoiceRecorderProps = {
  onResult: (text: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

type RecorderStatus = "idle" | "recording" | "transcribing";

function getSupportedMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
  ];

  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }

  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({ onResult, onError, disabled }: VoiceRecorderProps) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const transcribeBlob = useCallback(
    async (blob: Blob) => {
      setStatus("transcribing");

      const formData = new FormData();
      formData.append("audio", blob, mimeTypeRef.current.includes("mp4") ? "recording.m4a" : "recording.webm");

      try {
        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const payload = (await response.json()) as { text?: string; error?: string };

        if (!response.ok || !payload.text) {
          onError?.(payload.error ?? "Transkription fehlgeschlagen.");
          return;
        }

        onResult(payload.text);
      } catch {
        onError?.("Netzwerkfehler bei der Transkription.");
      } finally {
        setStatus("idle");
        setSeconds(0);
      }
    },
    [onError, onResult]
  );

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    clearTimer();
    recorder.stop();
  }, [clearTimer]);

  const startRecording = useCallback(async () => {
    if (disabled || status !== "idle") return;

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      onError?.("Sprachaufnahme wird in diesem Browser nicht unterstuetzt.");
      return;
    }

    mimeTypeRef.current = mimeType;
    autoStopRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        chunksRef.current = [];
        mediaRecorderRef.current = null;

        if (blob.size === 0) {
          setStatus("idle");
          setSeconds(0);
          return;
        }

        void transcribeBlob(blob);
      };

      recorder.onerror = () => {
        clearTimer();
        stopStream();
        setStatus("idle");
        setSeconds(0);
        onError?.("Aufnahme fehlgeschlagen.");
      };

      recorder.start(250);
      setStatus("recording");
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_SECONDS) {
            autoStopRef.current = true;
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (error) {
      stopStream();
      setStatus("idle");
      setSeconds(0);

      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        onError?.("Mikrofon-Zugriff in iOS-Einstellungen erlauben.");
        return;
      }

      onError?.("Mikrofon konnte nicht gestartet werden.");
    }
  }, [clearTimer, disabled, onError, status, stopRecording, stopStream, transcribeBlob]);

  const handleToggle = () => {
    if (status === "recording") {
      stopRecording();
      return;
    }
    if (status === "idle") {
      void startRecording();
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      stopStream();
    };
  }, [clearTimer, stopStream]);

  const isRecording = status === "recording";
  const isTranscribing = status === "transcribing";

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-text-secondary">Oder kurz einsprechen</p>

      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || isTranscribing}
        aria-label={isRecording ? "Aufnahme stoppen" : "Sprachaufnahme starten"}
        className={clsx(
          "relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-soft-lg transition-transform duration-200 ease-gentle",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isRecording && "animate-pulse ring-4 ring-primary/30"
        )}
      >
        {isTranscribing ? (
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        ) : isRecording ? (
          <Square className="h-7 w-7 fill-current" aria-hidden />
        ) : (
          <Mic className="h-8 w-8" strokeWidth={2.25} aria-hidden />
        )}
      </button>

      {isRecording ? (
        <p className="text-sm font-medium tabular-nums text-primary">
          {formatTime(seconds)} / {formatTime(MAX_SECONDS)}
          {autoStopRef.current ? " · Stoppe…" : ""}
        </p>
      ) : null}

      {isTranscribing ? (
        <p className="text-sm text-text-secondary">Wird transkribiert…</p>
      ) : null}
    </div>
  );
}
