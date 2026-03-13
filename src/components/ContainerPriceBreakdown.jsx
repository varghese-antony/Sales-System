"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ContainerFillVisual } from "@/components/ContainerFillVisual"
import { Package } from "lucide-react"
import { CONTAINER_TYPE_20FT, CONTAINER_TYPE_40FT_HQ } from "../../lib/utils.js"

const CONTAINER_20FT_CAPACITY_M3 = 33
const CONTAINER_40FT_CAPACITY_M3 = 76.4

const formatCurrency = (value) => {
  const numeric = Number.isFinite(value) ? value : 0
  return `$${numeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function ContainerPriceBreakdown({ priceSummary, quantity = 1 }) {
  if (!priceSummary) return null

  const container20ft = priceSummary[CONTAINER_TYPE_20FT]
  const container40ft = priceSummary[CONTAINER_TYPE_40FT_HQ]

  const has20ft = container20ft && Object.keys(container20ft).length > 0
  const has40ft = container40ft && Object.keys(container40ft).length > 0

  // Calculate totals
  const total20ft = has20ft 
    ? container20ft.product_price + container20ft.tarrif + container20ft.shipment_cost + container20ft.admin_consolidation_fee
    : 0
  
  const total40ft = has40ft
    ? container40ft.product_price + container40ft.tarrif + container40ft.shipment_cost + container40ft.admin_consolidation_fee
    : 0

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-4 h-4" />
        <h4 className="text-sm font-semibold">Price Per Unit Breakdown</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 20ft Container Column */}
        <div className="space-y-1.5">
          <h5 className="font-medium text-xs mb-2">20ft Container</h5>
          {has20ft ? (
            <div className="space-y-1.5">
              {container20ft.space_occupied_cubic_meters !== undefined && (
                <>
                  <div className="flex justify-between items-center text-xs mb-1 pb-1 border-b border-border/30">
                    <span className="text-muted-foreground">Space Occupied:</span>
                    <span className="font-medium">{container20ft.space_occupied_cubic_meters.toFixed(2)} m³</span>
                  </div>
                  <div className="mb-2">
                    <ContainerFillVisual
                      percentage={(container20ft.space_occupied_cubic_meters / CONTAINER_20FT_CAPACITY_M3) * 100}
                      label="20ft fill"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Product Price:</span>
                <span className="font-medium">{formatCurrency(container20ft.product_price)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Tariff:</span>
                <span className="font-medium">{formatCurrency(container20ft.tarrif)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Shipping Fee:</span>
                <span className="font-medium">{formatCurrency(container20ft.shipment_cost + container20ft.admin_consolidation_fee)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-border">
                <span className="font-medium text-xs">Total Per Unit:</span>
                <span className="font-semibold text-primary text-xs">{formatCurrency(total20ft)}</span>
              </div>
            </div>
          ) : (
            <Alert variant="destructive" className="py-1.5">
              <AlertDescription className="text-xs">
                Quantity cannot be fulfilled in this container
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* 40ft Container Column */}
        <div className="space-y-1.5">
          <h5 className="font-medium text-xs mb-2">40ft Container</h5>
          {has40ft ? (
            <div className="space-y-1.5">
              {container40ft.space_occupied_cubic_meters !== undefined && (
                <>
                  <div className="flex justify-between items-center text-xs mb-1 pb-1 border-b border-border/30">
                    <span className="text-muted-foreground">Space Occupied:</span>
                    <span className="font-medium">{container40ft.space_occupied_cubic_meters.toFixed(2)} m³</span>
                  </div>
                  <div className="mb-2">
                    <ContainerFillVisual
                      percentage={(container40ft.space_occupied_cubic_meters / CONTAINER_40FT_CAPACITY_M3) * 100}
                      label="40ft HQ fill"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Product Price:</span>
                <span className="font-medium">{formatCurrency(container40ft.product_price)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Tariff:</span>
                <span className="font-medium">{formatCurrency(container40ft.tarrif)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Shipping Fee:</span>
                <span className="font-medium">{formatCurrency(container40ft.shipment_cost + container40ft.admin_consolidation_fee)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-border">
                <span className="font-medium text-xs">Total Per Unit:</span>
                <span className="font-semibold text-primary text-xs">{formatCurrency(total40ft)}</span>
              </div>
            </div>
          ) : (
            <Alert variant="destructive" className="py-1.5">
              <AlertDescription className="text-xs">
                Quantity cannot be fulfilled in this container
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}
