// Helper function to open links in new tab
function openLink(url) {
    if (url && isValidUrl(url)) {
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
        displayAllNewsletters(newsletters.slice(1)); // Skip the featured one
    } catch (error) {
        console.error('Error loading newsletter content:', error);
        // Display fallback content
        displayFallbackContent();
    }
}

// Display featured newsletter with animation
function displayFeaturedNewsletter(newsletter) {
    const featuredContent = document.getElementById('featured-content');
    if (!featuredContent) return;

    const pdfUrl = `newsletters/pdf/${newsletter.id}.pdf`;
    
    featuredContent.innerHTML = `
        <div class="relative">
            <div class="relative w-full h-64 mb-6 overflow-hidden rounded-lg">
                <img src="${newsletter.image}" alt="${newsletter.title}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" />
                <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
            </div>
            <div class="flex items-center justify-between mb-4">
                <span class="text-sm text-textSecondary">${formatDate(newsletter.date)}</span>
                <span class="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-full">${newsletter.category}</span>
            </div>
            <h3 class="text-2xl font-bold mb-4 text-textPrimary group-hover:text-primary transition-colors duration-300">${newsletter.title}</h3>
            <p class="text-textSecondary mb-6 group-hover:text-textPrimary transition-colors duration-300">${newsletter.content}</p>
            <div class="flex items-center justify-end">
                <a href="${pdfUrl}" target="_blank" class="inline-flex items-center text-primary hover:text-secondary transition-colors duration-300">
                    Read Full Newsletter <i class="fi-rr-arrow-right ml-2"></i>
                </a>
            </div>
            <div class="flex flex-wrap gap-2 mt-4">
                ${newsletter.tags.map(tag => `
                    <span class="px-2 py-1 text-xs text-textSecondary bg-bgLight rounded-full hover:bg-primary hover:text-white transition-colors duration-300">${tag}</span>
                `).join('')}
            </div>
        </div>
    `;

    // Make the entire featured newsletter clickable
    featuredContent.style.cursor = 'pointer';
    featuredContent.addEventListener('click', () => openLink(pdfUrl));
}

// Display all newsletters with staggered animation
function displayAllNewsletters(newsletters) {
    const grid = document.getElementById('newsletters-grid');
    const template = document.getElementById('newsletter-card-template');
    const tagTemplate = document.getElementById('tag-template');
    
    if (!grid || !template || !tagTemplate) return;

    grid.innerHTML = '';

    newsletters.forEach((newsletter, index) => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.group');
        
        // Add staggered animation delay
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-fade-in');

        // Set content
        const pdfUrl = `newsletters/pdf/${newsletter.id}.pdf`;
        const img = clone.querySelector('img');
        img.src = newsletter.image;
        img.alt = newsletter.title;

        clone.querySelector('.date').textContent = formatDate(newsletter.date);
        clone.querySelector('.category').textContent = newsletter.category;
        clone.querySelector('.title').textContent = newsletter.title;
        clone.querySelector('.content').textContent = truncateText(newsletter.content, 150);
        
        const readMoreLink = clone.querySelector('.read-more');
        readMoreLink.href = pdfUrl;
        readMoreLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLink(pdfUrl);
        });

        // Add tags
        const tagsContainer = clone.querySelector('.tags');
        newsletter.tags.forEach(tag => {
            const tagClone = tagTemplate.content.cloneNode(true);
            const tagSpan = tagClone.querySelector('span');
            tagSpan.textContent = tag;
            tagsContainer.appendChild(tagSpan);
        });

        grid.appendChild(clone);
    });
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
                    opacity-0 animate-fade-in"
             style="animation-delay: ${index * 0.1}s">
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
document.addEventListener('DOMContentLoaded', () => {
    // Add dynamic background to all sections
    document.querySelectorAll('section').forEach(addDynamicBackground);

    // Set primary color CSS variable
    document.documentElement.style.setProperty('--color-primary', '#3e5c76');

    // Initialize based on current page
    const path = window.location.pathname;
    
    if (path.includes('newsletters.html')) {
        initializeNewsletters();
    } else if (path.includes('research.html')) {
        initializeResearch();
    } else {
        initializeHome();
    }

    // Add smooth scroll for anchor links
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

    // Add hover effect for navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.classList.add('animate-scale-pulse');
        });
        link.addEventListener('mouseleave', () => {
            link.classList.remove('animate-scale-pulse');
        });
    });
});

function initializeNewsletters() {
    loadNewsletterContent()
        .then(newsletters => {
            if (newsletters && newsletters.length > 0) {
                displayFeaturedNewsletter(newsletters[0]);
                displayAllNewsletters(newsletters);
            }
        })
        .catch(error => {
            console.error('Error loading newsletters:', error);
            displayFallbackContent();
        });
}

function initializeHome() {
    // Add dynamic background to all sections
    document.querySelectorAll('section').forEach(addDynamicBackground);

    // Load featured newsletter
    loadNewsletterContent()
        .then(() => {
            const featuredNewsletter = document.getElementById('featured-newsletter');
            if (featuredNewsletter) {
                displayFeaturedNewsletter({
                    id: 1,
                    title: "The Future of AI in Healthcare",
                    date: "2024-03-19",
                    category: "Technology",
                    content: "Exploring how artificial intelligence is revolutionizing healthcare, from diagnosis to treatment planning.",
                    image: "https://source.unsplash.com/random/800x600/?ai,healthcare",
                    tags: ["AI", "Healthcare", "Technology", "Innovation"],
                    author: "Soha"
                });
            }
        })
        .catch(error => {
            console.error('Error loading featured newsletter:', error);
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

function displayFallbackContent() {
    const featuredContent = document.getElementById('featured-content');
    const grid = document.getElementById('newsletters-grid');

    if (featuredContent) {
        featuredContent.innerHTML = `
            <div class="text-center p-8">
                <h3 class="text-xl font-bold mb-4 text-textPrimary">No Featured Newsletter Available</h3>
                <p class="text-textSecondary">Please check back later for updates.</p>
            </div>
        `;
    }

    if (grid) {
        grid.innerHTML = `
            <div class="col-span-full text-center p-8">
                <h3 class="text-xl font-bold mb-4 text-white">No Newsletters Available</h3>
                <p class="text-gray-300">Please check back later for updates.</p>
            </div>
        `;
    }
}

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
