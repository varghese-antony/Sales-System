"use client"

import { useState, useEffect } from "react"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function QuantitySelector({ 
  value = 1, 
  onChange, 
  min = 1, 
  max = 99999, 
  size = "default",
  className 
}) {
  const [inputValue, setInputValue] = useState(value.toString())

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    
    // Allow empty string for better UX while typing
    if (newValue === '') {
      setInputValue('')
      return
    }
    
    // Only allow numeric input
    if (!/^\d+$/.test(newValue)) {
      return
    }
    
    setInputValue(newValue)
    
    // Update parent if it's a valid number within range
    const numValue = parseInt(newValue)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue)
    }
  }

  const handleInputBlur = () => {
    // If empty or invalid, reset to current value or minimum
    if (inputValue === '' || isNaN(parseInt(inputValue))) {
      setInputValue(value.toString())
      return
    }
    
    const numValue = parseInt(inputValue)
    if (numValue < min) {
      setInputValue(min.toString())
      onChange(min)
    } else if (numValue > max) {
      setInputValue(max.toString())
      onChange(max)
    } else if (numValue !== value) {
      // Ensure the value is properly set
      onChange(numValue)
    }
  }

  const handleDecrement = () => {
    const newValue = Math.max(min, value - 1)
    onChange(newValue)
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, value + 1)
    onChange(newValue)
  }



  const buttonSizeClasses = {
    sm: "h-8 w-8 p-0",
    default: "h-10 w-10 p-0", 
    lg: "h-12 w-12 p-0"
  }

  const inputSizeClasses = {
    sm: "h-8 text-sm",
    default: "h-10",
    lg: "h-12 text-lg"
  }

  // Calculate width based on the number of digits, with minimum widths
  const getInputWidth = () => {
    // Use the longer of current input or actual value, minimum 2 digits
    const currentLength = inputValue.length || 1
    const valueLength = value.toString().length
    const digits = Math.max(currentLength, valueLength, 2)
    
    // Add extra padding for different sizes
    if (size === "sm") {
      return Math.max(digits * 9 + 20, 50) // min 50px for sm
    } else if (size === "lg") {
      return Math.max(digits * 14 + 28, 85) // min 85px for lg  
    } else {
      return Math.max(digits * 11 + 24, 70) // min 70px for default
    }
  }

  return (
    <div className={cn("flex items-center border rounded-md bg-background", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDecrement}
        disabled={value <= min}
        className={cn("hover:bg-muted rounded-r-none border-r flex-shrink-0", buttonSizeClasses[size])}
      >
        <Minus className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
      </Button>
      
      <Input
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        min={min}
        max={max}
        style={{ width: `${getInputWidth()}px` }}
        className={cn(
          "border-0 rounded-none text-center font-medium focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none flex-shrink-0",
          inputSizeClasses[size]
        )}
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleIncrement}
        disabled={value >= max}
        className={cn("hover:bg-muted rounded-l-none border-l flex-shrink-0", buttonSizeClasses[size])}
      >
        <Plus className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
      </Button>
    </div>
  )
}