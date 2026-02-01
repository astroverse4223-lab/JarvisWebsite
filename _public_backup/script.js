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

// Checkout function with payment integration
function checkout(plan) {
    // Here you'll integrate your payment processor
    // Options: Stripe, PayPal, Gumroad, Paddle, LemonSqueezy
    
    if (plan === 'free') {
        // Direct download link
        window.location.href = 'https://github.com/YOUR_USERNAME/jarvis-omega/releases/download/v1.0.0/Jarvis-Omega-v1.0-Windows.zip';
        return;
    }
    
    // For paid plans, redirect to payment processor
    
    // OPTION 1: Gumroad (Easiest - recommended for beginners)
    if (plan === 'pro') {
        window.location.href = 'https://gumroad.com/l/jarvis-omega-pro';
    } else if (plan === 'enterprise') {
        window.location.href = 'mailto:sales@jarvisomega.com?subject=Enterprise Plan Inquiry';
    }
    
    // OPTION 2: Stripe Checkout (More professional)
    /*
    if (plan === 'pro') {
        // Create Stripe checkout session
        fetch('/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plan: 'pro',
                price: 29
            })
        })
        .then(res => res.json())
        .then(data => {
            window.location.href = data.url;
        });
    }
    */
    
    // OPTION 3: PayPal (Alternative)
    /*
    if (plan === 'pro') {
        window.location.href = 'https://www.paypal.com/checkout?cmd=_s-xclick&hosted_button_id=YOUR_BUTTON_ID';
    }
    */
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
