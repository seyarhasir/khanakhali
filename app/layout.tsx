import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manzil",
  description: "Browse and manage home listings",
  metadataBase: new URL("https://asanmanzil.com"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
