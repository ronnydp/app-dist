import { getProducts } from "@/services/database";
import { Product } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

/*
1. ProductTypeContext
    Los tipos de datos que debe tener el ProductContext
2. ProductContext
    El espacio o la caja donde que almacenará los datos
3. ProductProvider
    Trae los datos que necesitamos
4. useProduct
    Devuelve los datos a traves de product provider
*/
type ProductContextType = {
  products: Product[];
  isLoading: boolean;
  error: string | null;
};

export const ProductContext = createContext<ProductContextType | undefined>(
  undefined,
);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al cargar productos";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    if (session != null) {
      loadProducts();
    } else {
      setProducts([])
    }
  }, [session]);

  return (
    <ProductContext.Provider value={{ products, isLoading, error }}>
      {children}
    </ProductContext.Provider>
  );
}
export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct debe usarse dentro de un ProductProvider.')
  }
  return context;
}
