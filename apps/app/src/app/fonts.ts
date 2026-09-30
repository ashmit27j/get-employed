import { Inter, JetBrains_Mono } from "next/font/google";

// Exposed as CSS variables; packages/ui/src/theme.css builds --font-sans / --font-mono from them.
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});
