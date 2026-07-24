import { getProducts } from "@/services/database";
import { Product } from "@/types";
import { useEffect, useState } from "react";

function useProduct() {
    const [products, setProducts] = useState<Product[]>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await getProducts();
                setProducts(data)
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Error al cargar productos'
                setError(message)
            } finally {
                setLoading(false)
            }
        }
        loadProducts();
    }, [])

    return { products, loading, error }
}