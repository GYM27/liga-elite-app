import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const config = fs.readFileSync('/Users/luis/Documents/Antigravity/Liga ELite/liga-elite-app/src/lib/supabaseClient.js', 'utf8');
console.log(config);
