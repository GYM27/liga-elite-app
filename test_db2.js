import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const dotenv = await import('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_URL';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY';

// I need to read the env variables since they are in .env
// actually, I can just grep for historico in the codebase first.
