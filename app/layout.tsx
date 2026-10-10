import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600"], display: "swap" });

export const metadata: Metadata = {
  title: "REDSALCARS | Location de voitures de luxe au Maroc",
  description: "Une collection d'exception, livrée partout au Maroc. Réservez votre voiture premium avec REDSALCARS.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${manrope.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
