/**
 * Autonomous Robotics Website - Main JavaScript
 * Interactive features and dynamic functionality
 */

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initializeAnimations();
    init3DRobot();
    calculateROI();
    animateCounters();
});

/**
 * Initialize 3D Robot Visualization using Three.js
 */
function init3DRobot() {
    const container = document.getElementById('robot-3d-container');
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Create robot arm geometry (simplified 6-axis robot)
    const robotGroup = new THREE.Group();

    // Base
    const baseGeometry = new THREE.CylinderGeometry(1.5, 1.8, 0.5, 32);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x3B82F6,
        metalness: 0.7,
        roughness: 0.3
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    robotGroup.add(base);

    // Joint 1 (rotation)
    const joint1Geometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 32);
    const jointMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B5CF6,
        metalness: 0.6,
        roughness: 0.4
    });
    const joint1 = new THREE.Mesh(joint1Geometry, jointMaterial);
    joint1.position.y = 1.25;
    robotGroup.add(joint1);

    // Arm segment 1
    const arm1Geometry = new THREE.BoxGeometry(0.6, 3, 0.6);
    const armMaterial = new THREE.MeshStandardMaterial({
        color: 0x3B82F6,
        metalness: 0.7,
        roughness: 0.3
    });
    const arm1 = new THREE.Mesh(arm1Geometry, armMaterial);
    arm1.position.set(0, 3.5, 0);
    arm1.rotation.z = Math.PI / 6;
    robotGroup.add(arm1);

    // Joint 2
    const joint2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        jointMaterial
    );
    joint2.position.set(1.5, 5, 0);
    robotGroup.add(joint2);

    // Arm segment 2
    const arm2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 2.5, 0.5),
        armMaterial
    );
    arm2.position.set(2.5, 6, 0);
    arm2.rotation.z = -Math.PI / 4;
    robotGroup.add(arm2);

    // End effector (gripper)
    const gripperGroup = new THREE.Group();
    const gripperBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.5, 32),
        jointMaterial
    );
    gripperGroup.add(gripperBase);

    const gripperFinger1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.8, 0.15),
        armMaterial
    );
    gripperFinger1.position.set(0.3, -0.4, 0);

    const gripperFinger2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.8, 0.15),
        armMaterial
    );
    gripperFinger2.position.set(-0.3, -0.4, 0);

    gripperGroup.add(gripperFinger1);
    gripperGroup.add(gripperFinger2);
    gripperGroup.position.set(3.5, 7, 0);

    robotGroup.add(gripperGroup);

    scene.add(robotGroup);

    // Position camera
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 3, 0);

    // Animation
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        // Rotate robot base
        robotGroup.rotation.y = Math.sin(time * 0.5) * 0.3;

        // Animate arm segments
        arm1.rotation.z = Math.PI / 6 + Math.sin(time) * 0.2;
        arm2.rotation.z = -Math.PI / 4 + Math.cos(time) * 0.2;

        // Animate gripper
        gripperGroup.rotation.z = Math.sin(time * 2) * 0.1;

        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

/**
 * ROI Calculator
 */
function calculateROI() {
    const laborCost = parseFloat(document.getElementById('labor-cost')?.value || 150000);
    const productivityGain = parseFloat(document.getElementById('productivity-gain')?.value || 250) / 100;
    const robotCost = parseFloat(document.getElementById('robot-cost')?.value || 100000);
    const shifts = parseInt(document.getElementById('shifts')?.value || 3);

    // Update productivity display
    const productivityDisplay = document.getElementById('productivity-display');
    if (productivityDisplay) {
        productivityDisplay.textContent = (productivityGain * 100).toFixed(0) + '%';
    }

    // Calculate metrics
    const annualSavings = laborCost * (productivityGain - 1) * (shifts / 3);
    const paybackMonths = (robotCost / annualSavings) * 12;
    const threeYearROI = ((annualSavings * 3 - robotCost) / robotCost) * 100;
    const fiveYearValue = annualSavings * 5 - robotCost;

    // Update display
    updateElement('annual-savings', '$' + formatNumber(annualSavings));
    updateElement('payback-period', paybackMonths.toFixed(1) + ' months');
    updateElement('three-year-roi', formatNumber(threeYearROI) + '%');
    updateElement('five-year-value', '$' + formatNumber(fiveYearValue));
}

/**
 * Animate counter numbers
 */
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000; // 2 seconds
        const start = 0;
        const increment = target / (duration / 16); // 60fps

        let current = start;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            counter.textContent = Math.floor(current);
        }, 16);
    });
}

/**
 * Initialize scroll animations
 */
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}

/**
 * Mobile menu toggle
 */
function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'white';
        navLinks.style.padding = '1rem';
        navLinks.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    }
}

/**
 * Open contact modal
 */
function openContactModal() {
    alert('Contact form opening... (Would integrate with CRM in production)');
    // In production, this would open a modal with a contact form
    // connected to the autonomous lead management system
}

/**
 * Open ROI Calculator
 */
function openROICalculator() {
    const calculator = document.getElementById('roi-calculator');
    if (calculator) {
        calculator.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Start AR Demo
 */
function startARDemo() {
    alert('AR Demo launching... (Requires AR.js integration)');
    // In production, this would launch an AR experience
    // showing robots in the user's environment
}

/**
 * Download ROI Report
 */
function downloadROIReport() {
    const laborCost = parseFloat(document.getElementById('labor-cost')?.value || 150000);
    const productivityGain = parseFloat(document.getElementById('productivity-gain')?.value || 250);
    const robotCost = parseFloat(document.getElementById('robot-cost')?.value || 100000);

    const reportData = `
ROI ANALYSIS REPORT
===================

Input Parameters:
- Annual Labor Cost: $${formatNumber(laborCost)}
- Expected Productivity Gain: ${productivityGain}%
- Robot System Cost: $${formatNumber(robotCost)}

Calculated Results:
- Annual Savings: ${document.getElementById('annual-savings')?.textContent}
- Payback Period: ${document.getElementById('payback-period')?.textContent}
- 3-Year ROI: ${document.getElementById('three-year-roi')?.textContent}
- 5-Year Value: ${document.getElementById('five-year-value')?.textContent}

Next Steps:
1. Schedule consultation with our robotics experts
2. Site assessment and process analysis
3. Custom implementation plan
4. Deployment and training

Contact: info@roboticswebsite.com
Phone: 1-800-ROBOTS
    `.trim();

    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robotics-roi-analysis.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Download Implementation Guide
 */
function downloadGuide() {
    alert('Downloading implementation guide... (Would trigger PDF download in production)');
    // In production, this would download a comprehensive PDF guide
}

/**
 * Utility Functions
 */
function formatNumber(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Track user interactions for autonomous learning
 */
function trackInteraction(eventType, eventData) {
    // In production, this would send data to the AI engine for learning
    console.log('Interaction tracked:', eventType, eventData);

    // Send to autonomous controller
    fetch('/api/analytics/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString()
        })
    }).catch(err => console.log('Analytics error:', err));
}

// Track page interactions
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
        trackInteraction('click', {
            element: e.target.textContent,
            href: e.target.href
        });
    }
});

// Track form interactions
document.querySelectorAll('input, select').forEach(element => {
    element.addEventListener('change', () => {
        trackInteraction('form_interaction', {
            field: element.id,
            value: element.value
        });
    });
});

console.log('🤖 Autonomous Robotics Website Initialized');
console.log('🧠 AI-optimized systems active');
console.log('📊 Analytics tracking enabled');
