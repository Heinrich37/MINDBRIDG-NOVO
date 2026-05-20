import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindBridge",
  description: "Uma ponte para pedir ajuda."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
