// auth-service.ts

import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_SESSION_KEY = "authSession";
// Define la estructura de la sesión de autenticación
export interface AuthSession {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
    issuedAt: string;
}

export interface AuthResult {
    ok: boolean;
    error?: string
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export const authService = {
    // Función para iniciar sesión
    async login({ email, password }: LoginCredentials) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            throw new Error(error.message);
        }
        // Save session to async storage
        const session: AuthSession = {
            token: data.session?.access_token || "",
            user: {
                id: data.user?.id || "",
                email: data.user?.email || "",
                name: data.user?.user_metadata?.name || "",
                role: data.user?.user_metadata?.role || ""
            },
            issuedAt: new Date().toISOString()
        };

        await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
        return data;
    }
    ,
    // Función para cerrar sesión
    async logout(): Promise<AuthResult> {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return {
                ok: false,
                error: error.message
            };
        }

        await AsyncStorage.removeItem(AUTH_SESSION_KEY);

        return {
            ok: true
        };
    }
    ,
    // Función para recuperar la sesión guardada desde AsyncStorage
    async getSession(): Promise<AuthSession | null> {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                    
                const mappedSession: AuthSession = {
                    token: session.access_token,
                    user: {
                        id: session.user.id,
                        email: session.user.email || "",
                        name: session.user.user_metadata?.name || "",
                        role: userData?.role || "",
                    },
                    issuedAt: new Date().toISOString(),
                };

                await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(mappedSession));
                return mappedSession;
            }

            const sessionData = await AsyncStorage.getItem(AUTH_SESSION_KEY);
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error("Error al recuperar la sesión:", error);
            return null;
        }
    }
}