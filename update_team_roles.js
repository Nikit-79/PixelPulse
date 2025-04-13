require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in the .env file.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to extract role and clean description
function extractRole(description) {
    if (!description) return { role: null, cleanDescription: null };
    
    // Look for the first sentence ending with a period followed by a space.
    // Assume this first sentence is the role.
    const match = description.match(/^([^.]+.)\s+(.*)$/);
    
    if (match && match[1] && match[2]) {
        // Found a potential role and the rest of the description
        const role = match[1].trim();
        const cleanDescription = match[2].trim();
        
        // Simple check: Is the potential role relatively short?
        // Avoids cases where the first sentence is very long and unlikely to be just a role.
        if (role.length < 50) { 
            return { role, cleanDescription };
        }
    }
    
    // If no clear role found, return the original description and null role
    return { role: null, cleanDescription: description };
}

async function updateTeamRoles() {
    console.log('Fetching team members...');
    const { data: teamMembers, error: fetchError } = await supabase
        .from('team_members')
        .select('id, description, role'); // Select id, description, and current role

    if (fetchError) {
        console.error('Error fetching team members:', fetchError);
        return;
    }

    if (!teamMembers || teamMembers.length === 0) {
        console.log('No team members found to update.');
        return;
    }

    console.log(`Found ${teamMembers.length} members. Processing updates...`);
    let updatesMade = 0;
    let errorsEncountered = 0;

    for (const member of teamMembers) {
        // Only process if description exists and role is currently null (or empty)
        if (member.description && !member.role) { 
            const { role, cleanDescription } = extractRole(member.description);

            if (role) { // Only update if a role was successfully extracted
                console.log(`Updating member ID ${member.id}: Role='${role}', Desc='${cleanDescription.substring(0, 30)}...'`);
                const { error: updateError } = await supabase
                    .from('team_members')
                    .update({ 
                        role: role, 
                        description: cleanDescription 
                    })
                    .eq('id', member.id);

                if (updateError) {
                    console.error(`Error updating member ID ${member.id}:`, updateError.message);
                    errorsEncountered++;
                } else {
                    updatesMade++;
                }
            } else {
                 console.log(`Skipping member ID ${member.id}: Could not extract role from description.`);
            }
        } else if (member.role) {
             console.log(`Skipping member ID ${member.id}: Role already seems to be set.`);
        }
         else {
             console.log(`Skipping member ID ${member.id}: No description found.`);
        }
    }

    console.log(`
--- Update Summary ---
Updates attempted: ${updatesMade}
Errors encountered: ${errorsEncountered}
Members skipped (no description/role already set/role not extracted): ${teamMembers.length - updatesMade - errorsEncountered}
--------------------
    `);
}

updateTeamRoles(); 