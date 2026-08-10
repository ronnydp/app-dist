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

        const timer = setTimeout(() => {
            if (isMounted) {
                setIsAuthenticated(false)
                setIsLoading(false)
            }
        }, 1000)

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
            console.log('Evento', _event)
            if (_event === 'SIGNED_OUT') {
                if (isMounted) {
                    setSession(null);
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    clearTimeout(timer);
                }
                return;
            }
            try {

                if (authSession) {
                    const now = Math.floor(Date.now() / 1000);

                    if (authSession.expires_at && authSession.expires_at < now) {
                        if (isMounted) {
                            setSession(null);
                            setIsAuthenticated(false);
                            setIsLoading(false)
                        }
                        return;
                    }
                    const fullSession = await authService.getSession();
                    if (isMounted) {
                        setIsAuthenticated(true);
                        setSession(fullSession);
                    }
                } else {
                    if (isMounted) {
                        setSession(null);
                        setIsAuthenticated(false);
                    }
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
                if (isMounted) {
                    setError(message);
                    setIsAuthenticated(false)
                    setSession(null)
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                    clearTimeout(timer)
                }
            }
        });
        return () => {
            isMounted = false;
            clearTimeout(timer)
            subscription.unsubscribe(); // Limpia el listener al desmontar el componente
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
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider.')
    }
    return context
}