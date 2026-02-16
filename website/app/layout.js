import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Accredilink Community Response Taskforce | Care Services in Denbighshire, Conwy & Wrexham",
    template: "%s | Accredilink CRT",
  },
  description:
    "Professional domiciliary care, emergency response, respite, palliative care and training services across Denbighshire, Conwy and Wrexham. Regulated by Care Inspectorate Wales.",
  keywords: [
    "domiciliary care",
    "care services",
    "Denbighshire",
    "Conwy",
    "Wrexham",
    "North Wales",
    "emergency response",
    "palliative care",
    "respite care",
    "Care Inspectorate Wales",
    "CIW",
  ],
  openGraph: {
    title: "Accredilink Community Response Taskforce",
    description: "Compassionate care services across Denbighshire, Conwy and Wrexham",
    type: "website",
    locale: "en_GB",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
