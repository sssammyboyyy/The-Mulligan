import type React from "react"
import type { Metadata } from "next"
import { Poppins, Playfair_Display } from "next/font/google"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  title: "The Mulligan | Premier Golf Simulator in Vanderbijlpark ",
  description:
    "Book 4-ball games, coaching, and practice sessions at The Mulligan. Top-tier golf simulation technology.",
  keywords:
    "golf simulator near me, indoor golf simulator near me, golf simulator Vanderbijlpark, indoor golf Gauteng, Augusta National simulator, golf simulation",
  openGraph: {
    title: "Elite Golf Sim Vanderbijlpark | World-Class Golf Simulator",
    description:
      "Experience Augusta National & premium golf simulation with 5000+ courses in Vanderbijlpark. Book online or walk in.",
    type: "website",
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["LocalBusiness", "SportsActivityLocation"],
              name: "Elite Golf Sim",
              description:
                "Vanderbijlpark's premier indoor golf simulator facility featuring Augusta National and 5000+ championship courses",
              address: {
                "@type": "PostalAddress",
                streetAddress: "38A Chopin St, Vanderbijlpark S. W. 5",
                addressLocality: "Vanderbijlpark",
                postalCode: "1911",
                addressRegion: "Gauteng",
                addressCountry: "ZA",
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "09:00",
                  closes: "20:00",
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: "Saturday",
                  opens: "08:00",
                  closes: "20:00",
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: "Sunday",
                  opens: "10:00",
                  closes: "16:00",
                },
              ],
              priceRange: "R250-R600",
              telephone: "+27-XX-XXX-XXXX",
              url: "https://your-actual-domain.com",
            }),
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>{children}</body>
    </html>
  )
}
