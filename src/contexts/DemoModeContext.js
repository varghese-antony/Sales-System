'use client'
import { createContext, useContext, useState } from 'react'

const DemoModeContext = createContext({ demoMode: false, toggleDemoMode: () => {} })

export function DemoModeProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false)
  return (
    <DemoModeContext.Provider value={{ demoMode, toggleDemoMode: () => setDemoMode(d => !d) }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export const useDemoMode = () => useContext(DemoModeContext)
