"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, TrendingUp, X, CheckCircle2 } from "lucide-react"
import { getPriceOptimizationSuggestions } from "@/lib/utils"

const formatCurrency = (value) => {
  const numeric = Number.isFinite(value) ? value : 0
  return `$${numeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function PriceOptimizationDialog({ isOpen, onClose, cartItems, onApplySuggestion, onContinueToEnquiry }) {
  const suggestions = getPriceOptimizationSuggestions(cartItems || [])
  
  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-primary" />
            Price Optimization Suggestions
          </DialogTitle>
          <DialogDescription>
            Discover ways to reduce your total shipping cost by adjusting quantities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Your cart is already optimized! No additional savings available.
                </p>
              </CardContent>
            </Card>
          ) : (
            suggestions.map((suggestion, index) => (
              <Card key={index} className="border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {suggestion.type === 'add-quantity' ? (
                          <TrendingUp className="w-5 h-5 text-blue-500" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-green-500" />
                        )}
                        <h3 className="text-lg font-semibold">
                          {suggestion.type === 'add-quantity' 
                            ? `Add Quantity to Eliminate Admin Fee (${suggestion.containerType})`
                            : `Reduce Quantity to Fit Smaller Container (${suggestion.containerType})`
                          }
                        </h3>
                        <Badge variant="secondary" className="ml-2">
                          Save {formatCurrency(suggestion.savings)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {suggestion.changes.map((change, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium text-foreground">{change.productName}:</span>
                            <span>{change.currentQuantity} → {change.newQuantity}</span>
                            <span className="text-primary font-semibold">
                              ({change.change > 0 ? '+' : ''}{change.change} units)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Current Total</div>
                        <div className="text-lg font-semibold line-through text-muted-foreground">
                          {formatCurrency(suggestion.currentTotal)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">New Total</div>
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(suggestion.newTotal)}
                        </div>
                        <div className="text-sm font-semibold text-green-600 mt-1">
                          Save {formatCurrency(suggestion.savings)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {onApplySuggestion && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => {
                          onApplySuggestion(suggestion)
                          onClose()
                        }}
                        className="flex-1"
                        variant="default"
                      >
                        Apply This Suggestion
                      </Button>
                      {onContinueToEnquiry && (
                        <Button
                          onClick={() => {
                            onApplySuggestion(suggestion)
                            onClose()
                            setTimeout(() => {
                              onContinueToEnquiry()
                            }, 100)
                          }}
                          className="flex-1"
                        >
                          Apply & Submit Enquiry
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
