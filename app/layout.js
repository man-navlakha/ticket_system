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
  title: {
    default: "Man's Ticket System | Professional Support Infrastructure",
    template: "%s | Man's Ticket System"
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
    title: "Man's Ticket System",
    description: "Streamline your support infrastructure with automated workflows and smart inventory tracking.",
    url: 'https://mans-ticket-system.vercel.app',
    siteName: "Man's Ticket System",
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
    title: "Man's Ticket System",
    description: "Invite-based support infrastructure for modern hardware teams.",
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
