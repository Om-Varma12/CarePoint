"use client"

import { Button } from "@/components/ui/button"
import { X, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface FAQModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectFAQ: (question: string) => void
}

const faqs = [
  {
    question: "My blood sugar is 180 mg/dL, what should I do?",
    answer: "A blood sugar level of 180 mg/dL is elevated. If you have diabetes, follow your doctor's management plan. Consider checking your diet, medication timing, and physical activity. If levels remain high or you feel unwell, contact your healthcare provider.",
    category: "Diabetes & Blood Sugar"
  },
  {
    question: "I can't sleep well at night, what should I do?",
    answer: "For better sleep: maintain a consistent sleep schedule, avoid screens 1 hour before bed, keep your room cool and dark, avoid caffeine after 2 PM, try relaxation techniques like deep breathing, and limit daytime naps. If insomnia persists for more than 2 weeks, consult a doctor.",
    category: "Sleep & Rest"
  },
  {
    question: "I'm experiencing excessive hair loss, what could be causing it?",
    answer: "Hair loss can be caused by stress, nutritional deficiencies (iron, protein, vitamins), hormonal changes, certain medications, or medical conditions. Ensure adequate protein intake, manage stress, and consider supplements after consulting a doctor. If losing more than 100 strands daily, see a dermatologist.",
    category: "Hair & Skin"
  },
  {
    question: "What's the difference between cold and flu symptoms?",
    answer: "Cold symptoms develop gradually and include runny nose, sneezing, and mild fatigue. Flu symptoms come suddenly with high fever (100-104°F), severe body aches, extreme fatigue, and dry cough. Flu is more severe and may require antiviral medication within 48 hours of symptom onset.",
    category: "Common Illnesses"
  },
  {
    question: "How much water should I drink daily?",
    answer: "General recommendation is 8-10 glasses (2-2.5 liters) daily, but needs vary based on activity level, climate, and health conditions. Good indicators of proper hydration: light yellow urine, no persistent thirst, and good energy levels. Increase intake during exercise or hot weather.",
    category: "Nutrition & Hydration"
  },
  {
    question: "I have frequent headaches, when should I be concerned?",
    answer: "Seek immediate care if headache is sudden and severe ('worst headache ever'), accompanied by fever, stiff neck, confusion, vision changes, or numbness. See a doctor if headaches are frequent (3+ per week), worsening, or not relieved by over-the-counter medication.",
    category: "Pain Management"
  },
  {
    question: "What are normal blood pressure readings?",
    answer: "Normal blood pressure is below 120/80 mmHg. Elevated is 120-129/80, Stage 1 hypertension is 130-139/80-89, and Stage 2 is 140+/90+. Monitor regularly, reduce salt intake, exercise, manage stress, and maintain healthy weight. Consult a doctor if consistently above 130/80.",
    category: "Heart Health"
  },
  {
    question: "How can I boost my immune system naturally?",
    answer: "Strengthen immunity by: getting 7-9 hours of sleep, eating fruits and vegetables rich in vitamins C and D, exercising regularly (30 minutes daily), managing stress through meditation or yoga, staying hydrated, avoiding smoking, and maintaining good hygiene. Consider vitamin D supplements if deficient.",
    category: "Preventive Care"
  },
  {
    question: "I feel anxious and stressed constantly, what can help?",
    answer: "Try deep breathing exercises (4-7-8 technique), regular physical activity, adequate sleep, limit caffeine, practice mindfulness or meditation, maintain social connections, and establish a routine. If anxiety interferes with daily life for more than 2 weeks, consider speaking with a mental health professional.",
    category: "Mental Health"
  },
  {
    question: "What should I do for a minor burn or cut?",
    answer: "For minor burns: cool under running water for 10-15 minutes, apply antibiotic ointment, cover with sterile bandage. For cuts: clean with soap and water, apply pressure to stop bleeding, use antibiotic ointment, cover with bandage. Seek medical care if burn is larger than 3 inches, cut is deep, or shows signs of infection.",
    category: "First Aid"
  }
]

export function FAQModal({ isOpen, onClose, onSelectFAQ }: FAQModalProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  if (!isOpen) return null

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  const handleAskQuestion = (question: string) => {
    onSelectFAQ(question)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-lg max-w-3xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Healthcare FAQs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Common health questions and guidance
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* FAQ List */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
            >
              {/* Question Header */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 pr-4">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {faq.category}
                  </span>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {faq.question}
                  </p>
                </div>
                {expandedIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {/* Answer Section */}
              {expandedIndex === index && (
                <div className="px-4 pb-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed mt-3 mb-4">
                    {faq.answer}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAskQuestion(faq.question)}
                    className="text-xs"
                  >
                    Ask this question in chat
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/30 rounded-b-lg">
          <p className="text-xs text-muted-foreground text-center">
            💡 These FAQs provide general guidance. Always consult a healthcare professional for personalized medical advice.
          </p>
        </div>
      </div>
    </div>
  )
}