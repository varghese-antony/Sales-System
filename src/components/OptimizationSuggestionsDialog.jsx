"use client"

import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const formatCurrency = (value) => {
  const numeric = (typeof value === 'number' && Number.isFinite(value))
    ? value
    : (parseFloat(String(value || 0).replace(/[^\d.-]/g, '')) || 0)
  return `$${numeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function OptimizationSuggestionsDialog({
  open,
  onOpenChange,
  optimizationSuggestions,
  cartTotal,
  tariffAmount,
  onContinue,
  onSubmitEnquiry
}) {
  if (!optimizationSuggestions) return null

  // Calculate current total cost
  const currentTotalCost = cartTotal + tariffAmount + (optimizationSuggestions.currentShippingCost || 0)
  
  // Calculate optimized total cost (use the best optimization available)
  let optimizedTotalCost = currentTotalCost
  let optimizedShippingCost = optimizationSuggestions.currentShippingCost
  let bestSavings = 0
  
  // Check consolidation fee optimization
  if (optimizationSuggestions.hasConsolidationFee) {
    const consolidationOptimizedCost = optimizationSuggestions.consolidationFeeOptimizedShippingCost || optimizationSuggestions.optimizedShippingCost
    const consolidationSavings = optimizationSuggestions.consolidationFeeSavings || optimizationSuggestions.savings || 0
    if (consolidationOptimizedCost && consolidationSavings > bestSavings) {
      optimizedShippingCost = consolidationOptimizedCost
      optimizedTotalCost = cartTotal + tariffAmount + optimizedShippingCost
      bestSavings = consolidationSavings
    }
  }
  
  // Check 40ft to 20ft optimization (may have better savings)
  if (optimizationSuggestions.using40ftContainer) {
    const containerOptimizedCost = optimizationSuggestions.containerDowngradeOptimizedShippingCost || optimizationSuggestions.optimizedShippingCost
    const containerSavings = optimizationSuggestions.containerDowngradeSavings || optimizationSuggestions.savings || 0
    if (containerOptimizedCost && containerSavings > bestSavings) {
      optimizedShippingCost = containerOptimizedCost
      optimizedTotalCost = cartTotal + tariffAmount + optimizedShippingCost
      bestSavings = containerSavings
    }
  }
  
  // Check max capacity warning optimization
  if (optimizationSuggestions.atMaxCapacity) {
    const maxCapacityOptimizedCost = optimizationSuggestions.maxCapacityWarningOptimizedShippingCost || optimizationSuggestions.optimizedShippingCost
    const maxCapacitySavings = optimizationSuggestions.maxCapacityWarningSavings || optimizationSuggestions.savings || 0
    if (maxCapacityOptimizedCost && maxCapacitySavings > bestSavings) {
      optimizedShippingCost = maxCapacityOptimizedCost
      optimizedTotalCost = cartTotal + tariffAmount + optimizedShippingCost
      bestSavings = maxCapacitySavings
    }
  }
  
  const totalSavings = currentTotalCost - optimizedTotalCost

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Shipping Cost Optimization
          </DialogTitle>
          <DialogDescription>
            We found opportunities to optimize your shipping costs
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Consolidation Fee Suggestion */}
          {optimizationSuggestions.hasConsolidationFee && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Remove Consolidation Fee
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    You're currently paying a consolidation fee of {formatCurrency(optimizationSuggestions.consolidationFeeSavings || optimizationSuggestions.savings || 650)}.
                  </p>
                  {optimizationSuggestions.piecesToAddToRemoveFee && (
                    <div className="bg-white dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                        Add {optimizationSuggestions.piecesToAddToRemoveFee} more piece{optimizationSuggestions.piecesToAddToRemoveFee !== 1 ? 's' : ''} to reach 97% container utilization and remove the consolidation fee.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Current shipping cost:</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100">{formatCurrency(optimizationSuggestions.currentShippingCost)}</span>
                        </div>
                        {optimizationSuggestions.currentShippingPerUnit !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 dark:text-blue-300">Current per-piece shipping:</span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">{formatCurrency(optimizationSuggestions.currentShippingPerUnit)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Optimized shipping cost:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(optimizationSuggestions.consolidationFeeOptimizedShippingCost || optimizationSuggestions.optimizedShippingCost)}</span>
                        </div>
                        {(optimizationSuggestions.consolidationFeeOptimizedShippingPerUnit !== undefined || optimizationSuggestions.optimizedShippingPerUnit !== undefined) && (
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 dark:text-blue-300">Optimized per-piece shipping:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(optimizationSuggestions.consolidationFeeOptimizedShippingPerUnit || optimizationSuggestions.optimizedShippingPerUnit)}</span>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700 flex items-center justify-between">
                          <span className="font-semibold text-blue-900 dark:text-blue-100">Shipping savings:</span>
                          <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(optimizationSuggestions.consolidationFeeSavings || optimizationSuggestions.savings)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Max Capacity Warning */}
          {optimizationSuggestions.atMaxCapacity && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Maximum Container Capacity Reached
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                    Your order has reached {optimizationSuggestions.utilizationPercentage?.toFixed(1) || '97'}% of the container capacity. The container is at maximum capacity and full container price is being applied.
                    {optimizationSuggestions.wouldCostMoreToReduce && (
                      <span className="block mt-2 font-medium">
                        Note: Reducing quantity would add a consolidation fee, making it more expensive. It's optimal to keep the current quantity.
                      </span>
                    )}
                  </p>
                  {optimizationSuggestions.piecesToReduceForMaxCapacity && !optimizationSuggestions.wouldCostMoreToReduce && (
                    <div className="bg-white dark:bg-red-900/30 p-3 rounded border border-red-200 dark:border-red-700">
                      {optimizationSuggestions.wouldCostMore ? (
                        <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-3">
                          Reducing {optimizationSuggestions.piecesToReduceForMaxCapacity} piece{optimizationSuggestions.piecesToReduceForMaxCapacity !== 1 ? 's' : ''} would bring you below 97% capacity, but would add a consolidation fee, making it more expensive. It's better to keep the current quantity at maximum capacity.
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-3">
                          Reduce {optimizationSuggestions.piecesToReduceForMaxCapacity} piece{optimizationSuggestions.piecesToReduceForMaxCapacity !== 1 ? 's' : ''} to get below 97% capacity and potentially reduce shipping costs.
                        </p>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-red-700 dark:text-red-300">Current shipping cost:</span>
                          <span className="font-semibold text-red-900 dark:text-red-100">{formatCurrency(optimizationSuggestions.currentShippingCost)}</span>
                        </div>
                        {optimizationSuggestions.currentShippingPerUnit !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-red-700 dark:text-red-300">Current per-piece shipping:</span>
                            <span className="font-semibold text-red-900 dark:text-red-100">{formatCurrency(optimizationSuggestions.currentShippingPerUnit)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-red-700 dark:text-red-300">If reduced, shipping cost:</span>
                          <span className={`font-semibold ${optimizationSuggestions.wouldCostMore ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(optimizationSuggestions.maxCapacityWarningOptimizedShippingCost || optimizationSuggestions.optimizedShippingCost)}
                          </span>
                        </div>
                        {(optimizationSuggestions.maxCapacityWarningOptimizedShippingPerUnit !== undefined || optimizationSuggestions.optimizedShippingPerUnit !== undefined) && (
                          <div className="flex items-center justify-between">
                            <span className="text-red-700 dark:text-red-300">If reduced, per-piece shipping:</span>
                            <span className={`font-semibold ${optimizationSuggestions.wouldCostMore ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {formatCurrency(optimizationSuggestions.maxCapacityWarningOptimizedShippingPerUnit || optimizationSuggestions.optimizedShippingPerUnit)}
                            </span>
                          </div>
                        )}
                        {optimizationSuggestions.maxCapacityWarningSavings !== undefined && optimizationSuggestions.maxCapacityWarningSavings !== 0 && (
                          <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700 flex items-center justify-between">
                            <span className="font-semibold text-red-900 dark:text-red-100">
                              {optimizationSuggestions.wouldCostMore ? 'Additional cost:' : 'Potential savings:'}
                            </span>
                            <span className={`font-bold ${optimizationSuggestions.wouldCostMore ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {optimizationSuggestions.wouldCostMore 
                                ? formatCurrency(Math.abs(optimizationSuggestions.maxCapacityWarningSavings))
                                : formatCurrency(optimizationSuggestions.maxCapacityWarningSavings)
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* 40ft to 20ft Container Suggestion */}
          {optimizationSuggestions.using40ftContainer && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Reduce Shipping Cost with 20ft Container
                  </h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                    Your order currently requires a 40ft container. You can reduce the quantity to fit in a 20ft container and save on shipping.
                  </p>
                  {optimizationSuggestions.piecesToReduceFor20ft && (
                    <div className="bg-white dark:bg-orange-900/30 p-3 rounded border border-orange-200 dark:border-orange-700">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-3">
                        Reduce {optimizationSuggestions.piecesToReduceFor20ft} piece{optimizationSuggestions.piecesToReduceFor20ft !== 1 ? 's' : ''} to fit in a 20ft container.
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-orange-700 dark:text-orange-300">Current shipping (40ft):</span>
                          <span className="font-semibold text-orange-900 dark:text-orange-100">{formatCurrency(optimizationSuggestions.currentShippingCost)}</span>
                        </div>
                        {optimizationSuggestions.currentShippingPerUnit !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Current per-piece shipping:</span>
                            <span className="font-semibold text-orange-900 dark:text-orange-100">{formatCurrency(optimizationSuggestions.currentShippingPerUnit)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-orange-700 dark:text-orange-300">Optimized shipping (20ft):</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(optimizationSuggestions.containerDowngradeOptimizedShippingCost || optimizationSuggestions.optimizedShippingCost)}</span>
                        </div>
                        {(optimizationSuggestions.containerDowngradeOptimizedShippingPerUnit !== undefined || optimizationSuggestions.optimizedShippingPerUnit !== undefined) && (
                          <div className="flex items-center justify-between">
                            <span className="text-orange-700 dark:text-orange-300">Optimized per-piece shipping:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(optimizationSuggestions.containerDowngradeOptimizedShippingPerUnit || optimizationSuggestions.optimizedShippingPerUnit)}</span>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-orange-200 dark:border-orange-700 flex items-center justify-between">
                          <span className="font-semibold text-orange-900 dark:text-orange-100">Shipping savings:</span>
                          <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(optimizationSuggestions.containerDowngradeSavings || optimizationSuggestions.savings)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Total Cost Comparison */}
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
              Total Cost Comparison
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-700 dark:text-green-300">Current total cost:</span>
                <span className="font-semibold text-green-900 dark:text-green-100">{formatCurrency(currentTotalCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700 dark:text-green-300">Optimized total cost:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(optimizedTotalCost)}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700 flex items-center justify-between">
                <span className="font-semibold text-green-900 dark:text-green-100">Total savings:</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-lg">{formatCurrency(totalSavings)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onContinue}
          >
            Continue with Current Order
          </Button>
          <Button
            onClick={onSubmitEnquiry}
          >
            Proceed to Submit Enquiry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

