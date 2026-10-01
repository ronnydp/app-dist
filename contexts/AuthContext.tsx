import { supabase } from "@/lib/supabase";
import { authService, AuthSession } from "@/services/auth-service";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
    session: AuthSession | null;
    role: string | undefined;
    isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        let sessionVersion = 0;
        let initializationFinished = false;

        const finishInitialization = () => {
            if (isMounted && !initializationFinished) {
                initializationFinished = true;
                setIsLoading(false);
            }
        };

        const applySession = (currentSession: Session | null) => {
            if (!currentSession) {
                return;
            }

            const currentVersion = ++sessionVersion;
            setSession((previousSession) => previousSession ?? {
                token: currentSession.access_token,
                user: {
                    id: currentSession.user.id,
                    email: currentSession.user.email || "",
                    name: currentSession.user.user_metadata?.name || "",
                    role: currentSession.user.user_metadata?.role || "",
                },
                issuedAt: new Date().toISOString(),
            });
            finishInitialization();

            setTimeout(() => {
                void authService.mapSession(currentSession)
                    .then((mappedSession) => {
                        if (isMounted && sessionVersion === currentVersion) {
                            setSession(mappedSession);
                        }
                    })
                    .catch((mapError) => {
                        console.error("Error al mapear datos de perfil:", mapError);
                    });
            }, 0);
        };

        const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
            if (currentSession) {
                applySession(currentSession);
            } else if (event === "SIGNED_OUT") {
                sessionVersion += 1;
                setSession(null);
                finishInitialization();
            }
        });

        void Promise.race([
            supabase.auth.getSession(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]).then((result) => {
            if (result && "data" in result) {
                applySession(result.data.session);
            }
            finishInitialization();
        }).catch((error) => {
            console.error("Error al inicializar la sesión:", error);
            finishInitialization();
        });

        return () => {
            isMounted = false;
            authListener?.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{ session, role: session?.user?.role, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider.');
    }
    return context;
}
