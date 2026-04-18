/* ============================================
   ERFOLG LIVING — JavaScript
   Scroll Animations, Navbar, Parallax, Mobile Menu
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- NAVBAR SCROLL TRANSITION ---- //
  const navbar = document.getElementById('navbar');
  const heroSection = document.getElementById('home');
  let lastScrollY = 0;

  function handleNavbarScroll() {
    const scrollY = window.scrollY;
    const heroHeight = heroSection?.offsetHeight || 600;

    if (scrollY > 60) {
      navbar.classList.remove('navbar--transparent');
      navbar.classList.add('navbar--solid');
    } else {
      navbar.classList.remove('navbar--solid');
      navbar.classList.add('navbar--transparent');
    }

    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll(); // Initial check


  // ---- MOBILE MENU ---- //
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  let menuOpen = false;

  function toggleMenu() {
    menuOpen = !menuOpen;
    mobileMenu.classList.toggle('open', menuOpen);
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    
    // Animate hamburger
    const spans = hamburger.querySelectorAll('span');
    if (menuOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  }

  hamburger?.addEventListener('click', toggleMenu);

  // Close mobile menu on link click
  mobileMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (menuOpen) toggleMenu();
    });
  });


  // ---- HERO PARALLAX ---- //
  const heroBgImg = document.getElementById('hero-bg-img');

  function handleParallax() {
    const scrollY = window.scrollY;
    const heroHeight = heroSection?.offsetHeight || 600;

    if (scrollY < heroHeight && heroBgImg) {
      const parallaxValue = scrollY * 0.35;
      heroBgImg.style.transform = `scale(1.05) translateY(${parallaxValue}px)`;
    }
  }

  window.addEventListener('scroll', handleParallax, { passive: true });


  // ---- HERO LOADED STATE ---- //
  // Trigger the slow zoom-in effect once the image loads
  if (heroBgImg) {
    if (heroBgImg.complete) {
      heroSection.classList.add('loaded');
    } else {
      heroBgImg.addEventListener('load', () => {
        heroSection.classList.add('loaded');
      });
    }
  }


  // ---- SCROLL REVEAL ANIMATIONS ---- //
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  // ---- SMOOTH SCROLL FOR ANCHOR LINKS ---- //
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navHeight = navbar.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });


  // ---- STAGGER ANIMATION FOR GALLERY & CARDS ---- //
  const staggerContainers = document.querySelectorAll('.collections__grid, .gallery__masonry');

  staggerContainers.forEach(container => {
    const children = container.querySelectorAll('.reveal');
    children.forEach((child, index) => {
      child.style.transitionDelay = `${index * 0.12}s`;
    });
  });


  // ---- ACTIVE NAV LINK ON SCROLL ---- //
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar__link');

  function updateActiveNav() {
    const scrollY = window.scrollY + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.style.opacity = '0.7';
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.style.opacity = '1';
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });

});

/* ============================================
   BORDER GLOW HOVER EFFECT (Vanilla JS Port)
   ============================================ */
class BorderGlow {
  constructor(el, options = {}) {
    this.el = el;
    this.options = {
      edgeSensitivity: 30,
      glowColor: '25 80 60', // Copper Glow by default
      backgroundColor: 'transparent',
      glowRadius: 40,
      glowIntensity: 1.0,
      coneSpread: 25,
      animated: false,
      colors: ['#b87333', '#d4af37', '#1a5c5e'], // Copper, Gold, Teal
      fillOpacity: 0.5,
      ...options
    };

    this.init();
  }

  parseHSL(hslStr) {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 40, s: 80, l: 80 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }

  buildGlowVars() {
    const { h, s, l } = this.parseHSL(this.options.glowColor);
    const base = `${h}deg ${s}% ${l}%`;
    const opacities = [100, 60, 50, 40, 30, 20, 10];
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    for (let i = 0; i < opacities.length; i++) {
      this.el.style.setProperty(`--glow-color${keys[i]}`, `hsl(${base} / ${Math.min(opacities[i] * this.options.glowIntensity, 100)}%)`);
    }
  }

  buildGradientVars() {
    const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
    const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
    const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];
    
    for (let i = 0; i < 7; i++) {
      const c = this.options.colors[Math.min(COLOR_MAP[i], this.options.colors.length - 1)];
      this.el.style.setProperty(GRADIENT_KEYS[i], `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`);
    }
    this.el.style.setProperty('--gradient-base', `linear-gradient(${this.options.colors[0]} 0 100%)`);
  }

  init() {
    this.el.classList.add('border-glow-card');
    
    const edgeLight = document.createElement('span');
    edgeLight.className = 'edge-light';
    
    // Attempt to compute the actual card background if we passed transparent
    let bg = this.options.backgroundColor;
    if (bg === 'transparent') {
      const computedBg = window.getComputedStyle(this.el).backgroundColor;
      if (computedBg !== 'rgba(0, 0, 0, 0)' && computedBg !== 'transparent') {
        bg = computedBg;
      } else {
        bg = '#121E20'; // Our Surface Color fallback
      }
    }

    this.el.style.setProperty('--card-bg', bg);
    this.el.style.setProperty('--edge-sensitivity', this.options.edgeSensitivity);
    this.el.style.setProperty('--glow-padding', `${this.options.glowRadius}px`);
    this.el.style.setProperty('--cone-spread', this.options.coneSpread);
    this.el.style.setProperty('--fill-opacity', this.options.fillOpacity);
    
    this.buildGlowVars();
    this.buildGradientVars();

    // Prevent pointer events on the overlay
    this.el.appendChild(edgeLight);

    this.el.addEventListener('pointermove', (e) => this.handlePointerMove(e));
  }

  getCenterOfElement() {
    const rect = this.el.getBoundingClientRect();
    return [rect.width / 2, rect.height / 2];
  }

  getEdgeProximity(x, y) {
    const [cx, cy] = this.getCenterOfElement();
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  getCursorAngle(x, y) {
    const [cx, cy] = this.getCenterOfElement();
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }

  handlePointerMove(e) {
    const rect = this.el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = this.getEdgeProximity(x, y);
    const angle = this.getCursorAngle(x, y);

    this.el.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    this.el.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  }
}

// Initialize on desktop only — skip on touch devices for performance
document.addEventListener('DOMContentLoaded', () => {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isTouchDevice && !prefersReducedMotion) {
    const glowTargets = document.querySelectorAll('.collection-card, .product-card, .philosophy__item');
    glowTargets.forEach(card => {
      if (card.classList.contains('philosophy__item')) {
        card.style.borderRadius = '8px';
      }
      new BorderGlow(card, {
        glowColor: '180 80 60',
        colors: ['#8673BB', '#006D7A', '#9C8AC7'],
        glowRadius: 30,
      });
    });
  }
});

