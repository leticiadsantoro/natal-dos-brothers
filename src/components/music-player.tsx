"use client";

import { useEffect, useRef, useState } from "react";

type Player = {
  playVideo(): void;
  setVolume(value: number): void;
  destroy(): void;
  getIframe(): HTMLIFrameElement;
};
type YouTube = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady(event: { target: Player }): void;
        onAutoplayBlocked(): void;
        onStateChange(event: { data: number }): void;
        onError(): void;
      };
    },
  ) => Player;
};
type MusicWindow = Window & {
  YT?: YouTube;
  onYouTubeIframeAPIReady?: () => void;
};
let loadingApi: Promise<YouTube> | undefined;

function loadYouTube(): Promise<YouTube> {
  const browser = window as MusicWindow;
  if (browser.YT?.Player) return Promise.resolve(browser.YT);
  if (loadingApi) return loadingApi;
  loadingApi = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      loadingApi = undefined;
      script.remove();
      reject(new Error("Não foi possível carregar a música."));
    }, 15000);
    browser.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      if (browser.YT) resolve(browser.YT);
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      loadingApi = undefined;
      script.remove();
      reject(new Error("Não foi possível carregar a música."));
    };
    script.src = "https://www.youtube.com/iframe_api";
    document.head.append(script);
  });
  return loadingApi;
}

export function MusicPlayer() {
  const host = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let player: Player | undefined;
    setBlocked(false);
    setReady(false);
    setPlaying(false);
    setError("");
    void loadYouTube()
      .then((youtube) => {
        if (cancelled || !host.current) return;
        const element = document.createElement("div");
        host.current.replaceChildren(element);
        player = new youtube.Player(element, {
          videoId: "x305n2dMm8M",
          width: "280",
          height: "200",
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            loop: 1,
            playlist: "x305n2dMm8M",
            origin: window.location.origin,
            controls: 0,
          },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              target.getIframe().tabIndex = -1;
              playerRef.current = target;
              setReady(true);
              target.setVolume(35);
              target.playVideo();
            },
            onStateChange: ({ data }) => {
              if (cancelled) return;
              setPlaying(data === 1);
              if (data === 1) setBlocked(false);
            },
            onAutoplayBlocked: () => {
              if (!cancelled) setBlocked(true);
            },
            onError: () => {
              if (!cancelled)
                setError("O YouTube não conseguiu reproduzir este vídeo aqui.");
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Não foi possível carregar a música. Verifique sua conexão e tente novamente.",
          );
      });
    return () => {
      cancelled = true;
      playerRef.current = null;
      player?.destroy();
    };
  }, [enabled, attempt]);

  useEffect(() => {
    if (!enabled || !ready || playing || error) return;
    function startOnInteraction(event: Event) {
      if (
        event.target instanceof Element &&
        event.target.closest(".music-toggle")
      )
        return;
      playerRef.current?.playVideo();
    }
    document.addEventListener("pointerdown", startOnInteraction, {
      passive: true,
    });
    document.addEventListener("keydown", startOnInteraction);
    return () => {
      document.removeEventListener("pointerdown", startOnInteraction);
      document.removeEventListener("keydown", startOnInteraction);
    };
  }, [enabled, ready, playing, error]);

  function toggle() {
    if (enabled && error) {
      setAttempt((value) => value + 1);
      return;
    }
    setEnabled(!enabled);
  }

  return (
    <>
      <button
        className="music-toggle"
        type="button"
        onClick={toggle}
        disabled={enabled && !ready && !error}
        aria-pressed={enabled}
        aria-controls="natal-music-player"
        title={
          error ||
          (blocked
            ? "Música ativada: o som começa na primeira interação com a página"
            : undefined)
        }
      >
        <span aria-hidden="true">{enabled ? "♫" : "♪"}</span>
        {enabled && !ready && !error
          ? "Carregando música…"
          : error
            ? "Tentar música"
            : enabled
              ? "Desativar música"
              : "Ativar música"}
      </button>
      {enabled && (
        <div
          id="natal-music-player"
          className="music-audio-host"
          ref={host}
          aria-hidden="true"
        />
      )}
      {error && (
        <span className="sr-only" role="status">
          {error}
        </span>
      )}
    </>
  );
}
