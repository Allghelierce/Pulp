"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { uid } from "@/app/lib/uid"
import type { FlashcardItem } from "@/app/types"

interface FlashcardViewProps {
  cards: FlashcardItem[]
  onChange: (cards: FlashcardItem[]) => void
  noteTitle: string
  theme: "light" | "dark"
  accent: string
  onStudyComplete?: (cardsReviewed: number, juiceEarned: number) => void
}

// SM-2 Spaced Repetition Algorithm
const calculateNextReview = (quality: number, card: FlashcardItem): FlashcardItem => {
  const { easeFactor } = card
  let { interval, repetitions } = card
  const now = Date.now()

  // Quality: 0-5, where 0=again, 1-2=hard, 3-4=good, 5=easy
  const newEase = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  if (quality < 3) {
    // Incorrect: restart interval
    interval = 1
    repetitions = 0
  } else {
    repetitions += 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 3
    else interval = Math.round(interval * newEase)
  }

  return {
    ...card,
    interval,
    easeFactor: newEase,
    repetitions,
    nextReviewDate: now + interval * 24 * 60 * 60 * 1000,
    lastReviewDate: now,
  }
}

export function FlashcardView({
  cards,
  onChange,
  noteTitle,
  theme,
  accent,
  onStudyComplete
}: FlashcardViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isStudyMode, setIsStudyMode] = useState(false)
  const [sessionCards, setSessionCards] = useState<string[]>([]) // cards due for review
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<{ show: boolean; type: "again" | "hard" | "good" | "easy" } | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  const bgColor = theme === "dark" ? "bg-[#0f0f12]" : "bg-[#fdfcf9]"
  const cardBg = theme === "dark" ? "bg-zinc-900/50" : "bg-white"
  const borderColor = theme === "dark" ? "border-zinc-700/50" : "border-zinc-200"
  const textColor = theme === "dark" ? "text-white" : "text-zinc-900"
  const mutedColor = theme === "dark" ? "text-zinc-400" : "text-zinc-600"

  // Initialize SRS fields for new cards
  useEffect(() => {
    const needsInit = cards.some(c => c.interval === undefined)
    if (needsInit) {
      const initialized = cards.map(c => ({
        ...c,
        interval: c.interval ?? 1,
        easeFactor: c.easeFactor ?? 2.5,
        repetitions: c.repetitions ?? 0,
        nextReviewDate: c.nextReviewDate ?? Date.now(),
      }))
      onChange(initialized)
    }
  }, [cards, onChange])

  // Get cards due for review (for study mode)
  const dueCards = useMemo(() => {
    return cards.filter(c => c.nextReviewDate <= now)
  }, [cards, now])

  // Handle study mode toggle
  const handleStudyToggle = (enable: boolean) => {
    if (enable) {
      // Randomize order of due cards
      const order = dueCards.map(c => c.id).sort(() => Math.random() - 0.5)
      setSessionCards(order)
      setStudiedCards(new Set())
      setCurrentIdx(0)
    } else {
      // End session
      if (studiedCards.size > 0 && onStudyComplete) {
        const juiceEarned = studiedCards.size * 2
        onStudyComplete(studiedCards.size, juiceEarned)
      }
    }
    setIsStudyMode(enable)
    setIsFlipped(false)
  }

  const displayCards = isStudyMode ? sessionCards.map(id => cards.find(c => c.id === id)!).filter(Boolean) : cards
  const currentCard = displayCards[currentIdx]
  const cardCount = displayCards.length

  const goToPrev = () => {
    setCurrentIdx(prev => Math.max(0, prev - 1))
    setIsFlipped(false)
  }

  const goToNext = () => {
    if (isStudyMode && currentCard) {
      setStudiedCards(prev => new Set([...prev, currentCard.id]))
    }
    setCurrentIdx(prev => Math.min(cardCount - 1, prev + 1))
    setIsFlipped(false)
  }

  const rateCard = (quality: number) => {
    if (!currentCard) return

    const qualityLabel = ["again", "hard", "good", "easy"][Math.min(quality, 3)] as "again" | "hard" | "good" | "easy"
    setFeedback({ show: true, type: qualityLabel })

    const updated = cards.map(c =>
      c.id === currentCard.id ? calculateNextReview(quality, c) : c
    )
    onChange(updated)

    setStudiedCards(prev => new Set([...prev, currentCard.id]))

    setTimeout(() => {
      setFeedback(null)
      setCurrentIdx(prev => Math.min(cardCount - 1, prev + 1))
      setIsFlipped(false)
    }, 600)
  }

  const addCard = () => {
    const now = Date.now()
    const newCard: FlashcardItem = {
      id: uid(),
      front: "",
      back: "",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: now,
    }
    onChange([...cards, newCard])
    setCurrentIdx(cards.length)
    setIsEditMode(true)
  }

  const deleteCard = () => {
    if (!currentCard) return
    const newCards = cards.filter(c => c.id !== currentCard.id)
    onChange(newCards)
    if (newCards.length > 0) {
      setCurrentIdx(Math.min(currentIdx, newCards.length - 1))
    }
  }

  const updateCard = (front: string, back: string) => {
    if (!currentCard) return
    const updated = cards.map(c =>
      c.id === currentCard.id ? { ...c, front, back } : c
    )
    onChange(updated)
  }

  // Statistics
  const stats = {
    new: cards.filter(c => c.repetitions === 0).length,
    learning: cards.filter(c => c.repetitions > 0 && c.interval < 7).length,
    review: cards.filter(c => c.interval >= 7).length,
  }

  const dueCount = dueCards.length
  const successRate = studiedCards.size > 0
    ? Math.round((Array.from(studiedCards).filter(id => {
        const card = cards.find(c => c.id === id)
        return card && card.repetitions > 0
      }).length / studiedCards.size) * 100)
    : 0

  return (
    <div className={`${bgColor} ${textColor} min-h-screen w-full flex flex-col`}>
      {/* Header */}
      <div className={`border-b ${borderColor} sticky top-0 z-10 backdrop-blur-sm`}>
        <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-dancing), cursive', color: accent }}>
              {noteTitle}
            </h1>
            <p className={`text-sm mt-1 ${mutedColor}`}>Spaced Repetition Study</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-2xl font-bold">{cardCount}</div>
              <div className={`text-xs ${mutedColor}`}>
                {isStudyMode ? `${Math.max(0, cardCount - currentIdx)} remaining` : `${dueCount} due`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-8 py-12">
        {!isStudyMode && !isEditMode && (
          // Stats Overview
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className={`${cardBg} rounded-2xl p-6 border ${borderColor}`}>
              <div className="text-sm font-semibold opacity-60 mb-1">New</div>
              <div className="text-3xl font-bold">{stats.new}</div>
            </div>
            <div className={`${cardBg} rounded-2xl p-6 border ${borderColor}`}>
              <div className="text-sm font-semibold opacity-60 mb-1">Learning</div>
              <div className="text-3xl font-bold">{stats.learning}</div>
            </div>
            <div className={`${cardBg} rounded-2xl p-6 border ${borderColor}`}>
              <div className="text-sm font-semibold opacity-60 mb-1">Due Today</div>
              <div className="text-3xl font-bold" style={{ color: accent }}>{dueCount}</div>
            </div>
          </motion.div>
        )}

        {cardCount > 0 ? (
          <>
            {isEditMode ? (
              // Edit Mode
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`${cardBg} rounded-2xl p-8 border-2 ${borderColor}`}
              >
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Edit Card {currentIdx + 1} of {cardCount}</h2>
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="text-sm font-semibold opacity-70 block mb-2">Front</label>
                      <textarea
                        value={currentCard.front}
                        onChange={e => updateCard(e.target.value, currentCard.back)}
                        className={`w-full h-40 p-4 rounded-lg border ${borderColor} outline-none resize-none ${cardBg}`}
                        style={{ color: "inherit" }}
                        placeholder="Question or prompt..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold opacity-70 block mb-2">Back</label>
                      <textarea
                        value={currentCard.back}
                        onChange={e => updateCard(currentCard.front, e.target.value)}
                        className={`w-full h-40 p-4 rounded-lg border ${borderColor} outline-none resize-none ${cardBg}`}
                        style={{ color: "inherit" }}
                        placeholder="Answer..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="px-6 py-2 rounded-lg font-semibold transition-colors"
                    style={{ backgroundColor: accent, color: theme === "dark" ? "#fff" : "#000" }}
                  >
                    Done
                  </button>
                  {currentIdx > 0 && (
                    <button
                      onClick={goToPrev}
                      className={`px-4 py-2 rounded-lg transition-colors ${borderColor} border`}
                    >
                      ← Prev
                    </button>
                  )}
                  {currentIdx < cardCount - 1 && (
                    <button
                      onClick={goToNext}
                      className={`px-4 py-2 rounded-lg transition-colors ${borderColor} border`}
                    >
                      Next →
                    </button>
                  )}
                  <button
                    onClick={addCard}
                    className={`px-4 py-2 rounded-lg transition-colors ${borderColor} border ml-auto`}
                  >
                    + Add Card
                  </button>
                  <button
                    onClick={deleteCard}
                    disabled={cardCount === 1}
                    className="px-4 py-2 rounded-lg text-red-500 transition-colors disabled:opacity-30"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Card Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={currentCard?.id}
                  className={`${cardBg} rounded-2xl border-2 ${borderColor} overflow-hidden mb-8 cursor-pointer transition-all`}
                  onClick={() => setIsFlipped(!isFlipped)}
                  style={{
                    perspective: "1000px",
                    minHeight: "400px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isFlipped ? "back" : "front"}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="text-center px-12 py-8 w-full"
                    >
                      <div className={`text-sm font-semibold uppercase tracking-widest mb-6 ${mutedColor}`}>
                        {isFlipped ? "Answer" : "Question"}
                      </div>
                      <div className="text-3xl font-medium leading-relaxed mb-4">
                        {isFlipped ? currentCard.back : currentCard.front}
                      </div>
                      <div className={`text-xs ${mutedColor}`}>Click to flip</div>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* Rating Buttons (Study Mode) */}
                {isStudyMode && isFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-4 gap-3 mb-8"
                  >
                    <button
                      onClick={() => rateCard(0)}
                      disabled={feedback?.show}
                      className="py-3 rounded-xl font-semibold transition-all disabled:opacity-50 text-white bg-red-500 hover:bg-red-600 active:scale-95"
                    >
                      Again
                    </button>
                    <button
                      onClick={() => rateCard(2)}
                      disabled={feedback?.show}
                      className="py-3 rounded-xl font-semibold transition-all disabled:opacity-50 text-white bg-orange-500 hover:bg-orange-600 active:scale-95"
                    >
                      Hard
                    </button>
                    <button
                      onClick={() => rateCard(3)}
                      disabled={feedback?.show}
                      className="py-3 rounded-xl font-semibold transition-all disabled:opacity-50 text-white bg-blue-500 hover:bg-blue-600 active:scale-95"
                    >
                      Good
                    </button>
                    <button
                      onClick={() => rateCard(5)}
                      disabled={feedback?.show}
                      className="py-3 rounded-xl font-semibold transition-all disabled:opacity-50 text-white bg-green-500 hover:bg-green-600 active:scale-95"
                    >
                      Easy
                    </button>
                  </motion.div>
                )}

                {/* Feedback Animation */}
                <AnimatePresence>
                  {feedback?.show && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="text-center mb-4"
                    >
                      <div className="inline-block px-6 py-3 rounded-xl font-semibold text-white"
                        style={{
                          backgroundColor: feedback.type === "again" ? "#ef4444" :
                            feedback.type === "hard" ? "#f97316" :
                            feedback.type === "good" ? "#3b82f6" : "#22c55e"
                        }}
                      >
                        {feedback.type === "again" && "↻ Again"}
                        {feedback.type === "hard" && "⚠ Hard"}
                        {feedback.type === "good" && "✓ Good"}
                        {feedback.type === "easy" && "★ Easy"}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <button
                    onClick={goToPrev}
                    disabled={currentIdx === 0 || isStudyMode}
                    className={`px-4 py-2 rounded-lg transition-colors ${borderColor} border disabled:opacity-30`}
                  >
                    ← Prev
                  </button>
                  <div className="text-sm font-medium min-w-24 text-center">
                    <span>{currentIdx + 1}</span>
                    <span className="opacity-50"> / {cardCount}</span>
                  </div>
                  <button
                    onClick={goToNext}
                    disabled={currentIdx === cardCount - 1 && !isStudyMode}
                    className={`px-4 py-2 rounded-lg transition-colors ${borderColor} border disabled:opacity-30`}
                  >
                    Next →
                  </button>
                </div>

                {/* Mode Toggles */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setIsEditMode(true)}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${!isStudyMode ? "bg-orange-500/20 text-orange-600" : "border " + borderColor}`}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleStudyToggle(!isStudyMode)}
                    disabled={dueCount === 0 && !isStudyMode}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors ${isStudyMode ? "text-green-600" : "disabled:opacity-30"}`}
                    style={isStudyMode ? { backgroundColor: accent + "20", color: accent } : {}}
                  >
                    {isStudyMode ? "✓ End Session" : `📚 Study (${dueCount} due)`}
                  </button>
                </div>

                {/* Study Session Stats */}
                {isStudyMode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`${cardBg} rounded-xl border ${borderColor} p-4 mt-8 text-center`}
                  >
                    <div className="text-sm opacity-70">Progress</div>
                    <div className="text-lg font-semibold mt-1">
                      {studiedCards.size} / {cardCount} reviewed
                    </div>
                    {successRate > 0 && (
                      <div className="text-xs opacity-60 mt-2">Success rate: {successRate}%</div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </>
        ) : (
          // Empty State
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-40">📚</div>
            <h2 className="text-2xl font-semibold mb-2">No cards yet</h2>
            <p className={`${mutedColor} mb-6`}>Create your first flashcard to get started</p>
            <button
              onClick={addCard}
              className="px-8 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: accent }}
            >
              + Create Your First Card
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
