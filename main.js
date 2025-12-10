/**
 * UNIFIED SITE.JS - Works on ALL Pages
 * Detects which page is active and loads appropriate functionality
 * Eliminates redundant code across multiple JS files
 * 
 * Features:
 * - Automatic page detection
 * - Shared utilities (navigation, back-to-top, smooth scroll)
 * - Page-specific features (search, filters, forms, animations)
 * - Performance optimized
 * - Fully accessible
 */

// ==========================================
// UTILITY FUNCTIONS (Used by all pages)
// ==========================================

const Utils = {
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit = 250) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-weight: 500;
            max-width: 400px;
            ${type === 'success' ? 'background: #28a745; color: white;' : ''}
            ${type === 'error' ? 'background: #dc3545; color: white;' : ''}
            ${type === 'info' ? 'background: #17a2b8; color: white;' : ''}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
};

// ==========================================
// PAGE DETECTOR
// ==========================================

const PageDetector = {
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        if (filename.includes('attractions')) return 'attractions';
        if (filename.includes('beaches')) return 'beaches';
        if (filename.includes('culture')) return 'culture';
        if (filename.includes('plan')) return 'plan';
        if (filename.includes('team')) return 'team';
        return 'home';
    },

    isPage(pageName) {
        return this.getCurrentPage() === pageName;
    }
};

// ==========================================
// SHARED FEATURES (All Pages)
// ==========================================

const SharedFeatures = {
    // Mobile Navigation
    initMobileNav() {
        const menuToggle = document.querySelector('.menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!menuToggle || !navMenu) return;
        
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
            
            if (!isExpanded) {
                const firstLink = navMenu.querySelector('a');
                if (firstLink) firstLink.focus();
            }
        });
        
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                menuToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
                menuToggle.focus();
            }
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                menuToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            }
        });
        
        // Close on window resize
        window.addEventListener('resize', Utils.debounce(() => {
            if (window.innerWidth > 768) {
                menuToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            }
        }, 250));
    },

    // Back to Top Button
    initBackToTop() {
        const backToTopBtn = document.getElementById('back-to-top');
        if (!backToTopBtn) return;
        
        const handleScroll = Utils.throttle(() => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }, 100);
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    },

    // Smooth Scrolling for Anchor Links
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    
                    const headerOffset = 100;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                }
            });
        });
    },

    // Lazy Loading Images
    initLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            images.forEach(img => imageObserver.observe(img));
        }
    },

    // Accessibility Enhancements
    enhanceAccessibility() {
        // Make cards keyboard accessible
        const cards = document.querySelectorAll(
            '.feature-card, .attraction-card, .beach-card, .season-card, ' +
            '.transport-card, .package-card, .timeline-item, .heritage-card'
        );
        
        cards.forEach(card => {
            if (!card.hasAttribute('tabindex')) {
                card.setAttribute('tabindex', '0');
            }
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    },

    // Performance Logging
    logPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        console.log('Performance Metrics:');
                        console.log('- DOM Content Loaded:', Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart), 'ms');
                        console.log('- Page Load Time:', Math.round(perfData.loadEventEnd - perfData.loadEventStart), 'ms');
                    }
                }, 0);
            });
        }
    }
};

// ==========================================
// ATTRACTIONS PAGE FEATURES
// ==========================================

