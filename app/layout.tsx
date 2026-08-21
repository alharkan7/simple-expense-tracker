import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./components/providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Finance Tracker",
  description: "Simple Finance Tracker to Google Sheets",
  icons: [
    {
      url: "/wallet.png"
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function isFormControlFocused() {
                const activeElement = document.activeElement;
                return activeElement && (
                  activeElement.tagName === 'INPUT' ||
                  activeElement.tagName === 'TEXTAREA' ||
                  activeElement.tagName === 'SELECT' ||
                  activeElement.isContentEditable
                );
              }

              function setVH(force) {
                // On mobile, opening the software keyboard fires a resize event.
                // Keep the app shell at its original height so the chart and footer
                // are not compressed into the visible area above the keyboard.
                if (!force && isFormControlFocused()) return;

                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', vh + 'px');
              }

              setVH(true);
              window.addEventListener('resize', function () { setVH(false); });
              window.addEventListener('orientationchange', function () {
                window.setTimeout(function () { setVH(true); }, 250);
              });
              document.addEventListener('focusout', function () {
                window.setTimeout(function () {
                  if (!isFormControlFocused()) setVH(true);
                }, 250);
              });
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full max-w-full`}
      >
        <Providers>
          <div className="w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
