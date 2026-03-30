document.addEventListener('DOMContentLoaded', () => {
    // ==== Elements ====
    const videosGrid = document.getElementById('videosGrid');
    const noResults = document.getElementById('noResults');
    const filterLinks = document.querySelectorAll('.nav-links a');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const resultsCount = document.getElementById('resultsCount');
    const searchInput = document.getElementById('searchInput');
    
    const themeToggleBtn = document.getElementById('themeToggle');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    
    const modal = document.getElementById('videoModal');
    const closeBtn = document.querySelector('.close-btn');
    const youtubePlayer = document.getElementById('youtubePlayer');

    // ==== State ====
    let favorites = JSON.parse(localStorage.getItem('islamicLibraryFavs')) || [];
    let currentFilter = 'all';
    
    // ==== Init Theme ====
    const savedTheme = localStorage.getItem('islamicLibraryTheme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
        updateThemeIcon();
    }

    // ==== Event Listeners ====
    
    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('islamicLibraryTheme', isDark ? 'dark' : 'light');
        updateThemeIcon();
    });

    function updateThemeIcon() {
        const icon = themeToggleBtn.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Mobile Menu
    mobileMenuBtn.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
    });

    // Navigation Filters
    filterLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // active state
            filterLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // mobile menu closing
            if (window.innerWidth <= 768) {
                navLinksContainer.classList.remove('active');
            }
            
            currentFilter = link.getAttribute('data-filter');
            currentCategoryTitle.textContent = link.textContent;
            searchInput.value = ''; // clear search when switching tabs
            
            renderVideos();
        });
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
        renderVideos(e.target.value.toLowerCase());
    });

    // Modal Events
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Optional: Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // ==== Functions ====

    function openModal(youtubeId) {
        // Adding origin parameter often bypasses the "Error 153" on local file:// execution
        youtubePlayer.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&origin=http://127.0.0.1`;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent background scrolling
    }

    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            youtubePlayer.src = ''; // stop video
            document.body.style.overflow = '';
        }, 300);
    }

    function toggleFavorite(e, videoId) {
        e.stopPropagation(); // prevent modal from opening
        const btn = e.currentTarget;
        
        if (favorites.includes(videoId)) {
            // Remove from fav
            favorites = favorites.filter(id => id !== videoId);
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-regular fa-star"></i>';
        } else {
            // Add to fav
            favorites.push(videoId);
            btn.classList.add('active');
            btn.innerHTML = '<i class="fa-solid fa-star"></i>';
        }
        
        localStorage.setItem('islamicLibraryFavs', JSON.stringify(favorites));
        
        // Re-render if currently on favorites tab
        if (currentFilter === 'favorites') {
            renderVideos(searchInput.value.toLowerCase());
        }
    }

    function renderVideos(searchQuery = '') {
        videosGrid.innerHTML = '';
        
        let filteredVideos = videosData;

        // Apply Category Filter
        if (currentFilter === 'favorites') {
            filteredVideos = videosData.filter(v => favorites.includes(v.id));
        } else if (currentFilter !== 'all') {
            filteredVideos = videosData.filter(v => v.category === currentFilter);
        }

        // Apply Search Filtering
        if (searchQuery) {
            filteredVideos = filteredVideos.filter(v => 
                v.title.toLowerCase().includes(searchQuery)
            );
        }

        // Update count
        resultsCount.textContent = `${filteredVideos.length} فيديو`;

        // Empty state
        if (filteredVideos.length === 0) {
            videosGrid.classList.add('hidden');
            noResults.classList.remove('hidden');
            return;
        }

        videosGrid.classList.remove('hidden');
        noResults.classList.add('hidden');

        // Render Cards
        filteredVideos.forEach(video => {
            const isFav = favorites.includes(video.id);
            const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
            
            const card = document.createElement('article');
            card.className = 'video-card';
            
            // Create content
            card.innerHTML = `
                <div class="video-thumbnail" data-video-id="${video.youtubeId}">
                    <img src="${thumbnailUrl}" alt="${video.title}" loading="lazy">
                    <div class="play-overlay">
                        <i class="fa-solid fa-play"></i>
                    </div>
                </div>
                <div class="video-info">
                    <h4 class="video-title" data-video-id="${video.youtubeId}">${video.title}</h4>
                    <div class="video-meta">
                        <span><i class="fa-solid fa-eye"></i> ${video.views}</span>
                        <span><i class="fa-regular fa-clock"></i> ${video.date}</span>
                        <button class="favorite-btn ${isFav ? 'active' : ''}" aria-label="أضف للمفضلة" data-id="${video.id}">
                            ${isFav ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>'}
                        </button>
                    </div>
                </div>
            `;
            
            // Attach event listeners
            card.querySelectorAll('[data-video-id]').forEach(el => {
                el.addEventListener('click', () => openModal(video.youtubeId));
            });
            
            card.querySelector('.favorite-btn').addEventListener('click', (e) => toggleFavorite(e, video.id));
            
            videosGrid.appendChild(card);
        });
    }

    // Initial render
    renderVideos();
});
