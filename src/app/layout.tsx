import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "@/shared/styles/globals.css";
import { AuthProvider } from "@/features/auth";
import { PwaGuard } from "@/widgets/pwa-guard/PwaGuard";
import { APP_ICON_APPLE } from "@/shared/config/assets";

const notoSansKr = Noto_Sans_KR({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "모니 - 모의 투자로 배우는 주식",
    description: "AI 기반 주식 분석과 모의 투자로 현명한 투자자가 되어보세요.",
    icons: {
        icon: [{ url: "/favicon.ico" }],
        apple: [{ url: APP_ICON_APPLE, sizes: "180x180", type: "image/png" }],
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="ko" data-scroll-behavior="smooth">
        <body className={notoSansKr.className}>
        <div className="app-shell">
            <PwaGuard>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </PwaGuard>
        </div>
        </body>
        </html>
    );
}