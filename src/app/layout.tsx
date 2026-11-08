import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import "./globals.css";
import { MusicPlayer } from "@/components/music-player";
export const metadata: Metadata = {
  title: "Natal dos amigos · Listas de presentes",
  description:
    "Crie sua lista de presentes e descubra o que seus amigos querem ganhar neste Natal.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <MusicPlayer />
        <div className="snowfall" aria-hidden="true">
          {Array.from({ length: 42 }, (_, i) => (
            <span
              key={i}
              style={
                {
                  "--snow-left": `${(i * 37 + 11) % 100}%`,
                  "--snow-size": `${3 + (i % 5)}px`,
                  "--snow-duration": `${10 + (i % 13)}s`,
                  "--snow-delay": `${-((i * 7) % 23)}s`,
                  "--snow-drift": `${((i * 29) % 130) - 65}px`,
                  "--snow-opacity": 0.35 + (i % 5) * 0.13,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <a className="skip" href="#conteudo">
          Ir para o conteúdo
        </a>
        <header className="art">
          <Link href="/" aria-label="Página inicial">
            <img
              src="/natal.svg"
              alt="Convite de Natal, 18 de dezembro às 19 horas. Lista de presentes."
              fetchPriority="high"
            />
          </Link>
        </header>
        <main id="conteudo" className="content">
          {children}
        </main>
        <footer>NATAL DOS AMIGOS · FEITO PARA CELEBRAR JUNTOS</footer>
      </body>
    </html>
  );
}
