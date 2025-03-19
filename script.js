// Helper function to open links in new tab
function openLink(url) {
    if (url && url !== '#') {
        window.open(url, '_blank');
    }
}

// Helper function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Load and display newsletter content
async function loadNewsletterContent() {
    try {
        const response = await fetch('content.json');
        const data = await response.json();
        const newsletters = data.newsletters;

        // Sort newsletters by date (newest first)
        newsletters.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Display featured newsletter (latest)
        displayFeaturedNewsletter(newsletters[0]);

        // Display all newsletters
        displayAllNewsletters(newsletters);
    } catch (error) {
        console.error('Error loading newsletter content:', error);
    }
}

// Display featured newsletter
function displayFeaturedNewsletter(newsletter) {
    const featuredSection = document.getElementById('featured-newsletter');
    if (!featuredSection || !newsletter) return;

    featuredSection.innerHTML = `
        <div class="flex flex-col md:flex-row">
            <div class="md:w-1/2">
                <img src="${newsletter.image}" alt="${newsletter.title}" class="w-full h-64 md:h-full object-cover">
            </div>
            <div class="md:w-1/2 p-6 md:p-8">
                <div class="flex items-center mb-4">
                    <span class="bg-primary text-white text-sm px-3 py-1 rounded-full">${newsletter.category}</span>
                    <span class="ml-4 text-gray-600">${formatDate(newsletter.date)}</span>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 mb-4">${newsletter.title}</h3>
                <p class="text-gray-600 mb-4">${newsletter.content}</p>
                <div class="flex items-center">
                    <img src="https://source.unsplash.com/random/40x40/?portrait" alt="${newsletter.author}" class="w-10 h-10 rounded-full">
                    <span class="ml-3 font-medium text-gray-900">${newsletter.author}</span>
                </div>
            </div>
        </div>
    `;
}

// Display all newsletters
function displayAllNewsletters(newsletters) {
    const grid = document.getElementById('newsletter-grid');
    if (!grid) return;

    grid.innerHTML = newsletters.slice(1).map(newsletter => `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <img src="${newsletter.image}" alt="${newsletter.title}" class="w-full h-48 object-cover">
            <div class="p-6">
                <div class="flex items-center mb-4">
                    <span class="bg-primary text-white text-sm px-3 py-1 rounded-full">${newsletter.category}</span>
                    <span class="ml-4 text-gray-600">${formatDate(newsletter.date)}</span>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">${newsletter.title}</h3>
                <p class="text-gray-600 mb-4">${truncateText(newsletter.content, 150)}</p>
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="https://source.unsplash.com/random/32x32/?portrait" alt="${newsletter.author}" class="w-8 h-8 rounded-full">
                        <span class="ml-2 text-sm font-medium text-gray-900">${newsletter.author}</span>
                    </div>
                    <div class="flex gap-2">
                        ${newsletter.tags.map(tag => `
                            <span class="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">${tag}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load research papers
async function loadResearchPapers() {
    try {
        const response = await fetch('papers.json');
        const papers = await response.json();
        displayResearchPapers(papers);
    } catch (error) {
        console.error('Error loading research papers:', error);
    }
}

// Display research papers
function displayResearchPapers(papers) {
    const grid = document.getElementById('research-grid');
    if (!grid) return;

    grid.innerHTML = papers.map(paper => `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div class="p-6">
                <div class="flex items-center mb-4">
                    <span class="bg-primary text-white text-sm px-3 py-1 rounded-full">${paper.category}</span>
                    <span class="ml-4 text-gray-600">${formatDate(paper.date)}</span>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">${paper.title}</h3>
                <p class="text-gray-600 mb-4">${paper.abstract}</p>
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <span class="text-sm font-medium text-gray-900">${paper.author}</span>
                    </div>
                    <div class="flex gap-2">
                        ${paper.tags.map(tag => `
                            <span class="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">${tag}</span>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize content based on current page
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('newsletters.html')) {
        loadNewsletterContent();
    } else if (path.includes('research.html')) {
        loadResearchPapers();
    }
});

// Custom toggle script
document.addEventListener('DOMContentLoaded', function () {
  const togglerButton = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.getElementById('navbarNav');
  
  togglerButton.addEventListener('click', function () {
    if (navbarCollapse.classList.contains('show')) {
      navbarCollapse.classList.remove('show'); // Manually remove the 'show' class to close it
    } else {
      navbarCollapse.classList.add('show'); // Add the 'show' class to open it
    }
  });
});
