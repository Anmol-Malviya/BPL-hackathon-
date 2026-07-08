import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PwaRegister from "./PwaRegister";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata = {
  title: "Secure OS | QR & Phishing Link Scanner",
  description: "Mobile-first scanner to check links and QR codes for phishing attempts instantly, offline-ready.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Secure OS",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        {/* Kill stale service workers immediately to prevent reload loops */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for (var i = 0; i < registrations.length; i++) {
                registrations[i].unregister();
              }
            });
          }
        `}} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/ic_app_logo.png" type="image/png" />
        <meta name="theme-color" content="#060411" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
