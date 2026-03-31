"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export default function PulpLanding() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [platform, setPlatform] = useState<"mac" | "windows" | "linux" | null>(null)

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent
    if (ua.indexOf("Mac") > -1) setPlatform("mac")
    else if (ua.indexOf("Windows") > -1) setPlatform("windows")
    else if (ua.indexOf("Linux") > -1) setPlatform("linux")
  }, [])

  const handleInstall = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      // Simulate download progress for UX
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + Math.random() * 30
        })
      }, 300)

      // Fetch download URL from API
      const response = await fetch(`/api/download?platform=${platform || "mac"}`)
      const data = await response.json()

      // Complete progress
      clearInterval(interval)
      setDownloadProgress(100)

      // Trigger download
      if (data.url) {
        const link = document.createElement("a")
        link.href = data.url
        link.target = "_blank"
        link.click()
      }

      // Reset after completion
      setTimeout(() => {
        setIsDownloading(false)
        setDownloadProgress(0)
      }, 1500)
    } catch (error) {
      console.error("Download failed:", error)
      setIsDownloading(false)
      setDownloadProgress(0)
      alert("Download failed. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32 flex flex-col items-center justify-center min-h-screen">
        {/* Logo/Title */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="text-7xl font-bold" style={{ fontFamily: 'var(--font-dancing), cursive', color: '#D4AF37', letterSpacing: '0.05em' }}>
            Pulp
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-zinc-300 mb-12 text-center max-w-2xl"
          style={{ fontFamily: '"EB Garamond", Georgia, serif' }}
        >
          A playful, minimalist note-taking app where your thoughts feel like handwritten pages in a vintage journal
        </motion.p>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 w-full"
        >
          {[
            { emoji: "✍️", title: "Handwritten Feel", desc: "Jittery, organic text animations" },
            { emoji: "📚", title: "Notebook Shelf", desc: "Organize notes with beautiful 3D shelf" },
            { emoji: "🎨", title: "Customizable", desc: "Themes, fonts, and colors" }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="p-6 rounded-xl bg-zinc-800/40 border border-zinc-700/50 text-center"
            >
              <div className="text-4xl mb-3">{feature.emoji}</div>
              <h3 className="font-semibold text-lg mb-2" style={{ color: '#D4AF37' }}>
                {feature.title}
              </h3>
              <p className="text-zinc-400 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Download Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative"
        >
          <button
            onClick={handleInstall}
            disabled={isDownloading}
            className={`relative px-10 py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
              isDownloading
                ? "bg-amber-600/80 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:shadow-orange-500/50"
            }`}
            style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: '1.4rem' }}
          >
            {isDownloading ? (
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  ⚙️
                </motion.div>
                <span>{Math.round(downloadProgress)}%</span>
              </div>
            ) : (
              `Install Pulp${platform ? ` for ${platform}` : ""}`
            )}
          </button>

          {/* Download Progress Bar */}
          {isDownloading && (
            <motion.div
              className="absolute top-full mt-4 w-64 h-2 bg-zinc-700 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                style={{ width: `${downloadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Version info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 text-zinc-500 text-sm"
        >
          v1.0.0 • Open source • macOS, Windows, Linux
        </motion.p>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 text-zinc-600"
        >
          ↓
        </motion.div>
      </div>

      {/* Footer Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 py-20 px-6 border-t border-zinc-700/50"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8" style={{ color: '#D4AF37' }}>
            Perfect for your creative thoughts
          </h2>
          <p className="text-zinc-300 text-lg mb-8">
            Whether you're brainstorming ideas, journaling daily thoughts, or organizing projects, Pulp provides a delightful experience that feels like writing on real paper.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-zinc-400">
            <span>✓ Fast & Responsive</span>
            <span>✓ Privacy Focused</span>
            <span>✓ No Subscriptions</span>
            <span>✓ Cloud Sync</span>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
