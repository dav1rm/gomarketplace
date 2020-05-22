import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const StoragedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (StoragedProducts) {
        setProducts(JSON.parse(StoragedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const updatedProducts = products.map(product => {
        if (product.id === id) {
          return { ...product, quantity: product.quantity + 1 };
        }

        return product;
      });

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const currentProduct = products.find(product => product.id === id);
      let updatedProducts: Product[] = [];

      if (currentProduct && currentProduct?.quantity > 1) {
        updatedProducts = products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity - 1 }
            : product,
        );
      } else {
        updatedProducts = products.filter(product => product.id !== id);
      }

      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async newProduct => {
      if (products.findIndex(product => product.id === newProduct.id) === -1) {
        const newProducts = [...products, { ...newProduct, quantity: 1 }];

        setProducts(newProducts);
        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(newProducts),
        );
      } else {
        increment(newProduct.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
