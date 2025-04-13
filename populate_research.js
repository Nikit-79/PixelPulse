require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in the .env file.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const papersFilePath = path.join(__dirname, 'papers.json');

async function populateResearch() {
    console.log('Reading papers.json...');
    let papersData;
    try {
        const fileContent = fs.readFileSync(papersFilePath, 'utf8');
        papersData = JSON.parse(fileContent);
    } catch (err) {
        console.error('Error reading or parsing papers.json:', err);
        process.exit(1);
    }

    if (!Array.isArray(papersData) || papersData.length === 0) {
        console.log('No valid paper data found in papers.json.');
        return;
    }

    console.log('Fetching existing research paper titles...');
    const { data: existingPapers, error: fetchError } = await supabase
        .from('research_papers')
        .select('title');

    if (fetchError) {
        console.error('Error fetching existing research papers:', fetchError);
        return;
    }

    const existingTitles = new Set(existingPapers.map(p => p.title));
    console.log(`Found ${existingTitles.size} existing paper titles.`);

    const papersToInsert = papersData
        .filter(paper => !existingTitles.has(paper.title)) // Filter out existing papers by title
        .map(paper => ({
            title: paper.title,
            description: paper.abstract, // Map abstract to description
            // file_url: paper.link === '#' ? null : paper.link, // Use link if not placeholder, else null (or generate placeholder)
            file_url: `placeholder_research_${Date.now()}_${paper.title.replace(/\s+/g, '_').substring(0, 15)}.pdf`, // Placeholder URL
            image_url: null, // No image URL in JSON, set to null
            uploaded_at: paper.date ? new Date(paper.date).toISOString() : new Date().toISOString() // Use paper date or current date
            // Add category/author/tags later if schema is updated
        }));

    if (papersToInsert.length === 0) {
        console.log('No new research papers found to insert.');
        return;
    }

    console.log(`Attempting to insert ${papersToInsert.length} new research papers...`);

    const { data, error: insertError } = await supabase
        .from('research_papers')
        .insert(papersToInsert)
        .select();

    if (insertError) {
        console.error('Error inserting research papers:', insertError);
    } else {
        console.log(`Successfully inserted ${data.length} new research papers.`);
    }
}

populateResearch(); 