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

// Load and display newsletter content with animations
async function loadNewsletterContent() {
    try {
        const response = await fetch('content.json');
        const data = await response.json();
        const newsletters = data.newsletters;

        // Sort newsletters by date (newest first)
        newsletters.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Display featured newsletter (latest)
        displayFeaturedNewsletter(newsletters[0]);

        // Display all newsletters with staggered animation
        displayAllNewsletters(newsletters);
    } catch (error) {
        console.error('Error loading newsletter content:', error);
    }
}

// Display featured newsletter with animation
function displayFeaturedNewsletter(newsletter) {
    const featuredSection = document.getElementById('featured-newsletter');
    if (!featuredSection || !newsletter) return;

    featuredSection.innerHTML = `
        <div class="flex flex-col md:flex-row transform hover:scale-[1.02] transition-all duration-300">
            <div class="md:w-1/2">
                <img src="${newsletter.image}" alt="${newsletter.title}" 
                     class="w-full h-64 md:h-full object-cover rounded-t-xl md:rounded-l-xl md:rounded-t-none 
                            animate-fade-in">
            </div>
            <div class="md:w-1/2 p-6 md:p-8 bg-white rounded-b-xl md:rounded-r-xl md:rounded-b-none">
                <div class="flex items-center mb-4 animate-slide-up">
                    <span class="bg-primary text-white text-sm px-3 py-1 rounded-full">${newsletter.category}</span>
                    <span class="ml-4 text-textSecondary">${formatDate(newsletter.date)}</span>
                </div>
                <h3 class="text-2xl font-bold text-primary mb-4 animate-slide-up">${newsletter.title}</h3>
                <p class="text-textPrimary mb-6 animate-slide-up">${newsletter.content}</p>
                <div class="flex flex-wrap gap-2 animate-slide-up">
                    ${newsletter.tags.map(tag => `
                        <span class="text-xs text-textSecondary bg-bgLight px-2 py-1 rounded-full 
                                   hover:bg-primary hover:text-white transition-colors duration-300">${tag}</span>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// Display all newsletters with staggered animation
function displayAllNewsletters(newsletters) {
    const grid = document.getElementById('newsletter-grid');
    if (!grid) return;

    grid.innerHTML = newsletters.slice(1).map((newsletter, index) => `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300 
                    opacity-0 animate-[fade-in_0.5s_ease-out_${index * 0.1}s_forwards]">
            <img src="${newsletter.image}" alt="${newsletter.title}" class="w-full h-48 object-cover">
            <div class="p-6">
                <div class="flex items-center mb-4">
                    <span class="bg-primary text-white text-sm px-3 py-1 rounded-full">${newsletter.category}</span>
                    <span class="ml-4 text-textSecondary">${formatDate(newsletter.date)}</span>
                </div>
                <h3 class="text-xl font-bold text-primary mb-2 hover:text-secondary transition-colors duration-300">${newsletter.title}</h3>
                <p class="text-textPrimary mb-4">${truncateText(newsletter.content, 150)}</p>
                <div class="flex flex-wrap gap-2">
                    ${newsletter.tags.map(tag => `
                        <span class="text-xs text-textSecondary bg-bgLight px-2 py-1 rounded-full 
                                   hover:bg-primary hover:text-white transition-colors duration-300">${tag}</span>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// Load research papers with animations
async function loadResearchPapers() {
    try {
        const response = await fetch('papers.json');
        const papers = await response.json();
        displayResearchPapers(papers);
    } catch (error) {
        console.error('Error loading research papers:', error);
    }
}

// Display research papers with animations
function displayResearchPapers(papers) {
    const grid = document.getElementById('research-grid');
    if (!grid) return;

    grid.innerHTML = papers.map((paper, index) => `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300 
                    opacity-0 animate-[fade-in_0.5s_ease-out_${index * 0.1}s_forwards]">
            <div class="p-6">
                <div class="flex items-center mb-4">
                    <span class="bg-primary text-white text-sm px-3 py-1 rounded-full">${paper.category}</span>
                    <span class="ml-4 text-textSecondary">${formatDate(paper.date)}</span>
                </div>
                <h3 class="text-xl font-bold text-primary mb-2 hover:text-secondary transition-colors duration-300">${paper.title}</h3>
                <p class="text-textPrimary mb-4">${paper.abstract}</p>
                <div class="flex flex-wrap gap-2">
                    ${paper.tags.map(tag => `
                        <span class="text-xs text-textSecondary bg-bgLight px-2 py-1 rounded-full 
                                   hover:bg-primary hover:text-white transition-colors duration-300">${tag}</span>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    // Add filter functionality
    const filterButtons = document.querySelectorAll('[data-category]');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            const filteredPapers = category === 'All' 
                ? papers 
                : papers.filter(paper => paper.category === category);
            
            // Update active state of filter buttons
            filterButtons.forEach(btn => btn.classList.remove('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white'));
            button.classList.add('bg-gradient-to-r', 'from-primary', 'to-secondary', 'text-white');
            
            // Re-render papers with animation
            displayResearchPapers(filteredPapers);
        });
    });
}

// Initialize content based on current page
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path.includes('newsletters.html')) {
        loadNewsletterContent();
    } else if (path.includes('research.html')) {
        loadResearchPapers();
    } else if (path.includes('index.html') || path === '/') {
        loadNewsletterContent(); // Load featured newsletter on home page
    }

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add hover effect to navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.style.transform = 'translateY(-2px)';
        });
        link.addEventListener('mouseleave', () => {
            link.style.transform = 'translateY(0)';
        });
    });
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
