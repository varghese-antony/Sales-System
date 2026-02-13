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
  step = 1,
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
    
    let numValue = parseInt(inputValue)
    
    // Round up to nearest step (pcs_per_box) if step > 1
    if (step > 1 && numValue > 0) {
      numValue = Math.ceil(numValue / step) * step
    }
    
    // Ensure minimum
    if (numValue < min) {
      numValue = min
      // If step > 1, round up min to nearest step
      if (step > 1 && min > 0) {
        numValue = Math.ceil(min / step) * step
      }
    }
    
    // Ensure maximum
    if (numValue > max) {
      numValue = max
      // If step > 1, round down max to nearest step
      if (step > 1) {
        numValue = Math.floor(max / step) * step
      }
    }
    
    // Update the input value and notify parent
    setInputValue(numValue.toString())
    if (numValue !== value) {
      onChange(numValue)
    }
  }

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step)
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
      return Math.max(digits * 9 + 18 + 20, 50) // min 50px for sm
    } else if (size === "lg") {
      return Math.max(digits * 14 + 28 + 28, 85) // min 85px for lg  
    } else {
      return Math.max(digits * 11 + 22 + 24, 70) // min 70px for default
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