"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/utils/supabase";

export type WhisperState = "idle" | "recording" | "transcribing";

const BAR_COUNT = 16;

export interface UseWhisperReturn {
  state: WhisperState;
  error: string | null;
  duration: number;
  transcribedText: string;
  isSupported: boolean;
  /** Array of 16 bar heights (0–1) driven by real mic levels */
  levels: number[];
  startRecording: () => Promise<void>;
  stopAndTranscribe: () => void;
  cancelRecording: () => void;
  clearTranscription: () => void;
}

function getMediaRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const mime of ["audio/webm;codecs=opus", "audio/webm"]) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return undefined;
}

export function useWhisper(): UseWhisperReturn {
  const isSupported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  const [state, setState] = useState<WhisperState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [transcribedText, setTranscribedText] = useState("");
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Audio analysis refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const releaseResources = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setLevels(Array(BAR_COUNT).fill(0));
  }, []);

  const startRecording = useCallback(async () => {
    if (state !== "idle" || !isSupported) return;

    try {
      setError(null);
      setTranscribedText("");
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analysis — use time-domain data for voice responsiveness
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.fftSize);
      const NOISE_FLOOR = 0.012;
      const updateLevels = () => {
        analyser.getByteTimeDomainData(dataArray);

        // Compute RMS amplitude (deviation from 128 = silence)
        let sumSq = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / dataArray.length);

        // Gate out ambient noise, amplify normal speech
        const amplitude = rms < NOISE_FLOOR ? 0 : Math.min(1, rms * 8);

        // Distribute across bars with per-bar variance for natural look
        const newLevels: number[] = [];
        const chunkSize = Math.floor(dataArray.length / BAR_COUNT);
        for (let i = 0; i < BAR_COUNT; i++) {
          let localMax = 0;
          for (let j = 0; j < chunkSize; j++) {
            const v = Math.abs(dataArray[i * chunkSize + j] - 128) / 128;
            if (v > localMax) localMax = v;
          }
          const barLevel = amplitude > 0
            ? Math.min(1, localMax * 6)
            : 0;
          newLevels.push(barLevel);
        }
        setLevels(newLevels);
        animFrameRef.current = requestAnimationFrame(updateLevels);
      };
      animFrameRef.current = requestAnimationFrame(updateLevels);

      // Set up MediaRecorder
      const mimeType = getMediaRecorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      setState("recording");

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      releaseResources();
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied");
      } else {
        setError("Failed to start recording");
      }
    }
  }, [state, isSupported, releaseResources]);

  const transcribe = useCallback(async (blob: Blob) => {
    setState("transcribing");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const {
        data: { session },
      } = await getSupabase().auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Transcription failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.success || !data.text) {
        throw new Error("Transcription returned empty result");
      }

      setTranscribedText(data.text);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(
          err instanceof Error ? err.message : "Transcription failed",
        );
      }
    } finally {
      abortRef.current = null;
      setState("idle");
    }
  }, []);

  const stopAndTranscribe = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    recorder.onstop = () => {
      const mimeType = getMediaRecorderMimeType() || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      releaseResources();
      transcribe(blob);
    };

    recorder.stop();
  }, [releaseResources, transcribe]);

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.onstop = null;
      recorder.stop();
    }
    releaseResources();
    setDuration(0);
    setState("idle");
  }, [releaseResources]);

  const clearTranscription = useCallback(() => {
    setTranscribedText("");
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      const recorder = recorderRef.current;
      if (recorder && recorder.state === "recording") {
        recorder.onstop = null;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    state,
    error,
    duration,
    transcribedText,
    isSupported,
    levels,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
    clearTranscription,
  };
}
