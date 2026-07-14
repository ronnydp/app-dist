import { createContext, useContext, useRef, useState, ReactNode } from 'react'
interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextValue {
  toast: ToastState;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

// el tablero para emitir los anuncios
export const ToastContext = createContext<ToastContextValue | null>(null);

// lo que necesita el anuncio
export function ToastProvider({ children }: {children: ReactNode}) {
    // el toast necesita saber si esta visible, el mensaje, y el tipo(exito o error)
    // para eso se crea un variable de estado que englobe a esas tres variables necesarias
    const [toast, setToast] = useState<ToastState>({
        visible: false,
        message: '',
        type: 'success', // o error
    })

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // la funcion que el conserje usa para publicar el anuncio
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setToast({ visible: true, message, type });

        timerRef.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }))
        }, 3000)
    }

    // el conserje
    return (
        <ToastContext.Provider value={{ toast, showToast }}>
            {children}
        </ToastContext.Provider>
    )
};

// lo que usan los inquilinos para pedirle al conserje que muestre el anuncio
export function useToast() {
    const context = useContext(ToastContext);
    if(!context){
        throw new Error('useToast debe usarse dentro de un ToastProvider.')
    }
    return context;
}