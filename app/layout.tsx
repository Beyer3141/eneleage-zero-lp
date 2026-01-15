import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Noto_Sans_JP } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _notoSansJP = Noto_Sans_JP({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ENELEAGE Zero | AI蓄電池で電気代最大48%削減",
  description:
    "太陽光パネル不要のAI蓄電池ENELEAGE Zero。飲食店の電気代を最大48%削減し、BCP対策も万全に。室内設置型で導入も簡単。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