const AttractionsPage = {
    init() {
        this.initSearch();
        this.initFilters();
        this.applyURLFilter(); // Apply filter from URL if present
        this.initLoadMore(); // Handle load more button
    },
    applyURLFilter() {
        // Get filter parameter from URL (e.g., ?filter=churches)
        const urlParams = new URLSearchParams(window.location.search);
        const filterCategory = urlParams.get('filter');
        
        if (filterCategory) {
            // Find the button with matching category
            const targetButton = document.querySelector(`.filter-tab[data-category="${filterCategory}"]`);
            
            if (targetButton) {
                // Trigger click on the button to activate filter
                targetButton.click();
                
                // Smooth scroll to attractions section after brief delay
                setTimeout(() => {
                    const attractionsSection = document.querySelector('.attractions-grid');
                    if (attractionsSection) {
                        const headerOffset = 100;
                        const elementPosition = attractionsSection.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            }
        }
    },
    
    initLoadMore() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (!loadMoreBtn) return;
        
        loadMoreBtn.addEventListener('click', () => {
            // Hide the button
            loadMoreBtn.style.display = 'none';
            
            // Create and show themed message
            const messageDiv = document.createElement('div');
            messageDiv.className = 'no-more-message';
            messageDiv.innerHTML = `
                <div class="message-icon">🏖️</div>
                <h3 class="message-title">You've Seen It All!</h3>
                <p class="message-text">
                    We're currently updating our attractions database with more amazing places to visit in Goa. 
                    Check back soon for new discoveries!
                </p>
                <div class="message-badge">Coming Soon</div>
            `;
            
            // Insert message where button was
            const wrapper = loadMoreBtn.parentElement;
            wrapper.appendChild(messageDiv);
            
            // Smooth scroll to message
            setTimeout(() => {
                messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        });
    },


    initSearch() {
        const searchInput = document.getElementById('attraction-search');
        if (!searchInput) return;

        const searchAttractions = () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const attractions = document.querySelectorAll('.attraction-card');
            let visibleCount = 0;

            attractions.forEach(card => {
                const title = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
                const description = card.querySelector('.card-description')?.textContent.toLowerCase() || '';
                const location = card.querySelector('.card-location')?.textContent.toLowerCase() || '';

                const matches = title.includes(searchTerm) || 
                               description.includes(searchTerm) || 
                               location.includes(searchTerm);

                if (matches || searchTerm === '') {
                    card.style.display = '';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            this.announceResults(visibleCount, attractions.length);
        };

        searchInput.addEventListener('input', Utils.debounce(searchAttractions, 300));
    },

    initFilters() {
        const filterButtons = document.querySelectorAll('.filter-tab');
        if (!filterButtons.length) return;

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-category');
                
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter attractions
                const attractions = document.querySelectorAll('.attraction-card');
                let visibleCount = 0;

                attractions.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    
                    if (category === 'all' || cardCategory === category) {
                        card.style.display = '';
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                this.announceResults(visibleCount, attractions.length);
            });
        });
    },

    announceResults(visible, total) {
        const announcement = `Showing ${visible} of ${total} attractions`;
        const announcer = document.getElementById('search-announcer');
        
        if (announcer) {
            announcer.textContent = announcement;
        } else {
            // Create announcer if it doesn't exist
            const div = document.createElement('div');
            div.id = 'search-announcer';
            div.className = 'sr-only';
            div.setAttribute('aria-live', 'polite');
            div.textContent = announcement;
            document.body.appendChild(div);
        }
    }
};

// ==========================================
// BEACHES PAGE FEATURES
// ==========================================

const BeachesPage = {
    init() {
        this.initRegionFiltering();
    },

    initRegionFiltering() {
        const regionCards = document.querySelectorAll('.region-card');
        if (!regionCards.length) return;

        regionCards.forEach(card => {
            card.addEventListener('click', () => {
                const region = card.getAttribute('data-region');
                this.filterBeaches(region);
            });

            // Keyboard support
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    },

    filterBeaches(region) {
        const beaches = document.querySelectorAll('.beach-card');
        let visibleCount = 0;

        beaches.forEach(beach => {
            const beachRegion = beach.getAttribute('data-region');
            
            if (region === 'all' || beachRegion === region) {
                beach.style.display = '';
                visibleCount++;
            } else {
                beach.style.display = 'none';
            }
        });

        // Scroll to beaches section
        const beachesSection = document.querySelector('.featured-beaches');
        if (beachesSection) {
            const headerOffset = 100;
            const elementPosition = beachesSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }

        // Announce results
        const announcement = `Showing ${visibleCount} beaches in ${region === 'all' ? 'all regions' : region}`;
        const announcer = document.getElementById('filter-announcer');
        
        if (announcer) {
            announcer.textContent = announcement;
        } else {
            const div = document.createElement('div');
            div.id = 'filter-announcer';
            div.className = 'sr-only';
            div.setAttribute('aria-live', 'polite');
            div.textContent = announcement;
            document.body.appendChild(div);
        }
    }
};

// ==========================================
// CULTURE PAGE FEATURES
// ==========================================

const CulturePage = {
    init() {
        this.initTimelineAnimations();
        this.initCardAnimations();
    },

    initTimelineAnimations() {
        const timelineItems = document.querySelectorAll('.timeline-item');
        if (!timelineItems.length) return;
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateX(0)';
                        }, index * 100);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.2
            });
            
            timelineItems.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-30px)';
                item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(item);
            });
        }
    },

    initCardAnimations() {
        const cards = document.querySelectorAll('.highlight-card, .heritage-card');
        if (!cards.length) return;
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, index * 80);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1
            });
            
            cards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(card);
            });
        }
    }
};

