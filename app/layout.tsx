import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Creative Calendar",
    template: "%s | Creative Calendar",
  },
  applicationName: "Creative Calendar",
  description:
    "A polished, interactive wall calendar with date range planning, integrated notes, and responsive desktop/mobile UX.",
  manifest: "/favicon/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/favicon/favicon.ico",
        sizes: "any",
      },
      {
        url: "/favicon/favicon-16x16.png",
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: "/favicon/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Creative Calendar",
    description:
      "Plan your month with tactile wall-calendar visuals, range selection, and integrated notes.",
    type: "website",
    images: [
      {
        url: "/January.png",
        alt: "Creative Calendar preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creative Calendar",
    description:
      "Interactive wall calendar with date range selection and built-in notes.",
    images: ["/January.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${playfair.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
        <Toaster position={"bottom-right"} richColors theme="light" />
      </body>
    </html>
  );
}
