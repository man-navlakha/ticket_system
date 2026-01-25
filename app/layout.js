import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    default: "Man's Support Desk | IT Infrastructure",
    template: "%s | Man's Support Desk"
  },
  description: "A high-performance, invite-only support ticket system with smart inventory management and real-time notifications.",
  keywords: ["ticket system", "support", "inventory management", "it support", "helpdesk"],
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
    title: "Man's Support Desk",
    description: "Streamline your IT support infrastructure with automated workflows and smart inventory tracking.",
    url: 'https://man-support-desk.netlify.app',
    siteName: "Man's Support Desk",
    images: [
      {
        url: '/favicon.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Man's Support Desk",
    description: "Invite-based IT support infrastructure for modern teams.",
    images: ['/favicon.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
