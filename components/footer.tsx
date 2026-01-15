import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="py-16 border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center mb-6">
              <Image
                src="/images/e6-ae-b5-e8-90-bd-e3-83-86-e3-82-ad-e3-82-b9-e3-83-88.png"
                alt="AND HOLDINGS"
                width={200}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-muted-foreground leading-relaxed mb-6">
              AI蓄電池で飲食店・オフィスの電気代を最大48%削減。 太陽光パネル不要で、どこでも導入可能です。
            </p>
            <div className="flex gap-3">
              <a
                href="https://volta-inc.jp"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                公式サイト
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-5">製品情報</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li>
                <Link href="#features" className="hover:text-primary transition-colors">
                  特徴
                </Link>
              </li>
              <li>
                <Link href="#technology" className="hover:text-primary transition-colors">
                  仕組み
                </Link>
              </li>
              <li>
                <Link href="#benefits" className="hover:text-primary transition-colors">
                  導入効果
                </Link>
              </li>
              <li>
                <Link href="#specs" className="hover:text-primary transition-colors">
                  仕様
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-5">会社情報</h3>
            <div className="text-muted-foreground space-y-3">
              <p className="font-medium text-foreground">株式会社ANDホールディングス</p>
              <p className="leading-relaxed text-sm">
                〒536-0023
                <br />
                大阪府大阪市城東区東中浜
                <br />
                ２丁目２番１号
                <br />
                エムフィールド緑橋１階
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ANDホールディングス. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              利用規約
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
