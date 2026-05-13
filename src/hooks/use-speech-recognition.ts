import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function getRecognition(): ISpeechRecognition | null {
  const cls = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return cls ? new cls() : null;
}

export function useSpeechRecognition(options?: { lang?: string }) {
  const lang = options?.lang ?? "id-ID";
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    setIsSupported(!!getRecognition());
  }, []);

  const startListening = useCallback(async () => {
    const recognition = getRecognition();
    if (!recognition) {
      setError("Browser tidak mendukung speech recognition. Gunakan Chrome atau Edge.");
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Mikrofon tidak diizinkan. Cek pengaturan browser.");
      return;
    }

    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    finalTranscriptRef.current = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0]?.transcript ?? "";
        } else {
          interim += result[0]?.transcript ?? "";
        }
      }

      if (final) {
        finalTranscriptRef.current += " " + final;
      }

      setTranscript((finalTranscriptRef.current + " " + interim).trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        if (shouldListenRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current && recognitionRef.current) {
              try { recognitionRef.current.start(); } catch { /* retry on next end */ }
            }
          }, 300);
        }
        return;
      }
      if (event.error === "aborted") return;
      if (event.error === "not-allowed") {
        setError("Mikrofon tidak diizinkan. Cek pengaturan browser.");
      } else {
        setError(event.message || event.error);
      }
      shouldListenRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (shouldListenRef.current && recognitionRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (shouldListenRef.current && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch {
              shouldListenRef.current = false;
              setIsListening(false);
            }
          }
        }, 200);
      } else {
        setIsListening(false);
      }
    };

    try {
      setError(null);
      recognition.start();
      setIsListening(true);
    } catch (err: any) {
      setError(err.message || "Gagal memulai speech recognition");
      shouldListenRef.current = false;
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      }
    };
  }, []);

  return { isListening, transcript, error, isSupported, startListening, stopListening };
}
