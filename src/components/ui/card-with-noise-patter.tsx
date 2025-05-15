import { cn } from '@/lib/utils'
import { motion } from "framer-motion"

interface NoisePatternCardProps {
  children: React.ReactNode
  className?: string
  patternClassName?: string
  overlayClassName?: string
}

export function NoisePatternCard({ 
  children, 
  className,
  patternClassName,
  overlayClassName
}: NoisePatternCardProps) {
  return (
    <motion.div
      className={cn(
        "border w-full rounded-md overflow-hidden",
        "bg-zinc-950",
        "border-zinc-900",
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className={cn(
        "size-full bg-repeat bg-[length:500px_500px]",
        "bg-noise-pattern",
        patternClassName
      )}>
        <div className={cn(
          "bg-zinc-950/30",
          overlayClassName
        )}>
          {children}
        </div>
      </div>
    </motion.div>
  )
}

export function NoisePatternCardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("text-left p-4 md:p-6", className)} 
      {...props} 
    />
  )
} 