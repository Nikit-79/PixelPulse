// Asynchronously fetch config and initialize Supabase
async function initializeSupabaseGlobal() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();

        if (!config.url || !config.anonKey) {
            throw new Error('Fetched config is missing URL or anonKey.');
        }

        // Check if Supabase library is loaded
        if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
            throw new Error('Supabase client library not loaded.');
        }

        // Initialize and return the client
        return supabase.createClient(config.url, config.anonKey);

    } catch (error) {
        console.error('CRITICAL Error initializing Supabase in script.js:', error);
        // Display fallback content or indicate error
        displayFallbackContent('newsletters-grid', 'Error: Cannot connect to database.');
        displayFallbackContent('featured-content', '');
        displayFallbackContent('research-cards', 'Error: Cannot connect to database.');
        displayFallbackContent('team-grid', 'Error: Cannot connect to database.'); // Ensure team gets fallback too
        return null;
    }
}

// --- Global Variable for Supabase Client ---
let supabaseClient = null; // Will be initialized asynchronously

// Helper function to open links in new tab
function openLink(url) {
    if (url && isValidUrl(url)) {
        window.open(url, '_blank');
    }
}

// Helper function to format date
function formatDate(dateString) {
    // Check if dateString is a non-empty string
    if (!dateString || typeof dateString !== 'string') {
        console.warn('Invalid or missing dateString passed to formatDate:', dateString);
        return 'Date unavailable';
    }
    try {
        // Directly create a Date object. JS engine usually parses ISO 8601 timestamps.
        const date = new Date(dateString); 
        // Check if the date is valid after parsing
        if (isNaN(date.getTime())) {
            console.warn('Could not parse dateString into valid Date:', dateString);
            return 'Invalid date';
        }
        // Use UTC options to avoid unintended timezone shifts during formatting
        const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        console.error('Error formatting date:', dateString, e);
        return 'Invalid date format';
    }
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}


// RESEARCH SECTION--------------------------------------------------
let allResearchPapers = []; // Store all fetched papers for filtering

// Load research papers from Supabase
async function loadResearchPapers() {
    if (!supabaseClient) {
        console.error('Supabase client is not available for research papers.');
        displayResearchPapers([]); // Display empty state or error
        return;
    }
    console.log('loadResearchPapers called.');
    const grid = document.getElementById('research-cards');
    if (grid) grid.innerHTML = '<p class="text-center text-gray-600 col-span-full">Loading research papers...</p>';

    try {
        console.log("Fetching research papers from Supabase...");
        const { data, error } = await supabaseClient
            .from('research_papers')
            .select('*')
            .order('uploaded_at', { ascending: false }); // Fetch newest first

        if (error) {
            console.error('Supabase fetch error (research_papers):', error);
            allResearchPapers = [];
            if (grid) grid.innerHTML = '<p class="text-center text-red-500 col-span-full">Error loading papers.</p>';
        } else {
            console.log("Fetched research papers:", data);
            allResearchPapers = data || [];
            displayResearchPapers(allResearchPapers); // Display all initially
            setupResearchFilters(); // Setup filters after data is loaded
        }
    } catch (fetchError) {
        console.error('Exception loading research papers:', fetchError);
        allResearchPapers = [];
        if (grid) grid.innerHTML = '<p class="text-center text-red-500 col-span-full">An unexpected error occurred.</p>';
    }
}

// Display research papers with animations
function displayResearchPapers(papersToDisplay) {
    const grid = document.getElementById('research-cards');
    if (!grid) return;

    if (!papersToDisplay || papersToDisplay.length === 0) {
        grid.innerHTML = '<p class="text-center text-gray-600 col-span-full">No research papers found.</p>';
        return;
    }

    grid.innerHTML = papersToDisplay.map((paper, index) => {
        const pdfUrl = paper.file_url;
        const imageUrl = paper.image_url;
        // Assuming no category/tags in the current schema, add later if needed
        return `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300 
                    cursor-pointer" 
             onclick="openLink('${pdfUrl}')">
            ${imageUrl ? `
            <div class="relative w-full h-48"> 
                 <img src="${imageUrl}" alt="${paper.title}" class="w-full h-full object-cover" onerror="this.style.display='none'"> 
            </div>` : ''}
            <div class="p-6">
                <!-- <span class="bg-chambray text-white text-sm px-3 py-1 rounded-full">CATEGORY</span> -->
                <span class="ml-1 text-silverlake text-sm">${formatDate(paper.uploaded_at)}</span>
                <h3 class="text-xl font-bold text-chambray mt-2 mb-2 hover:text-silverlake transition-colors duration-300">${paper.title}</h3>
                ${paper.description ? `<p class="text-oxford-blue mb-4 text-sm">${truncateText(paper.description, 150)}</p>` : ''}
                <!-- <div class="flex flex-wrap gap-2">
                    <span class="text-xs text-silverlake bg-platinum px-2 py-1 rounded-full 
                               hover:bg-chambray hover:text-white transition-colors duration-300">TAG</span>
                </div> -->
                 <div class="text-right mt-2">
                     <span class="read-more text-sm font-semibold text-chambray hover:text-silverlake transition-colors duration-300">
                         View Paper <i class="fi-rr-arrow-right ml-1"></i>
                     </span>
                 </div>
            </div>
        </div>
    `;
    }).join('');
}

