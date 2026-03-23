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
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Outfit:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Geist:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body
        className="flex flex-col min-h-screen"
        suppressHydrationWarning
      >
        <AlertProvider>
          <StoreProvider>
            <AuthProvider>
              <Header />
              <main className="grow">{children}</main>
              <Footer />
            </AuthProvider>
          </StoreProvider>
        </AlertProvider>
      </body>
    </html>
  );
}