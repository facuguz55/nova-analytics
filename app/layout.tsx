import type { Metadata } from "next";
import { Syne, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nova Analytics",
    template: "%s | Nova Analytics",
  },
  description:
    "Dashboard de analytics para e-commerce. TiendaNube, Meta Ads y Gmail en un solo lugar.",
  metadataBase: new URL("https://analytics.novaagency.info"),
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://analytics.novaagency.info",
    siteName: "Nova Analytics",
    title: "Nova Analytics — Dashboard inteligente para e-commerce",
    description:
      "Centralizá TiendaNube, Meta Ads y Gmail en un solo dashboard con IA integrada.",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: false, // SaaS — no indexable
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
        className={`${syne.variable} ${barlowCondensed.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