// Setup filter button listeners
function setupResearchFilters() {
    console.log("Setting up research filters...");
    const filterButtonContainer = document.getElementById('research-filter-buttons');
    if (!filterButtonContainer) {
        console.error("Filter button container #research-filter-buttons not found.");
        return;
    }
    const filterButtons = filterButtonContainer.querySelectorAll('button[data-category]'); 
    if (!filterButtons || filterButtons.length === 0) {
        console.warn("No filter buttons found within #research-filter-buttons.");
        return;
    }
    console.log(`Found ${filterButtons.length} filter buttons.`);

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            console.log(`Filter button clicked: ${category}`);
            
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('bg-gradient-to-r', 'from-chambray', 'to-silverlake', 'text-white', 'active'));
            button.classList.add('bg-gradient-to-r', 'from-chambray', 'to-silverlake', 'text-white', 'active');

            // Filter the papers (CASE-INSENSITIVE)
            // NOTE: Assumes category is stored in the 'description' or a future 'category' field.
            //       Modify this logic if you add a dedicated category column.
            console.log("Filtering papers...");
            const filteredPapers = category === 'all' 
                ? allResearchPapers 
                : allResearchPapers.filter(paper => 
                    paper.description?.toLowerCase().includes(category.toLowerCase()) || 
                    paper.title?.toLowerCase().includes(category.toLowerCase()) 
                  );
            console.log(`Found ${filteredPapers.length} papers for category '${category}'.`);
            
            // Re-render papers with animation
            displayResearchPapers(filteredPapers);
        });
    });

    // Activate the 'all' button initially
    const allButton = filterButtonContainer.querySelector('button[data-category="all"]');
    if (allButton && !allButton.classList.contains('active')) {
        console.log("Activating 'All' button initially.");
        filterButtons.forEach(btn => btn.classList.remove('bg-gradient-to-r', 'from-chambray', 'to-silverlake', 'text-white', 'active'));
        allButton.classList.add('bg-gradient-to-r', 'from-chambray', 'to-silverlake', 'text-white', 'active');
    }
}

// Add dynamic background effect
function addDynamicBackground(element) {
    element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        element.style.setProperty('--mouse-x', `${x}px`);
        element.style.setProperty('--mouse-y', `${y}px`);
    });
}

// Initialize dynamic backgrounds
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM fully loaded and parsed.");

    // Initialize Supabase client asynchronously
    supabaseClient = await initializeSupabaseGlobal();

    // Initialize Supabase client check
    if (!supabaseClient) {
        console.error("Supabase client failed to initialize. Cannot load dynamic content.");
        // Fallback content is already displayed within initializeSupabaseGlobal error handling
        return; // Stop further execution if client is missing
    }
    console.log("Supabase client appears initialized.");

    // Add dynamic background to all sections
    document.querySelectorAll('section').forEach(addDynamicBackground);

    // Set primary color CSS variable
    document.documentElement.style.setProperty('--color-primary', '#3e5c76');

    // Initialize based on current page AFTER Supabase client is ready
    const path = window.location.pathname;
    console.log("Current path:", path);
    
    // Use path.startsWith() for clearer matching without .html
    if (path.startsWith('/newsletters')) {
        console.log("Initializing Newsletters page content...");
        initializeNewsletters(); 
    } else if (path.startsWith('/research')) {
        console.log("Initializing Research page content...");
        initializeResearch(); 
    } else if (path.startsWith('/team')) {
        console.log("Initializing Team page content...");
        loadTeamMembers(); 
    } else if (path.startsWith('/admin')) {
        // Do nothing here, admin.js handles its own initialization
        console.log("Admin page detected, script.js skipping initialization.");
    } else { // Assume it's the index page (/, /index, /index.html, etc.)
         console.log("Initializing Home page content...");
        initializeHome(); 
    }

    // Add smooth scroll for anchor links (only if links exist)
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    if (anchorLinks.length > 0) {
        anchorLinks.forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetElement = document.querySelector(this.getAttribute('href'));
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Add hover effect for navigation links (only if links exist)
    const navLinks = document.querySelectorAll('nav a');
    if (navLinks.length > 0) {
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.classList.add('animate-scale-pulse');
            });
            link.addEventListener('mouseleave', () => {
                link.classList.remove('animate-scale-pulse');
            });
        });
    }

    // Attach contact form listener (only if form exists)
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', sendEmail);
    } else {
        // This is expected on pages other than index.html
        // console.log("Contact form not found on this page.");
    }
});



