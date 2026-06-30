import type { NextConfig } from "next";

const stockLogoBaseUrl = process.env.NEXT_PUBLIC_STOCK_LOGO_BASE_URL;
const stockLogoUrl = stockLogoBaseUrl ? new URL(stockLogoBaseUrl) : null;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.30.1.60", "reseal-geiger-untried.ngrok-free.dev"],
  images: {
    remotePatterns: stockLogoUrl
      ? [
          {
            protocol: stockLogoUrl.protocol.replace(":", "") as "https" | "http",
            hostname: stockLogoUrl.hostname,
            pathname: stockLogoUrl.pathname.replace(/[^/]+$/, "") + "**",
          },
        ]
      : [],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
