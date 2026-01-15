"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const formUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSdVRVxurB8AOO9KT1-Mv5kmM3A_VawLS-gB6mfW2Ia4LO-DuQ/viewform?usp=header"

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-card/95 backdrop-blur-md shadow-sm border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/e6-ae-b5-e8-90-bd-e3-83-86-e3-82-ad-e3-82-b9-e3-83-88.png"
              alt="AND HOLDINGS"
              width={200}
              height={40}
              className="h-8 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              特徴
            </Link>
            <Link
              href="#technology"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              仕組み
            </Link>
            <Link
              href="#benefits"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              導入効果
            </Link>
            <Link
              href="#specs"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              仕様
            </Link>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              asChild
            >
              <a href={formUrl} target="_blank" rel="noopener noreferrer">
                お問い合わせ
              </a>
            </Button>
          </nav>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="メニューを開く"
          >
            {isMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden py-6 border-t border-border bg-card/95 backdrop-blur-md">
            <div className="flex flex-col gap-4">
              <Link
                href="#features"
                className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              >
                特徴
              </Link>
              <Link
                href="#technology"
                className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              >
                仕組み
              </Link>
              <Link
                href="#benefits"
                className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              >
                導入効果
              </Link>
              <Link
                href="#specs"
                className="text-base font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              >
                仕様
              </Link>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2" asChild>
                <a href={formUrl} target="_blank" rel="noopener noreferrer">
                  お問い合わせ
                </a>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
