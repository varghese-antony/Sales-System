import * as React from "react"

import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col border border-border/50 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
  {
    variants: {
      density: {
        default: "gap-6 rounded-2xl py-6 px-6",
        compact: "gap-3 rounded-xl py-3 px-3",
      },
    },
    defaultVariants: {
      density: "default",
    },
  }
)

const cardHeaderVariants = cva(
  "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto]",
  {
    variants: {
      density: {
        default: "gap-1.5 px-6 [.border-b]:pb-6",
        compact: "gap-1 px-3 [.border-b]:pb-3",
      },
    },
    defaultVariants: {
      density: "default",
    },
  }
)

const cardContentVariants = cva("flex flex-col", {
  variants: {
    density: {
      default: "gap-4 px-6 py-0",
      compact: "gap-2.5 px-3 py-0",
    },
  },
  defaultVariants: {
    density: "default",
  },
})

const cardFooterVariants = cva("flex items-center", {
  variants: {
    density: {
      default: "px-6 [.border-t]:pt-6",
      compact: "px-3 [.border-t]:pt-3",
    },
  },
  defaultVariants: {
    density: "default",
  },
})

/**
 * @param {Object} props
 * @param {string} [props.className]
 * @param {"default" | "compact"} [props.density="default"] - Controls spacing density
 */
function Card({
  className,
  density = "default",
  ...props
}) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ density }), className)}
      {...props} />
  );
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 * @param {"default" | "compact"} [props.density="default"] - Controls spacing density
 */
function CardHeader({
  className,
  density = "default",
  ...props
}) {
  return (
    <div
      data-slot="card-header"
      className={cn(cardHeaderVariants({ density }), className)}
      {...props} />
  );
}

function CardTitle({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props} />
  );
}

function CardDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props} />
  );
}

function CardAction({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props} />
  );
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 * @param {"default" | "compact"} [props.density="default"] - Controls spacing density
 */
function CardContent({
  className,
  density = "default",
  ...props
}) {
  return (
    <div
      data-slot="card-content"
      className={cn(cardContentVariants({ density }), className)}
      {...props} />
  );
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 * @param {"default" | "compact"} [props.density="default"] - Controls spacing density
 */
function CardFooter({
  className,
  density = "default",
  ...props
}) {
  return (
    <div
      data-slot="card-footer"
      className={cn(cardFooterVariants({ density }), className)}
      {...props} />
  );
}

export {
  Card,
  cardVariants,
  CardHeader,
  cardHeaderVariants,
  CardFooter,
  cardFooterVariants,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardContentVariants,
}
