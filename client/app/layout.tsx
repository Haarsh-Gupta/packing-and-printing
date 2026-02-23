import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertProvider } from "@/components/CustomAlert";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const bgColor = process.env.NEXT_PUBLIC_SITE_BG_COLOR || "#f8fafc";

  return (
    <html lang="en">
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
          <AuthProvider>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}