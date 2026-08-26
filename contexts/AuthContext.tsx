import { supabase } from "@/lib/supabase";
import { authService, AuthSession } from "@/services/auth-service";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
    session: AuthSession | null;
    role: string | undefined;
    isLoading: boolean;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSession() {
            const session = await authService.getSession();
            if (session) {
                setSession(session);
            }
            setIsLoading(false);
        }
        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
            try {
                if (session) {
                    const fullSession = await authService.mapSession(session)
                    setSession(fullSession);
                } else {
                    setSession(null)
                }
                setIsLoading(false);
            } catch (error) {
                console.error("Error al mapear la sesión:", error);
                setSession(null);
            } finally {
                setIsLoading(false);
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        }
    }, [])
    return (
        <AuthContext.Provider
            value={{ session, role: session?.user?.role, isLoading }}>
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