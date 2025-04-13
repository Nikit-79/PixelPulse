require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// WARNING: This script deletes all entries from the newsletters table.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in the .env file.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearNewsletters() {
    console.log('Attempting to delete all newsletters...');
    
    // Need a dummy condition for delete without filter, or use rpc/truncate if allowed
    // Using `true` condition is often prevented by default pg settings.
    // Let's try deleting based on a common field that should match all (like title)
    // Or just fetch IDs and delete by ID chunks if necessary.
    
    // Simpler approach: delete based on known titles (less safe if titles change)
    // const knownTitle = "Pixel Pulse Unplugged";
    // const { error } = await supabase
    //     .from('newsletters')
    //     .delete()
    //     .eq('title', knownTitle); 

    // Safer approach: Delete everything (requires privileges or specific RLS)
    // This might fail depending on permissions. Use with caution.
    // We assume here that the anon key has delete rights for this script.
     const { error } = await supabase
         .from('newsletters')
         .delete()
         .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all

    if (error) {
        console.error('Error deleting newsletters:', error);
        console.error('Please ensure RLS allows delete or use Supabase dashboard to truncate manually.');
    } else {
        console.log('Successfully deleted newsletters (or table was empty).');
    }
}

clearNewsletters(); 