// auth-service.ts

import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";

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
            throw new Error("Credenciales inválidas");
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
        const { error } = await supabase.auth.signOut({ scope: "global" });

        if (error) {
            // Aunque falle la revocación remota, elimina la sesión local para
            // impedir que la aplicación vuelva a entrar sin pedir login.
            const { error: localSignOutError } = await supabase.auth.signOut({ scope: "local" });
            await AsyncStorage.removeItem(AUTH_SESSION_KEY);

            return localSignOutError
                ? { ok: false, error: error.message }
                : { ok: true };
        }

        await AsyncStorage.removeItem(AUTH_SESSION_KEY);

        return {
            ok: true
        };
    }
    ,
    async mapSession(session: Session): Promise<AuthSession> {
        const { data: userData } = await supabase
            .from('users')
            .select('name, role')
            .eq('id', session.user.id)
            .single();
        return {
            token: session.access_token,
            user: {
                id: session.user.id,
                email: session.user.email || "",
                name: userData?.name || "",
                role: userData?.role || "",
            },
            issuedAt: new Date().toISOString()
        }
    }
    ,
    // Función para recuperar la sesión guardada desde AsyncStorage
    // Cambio de contraseña estando logueado: reautentica con la contraseña
    // actual (signInWithPassword) antes de aplicar la nueva, como capa extra
    // de confirmación de identidad.
    async changePassword({ email, currentPassword, newPassword }: {
        email: string;
        currentPassword: string;
        newPassword: string;
    }): Promise<AuthResult> {
        try {
            const { error: reauthError } = await supabase.auth.signInWithPassword({
                email,
                password: currentPassword,
            });
            if (reauthError) {
                return { ok: false, error: "La contraseña actual es incorrecta" };
            }

            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

            if (updateError) {
                return { ok: false, error: updateError.message };
            }

            return { ok: true };
            
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo actualizar la contraseña";
            return {
                ok: false,
                error: message,
            };
        }
    }
    ,
    // Flujo "olvidé mi contraseña": envía el correo con el link de recuperación
    // que abrirá la app vía deep link (appdist://reset-password).
    async requestPasswordReset(email: string): Promise<AuthResult> {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "appdist://reset-password",
        });

        if (error) {
            return { ok: false, error: error.message };
        }

        return { ok: true };
    }
    ,
    // Intercambia el "code" recibido en el deep link por una sesión temporal
    // de recuperación (PKCE). Falla si el link ya expiró o ya fue usado.
    async exchangeRecoveryCode(code: string): Promise<AuthResult> {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            return { ok: false, error: "El link de recuperación expiró o ya fue usado" };
        }

        return { ok: true };
    }
    ,
    // Aplica la nueva contraseña usando la sesión temporal de recuperación.
    async updatePasswordFromRecovery(newPassword: string): Promise<AuthResult> {
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            return { ok: false, error: error.message };
        }

        return { ok: true };
    }
    ,
    // Función para recuperar la sesión guardada desde AsyncStorage
    async getSession(retriesLeft = 2): Promise<AuthSession | null> {
        try {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (session?.user) {
                const mappedSession = await this.mapSession(session)
                await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(mappedSession));
                return mappedSession;
            }

            // supabase.auth.getSession() puede devolver session=null por un error
            // transitorio de red al refrescar el token (p. ej. la app recién vuelve de
            // background/cold start y la conexión aún no está lista). En ese caso el
            // refresh_token guardado en storage NO se borra (solo se borra ante un
            // error de auth no reintentable), así que reintentamos antes de asumir
            // que la sesión realmente no existe.
            if (error && retriesLeft > 0) {
                console.warn(`getSession() no devolvió sesión (${error.message}), reintentando...`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return this.getSession(retriesLeft - 1);
            }

            return null
        } catch (error) {
            console.error("Error al recuperar la sesión:", error);
            return null;
        }
    }
}