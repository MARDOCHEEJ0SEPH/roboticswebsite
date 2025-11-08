# Chapter 3: Frontend Foundation

## Overview

The frontend serves as the user-facing interface for your autonomous service platform. This chapter covers building a modern, responsive, and interactive frontend using vanilla HTML, CSS, and JavaScript. The approach prioritizes performance, SEO, and ease of maintenance.

## Design Principles

### 1. Progressive Enhancement

Start with semantic HTML that works without JavaScript, then enhance with CSS and interactive features:

```
HTML (Structure) → CSS (Presentation) → JavaScript (Behavior)
```

### 2. Mobile-First Responsive Design

Design for mobile screens first, then scale up to larger devices:

```css
/* Base: Mobile styles */
.container { width: 100%; }

/* Tablet and up */
@media (min-width: 768px) {
  .container { width: 750px; }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container { width: 960px; }
}
```

### 3. Performance Budget

Target metrics:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Total page size: < 500KB
- JavaScript bundle: < 100KB

## HTML Structure

Create `frontend/public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Advanced automation services for your business. AI-powered solutions, expert consultation, and proven ROI.">
    <title>Your Service Platform - Professional Automation Solutions</title>

    <!-- Preconnect to external resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com">

    <!-- Styles -->
    <link rel="stylesheet" href="styles.css">

    <!-- Schema.org structured data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Your Service Platform",
      "description": "Advanced automation and consulting services",
      "@id": "https://yourservice.com",
      "url": "https://yourservice.com",
      "telephone": "+1-555-0123",
      "priceRange": "$$-$$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "123 Business St",
        "addressLocality": "San Francisco",
        "addressRegion": "CA",
        "postalCode": "94105",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "37.7749",
        "longitude": "-122.4194"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "18:00"
      },
      "sameAs": [
        "https://linkedin.com/company/yourservice",
        "https://twitter.com/yourservice"
      ]
    }
    </script>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="container">
            <div class="nav-brand">
                <a href="/">YourService</a>
            </div>
            <button class="nav-toggle" aria-label="Toggle navigation">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <ul class="nav-menu">
                <li><a href="#services">Services</a></li>
                <li><a href="#solutions">Solutions</a></li>
                <li><a href="#roi">ROI Calculator</a></li>
                <li><a href="#case-studies">Case Studies</a></li>
                <li><a href="#contact" class="btn-primary">Get Started</a></li>
            </ul>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <div class="hero-content">
                <h1>Transform Your Business with Intelligent Automation</h1>
                <p class="hero-subtitle">
                    Increase efficiency by 300%, reduce costs by 50%, and scale operations
                    with our AI-powered automation platform.
                </p>
                <div class="hero-cta">
                    <a href="#contact" class="btn btn-large btn-primary">Start Free Consultation</a>
                    <a href="#roi" class="btn btn-large btn-secondary">Calculate Your ROI</a>
                </div>
                <div class="hero-stats">
                    <div class="stat">
                        <div class="stat-value" data-target="500">0</div>
                        <div class="stat-label">Projects Completed</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" data-target="98">0</div>
                        <div class="stat-label">Client Satisfaction %</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value" data-target="250">0</div>
                        <div class="stat-label">Average % ROI</div>
                    </div>
                </div>
            </div>
            <div class="hero-visual">
                <div id="3d-visualization"></div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="services">
        <div class="container">
            <h2 class="section-title">Our Services</h2>
            <p class="section-subtitle">Comprehensive solutions tailored to your business needs</p>

            <div class="services-grid">
                <div class="service-card">
                    <div class="service-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                        </svg>
                    </div>
                    <h3>Process Automation</h3>
                    <p>Streamline repetitive tasks and workflows with intelligent automation solutions.</p>
                    <ul class="service-features">
                        <li>Workflow optimization</li>
                        <li>Task automation</li>
                        <li>Integration services</li>
                    </ul>
                    <a href="#contact" class="service-link">Learn More →</a>
                </div>

                <div class="service-card featured">
                    <div class="service-badge">Most Popular</div>
                    <div class="service-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v6l4 2"></path>
                        </svg>
                    </div>
                    <h3>AI Consulting</h3>
                    <p>Expert guidance on implementing AI and machine learning in your operations.</p>
                    <ul class="service-features">
                        <li>Strategy development</li>
                        <li>Implementation roadmap</li>
                        <li>Training and support</li>
                    </ul>
                    <a href="#contact" class="service-link">Learn More →</a>
                </div>

                <div class="service-card">
                    <div class="service-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                    </div>
                    <h3>Custom Solutions</h3>
                    <p>Bespoke automation systems designed specifically for your business requirements.</p>
                    <ul class="service-features">
                        <li>Custom development</li>
                        <li>API integration</li>
                        <li>Ongoing optimization</li>
                    </ul>
                    <a href="#contact" class="service-link">Learn More →</a>
                </div>
            </div>
        </div>
    </section>

    <!-- ROI Calculator -->
    <section id="roi" class="roi-calculator">
        <div class="container">
            <h2 class="section-title">ROI Calculator</h2>
            <p class="section-subtitle">Calculate your potential return on investment</p>

            <div class="calculator-wrapper">
                <div class="calculator-inputs">
                    <div class="input-group">
                        <label for="employees">Number of Employees</label>
                        <input type="number" id="employees" value="50" min="1" max="10000">
                    </div>

                    <div class="input-group">
                        <label for="avg-salary">Average Salary ($)</label>
                        <input type="number" id="avg-salary" value="60000" min="1000" step="1000">
                    </div>

                    <div class="input-group">
                        <label for="hours-saved">Hours Saved per Week per Employee</label>
                        <input type="number" id="hours-saved" value="5" min="0" max="40" step="0.5">
                    </div>

                    <div class="input-group">
                        <label for="implementation-cost">Implementation Cost ($)</label>
                        <input type="number" id="implementation-cost" value="50000" min="0" step="5000">
                    </div>

                    <button class="btn btn-primary" onclick="calculateROI()">Calculate ROI</button>
                </div>

                <div class="calculator-results">
                    <h3>Your Estimated Results</h3>
                    <div class="result-item">
                        <span class="result-label">Annual Cost Savings</span>
                        <span class="result-value" id="annual-savings">$0</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Payback Period</span>
                        <span class="result-value" id="payback-period">0 months</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">5-Year ROI</span>
                        <span class="result-value roi-highlight" id="five-year-roi">0%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Total Hours Saved Annually</span>
                        <span class="result-value" id="hours-saved-annual">0</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Case Studies -->
    <section id="case-studies" class="case-studies">
        <div class="container">
            <h2 class="section-title">Success Stories</h2>
            <p class="section-subtitle">Real results from real clients</p>

            <div class="case-studies-grid">
                <article class="case-study">
                    <div class="case-study-header">
                        <span class="case-study-industry">Manufacturing</span>
                        <h3>300% Productivity Increase</h3>
                    </div>
                    <p>Leading manufacturer automated quality control processes, reducing defects by 85% and increasing throughput by 300%.</p>
                    <div class="case-study-metrics">
                        <div class="metric">
                            <strong>300%</strong>
                            <span>Productivity</span>
                        </div>
                        <div class="metric">
                            <strong>85%</strong>
                            <span>Fewer Defects</span>
                        </div>
                        <div class="metric">
                            <strong>12mo</strong>
                            <span>Payback</span>
                        </div>
                    </div>
                </article>

                <article class="case-study">
                    <div class="case-study-header">
                        <span class="case-study-industry">Healthcare</span>
                        <h3>$2M Annual Savings</h3>
                    </div>
                    <p>Hospital network automated patient scheduling and records management, saving $2M annually while improving patient satisfaction.</p>
                    <div class="case-study-metrics">
                        <div class="metric">
                            <strong>$2M</strong>
                            <span>Saved</span>
                        </div>
                        <div class="metric">
                            <strong>50%</strong>
                            <span>Faster Processing</span>
                        </div>
                        <div class="metric">
                            <strong>95%</strong>
                            <span>Satisfaction</span>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact">
        <div class="container">
            <h2 class="section-title">Get Started Today</h2>
            <p class="section-subtitle">Schedule a free consultation with our experts</p>

            <form class="contact-form" id="contact-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="name">Full Name *</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email *</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="company">Company</label>
                        <input type="text" id="company" name="company">
                    </div>
                    <div class="form-group">
                        <label for="phone">Phone</label>
                        <input type="tel" id="phone" name="phone">
                    </div>
                </div>

                <div class="form-group">
                    <label for="service">Service Interested In</label>
                    <select id="service" name="service">
                        <option value="">Select a service</option>
                        <option value="process-automation">Process Automation</option>
                        <option value="ai-consulting">AI Consulting</option>
                        <option value="custom-solutions">Custom Solutions</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="message">Message</label>
                    <textarea id="message" name="message" rows="4"></textarea>
                </div>

                <button type="submit" class="btn btn-primary btn-large">Send Message</button>
            </form>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>YourService</h4>
                    <p>Transform your business with intelligent automation.</p>
                </div>
                <div class="footer-section">
                    <h4>Services</h4>
                    <ul>
                        <li><a href="#services">Process Automation</a></li>
                        <li><a href="#services">AI Consulting</a></li>
                        <li><a href="#services">Custom Solutions</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Company</h4>
                    <ul>
                        <li><a href="#case-studies">Case Studies</a></li>
                        <li><a href="#roi">ROI Calculator</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Contact</h4>
                    <ul>
                        <li>123 Business St</li>
                        <li>San Francisco, CA 94105</li>
                        <li>+1-555-0123</li>
                        <li>hello@yourservice.com</li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 YourService. All rights reserved.</p>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="main.js"></script>
</body>
</html>
```