// ==========================================
// PLAN TRIP PAGE FEATURES
// ==========================================

const PlanTripPage = {
    selectedInterests: [],

    init() {
        this.initInterestTags();
        this.initDateValidation();
        this.initFormSubmission();
    },

    initInterestTags() {
        const interestTags = document.querySelectorAll('.interest-tag');
        if (!interestTags.length) return;
        
        interestTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const interest = tag.getAttribute('data-interest');
                
                // Toggle active state
                tag.classList.toggle('active');
                
                // Update selected interests
                if (this.selectedInterests.includes(interest)) {
                    this.selectedInterests = this.selectedInterests.filter(i => i !== interest);
                } else {
                    this.selectedInterests.push(interest);
                }
                
                console.log('Selected interests:', this.selectedInterests);
            });
            
            // Keyboard support
            tag.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    tag.click();
                }
            });
        });
    },

    initDateValidation() {
        const checkinInput = document.getElementById('checkin-date');
        const checkoutInput = document.getElementById('checkout-date');
        
        if (!checkinInput || !checkoutInput) return;
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        checkinInput.setAttribute('min', today);
        
        // Update checkout min date when checkin changes
        checkinInput.addEventListener('change', () => {
            const checkinDate = checkinInput.value;
            if (checkinDate) {
                const nextDay = new Date(checkinDate);
                nextDay.setDate(nextDay.getDate() + 1);
                checkoutInput.setAttribute('min', nextDay.toISOString().split('T')[0]);
            }
        });
    },

    validateDates(checkinDate, checkoutDate) {
        const checkin = new Date(checkinDate);
        const checkout = new Date(checkoutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (checkin < today) {
            return { valid: false, message: 'Check-in date must be today or later' };
        }
        
        if (checkout <= checkin) {
            return { valid: false, message: 'Check-out date must be after check-in date' };
        }
        
        return { valid: true };
    },


    validateEmail(email) {
        // Check if email is provided
        if (!email || email.trim() === '') {
            return { valid: false, message: 'Please enter your email address' };
        }
        
        // Regular expression for email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }
        
        return { valid: true };
    },
    initFormSubmission() {
        const form = document.getElementById('trip-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const email = formData.get('email');
            const checkinDate = formData.get('checkin-date');
            const checkoutDate = formData.get('checkout-date');
            const travelers = formData.get('travelers');
            const specialRequests = formData.get('special-requests');
            
            // Validate email FIRST
            const emailValidation = this.validateEmail(email);
            if (!emailValidation.valid) {
                Utils.showNotification(emailValidation.message, 'error');
                // Focus on email field for better UX
                const emailInput = document.getElementById('email');
                if (emailInput) emailInput.focus();
                return;
            }
            
            // Validate dates
            const dateValidation = this.validateDates(checkinDate, checkoutDate);
            if (!dateValidation.valid) {
                Utils.showNotification(dateValidation.message, 'error');
                return;
            }
            
            // Validate travelers
            if (!travelers) {
                Utils.showNotification('Please select number of travelers', 'error');
                return;
            }
            
            // Validate interests
            if (this.selectedInterests.length === 0) {
                Utils.showNotification('Please select at least one travel interest', 'error');
                return;
            }
            
            // Prepare data
            const tripData = {
                email,
                checkinDate,
                checkoutDate,
                travelers,
                interests: this.selectedInterests,
                specialRequests
            };
            
            console.log('Trip data:', tripData);
            
            // Show loading state
            const submitBtn = form.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Itinerary...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                Utils.showNotification(`Itinerary sent to ${email}!`, 'success');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }
};

// ==========================================
// HOME PAGE FEATURES
// ==========================================

const HomePage = {
    init() {
        this.initFeatureCards();
        this.renderTeamMembers();
    },

    initFeatureCards() {
        const cards = document.querySelectorAll('.feature-card');
        if (!cards.length) return;
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.style.opacity = '1';
                            entry.target.style.transform = 'translateY(0)';
                        }, index * 100);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1
            });
            
            cards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(card);
            });
        }
    },

    renderTeamMembers() {
        // Team data
        const teamMembers = [
            {
                name: "Team Member 1",
                role: "Frontend Developer",
                contribution: "Homepage & Responsive Design"
            },
            {
                name: "Team Member 2",
                role: "Backend Developer",
                contribution: "API Integration & Database"
            },
            {
                name: "Team Member 3",
                role: "UI/UX Designer",
                contribution: "Design & User Experience"
            },
            {
                name: "Team Member 4",
                role: "Content Writer",
                contribution: "Content & Documentation"
            }
        ];

        const teamContainer = document.getElementById('team-members');
        if (!teamContainer) return;

        // Render team members (if needed)
        console.log('Team members ready:', teamMembers);
    }
};

