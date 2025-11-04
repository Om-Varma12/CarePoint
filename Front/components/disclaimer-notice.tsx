import { Info } from "lucide-react"

export function DisclaimerNotice() {
  return (
    <div className="mb-4 flex items-start gap-3 bg-[#FEF3C7] border-l-3 border-l-warning px-4 py-3 rounded-lg">
      <Info className="w-5 h-5 text-[#92400E] flex-shrink-0 mt-0.5" />
      <p className="text-sm text-[#92400E]">
        CarePoint provides general guidance for healthcare, college wellbeing, and emergencies. Always consult a healthcare professional or call emergency services for serious concerns.
      </p>
    </div>
  )
}