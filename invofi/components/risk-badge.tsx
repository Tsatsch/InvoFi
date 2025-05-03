import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RiskBadgeProps {
  score: number // 0-100
}

export function RiskBadge({ score }: RiskBadgeProps) {
  let variant: "outline" | "destructive" | "default" | "secondary" | null = null
  let label = ""

  if (score >= 80) {
    variant = "destructive"
    label = "High Risk"
  } else if (score >= 50) {
    variant = "secondary"
    label = "Medium Risk"
  } else {
    variant = "default"
    label = "Low Risk"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant}>{label}</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Risk Score: {score}/100</p>
          <p className="text-xs text-muted-foreground">Based on payment history, invoice size, and due date</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