// ==========================================
// API INTEGRATION (Ready for all pages)
// ==========================================

const API = {
    baseURL: '/api',
    
    async fetchAttractions() {
        try {
            const response = await fetch(`${this.baseURL}/attractions`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch attractions:', error);
            return { success: false, error: error.message };
        }
    },

    async fetchBeaches(region = 'all') {
        try {
            const url = region === 'all' 
                ? `${this.baseURL}/beaches` 
                : `${this.baseURL}/beaches/region/${region}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch beaches:', error);
            return { success: false, error: error.message };
        }
    },

    async submitTripPlan(tripData) {
        try {
            const response = await fetch(`${this.baseURL}/trip/create-itinerary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tripData)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to submit trip plan:', error);
            throw error;
        }
    }
};

// ==========================================
// MAIN INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = PageDetector.getCurrentPage();
    console.log(`Site.js initialized on: ${currentPage} page`);
    
    // Initialize shared features (all pages)
    SharedFeatures.initMobileNav();
    SharedFeatures.initBackToTop();
    SharedFeatures.initSmoothScroll();
    SharedFeatures.initLazyLoading();
    SharedFeatures.enhanceAccessibility();
    SharedFeatures.logPerformance();
    
    // Initialize page-specific features
    switch(currentPage) {
        case 'attractions':
            AttractionsPage.init();
            console.log('Attractions features loaded');
            break;
            
        case 'beaches':
            BeachesPage.init();
            console.log('Beaches features loaded');
            break;
            
        case 'culture':
            CulturePage.init();
            console.log('Culture features loaded');
            break;
            
        case 'plan':
            PlanTripPage.init();
            console.log('Plan Trip features loaded');
            break;
            
        case 'home':
            HomePage.init();
            console.log('Homepage features loaded');
            break;
            
        default:
            console.log('Basic features loaded');
    }
    
    console.log('All features initialized successfully!');
});

// ==========================================
// EXPORT FOR MODULES (if needed)
// ==========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Utils,
        PageDetector,
        SharedFeatures,
        AttractionsPage,
        BeachesPage,
        CulturePage,
        PlanTripPage,
        HomePage,
        API
    };
}