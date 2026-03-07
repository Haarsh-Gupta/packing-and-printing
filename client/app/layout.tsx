import "./animate.css";
import "./shadcn.css";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertProvider } from "@/components/CustomAlert";
import { AuthProvider } from "@/context/AuthContext";
import { StoreProvider } from "@/lib/store/StoreProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const bgColor = process.env.NEXT_PUBLIC_SITE_BG_COLOR || "#f8fafc";

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Geist:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body
        className="flex flex-col min-h-screen"
        style={{
          backgroundColor: bgColor,
          // @ts-ignore
          "--site-bg": bgColor
        } as React.CSSProperties}
        suppressHydrationWarning
      >
        <AlertProvider>
          <StoreProvider>
            <AuthProvider>
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </AuthProvider>
          </StoreProvider>
        </AlertProvider>
      </body>
    </html>
  );
}