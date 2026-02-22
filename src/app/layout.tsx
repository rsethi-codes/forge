import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { Syne, DM_Sans, JetBrains_Mono, Fraunces, Lora } from "next/font/google";
import "./globals.css";

const syne = Syne({
    subsets: ["latin"],
    variable: "--font-syne",
});

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains-mono",
});

const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-fraunces",
});

const lora = Lora({
    subsets: ["latin"],
    variable: "--font-lora",
});

export const viewport = {
    themeColor: "#ff3131",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: "FORGE | Senior React Engineer Roadmap",
    description: "Aggressive 60-day roadmap and professional dev blog for a Senior React Engineer journey.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "FORGE",
    },
};

import ForgeHUD from "@/components/ForgeHUD";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${fraunces.variable} ${lora.variable}`}>
            <body className="antialiased">
                {children}
                <ForgeHUD />
            </body>
        </html>
    );
}
