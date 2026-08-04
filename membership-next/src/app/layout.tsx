import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ranata Tour & Travel — Membership Eksklusif",
  description:
    "Program membership eksklusif Ranata Tour. Full handling service dari rumah hingga hotel. Bergabunglah dan nikmati perjalanan tanpa hambatan bersama Ranata Tour & Travel.",
  keywords: ["ranata tour", "membership tour", "travel indonesia", "umroh", "paket wisata"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="size-full antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
