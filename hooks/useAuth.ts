import { supabase } from "@/lib/supabase";
import { authService, AuthSession } from "@/services/auth-service";
import { useEffect, useState } from "react";

export const useAuth = () => {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true; // Muestra el LoginScreen
        const checkSession = async () => {
            const session = await authService.getSession();
            if (isMounted && session) {
                setSession(session);
                setIsAuthenticated(true);
            }
        };
        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, authSession) => {
            if (authSession) {
                setIsAuthenticated(true);
            } else {
                setSession(null);
                setIsAuthenticated(false);
            }
        });

        return () => {
            subscription.unsubscribe(); // Limpia el listener al desmontar el componente
            isMounted = false;
        };
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await authService.login({ email, password });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
            setError(message);
        } finally {
            setIsLoading(false);
        }

    };
    return {
        login
    }
};