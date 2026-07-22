
// lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Reemplaza estos valores con tus credenciales de Supabase
const SUPABASE_URL = 'https://qzbmandvbovgmwwjsrmm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Ym1hbmR2Ym92Z213d2pzcm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDIyODAsImV4cCI6MjA4NTMxODI4MH0.DYHfYlTa6QiNEpS36y-EDIKCiZC0Z5fCqmL-D2xGquI';

const isServer = typeof window === 'undefined';
const isWeb = Platform.OS === 'web'

// Crea y exporta el cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		storage: isServer ? undefined : AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
		lock: (isServer || isWeb) ? undefined : processLock,
	},
});