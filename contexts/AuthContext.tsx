import { supabase } from "@/lib/supabase";
import { authService, AuthSession } from "@/services/auth-service";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
    login: (email: string, password: string) => Promise<void>
    session: AuthSession | null;
    role: string | undefined;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true; // Muestra el LoginScreen

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
            if (authSession) {
                const fullSession = await authService.getSession();
                setIsAuthenticated(true);
                setSession(fullSession)
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
            const fullSession = await authService.getSession();
            setSession(fullSession);
            setIsAuthenticated(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
            setError(message);
        } finally {
            setIsLoading(false);
        }

    };
    return (
        <AuthContext.Provider
            value={{ login, session, role: session?.user?.role, isAuthenticated, isLoading, error }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    if(!context) {
        throw new Error('useToast debe usarse dentro de un ToastProvider.')
    }
    return context
}