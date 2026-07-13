import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ElementType, 
  title: string, 
  description: string, 
  action?: React.ReactNode 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 bg-muted/50 text-muted-foreground rounded-2xl flex items-center justify-center mb-6 border border-border">
        <Icon className="w-8 h-8 opacity-50" />
      </div>
      <h3 className="text-xl font-serif font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  )
}