## CSS Styling

Create `frontend/public/styles.css`:

```css
/* CSS Variables for theming */
:root {
    --primary-color: #2563eb;
    --primary-dark: #1e40af;
    --secondary-color: #10b981;
    --text-primary: #1f2937;
    --text-secondary: #6b7280;
    --bg-light: #f9fafb;
    --bg-white: #ffffff;
    --border-color: #e5e7eb;
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s ease;
}

/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: var(--text-primary);
    background-color: var(--bg-white);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Navigation */
.navbar {
    background: var(--bg-white);
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 0;
    z-index: 1000;
    padding: 1rem 0;
}

.navbar .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-brand a {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--primary-color);
    text-decoration: none;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
    align-items: center;
}

.nav-menu a {
    text-decoration: none;
    color: var(--text-primary);
    font-weight: 500;
    transition: var(--transition);
}

.nav-menu a:hover {
    color: var(--primary-color);
}

.nav-toggle {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
}

.nav-toggle span {
    display: block;
    width: 25px;
    height: 3px;
    background: var(--text-primary);
    transition: var(--transition);
}

/* Hero Section */
.hero {
    padding: 5rem 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.hero .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    align-items: center;
}

.hero h1 {
    font-size: 3rem;
    line-height: 1.2;
    margin-bottom: 1.5rem;
}

.hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.95;
}

.hero-cta {
    display: flex;
    gap: 1rem;
    margin-bottom: 3rem;
}

.hero-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
}

.stat {
    text-align: center;
}

.stat-value {
    font-size: 2.5rem;
    font-weight: bold;
}

.stat-label {
    font-size: 0.875rem;
    opacity: 0.9;
}

#3d-visualization {
    width: 100%;
    height: 400px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    text-decoration: none;
    transition: var(--transition);
    border: none;
    cursor: pointer;
    text-align: center;
}

.btn-primary {
    background: var(--primary-color);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-dark);
}

.btn-secondary {
    background: white;
    color: var(--primary-color);
}

.btn-secondary:hover {
    background: var(--bg-light);
}

.btn-large {
    padding: 1rem 2rem;
    font-size: 1.125rem;
}

/* Services Section */
.services {
    padding: 5rem 0;
    background: var(--bg-light);
}

.section-title {
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 1rem;
}

.section-subtitle {
    text-align: center;
    color: var(--text-secondary);
    margin-bottom: 3rem;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.service-card {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: var(--shadow-md);
    transition: var(--transition);
    position: relative;
}

.service-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
}

.service-card.featured {
    border: 2px solid var(--primary-color);
}

.service-badge {
    position: absolute;
    top: -10px;
    right: 20px;
    background: var(--secondary-color);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: bold;
}

.service-icon {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
    color: var(--primary-color);
}

.service-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.service-features {
    list-style: none;
    margin: 1.5rem 0;
}

.service-features li {
    padding: 0.5rem 0;
    padding-left: 1.5rem;
    position: relative;
}

.service-features li:before {
    content: "✓";
    position: absolute;
    left: 0;
    color: var(--secondary-color);
    font-weight: bold;
}

.service-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 600;
    transition: var(--transition);
}

.service-link:hover {
    color: var(--primary-dark);
}

/* ROI Calculator */
.roi-calculator {
    padding: 5rem 0;
}

.calculator-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    margin-top: 2rem;
}

.input-group {
    margin-bottom: 1.5rem;
}

.input-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.input-group input,
.input-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 1rem;
}

.calculator-results {
    background: var(--bg-light);
    padding: 2rem;
    border-radius: 12px;
}

.calculator-results h3 {
    margin-bottom: 2rem;
}

.result-item {
    display: flex;
    justify-content: space-between;
    padding: 1rem 0;
    border-bottom: 1px solid var(--border-color);
}

.result-value {
    font-weight: bold;
    font-size: 1.25rem;
}

.roi-highlight {
    color: var(--secondary-color);
    font-size: 1.5rem;
}

/* Case Studies */
.case-studies {
    padding: 5rem 0;
    background: var(--bg-light);
}

.case-studies-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}

.case-study {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: var(--shadow-md);
}

.case-study-industry {
    display: inline-block;
    background: var(--primary-color);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
}

.case-study-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1.5rem;
}

.metric {
    text-align: center;
}

.metric strong {
    display: block;
    font-size: 1.5rem;
    color: var(--primary-color);
}

/* Contact Form */
.contact {
    padding: 5rem 0;
}

.contact-form {
    max-width: 700px;
    margin: 0 auto;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 1rem;
    font-family: inherit;
}

/* Footer */
.footer {
    background: var(--text-primary);
    color: white;
    padding: 3rem 0 1rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h4 {
    margin-bottom: 1rem;
}

.footer-section ul {
    list-style: none;
}

.footer-section a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: var(--transition);
}

.footer-section a:hover {
    color: white;
}

.footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav-menu {
        display: none;
        flex-direction: column;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        box-shadow: var(--shadow-md);
        padding: 1rem;
    }

    .nav-menu.active {
        display: flex;
    }

    .nav-toggle {
        display: flex;
    }

    .hero .container {
        grid-template-columns: 1fr;
    }

    .hero h1 {
        font-size: 2rem;
    }

    .hero-cta {
        flex-direction: column;
    }

    .calculator-wrapper,
    .form-row {
        grid-template-columns: 1fr;
    }
}
```

