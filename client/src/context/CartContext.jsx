import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../utils/api.js';

const CartContext = createContext();

const CART_STORAGE_KEY = 'diglow_cart_items';
const SESSION_TOKEN_KEY = 'diglow_cart_session_token';
const RECOVERY_TOKEN_KEY = 'diglow_cart_recovery_token';

export const FREE_DELIVERY_THRESHOLD = 999;
export const STANDARD_DELIVERY_FEE = 99;

function getOrCreateSessionToken() {
  try {
    let token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      token = 'c_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    }
    return token;
  } catch (e) {
    return 'c_fallback_' + Date.now();
  }
}

export const getCartItemKey = (item) => {
  if (!item) return '';
  if (item.key) return item.key;
  if (item.variant) {
    const vId = item.variant.id || item.variant.sku || item.variant.title;
    return `${item.product.id}_${vId}`;
  }
  return item.product?.id || '';
};

export function CartProvider({ children }) {
  const [sessionToken] = useState(() => getOrCreateSessionToken());
  const [recoveryToken, setRecoveryTokenState] = useState(() => {
    try {
      return localStorage.getItem(RECOVERY_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Gracefully filter out corrupted or deleted entries
      return Array.isArray(parsed)
        ? parsed.filter((i) => i && i.product && i.product.id && i.quantity > 0)
        : [];
    } catch (e) {
      console.error('Failed to parse cart items:', e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const syncTimeoutRef = useRef(null);

  // Keep local storage in sync
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart items:', e);
    }
  }, [cartItems]);

  const setRecoveryToken = useCallback((token) => {
    setRecoveryTokenState(token);
    try {
      if (token) {
        localStorage.setItem(RECOVERY_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(RECOVERY_TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Unable to persist recovery token:', e);
    }
  }, []);

  // Background database sync with debouncing
  const syncCartWithServer = useCallback(
    async (extraMeta = {}) => {
      try {
        if (!sessionToken) return;
        await api.syncCart({
          sessionToken,
          items: cartItems,
          customerEmail: extraMeta.customerEmail || undefined,
          customerName: extraMeta.customerName || undefined,
          customerPhone: extraMeta.customerPhone || undefined
        });
      } catch (err) {
        // Non-blocking sync notice
        console.warn('Background cart sync notice:', err.message);
      }
    },
    [sessionToken, cartItems]
  );

  useEffect(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    // Debounce syncing to database
    syncTimeoutRef.current = setTimeout(() => {
      syncCartWithServer();
    }, 1500);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [cartItems, syncCartWithServer]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    if (!product || !product.id) return;

    const variantKey = selectedVariant
      ? `${product.id}_${selectedVariant.id || selectedVariant.sku || selectedVariant.title}`
      : product.id;

    const maxStock = selectedVariant
      ? (selectedVariant.stock ?? product.stock ?? 99)
      : (product.stock ?? 99);

    if (maxStock <= 0) {
      showToast(`"${product.name}${selectedVariant ? ` (${selectedVariant.title})` : ''}" is currently out of stock.`);
      return;
    }

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => getCartItemKey(item) === variantKey
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex].quantity = Math.min(newQty, maxStock);
        return updated;
      } else {
        return [
          ...prevItems,
          {
            key: variantKey,
            product,
            variant: selectedVariant || null,
            quantity: Math.min(quantity, maxStock)
          }
        ];
      }
    });

    const variantTitle = selectedVariant ? ` (${selectedVariant.title})` : '';
    showToast(`Added "${product.name}${variantTitle}" to your luxury cart.`);
    setIsCartOpen(true);
  };

  const removeFromCart = (identifier) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => getCartItemKey(item) !== identifier && item.product.id !== identifier
      )
    );
  };

  const updateQuantity = (identifier, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(identifier);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (getCartItemKey(item) === identifier || item.product.id === identifier) {
          const maxStock = item.variant
            ? (item.variant.stock ?? item.product.stock ?? 99)
            : (item.product.stock ?? 99);
          return { ...item, quantity: Math.min(newQuantity, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setRecoveryToken(null);
  };

  /**
   * Restores cart items from a valid recovery token payload
   */
  const restoreCart = (restoredItems, token) => {
    if (Array.isArray(restoredItems)) {
      setCartItems(restoredItems);
      if (token) setRecoveryToken(token);
      showToast('Your sanctuary candles have been successfully restored.');
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cartSubtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.variant?.price ?? item.product.price;
    return sum + itemPrice * item.quantity;
  }, 0);

  const deliveryFee =
    cartSubtotal >= FREE_DELIVERY_THRESHOLD || cartSubtotal === 0 ? 0 : STANDARD_DELIVERY_FEE;

  const freeDeliveryProgress = Math.min(
    100,
    Math.round((cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100)
  );
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - cartSubtotal);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        sessionToken,
        recoveryToken,
        setRecoveryToken,
        syncCartWithServer,
        restoreCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        deliveryFee,
        freeDeliveryProgress,
        remainingForFreeDelivery,
        isCartOpen,
        setIsCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toastMessage,
        getCartItemKey
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
