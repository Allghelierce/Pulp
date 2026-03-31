"use client"

import { useState, useMemo } from "react"
import { uid } from "@/app/lib/uid"
import type { FlashcardItem } from "@/app/types"

interface FlashcardViewProps {
  cards: FlashcardItem[]
  onChange: (cards: FlashcardItem[]) => void
  noteTitle: string
  theme: "light" | "dark"
}

export function FlashcardView({ cards, onChange, noteTitle, theme }: FlashcardViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isStudyMode, setIsStudyMode] = useState(false)
  const [seenCards, setSeenCards] = useState<Set<string>>(new Set())
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([])

  const displayCards = isStudyMode ? shuffledOrder.map(i => cards[i]) : cards
  const currentCard = displayCards[currentIdx]
  const cardCount = displayCards.length

  const handleStudyToggle = (enable: boolean) => {
    if (enable) {
      const order = [...Array(cards.length).keys()].sort(() => Math.random() - 0.5)
      setShuffledOrder(order)
      setSeenCards(new Set())
    }
    setIsStudyMode(enable)
    setCurrentIdx(0)
    setIsFlipped(false)
  }

  const goToPrev = () => {
    setCurrentIdx(Math.max(0, currentIdx - 1))
    setIsFlipped(false)
  }

  const goToNext = () => {
    if (isStudyMode) {
      setSeenCards(new Set([...seenCards, currentCard.id]))
    }
    setCurrentIdx(Math.min(cardCount - 1, currentIdx + 1))
    setIsFlipped(false)
  }

  const addCard = () => {
    const newCard: FlashcardItem = { id: uid(), front: "", back: "" }
    onChange([...cards, newCard])
    setCurrentIdx(cards.length)
    setIsEditMode(true)
  }

  const deleteCard = () => {
    const newCards = cards.filter(c => c.id !== currentCard.id)
    onChange(newCards)
    if (newCards.length > 0) {
      setCurrentIdx(Math.min(currentIdx, newCards.length - 1))
    }
  }

  const updateCard = (front: string, back: string) => {
    const updated = cards.map(c => c.id === currentCard.id ? { ...c, front, back } : c)
    onChange(updated)
  }

  const bgColor = theme === "dark" ? "bg-zinc-900" : "bg-white"
  const textColor = theme === "dark" ? "text-white" : "text-zinc-900"
  const borderColor = theme === "dark" ? "border-zinc-700" : "border-zinc-200"
  const hoverBg = theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"

  return (
    <div className={`${bgColor} ${textColor} w-full min-h-screen flex flex-col items-center justify-center gap-8 p-8`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-2">Flashcards · {noteTitle}</h1>
        <p className="text-sm opacity-60">{cardCount} cards</p>
      </div>

      {cardCount > 0 ? (
        <>
          {/* Card Display */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full max-w-2xl aspect-video rounded-lg shadow-lg cursor-pointer transition-all duration-300 flex items-center justify-center text-center p-8 border-2 ${borderColor}`}
            style={{
              perspective: "1000px",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              transformStyle: "preserve-3d",
              transition: "transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            }}
          >
            <div className="text-2xl font-medium leading-relaxed">
              {isFlipped ? currentCard.back : currentCard.front}
            </div>
            <div className="absolute top-4 left-4 text-xs opacity-40">{isFlipped ? "Back" : "Front"}</div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={goToPrev}
              disabled={currentIdx === 0}
              className={`px-4 py-2 rounded ${hoverBg} disabled:opacity-30 transition-colors`}
            >
              ← Prev
            </button>
            <span className="text-sm font-medium min-w-16 text-center">
              {currentIdx + 1} / {cardCount}
            </span>
            <button
              onClick={goToNext}
              disabled={currentIdx === cardCount - 1}
              className={`px-4 py-2 rounded ${hoverBg} disabled:opacity-30 transition-colors`}
            >
              Next →
            </button>
            <div className="w-px h-6" style={{ backgroundColor: "currentColor", opacity: 0.2 }} />
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded transition-colors ${isEditMode ? "bg-orange-500 text-white" : hoverBg}`}
            >
              ✏️ {isEditMode ? "Done" : "Edit"}
            </button>
          </div>

          {/* Edit Mode */}
          {isEditMode && (
            <div className={`w-full max-w-4xl grid grid-cols-2 gap-4 p-6 rounded-lg border-2 ${borderColor}`}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium opacity-70">Front</label>
                <textarea
                  value={currentCard.front}
                  onChange={e => updateCard(e.target.value, currentCard.back)}
                  className={`w-full h-40 p-3 rounded border ${borderColor} outline-none resize-none ${bgColor}`}
                  style={{ color: "inherit" }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium opacity-70">Back</label>
                <textarea
                  value={currentCard.back}
                  onChange={e => updateCard(currentCard.front, e.target.value)}
                  className={`w-full h-40 p-3 rounded border ${borderColor} outline-none resize-none ${bgColor}`}
                  style={{ color: "inherit" }}
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  onClick={addCard}
                  className={`flex-1 py-2 rounded font-medium transition-colors ${hoverBg}`}
                >
                  + Add Card
                </button>
                <button
                  onClick={deleteCard}
                  disabled={cardCount === 1}
                  className="px-6 py-2 rounded font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Study Mode */}
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isStudyMode}
                onChange={e => handleStudyToggle(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Study Mode</span>
            </label>
            {isStudyMode && (
              <span className="opacity-60">
                {seenCards.size} seen · {Math.max(0, cardCount - seenCards.size)} remaining
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="text-lg opacity-60 mb-4">No cards yet</p>
          <button
            onClick={addCard}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${hoverBg}`}
          >
            + Add Your First Card
          </button>
        </div>
      )}
    </div>
  )
}
