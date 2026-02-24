import type { Metadata } from "next";

// REMOVED: export const dynamic = "force-dynamic"
// This was forcing every page to re-render on every navigation.
// Individual pages/routes that need dynamic rendering should opt-in themselves.
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
import QueryProvider from "@/components/providers/QueryProvider";
import { TimerBackupRecovery } from "@/components/TimerBackupRecovery";
import { Toaster } from 'react-hot-toast'

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} ${fraunces.variable} ${lora.variable}`}>
            <body className="antialiased">
                <QueryProvider>
                    {children}
                    <ForgeHUD />
                    <TimerBackupRecovery />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: '#111',
                                color: '#fff',
                                border: '1px solid #333',
                                borderRadius: '12px',
                                fontFamily: 'var(--font-dm-sans)',
                            },
                        }}
                    />
                </QueryProvider>
            </body>
        </html>
    )
}
