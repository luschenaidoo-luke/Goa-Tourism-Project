/**
 * VISIT GOA - MAIN JAVASCRIPT
 * 
 * Features:
 * - Mobile navigation toggle
 * - Back to top button
 * - Smooth scrolling
 * - AJAX preparation for backend integration
 * - API integration structure
 * - Accessibility enhancements
 * - Performance optimizations
 * - Lazy loading images
 */

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 250) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// ==========================================
// API CONFIGURATION & HELPERS
// ==========================================

const API_CONFIG = {
    baseURL: '/api', // Will be configured for actual backend
    endpoints: {
        attractions: '/attractions',
        beaches: '/beaches',
        events: '/events',
        itinerary: '/itinerary',
        weather: '/weather'
    },
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

/**
 * Generic AJAX request function
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @returns {Promise} Promise resolving to response data
 */
async function apiRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                ...API_CONFIG.headers,
                ...options.headers
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            console.error('Request timeout');
            return { success: false, error: 'Request timeout' };
        }
        
        console.error('API request failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @returns {Promise} Promise resolving to response data
 */
async function apiGet(endpoint) {
    return apiRequest(`${API_CONFIG.baseURL}${endpoint}`, {
        method: 'GET'
    });
}

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise} Promise resolving to response data
 */
async function apiPost(endpoint, data) {
    return apiRequest(`${API_CONFIG.baseURL}${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// ==========================================
// DATA LOADING & DYNAMIC CONTENT
// ==========================================

/**
 * Load team members (placeholder for API integration)
 */
async function loadTeamMembers() {
    const authorList = document.getElementById('author-list');
    if (!authorList) return;
    
    // Placeholder team data - will be replaced with API call
    const teamMembers = [
        'Student Name 1',
        'Student Name 2',
        'Student Name 3',
        'Student Name 4'
    ];
    
    // In production, this would be:
    // const result = await apiGet('/team-members');
    // if (result.success) {
    //     const teamMembers = result.data;
    // }
    
    authorList.textContent = teamMembers.join(', ');
}

/**
 * Load attractions data (placeholder for API integration)
 */
async function loadAttractions() {
    const container = document.getElementById('attractionsContainer');
    if (!container) return;
    
    // This is ready for API integration
    // const result = await apiGet(API_CONFIG.endpoints.attractions);
    // if (result.success) {
    //     renderAttractions(result.data);
    // }
    
    console.log('Ready for attractions API integration');
}

/**
 * Example: Submit trip planning form with AJAX
 * @param {FormData} formData - Form data to submit
 */
async function submitTripPlan(formData) {
    const data = Object.fromEntries(formData.entries());
    
    // Example AJAX submission
    const result = await apiPost(API_CONFIG.endpoints.itinerary, data);
    
    if (result.success) {
        console.log('Trip plan submitted successfully:', result.data);
        showNotification('Trip plan created successfully!', 'success');
        return result.data;
    } else {
        console.error('Failed to submit trip plan:', result.error);
        showNotification('Failed to submit trip plan. Please try again.', 'error');
        return null;
    }
}

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    // ARIA live region for accessibility
    const notification = document.createElement('div');
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ==========================================
// NAVIGATION
// ==========================================

/**
 * Initialize mobile navigation
 */
function initMobileNav() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!menuToggle || !navMenu) return;
    
    menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        
        menuToggle.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('active');
        
        // Trap focus in menu when open
        if (!isExpanded) {
            const firstLink = navMenu.querySelector('a');
            if (firstLink) firstLink.focus();
        }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
            menuToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            menuToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
            menuToggle.focus();
        }
    });
    
    // Close menu when window is resized to desktop
    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 768) {
            menuToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('active');
        }
    }, 250));
}

/**
 * Handle header visibility on scroll
 */
function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    let lastScrollTop = 0;
    
    const handleScroll = throttle(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Hide header when scrolling down, show when scrolling up
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    }, 100);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
}

// ==========================================
// BACK TO TOP BUTTON
// ==========================================

/**
 * Initialize back to top button
 */
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;
    
    const handleScroll = throttle(() => {
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
}

// ==========================================
// SMOOTH SCROLLING
// ==========================================

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if href is just "#"
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
                
                // Set focus for accessibility
                target.setAttribute('tabindex', '-1');
                target.focus();
            }
        });
    });
}

// ==========================================
// LAZY LOADING
// ==========================================

/**
 * Initialize lazy loading for images
 */
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Preload image
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        img.src = img.dataset.src || img.src;
                        img.classList.add('loaded');
                    };
                    tempImg.src = img.dataset.src || img.src;
                    
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        images.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    }
}

// ==========================================
// ANIMATION ON SCROLL
// ==========================================

/**
 * Initialize animation on scroll
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.card, .section-title');
    
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    animationObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            animationObserver.observe(el);
        });
    }
}

// ==========================================
// FORM HANDLING
// ==========================================

/**
 * Initialize form handlers (ready for AJAX)
 */
function initForms() {
    const forms = document.querySelectorAll('form[data-ajax]');
    
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const submitButton = form.querySelector('[type="submit"]');
            
            // Disable submit button
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Submitting...';
            }
            
            // Example: Submit to API
            const result = await submitTripPlan(formData);
            
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Submit';
            }
            
            if (result) {
                form.reset();
            }
        });
    });
}

// ==========================================
// PERFORMANCE MONITORING
// ==========================================

/**
 * Log performance metrics
 */
function logPerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Performance Metrics:');
                console.log('- DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
                console.log('- Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                console.log('- Total Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
            }, 0);
        });
    }
}

// ==========================================
// ACCESSIBILITY ENHANCEMENTS
// ==========================================

/**
 * Announce page changes to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        announcement.remove();
    }, 1000);
}

/**
 * Ensure keyboard navigation for interactive elements
 */
function enhanceKeyboardNav() {
    // Add keyboard support to card links
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const link = card.querySelector('.learn-more');
                if (link) {
                    e.preventDefault();
                    link.click();
                }
            }
        });
    });
}

// ==========================================
// THIRD-PARTY API INTEGRATION EXAMPLES
// ==========================================

/**
 * Example: Weather API integration
 */
async function loadWeather() {
    // Placeholder for weather API integration
    // const result = await fetch('https://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=Goa');
    console.log('Ready for Weather API integration');
}

/**
 * Example: Google Maps API integration
 */
function initMap() {
    // Placeholder for Google Maps integration
    // This would initialize Google Maps with Goa locations
    console.log('Ready for Google Maps API integration');
}

/**
 * Example: Social Media Share functionality
 */
function initSocialShare() {
    const shareButtons = document.querySelectorAll('[data-share]');
    
    shareButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Visit Goa',
                        text: 'Discover paradise in Goa!',
                        url: window.location.href
                    });
                } catch (err) {
                    console.log('Share failed:', err);
                }
            }
        });
    });
}

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initialize all functionality when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Visit Goa - Website Initialized');
    
    // Navigation
    initMobileNav();
    initHeaderScroll();
    
    // UI Features
    initBackToTop();
    initSmoothScroll();
    initLazyLoading();
    initScrollAnimations();
    
    // Forms & Data
    initForms();
    loadTeamMembers();
    loadAttractions();
    
    // Accessibility
    enhanceKeyboardNav();
    
    // Third-party integrations (ready for implementation)
    // loadWeather();
    // initMap();
    initSocialShare();
    
    // Performance
    logPerformance();
    
    // Mark API container as ready
    const apiContainer = document.getElementById('api-data-container');
    if (apiContainer) {
        apiContainer.setAttribute('data-api-ready', 'true');
    }
});

// ==========================================
// SERVICE WORKER REGISTRATION (PWA Ready)
// ==========================================

/**
 * Register service worker for PWA functionality
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration is ready but not implemented yet
        // navigator.serviceWorker.register('/service-worker.js')
        //     .then(registration => console.log('SW registered:', registration))
        //     .catch(err => console.log('SW registration failed:', err));
    });
}

// ==========================================
// EXPORT FOR MODULES (if using ES6 modules)
// ==========================================

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        apiGet,
        apiPost,
        submitTripPlan,
        showNotification,
        announceToScreenReader
    };
}