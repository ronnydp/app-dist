// Este archivo simula un backend de autenticación para propósitos de desarrollo y demostración.
// En un proyecto real, este código no estaría en el frontend, sino que se comunicaría con un servidor real.
export interface BackendUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
}

// Tipos para la sesión y el proceso de login
export interface BackendSession {
  token: string;
  user: BackendUser;
  issuedAt: string;
}

// Payload para el login (lo que se envía desde el frontend)
export interface LoginPayload {
  email: string;
  password: string;
}

// Resultado del login (puede ser exitoso con la sesión o un error)
export type LoginResult =
  | { ok: true; session: BackendSession }
  | { ok: false; error: string };

const demoUsers = [
  {
    id: 'seller-1',
    email: 'vendedor@demo.com',
    password: '123456',
    name: 'Vendedor Demo',
    isActive: true,
  },
];

let currentSession: BackendSession | null = null;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const createToken = () => `token_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const authBackend = {
    // payload -> solo los datos necesarios para el login (email y password)
  async login(payload: LoginPayload): Promise<LoginResult> {
    await wait(500);

    // validar que el email y password no estén vacíos
    const email = payload.email.trim().toLowerCase();
    const password = payload.password;

    // verifficar si el email existe y la contraseña coincide
    const userRecord = demoUsers.find((user) => user.email.toLowerCase() === email);

    // si no existe el usuario o la contraseña no coincide, retornar error
    if (!userRecord || userRecord.password !== password) {
      return { ok: false, error: 'Correo o contraseña incorrectos' };
    }

    if (!userRecord.isActive) {
      return { ok: false, error: 'La cuenta está inactiva' };
    }

    // si todo es correcto, crear una sesión y retornarla
    const user: BackendUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      isActive: userRecord.isActive,
    };

    // generar un token de sesión (en un backend real sería un JWT u otro tipo de token seguro)
    const session: BackendSession = {
      token: createToken(),
      user,
      issuedAt: new Date().toISOString(),
    };

    // guardar la sesión actual (en un backend real esto se manejaría con cookies o almacenamiento seguro)
    currentSession = session;

    return { ok: true, session };
  },

  async logout(): Promise<void> {
    await wait(200);
    currentSession = null;
  },

  // retorna la sesión actual o null si no hay sesión activa
  async getSession(): Promise<BackendSession | null> {
    await wait(200);
    return currentSession;
  },
};

export const demoCredentials = {
  email: 'vendedor@demo.com',
  password: '123456',
};