// NEWSLETTER SECTION--------------------------------------------------------
// Load and display newsletter content with animations from Supabase
async function loadNewsletterContent() {
    if (!supabaseClient) {
        console.error('Supabase client is not available for newsletters.');
        displayFallbackContent('newsletters-grid'); // Use generic fallback
        displayFallbackContent('featured-content');
        return;
    }
    console.log('loadNewsletterContent called.');
    try {
        console.log("Fetching newsletters from Supabase...");
        const { data: newsletters, error } = await supabaseClient
            .from('newsletters')
            .select('*')
            .order('uploaded_at', { ascending: false }); // Fetch newest first

        if (error) {
            console.error('Supabase fetch error (newsletters):', error);
            displayFallbackContent('newsletters-grid', 'Error loading newsletters.');
            displayFallbackContent('featured-content', ''); // Clear featured if error
            return;
        }

        console.log("Fetched newsletters:", newsletters);

        if (!newsletters || newsletters.length === 0) {
            console.log("No newsletters found in database.");
            displayFallbackContent('newsletters-grid', 'No newsletters found.');
            displayFallbackContent('featured-content', ''); // Clear featured if none found
            return;
        }

        // Display featured newsletter (latest)
        displayFeaturedNewsletter(newsletters[0]);

        // Display all newsletters with staggered animation
        displayAllNewsletters(newsletters.slice(1)); // Skip the featured one

    } catch (fetchError) {
        console.error('Exception loading newsletter content:', fetchError);
        displayFallbackContent('newsletters-grid', 'An unexpected error occurred.');
        displayFallbackContent('featured-content', ''); 
    }
}

// Display featured newsletter with animation
function displayFeaturedNewsletter(newsletter) {
    console.log("Attempting to display featured newsletter:", newsletter);
    const featuredContent = document.getElementById('featured-content');
    if (!featuredContent) {
        console.error("Element with ID 'featured-content' not found!");
        return;
    }
    if (!newsletter) {
        console.warn("No newsletter data provided to displayFeaturedNewsletter.");
        featuredContent.innerHTML = ''; // Clear if no newsletter
        return;
    }
    console.log("Found featured-content element and newsletter data.");

    // Use file_url directly, assuming it's the public PDF URL
    const pdfUrl = newsletter.file_url; 
    const imageUrl = newsletter.image_url; // Preview image URL

    console.log("Setting innerHTML for featured-content...");
    featuredContent.innerHTML = `
        <div class="relative group cursor-pointer" onclick="openLink('${pdfUrl}')"> <!-- Add group and cursor -->
            <div class="relative w-full h-64 mb-6 overflow-hidden rounded-lg">
                <img src="${imageUrl || 'placeholder.png'}" 
                     alt="${newsletter.title}" 
                     class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" 
                     onerror="this.onerror=null;this.src='placeholder.png';" />
                <div class="absolute inset-0 bg-gradient-to-br from-chambray/20 to-silverlake/20 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            </div>
            <div class="flex items-center justify-between mb-4">
                <!-- Use uploaded_at for date, format it -->
                <span class="text-sm text-silverlake">${formatDate(newsletter.uploaded_at)}</span>
                <!-- <span class="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-chambray to-silverlake rounded-full">CATEGORY_PLACEHOLDER</span> --> <!-- Add category later if needed -->
            </div>
            <h3 class="text-2xl font-bold mb-4 text-oxford-blue group-hover:text-chambray transition-colors duration-300">${newsletter.title}</h3>
            ${newsletter.description ? `<p class="text-silverlake mb-6 group-hover:text-oxford-blue transition-colors duration-300">${newsletter.description}</p>` : ''}
            <div class="flex items-center justify-end">
                <span class="read-more inline-block px-8 py-3 bg-gradient-to-r from-chambray to-silverlake text-white rounded-full font-semibold transform hover:scale-105 transition-transform duration-300">
                    View Newsletter <i class="fi-rr-arrow-right ml-2"></i>
                </span>
            </div>
            <!-- Add tags later if schema supports it -->
            <!-- <div class="flex flex-wrap gap-2 mt-4">
                ${Array.isArray(newsletter.tags) && newsletter.tags.length > 0 ? 
                     newsletter.tags.map(tag => `
                         <span class="px-2 py-1 text-xs text-silverlake bg-platinum rounded-full hover:bg-chambray hover:text-white transition-colors duration-300">${tag}</span>
                     `).join('') : ''}
            </div> -->
        </div>
    `;
    console.log("Finished displaying featured newsletter.");
}

