require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('URL set?', Boolean(url));
console.log('ANON set?', Boolean(anon));
console.log('ANON prefix:', anon.slice(0, 3));
console.log('URL prefix:', url.slice(0, 25));
