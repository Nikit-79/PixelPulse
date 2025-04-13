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
const contentFilePath = path.join(__dirname, 'content.json');

async function populateNewsletters() {
    console.log('Reading content.json...');
    let contentData;
    try {
        const fileContent = fs.readFileSync(contentFilePath, 'utf8');
        contentData = JSON.parse(fileContent);
    } catch (err) {
        console.error('Error reading or parsing content.json:', err);
        process.exit(1);
    }

    const newslettersData = contentData?.newsletters;

    if (!Array.isArray(newslettersData) || newslettersData.length === 0) {
        console.log('No valid newsletter data found in content.json.');
        return;
    }

    console.log('Fetching existing newsletter titles...');
    const { data: existingNewsletters, error: fetchError } = await supabase
        .from('newsletters')
        .select('title');

    if (fetchError) {
        console.error('Error fetching existing newsletters:', fetchError);
        return;
    }

    const existingTitles = new Set(existingNewsletters.map(n => n.title));
    console.log(`Found ${existingTitles.size} existing newsletter titles.`);

    const newslettersToInsert = newslettersData
        .map(newsletter => ({
            title: newsletter.title,
            description: newsletter.content, // Map content to description
            file_url: newsletter.link, // Use link as the file URL
            image_url: newsletter.image, // Use image as the image URL
            uploaded_at: newsletter.date ? new Date(newsletter.date).toISOString() : new Date().toISOString() // Use newsletter date or current date
            // Category and tags ignored for now
        }));

    if (newslettersToInsert.length === 0) {
        console.log('No new newsletters found to insert.');
        return;
    }

    console.log(`Attempting to insert ${newslettersToInsert.length} new newsletters...`);

    const { data, error: insertError } = await supabase
        .from('newsletters')
        .insert(newslettersToInsert)
        .select();

    if (insertError) {
        console.error('Error inserting newsletters:', insertError);
    } else {
        console.log(`Successfully inserted ${data.length} new newsletters.`);
    }
}

populateNewsletters(); 