## JavaScript Functionality

Create `frontend/public/main.js`:

```javascript
// Mobile Navigation Toggle
document.querySelector('.nav-toggle')?.addEventListener('click', function() {
    document.querySelector('.nav-menu').classList.toggle('active');
});

// Animated Counter
function animateCounters() {
    const counters = document.querySelectorAll('.stat-value');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    });
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            if (entry.target.classList.contains('hero-stats')) {
                animateCounters();
            }
        }
    });
}, observerOptions);

document.querySelectorAll('.hero-stats, .service-card, .case-study').forEach(el => {
    observer.observe(el);
});

// ROI Calculator
function calculateROI() {
    const employees = parseFloat(document.getElementById('employees').value);
    const avgSalary = parseFloat(document.getElementById('avg-salary').value);
    const hoursSaved = parseFloat(document.getElementById('hours-saved').value);
    const implementationCost = parseFloat(document.getElementById('implementation-cost').value);

    // Calculations
    const hourlyRate = avgSalary / 2080; // 52 weeks * 40 hours
    const annualHoursSaved = employees * hoursSaved * 52;
    const annualSavings = annualHoursSaved * hourlyRate;
    const paybackMonths = (implementationCost / (annualSavings / 12)).toFixed(1);
    const fiveYearValue = (annualSavings * 5) - implementationCost;
    const fiveYearROI = ((fiveYearValue / implementationCost) * 100).toFixed(0);

    // Display results
    document.getElementById('annual-savings').textContent =
        '$' + annualSavings.toLocaleString('en-US', {maximumFractionDigits: 0});
    document.getElementById('payback-period').textContent = paybackMonths + ' months';
    document.getElementById('five-year-roi').textContent = fiveYearROI + '%';
    document.getElementById('hours-saved-annual').textContent =
        annualHoursSaved.toLocaleString('en-US', {maximumFractionDigits: 0});
}

// Contact Form Handling
document.getElementById('contact-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Thank you! We will contact you shortly.');
            this.reset();
        } else {
            alert('Something went wrong. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Unable to submit form. Please email us directly.');
    }
});

// Simple 3D Visualization with Three.js
function init3DVisualization() {
    const container = document.getElementById('3d-visualization');
    if (!container || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        container.offsetWidth / container.offsetHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    container.appendChild(renderer.domElement);

    // Create a simple rotating cube
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({
        color: 0x2563eb,
        specular: 0x555555,
        shininess: 30
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Add lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    camera.position.z = 5;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    init3DVisualization();

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                document.querySelector('.nav-menu')?.classList.remove('active');
            }
        });
    });
});
```

## Testing the Frontend

### Manual Testing Checklist

1. **Navigation**
   - Mobile menu toggles correctly
   - All links navigate to correct sections
   - Smooth scrolling works

2. **Hero Section**
   - Stats animate when scrolling into view
   - 3D visualization renders and rotates
   - CTA buttons work

3. **ROI Calculator**
   - Input validation works
   - Calculations are accurate
   - Results display correctly

4. **Contact Form**
   - Form validation works
   - Submit sends data (will implement backend later)
   - Error handling displays

5. **Responsive Design**
   - Test on mobile (< 768px)
   - Test on tablet (768px - 1024px)
   - Test on desktop (> 1024px)

### Performance Testing

Use browser DevTools:

```javascript
// Measure page load time
performance.timing.loadEventEnd - performance.timing.navigationStart

// Check for layout shifts
// Use Lighthouse in Chrome DevTools
```

## Next Steps

Chapter 4 will cover building the backend API with Rust and Actix-web. You will create RESTful endpoints, implement request handlers, and establish communication patterns between the frontend and backend services.
