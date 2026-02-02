// Smooth scrolling
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

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.8)';
    }
});

// Checkout function with Stripe integration
async function checkout(plan, isYearly, buttonElement) {
    // Store original button text
    const originalText = buttonElement ? buttonElement.innerHTML : '';
    
    try {
        // For free plan, redirect to download
        if (plan === 'free' || plan === 'personal') {
            window.location.href = '/download.html';
            return;
        }
        
        // For enterprise, send to contact
        if (plan === 'enterprise') {
            window.location.href = 'mailto:enterprise@jarvisomega.com?subject=Enterprise Plan Inquiry';
            return;
        }
        
        // Show loading state
        if (buttonElement) {
            buttonElement.innerHTML = '<span style="opacity: 0.7;">Processing...</span>';
            buttonElement.disabled = true;
            buttonElement.style.cursor = 'wait';
        }

        console.log('Starting checkout for:', { plan, isYearly });

        // Determine API URL based on environment
        const apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/create-checkout-session'
            : '/api/create-checkout-session';

        // Call backend to create a checkout session
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plan: plan,
                billing: isYearly ? 'yearly' : 'monthly'
            })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            throw new Error('API endpoint not found. Please check deployment.');
        }

        if (!response.ok) {
            throw new Error(data.message || data.error || `Server error: ${response.status}`);
        }

        if (!data.url) {
            throw new Error('No checkout URL received from server');
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;
        
    } catch (error) {
        console.error('Checkout Error:', error);
        
        // Show user-friendly error message
        let errorMessage = '❌ Payment Error\n\n';
        
        if (error.message.includes('not found') || error.message.includes('404')) {
            errorMessage += 'Payment system unavailable.\n';
            errorMessage += 'Try the free version or contact support.';
        } else if (error.message.includes('Price ID not configured')) {
            errorMessage += 'Payment not configured yet.\n';
            errorMessage += 'Please try again later or contact support.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
        
        // Reset button
        if (buttonElement && originalText) {
            buttonElement.innerHTML = originalText;
            buttonElement.disabled = false;
            buttonElement.style.cursor = 'pointer';
        }
    }
}

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards and pricing cards
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.feature-card, .pricing-card, .faq-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
});

// Counter animation for stats
function animateCounter(element, target, duration) {
    let current = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Trigger counter animation when stats come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            const target = entry.target.textContent === '∞' ? '∞' : parseInt(entry.target.textContent.replace('+', ''));
            if (target !== '∞') {
                entry.target.textContent = '0';
                animateCounter(entry.target, target, 2000);
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(stat => {
    statsObserver.observe(stat);
});

// Demo video placeholder click
document.querySelector('.play-button')?.addEventListener('click', () => {
    alert('Demo video coming soon! Follow us on social media for updates.');
    // In production, replace with actual video embed:
    // const videoContainer = document.querySelector('.video-placeholder');
    // videoContainer.innerHTML = '<iframe src="YOUR_VIDEO_URL" ...></iframe>';
});

// Futuristic Particle System
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 100;
        this.connectionDistance = 150;
        
        this.resize();
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1,
                color: this.getRandomColor()
            });
        }
    }
    
    getRandomColor() {
        const colors = [
            'rgba(255, 51, 51, 0.8)',
            'rgba(0, 243, 255, 0.8)',
            'rgba(185, 66, 255, 0.8)',
            'rgba(255, 136, 0, 0.8)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    drawParticle(particle) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = particle.color;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = particle.color;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.3;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(255, 51, 51, ${opacity})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    update() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawConnections();
        this.particles.forEach(particle => this.drawParticle(particle));
        this.update();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize particle system
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('particles');
    if (canvas) {
        new ParticleSystem(canvas);
    }
    
    // Start heartbeat for active user tracking
    startHeartbeat();
});

// Heartbeat system to track active users
function startHeartbeat() {
    const token = localStorage.getItem('jarvis_token');
    
    if (!token) {
        return; // No token, user not logged in
    }
    
    // Send heartbeat immediately
    sendHeartbeat(token);
    
    // Then send every 5 minutes
    setInterval(() => {
        sendHeartbeat(token);
    }, 5 * 60 * 1000); // 5 minutes
}

async function sendHeartbeat(token) {
    try {
        const response = await fetch('/api/heartbeat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.log('Heartbeat failed:', response.status);
        }
    } catch (error) {
        console.log('Heartbeat error:', error.message);
    }
}
