"use client"

import { forwardRef, type ElementType, type RefObject } from "react"
import { motion, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"

type TimelineContentProps = {
  as?: ElementType
  children: React.ReactNode
  className?: string
  animationNum?: number
  timelineRef?: RefObject<HTMLElement>
  customVariants?: Variants
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.4 },
  }),
}

export const TimelineContent = forwardRef<HTMLElement, TimelineContentProps>(
  ({ as, children, className, animationNum = 0, timelineRef, customVariants }, ref) => {
    const Component = as ?? "div"
    const MotionComponent = motion(Component as ElementType)

    return (
      <MotionComponent
        ref={ref}
        className={cn(className)}
        custom={animationNum}
        initial="hidden"
        whileInView="visible"
        viewport={{
          once: true,
          amount: 0.2,
          root: timelineRef as RefObject<Element | null> | undefined,
        }}
        variants={customVariants ?? defaultVariants}
      >
        {children}
      </MotionComponent>
    )
  },
)

TimelineContent.displayName = "TimelineContent"