// Display all newsletters with staggered animation
function displayAllNewsletters(newsletters) {
    console.log("Attempting to display all newsletters:", newsletters);
    const grid = document.getElementById('newsletters-grid');
    const template = document.getElementById('newsletter-card-template');
    
    // If the grid doesn't exist (e.g., on index.html), just return silently.
    if (!grid) { 
        // console.log("'newsletters-grid' not found, skipping displayAllNewsletters (expected on index page)."); 
        return; 
    }
    // Continue only if the grid exists
    if (!template) { console.error("Element with ID 'newsletter-card-template' not found!"); return; }
    if (!newsletters) { console.warn("No newsletters data provided to displayAllNewsletters."); return; }
    console.log("Found newsletters-grid, template, and newsletters data.");

    grid.innerHTML = ''; // Clear previous content

    if (newsletters.length === 0) {
        grid.innerHTML = '<p class="text-center text-gray-400 col-span-full">No other newsletters found.</p>';
        return;
    }

    newsletters.forEach((newsletter, index) => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.group');
        
        // Remove staggered animation delay and fade-in class
        // card.style.animationDelay = `${index * 0.1}s`;
        // card.classList.add('animate-fade-in', 'opacity-0'); // REMOVE THIS LINE

        // Set content
        const pdfUrl = newsletter.file_url;
        const imageUrl = newsletter.image_url;
        const img = clone.querySelector('img');
        if (imageUrl) {
            img.src = imageUrl;
            img.alt = newsletter.title;
            img.onerror = function() { this.onerror=null; this.src='placeholder.png'; };
        } else {
            // Maybe hide the image container or use a default
             img.src = 'placeholder.png';
             img.alt = 'Placeholder';
            // img.style.display = 'none'; 
        }

        const dateElement = clone.querySelector('.date');
        if (dateElement) dateElement.textContent = formatDate(newsletter.uploaded_at);
        
        // Hide category for now, or add data later
        const categoryElement = clone.querySelector('.category');
        if (categoryElement) categoryElement.style.display = 'none';

        const titleElement = clone.querySelector('.title');
        if (titleElement) titleElement.textContent = newsletter.title;
        
        const contentElement = clone.querySelector('.content');
        if (contentElement) contentElement.textContent = truncateText(newsletter.description || '', 100); // Shorten description
        
        const readMoreLink = clone.querySelector('.read-more');
        if(readMoreLink) {
            // Make card clickable instead of just the button
             readMoreLink.parentElement.parentElement.parentElement.style.cursor = 'pointer';
             readMoreLink.parentElement.parentElement.parentElement.onclick = () => openLink(pdfUrl);
            // Remove href from button itself if card is clickable
            readMoreLink.removeAttribute('href'); 
        }

        // Handle tags later if needed
        // const tagsContainer = clone.querySelector('.tags');
        // if (tagsContainer) tagsContainer.innerHTML = ''; // Clear existing tags

        grid.appendChild(clone);
    });
}

