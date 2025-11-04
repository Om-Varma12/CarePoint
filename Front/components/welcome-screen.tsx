"use client"

import { Heart } from "lucide-react"
import { Card } from "@/components/ui/card"

interface WelcomeScreenProps {
  onSelectQuestion: (question: string) => void
}

const suggestedQuestions = [
  "What are the signs of a medical emergency?",
  "How can I manage stress during exams?",
  "Tips for better sleep in college dorms",
  "When should I go to urgent care vs ER?",
]

export function WelcomeScreen({ onSelectQuestion }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <Heart className="w-20 h-20 text-primary mb-6" />

      <h1 className="text-4xl font-bold text-foreground mb-3 text-center">Welcome to CarePoint</h1>

      <p className="text-base text-muted-foreground mb-12 text-center max-w-2xl">
        Your trusted companion for healthcare guidance, college wellbeing, and emergency support.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
        {suggestedQuestions.map((question, index) => (
          <Card
            key={index}
            className="p-5 cursor-pointer transition-all hover:border-primary hover:shadow-md"
            onClick={() => onSelectQuestion(question)}
          >
            <p className="text-sm font-medium text-foreground">{question}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}