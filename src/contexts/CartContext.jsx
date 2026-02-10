"use client"

import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext()

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const productId = action.payload.id || action.payload.ID
      // Get pcs_per_box for increment step, default to 1
      const pcsPerBox = action.payload.pcs_per_box
      const incrementStep = (pcsPerBox && pcsPerBox > 0) ? pcsPerBox : 1
      
      const existingItem = state.items.find(item => (item.id || item.ID) === productId)
      if (existingItem) {
        // When adding to existing item, increment by pcs_per_box (or provided quantity if it's a custom add)
        const quantityToAdd = action.payload.quantity || incrementStep
        return {
          ...state,
          items: state.items.map(item =>
            (item.id || item.ID) === productId
              ? { ...item, quantity: item.quantity + quantityToAdd }
              : item
          )
        }
      }
      // For new items, use the provided quantity or pcs_per_box, default to 1
      const initialQuantity = action.payload.quantity || incrementStep
      return {
        ...state,
        items: [...state.items, { ...action.payload, id: productId, quantity: initialQuantity }]
      }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => (item.id || item.ID) !== action.payload)
      }
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          (item.id || item.ID) === action.payload.id
            ? { ...item, quantity: Math.max(0, action.payload.quantity) }
            : item
        ).filter(item => item.quantity > 0)
      }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      }
    
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload || []
      }
    
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('lighting-cart')
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: parsedCart })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lighting-cart', JSON.stringify(state.items))
  }, [state.items])

  const addToCart = (product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product })
  }

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId })
  }

  const updateQuantity = (productId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const value = {
    items: state.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}