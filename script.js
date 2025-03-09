function openLink(url) {
  window.open(url, '_blank'); // Always open in a new tab
}




$(document).ready(function() {
  // Load JSON data
  $.getJSON('content.json', function(data) {
    // Function to display all cards
    function displayCards(content) {
      $('#newsletter-cards').empty();
      content.forEach(item => {
        $('#newsletter-cards').append(`
          <div class="newsletter-card" data-category="${item.category}">
            <img class="card-img-top" src="${item.image || 'https://cdn.glitch.global/e935e5cb-fc33-4f8d-a0d2-76cc83905dc9/360_F_308697506_9dsBYHXm9FwuW0qcEqimAEXUvzTwfzwe.jpg?v=1739735883883'}" alt="${item.title}">
            <div class="card-content">
              <p class="newsletter-date">${formatDate(item.date)}</p>
              <h3 class="newsletter-title">${item.title}</h3>
              <p class="newsletter-description">${truncateText(item.content, 150)}</p>
              <button class="cta-button" onclick="openLink('${item.link}')">Read More</button>
            </div>
          </div>
        `);
      });
    }

    // Function to set featured card on homepage
    function setFeaturedCard(content) {
      const sortedContent = content.sort((a, b) => new Date(b.date) - new Date(a.date));
      const latestNewsletter = sortedContent[0];
      
      $('.newsletter-card.featured').html(`
      <div>
      
        <div class="card-content">
          
          <p class="newsletter-date">${formatDate(latestNewsletter.date)}</p>
          <h3 class="newsletter-title">${latestNewsletter.title}</h3>
          <p class="newsletter-description">${latestNewsletter.content}</p>
          <button class="cta-button" onclick="openLink('${latestNewsletter.link}')">Read More</button>
        </div>
        </div>
      `);
      
      
    }

    // Helper function to format dates
    function formatDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Month is zero-based

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}


    // Helper function to truncate text
    function truncateText(text, maxLength) {
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength) + '...';
    }

    // Filter functionality
    $('.filter-btn').click(function() {
      $('.filter-btn').removeClass('active');
      $(this).addClass('active');
      
      const category = $(this).data('category');
      if (category === 'all') {
        displayCards(data);
      } else {
        const filteredContent = data.filter(item => item.category === category);
        displayCards(filteredContent);
      }
    });

    // Initial display
    displayCards(data);
    
    // Set featured card if on homepage
    if ($('.newsletter-card.featured').length) {
      setFeaturedCard(data);
    }
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
