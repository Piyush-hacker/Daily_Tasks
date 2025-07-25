// Cloud Resource Optimizer - Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initThemeToggle();
    initNavigation();
    init3DBackground();
    initSmoothScrolling();
    initFormValidation();
    initAnimationObserver();
}

// Theme Toggle Functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    
    // Set initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Animate theme transition
            gsap.to('body', {
                duration: 0.3,
                scale: 0.95,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut'
            });
        });
    }
}

// Navigation Enhancement
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // Active nav link highlighting
    window.addEventListener('scroll', highlightActiveNav);
}

function highlightActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (scrollY >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
}

// 3D Background Animation
function init3DBackground() {
    const hero3dBackground = document.getElementById('hero3dBackground');
    
    if (!hero3dBackground || !window.THREE) {
        return;
    }
    
    try {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, hero3dBackground.clientWidth / hero3dBackground.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(hero3dBackground.clientWidth, hero3dBackground.clientHeight);
        renderer.setClearColor(0x000000, 0);
        hero3dBackground.appendChild(renderer.domElement);
        
        // Create animated geometry
        const geometry = new THREE.IcosahedronGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00C2FF,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        
        const particles = [];
        for (let i = 0; i < 50; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            particle.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            scene.add(particle);
            particles.push(particle);
        }
        
        camera.position.z = 15;
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            particles.forEach((particle, index) => {
                particle.rotation.x += 0.005;
                particle.rotation.y += 0.005;
                particle.position.y += Math.sin(Date.now() * 0.001 + index) * 0.005;
            });
            
            renderer.render(scene, camera);
        }
        
        animate();
        
        // Handle resize
        window.addEventListener('resize', () => {
            camera.aspect = hero3dBackground.clientWidth / hero3dBackground.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(hero3dBackground.clientWidth, hero3dBackground.clientHeight);
        });
        
    } catch (error) {
        console.log('3D background initialization failed:', error);
    }
}

// Smooth Scrolling
function initSmoothScrolling() {
    // Add smooth scrolling to all anchor links
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
}

// Form Validation
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('.form-input[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
        
        form.addEventListener('submit', function(e) {
            if (!validateForm(form)) {
                e.preventDefault();
            }
        });
    });
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldType = field.type;
    
    // Remove existing error
    clearFieldError(e);
    
    let isValid = true;
    let errorMessage = '';
    
    // Required field check
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Type-specific validation
    if (value && fieldType === 'number') {
        const numValue = parseFloat(value);
        const min = parseFloat(field.getAttribute('min'));
        const max = parseFloat(field.getAttribute('max'));
        
        if (isNaN(numValue)) {
            isValid = false;
            errorMessage = 'Please enter a valid number';
        } else if (!isNaN(min) && numValue < min) {
            isValid = false;
            errorMessage = `Value must be at least ${min}`;
        } else if (!isNaN(max) && numValue > max) {
            isValid = false;
            errorMessage = `Value must be at most ${max}`;
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    
    // Create or update error message
    let errorElement = field.parentElement.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        field.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    
    // Animate error appearance
    gsap.from(errorElement, {
        duration: 0.3,
        y: -10,
        opacity: 0
    });
}

function clearFieldError(e) {
    const field = e.target;
    field.classList.remove('error');
    
    const errorElement = field.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function validateForm(form) {
    const requiredFields = form.querySelectorAll('.form-input[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Animation Observer
function initAnimationObserver() {
    if (!window.IntersectionObserver) {
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                // Add animation class
                element.classList.add('animate-in');
                
                // Trigger specific animations based on element type
                if (element.classList.contains('dashboard-card')) {
                    animateDashboardCard(element);
                } else if (element.classList.contains('feature-card')) {
                    animateFeatureCard(element);
                } else if (element.classList.contains('metric-card')) {
                    animateMetricCard(element);
                }
                
                // Stop observing this element
                observer.unobserve(element);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    // Observe all animatable elements
    document.querySelectorAll('.dashboard-card, .feature-card, .metric-card, .form-section').forEach(el => {
        observer.observe(el);
    });
}

function animateDashboardCard(element) {
    gsap.from(element, {
        duration: 0.8,
        y: 30,
        opacity: 0,
        scale: 0.9,
        ease: 'power3.out'
    });
}

function animateFeatureCard(element) {
    gsap.from(element, {
        duration: 1,
        y: 40,
        opacity: 0,
        rotationY: 15,
        ease: 'power3.out'
    });
}

function animateMetricCard(element) {
    gsap.from(element, {
        duration: 0.6,
        x: -30,
        opacity: 0,
        ease: 'power2.out'
    });
}

// Utility Functions
function formatNumber(num, decimals = 1) {
    return parseFloat(num).toFixed(decimals);
}

function formatPercentage(num) {
    return formatNumber(num) + '%';
}

function formatMemory(num) {
    return formatNumber(num) + ' GB';
}

function formatTime(hours) {
    if (hours < 1) {
        return Math.round(hours * 60) + ' minutes';
    } else if (hours < 24) {
        return formatNumber(hours) + ' hours';
    } else {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days} day${days > 1 ? 's' : ''} ${formatNumber(remainingHours)} hours`;
    }
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Application error:', e.error);
    // You could add user-friendly error notifications here
});

// API Helper Functions
function showLoader() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

function hideLoader() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.classList.add('hidden');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    gsap.from(notification, {
        duration: 0.3,
        y: -50,
        opacity: 0
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        removeNotification(notification);
    });
}

function removeNotification(notification) {
    gsap.to(notification, {
        duration: 0.3,
        y: -50,
        opacity: 0,
        onComplete: () => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }
    });
}

// Performance Monitoring
function measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
}

// Export functions for use in other files
window.CloudOptimizer = {
    showLoader,
    hideLoader,
    showNotification,
    formatNumber,
    formatPercentage,
    formatMemory,
    formatTime,
    measurePerformance
};