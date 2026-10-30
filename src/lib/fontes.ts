import { Lexend as LexendFont, Bricolage_Grotesque as BricolageGrotesqueFont, Caveat as CaveatFont } from "next/font/google";

export const Lexend = LexendFont({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const Bricolage_Grotesque = BricolageGrotesqueFont({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-titulo",
  display: "swap",
});

export const Caveat = CaveatFont({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mano",
  display: "swap",
});