import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Man's Support Desk | Enterprise IT Ticketing System",
    template: "%s | Man's Support Desk"
  },
  description: "A high-performance, invite-only support ticket system with smart inventory management and real-time notifications. specific for enterprise IT infrastructure.",
  keywords: ["ticket system", "support", "inventory management", "it support", "helpdesk", "enterprise ticketing system", "IT asset management", "help desk software", "issue tracking"],
  authors: [{ name: "Man" }],
  creator: "Man",
  publisher: "Man",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: "Man's Support Desk | Enterprise IT Ticketing System",
    description: "Streamline your IT support infrastructure with automated workflows and smart inventory tracking. Built for modern teams.",
    url: 'https://man-support-desk.netlify.app',
    siteName: "Man's Support Desk",
    images: [
      {
        url: '/favicon.png',
        width: 800,
        height: 600,
        alt: "Man's Support Desk Logo",
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Man's Support Desk | Enterprise IT Ticketing System",
    description: "Invite-based IT support infrastructure for modern teams. Manage tickets and inventory in one place.",
    images: ['/favicon.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vj9qj3k6dd");
          `}
        </Script>
      </body>
    </html>
  );
}
