
// lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Reemplaza estos valores con tus credenciales de Supabase
const SUPABASE_URL = 'https://qzbmandvbovgmwwjsrmm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6Ym1hbmR2Ym92Z213d2pzcm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDIyODAsImV4cCI6MjA4NTMxODI4MH0.DYHfYlTa6QiNEpS36y-EDIKCiZC0Z5fCqmL-D2xGquI';

// Crea y exporta el cliente de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});