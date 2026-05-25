import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthErrorHandler from "@/components/auth/AuthErrorHandler";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Nova Analytics",
    template: "%s | Nova Analytics",
  },
  description:
    "Dashboard de analytics para e-commerce. TiendaNube, Meta Ads y Gmail en un solo lugar.",
  metadataBase: new URL("https://analytics.novaagency.info"),
  icons: {
    icon: [
      { url: "/logo-favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/logo-favicon.png", sizes: "96x96", type: "image/png" },
      { url: "/logo.png",         sizes: "192x192", type: "image/png" },
      { url: "/logo.png",         sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo-favicon.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://analytics.novaagency.info",
    siteName: "Nova Analytics",
    title: "Nova Analytics — Dashboard inteligente para e-commerce",
    description:
      "Centralizá TiendaNube, Meta Ads y Gmail en un solo dashboard con IA integrada.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Nova Analytics" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/logo.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      // Dark mode por defecto — la clase se maneja desde ThemeProvider
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/png" sizes="96x96" href="/logo-favicon.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/logo.png" />
        {/* Previene flash de tema incorrecto */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('nova-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} min-h-full flex flex-col bg-[#0a0a0f] text-[#F1F5F9] antialiased`}
      >
        {children}
        <AuthErrorHandler />
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
