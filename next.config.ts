import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deshabilitar source maps en producción — no exponer código fuente al browser
  productionBrowserSourceMaps: false,


  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=(), autoplay=(), encrypted-media=(), picture-in-picture=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.hcaptcha.com https://*.hcaptcha.com https://tracker.metricool.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.hcaptcha.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' blob: data: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.resend.com https://api.tiendanube.com https://gmail.googleapis.com https://www.googleapis.com https://oauth2.googleapis.com https://accounts.google.com https://www.tiendanube.com https://api.mercadopago.com https://*.hcaptcha.com https://tracker.metricool.com",
              "frame-src https://*.hcaptcha.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://www.mercadopago.com.ar https://mercadopago.com.ar",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Image domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