// Modified to accept ID and message
function displayFallbackContent(elementId, message = 'Could not load content.') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<p class="text-center text-gray-400 p-4">${message}</p>`;
    }
}


// Initialize specific page content
function initializeNewsletters() {
    console.log("Inside initializeNewsletters()...");
    loadNewsletterContent(); // Call the updated function
}

function initializeHome() {
    // Add dynamic background to all sections
    document.querySelectorAll('section').forEach(addDynamicBackground);

    // Load featured newsletter - loadNewsletterContent handles displaying it now
    loadNewsletterContent()
        .catch(error => {
            // Keep the catch block for logging errors during the actual fetch
            console.error('Error during newsletter content loading for Home:', error);
        });

    // Initialize counters with intersection observer
    const counters = document.querySelectorAll('.counter');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const targetValue = parseInt(target.getAttribute('data-target'));
                animateCounter(target, targetValue);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}



function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const duration = 2000;
    const step = duration / 100;

    const timer = setInterval(() => {
        current += increment;
        element.textContent = Math.round(current);

        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        }
    }, step);
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}



// Custom toggle script
document.addEventListener('DOMContentLoaded', function () {
    const togglerButton = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.getElementById('navbarNav');
    
    // Only add listener if both elements are found
    if (togglerButton && navbarCollapse) { 
        togglerButton.addEventListener('click', function () {
            if (navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show'); // Manually remove the 'show' class to close it
            } else {
                navbarCollapse.classList.add('show'); // Add the 'show' class to open it
            }
        });
    } else {
        // Expected if navbar elements aren't on the current page
        // console.log("Navbar toggler elements not found on this page.");
    }
});

// Handle contact form submission
function sendEmail(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    const mailtoLink = `mailto:pixelpulsenewsletterr@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
    
    window.location.href = mailtoLink;
    
    // Clear the form
    document.getElementById('contact-form').reset();
}

function initializeResearch() {
    // Load research papers
    loadResearchPapers()
        .catch(error => {
            console.error('Error loading research papers:', error);
            // Display empty state
            const grid = document.getElementById('research-cards');
            if (grid) {
                grid.innerHTML = `
                    <div class="col-span-full text-center p-8">
                        <h3 class="text-xl font-bold mb-4 text-oxford-blue">No Research Papers Available</h3>
                        <p class="text-silverlake">Please check back later for our upcoming research.</p>
                    </div>
                `;
            }
        });
}

// TEAM SECTION---------------------------------------------------
// Load Team Members (Moved from team.html)
async function loadTeamMembers() {
    const teamGrid = document.getElementById('team-grid');
    if (!teamGrid) {
        console.error("Team grid element not found.");
        return;
    }
    if (!supabaseClient) { 
        console.error("Global Supabase client not ready for team loading.");
        teamGrid.innerHTML = '<p class="text-center text-red-600 col-span-full">Error: Database connection failed.</p>';
        return;
    }
    console.log("loadTeamMembers called (from script.js)."); // Log execution
    teamGrid.innerHTML = '<p class="text-center text-gray-600 col-span-full">Loading team members...</p>'; 

    try {
        console.log("Fetching team members from Supabase...");
        const { data: teamMembers, error } = await supabaseClient 
            .from('team_members')
            .select('*') 
            .order('position', { ascending: true }); 

        if (error) {
            console.error('Supabase fetch error (team_members):', error);
            teamGrid.innerHTML = '<p class="text-center text-red-600 col-span-full">Error loading team members.</p>';
            return;
        }
        
        console.log("Fetched team members:", teamMembers);

        if (!teamMembers || teamMembers.length === 0) {
            console.log("No team members found in database.");
            teamGrid.innerHTML = '<p class="text-center text-gray-600 col-span-full">No team members found.</p>';
            return;
        }

        teamGrid.innerHTML = '';

        teamMembers.forEach((member, index) => {
            const memberCard = `
                <div class="bg-white rounded-xl shadow-lg p-6 transform hover:-translate-y-1 transition duration-300 flex flex-col items-center" > 
                    <img src="${member.image_url || 'placeholder.png'}" 
                            alt="${member.name}" 
                            class="w-32 h-32 rounded-full mb-4 object-cover border-4 border-platinum" 
                            onerror="this.onerror=null;this.src='placeholder.png';" /> 
                    <h3 class="text-xl font-bold text-chambray mb-1 text-center">${member.name}</h3>
                    ${member.role ? `<p class="text-silverlake font-semibold mb-3 text-center text-sm">${member.role}</p>` : ''} 
                    ${member.description ? `<p class="text-oxford-blue text-sm text-center flex-grow">${member.description}</p>` : ''} 
                </div>
            `;
            teamGrid.insertAdjacentHTML('beforeend', memberCard);
        });

    } catch (fetchError) {
        console.error('Exception fetching team members:', fetchError);
        teamGrid.innerHTML = '<p class="text-center text-red-600 col-span-full">An unexpected error occurred while loading team members.</p>';
    }
}
