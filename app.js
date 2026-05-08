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
    
    // Only apply scroll-based transparency logic on the homepage
    if (document.body.classList.contains('is-home')) {
      const threshold = 80;
      if (scrollY > threshold) {
        navbar.classList.add('is-scrolled');
      } else {
        navbar.classList.remove('is-scrolled');
      }
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

  // Delay observer start slightly to ensure initial paint and stagger delays are ready
  setTimeout(() => {
    revealElements.forEach(el => revealObserver.observe(el));
  }, 200);


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
      // Loop the stagger every 6 items to maintain the effect without creating long delays at the bottom
      const staggerDelay = (index % 6) * 0.1;
      child.style.transitionDelay = `${staggerDelay}s`;
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
  
  // ---- LIGHTBOX / IMAGE POPUP ---- //
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <button class="lightbox__close" aria-label="Close lightbox">&times;</button>
    
    <div class="lightbox__content">
      <!-- Main Product View -->
      <div id="lightbox-product-view" style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        <div class="lightbox__img-container">
          <img src="" alt="Enlarged view" class="lightbox__img">

          <div class="lightbox__details-overlay">
            <h3 class="lightbox__name"></h3>
            <div class="lightbox__meta"></div>
          </div>
        </div>
        
        <div class="lightbox__finishes" style="display:none;">
          <p class="lightbox__finishes-label">Available Finishes</p>
          <div class="lightbox__finishes-row">

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/1.Shiny Polish.jpg" alt="Shiny Polish"><div class="finish-drop__name">Shiny Polish</div></div>
              <img src="assets/images/Finishes/1.Shiny Polish.jpg" alt="Shiny Polish"><span>Shiny Polish</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/2.Light Copper Antique.jpg" alt="Light Copper Antique"><div class="finish-drop__name">Light Copper Antique</div></div>
              <img src="assets/images/Finishes/2.Light Copper Antique.jpg" alt="Light Copper Antique"><span>Light Antique</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/3.Medium Copper Antique.jpg" alt="Medium Copper Antique"><div class="finish-drop__name">Medium Copper Antique</div></div>
              <img src="assets/images/Finishes/3.Medium Copper Antique.jpg" alt="Medium Copper Antique"><span>Med Antique</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/4.Darker Copper Antique.jpg" alt="Darker Copper Antique"><div class="finish-drop__name">Darker Copper Antique</div></div>
              <img src="assets/images/Finishes/4.Darker Copper Antique.jpg" alt="Darker Copper Antique"><span>Dark Antique</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/5.Nickel.jpg" alt="Nickel"><div class="finish-drop__name">Nickel</div></div>
              <img src="assets/images/Finishes/5.Nickel.jpg" alt="Nickel"><span>Nickel</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/6.Tin.jpg" alt="Tin"><div class="finish-drop__name">Tin</div></div>
              <img src="assets/images/Finishes/6.Tin.jpg" alt="Tin"><span>Tin</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/7.Green Antique.jpg" alt="Green Antique"><div class="finish-drop__name">Green Antique</div></div>
              <img src="assets/images/Finishes/7.Green Antique.jpg" alt="Green Antique"><span>Green Antique</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/8.Verdigris Antique.jpg" alt="Verdigris Antique"><div class="finish-drop__name">Verdigris Antique</div></div>
              <img src="assets/images/Finishes/8.Verdigris Antique.jpg" alt="Verdigris Antique"><span>Verdigris</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/9.Matt Black.jpg" alt="Matt Black"><div class="finish-drop__name">Matt Black</div></div>
              <img src="assets/images/Finishes/9.Matt Black.jpg" alt="Matt Black"><span>Matt Black</span>
            </div>

            <div class="lightbox__finish-divider"></div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/10.Shiny Polish.jpg" alt="Shiny Polish Hammered"><div class="finish-drop__name">Shiny Polish Hammered</div></div>
              <img src="assets/images/Finishes/10.Shiny Polish.jpg" alt="Shiny Polish Hammered"><span>Shiny Ham.</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/11.Medium Copper Antique hammered.jpg" alt="Medium Copper Antique Hammered"><div class="finish-drop__name">Medium Copper Antique Hammered</div></div>
              <img src="assets/images/Finishes/11.Medium Copper Antique hammered.jpg" alt="Medium Copper Antique Hammered"><span>Med Ham.</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/12.Dark copper antique hammered.jpg" alt="Dark Copper Antique Hammered"><div class="finish-drop__name">Dark Copper Antique Hammered</div></div>
              <img src="assets/images/Finishes/12.Dark copper antique hammered.jpg" alt="Dark Copper Antique Hammered"><span>Dark Ham.</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/13.Nickel hammered.jpg" alt="Nickel Hammered"><div class="finish-drop__name">Nickel Hammered</div></div>
              <img src="assets/images/Finishes/13.Nickel hammered.jpg" alt="Nickel Hammered"><span>Nickel Ham.</span>
            </div>

            <div class="lightbox__finish-swatch">
              <div class="finish-drop"><img src="assets/images/Finishes/15. Tin hammered.jpg" alt="Tin Hammered"><div class="finish-drop__name">Tin Hammered</div></div>
              <img src="assets/images/Finishes/15. Tin hammered.jpg" alt="Tin Hammered"><span>Tin Ham.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('.lightbox__img');
  const lightboxClose = lightbox.querySelector('.lightbox__close');
  const lightboxName = lightbox.querySelector('.lightbox__name');
  const lightboxMeta = lightbox.querySelector('.lightbox__meta');
  const lightboxFinishes = lightbox.querySelector('.lightbox__finishes');
  
  const productView = lightbox.querySelector('#lightbox-product-view');

  // --- Zoom & Pan State ---
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;
  let didDrag = false; // distinguish click vs drag

  const ZOOM_MIN = 1;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 0.25;

  function applyTransform() {
    lightboxImg.style.transform = `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`;
    lightboxImg.classList.toggle('zoomed', zoomLevel > 1);
    
    // Hide details overlay when zoomed for unobstructed view
    const overlay = lightbox.querySelector('.lightbox__details-overlay');
    if (overlay) {
      overlay.style.opacity = zoomLevel > 1 ? '0' : '1';
      overlay.style.pointerEvents = zoomLevel > 1 ? 'none' : 'auto';
    }

    if (!isDragging) {
      lightboxImg.style.cursor = zoomLevel > 1 ? 'grab' : 'zoom-in';
      lightbox.style.cursor = zoomLevel > 1 ? 'default' : 'zoom-out';
    }
  }

  function resetZoom() {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    isDragging = false;
    applyTransform();
  }

  // --- Scroll-wheel zoom (zooms toward cursor) ---
  lightboxImg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomLevel + delta));
    // Reset pan if fully zoomed out
    if (zoomLevel === ZOOM_MIN) { panX = 0; panY = 0; }
    applyTransform();
  }, { passive: false });

  // --- Drag-to-pan ---
  lightboxImg.addEventListener('mousedown', (e) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    isDragging = true;
    didDrag = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = panX;
    panStartY = panY;
    lightboxImg.classList.add('dragging');
    lightboxImg.style.cursor = 'grabbing';
    lightbox.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
    panX = panStartX + dx;
    panY = panStartY + dy;
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    lightboxImg.classList.remove('dragging');
    applyTransform(); // restores correct cursor
  });

  // --- Click image to toggle zoom (only if not a drag) ---
  lightboxImg.addEventListener('click', (e) => {
    e.stopPropagation();
    if (didDrag) { didDrag = false; return; } // was a drag, not a click
    if (zoomLevel > 1) {
      zoomLevel = 1; panX = 0; panY = 0;
    } else {
      zoomLevel = 2;
    }
    applyTransform();
  });

  function openLightbox(src, name = '', meta = '', showFinishes = false) {
    if (!src) return;
    resetZoom();
    lightboxImg.src = src;
    lightboxName.textContent = name;
    lightboxMeta.innerHTML = meta;
    lightboxFinishes.style.display = showFinishes ? 'block' : 'none';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    lightboxFinishes.style.display = 'none';
    resetZoom();
    setTimeout(() => { 
      lightboxImg.src = ''; 
      lightboxName.textContent = '';
      lightboxMeta.innerHTML = '';
    }, 400);
  }

  // Use event delegation for product images
  document.addEventListener('click', (e) => {
    const target = e.target;
    
    // Check if the click was inside a product tile or gallery item
    const productItem = target.closest('.product-item');
    const galleryItem = target.closest('.gallery__item');
    
    // Determine which item was clicked
    const item = productItem || galleryItem;

    if (item) {
      // Find the primary image within this tile
      const img = item.querySelector('img');
      
      // Specifically exclude the home page collection accordion items to preserve navigation
      const isNavAccordion = item.classList.contains('collections-img-accordion__item');

      if (img && img.src && !isNavAccordion) {
        // Prevent default only if it's a product tile we want to show in lightbox
        e.preventDefault();
        
        // Extract product name and info
        const rawName = item.querySelector('.product-item__name')?.textContent || 
                        item.querySelector('.gallery__item-name')?.textContent || '';
        
        // Extract SKU/Item No if exists (specifically looking for SKU pattern)
        const skuElement = item.querySelector('.product-item__spec');
        let itemNo = '';
        if (skuElement && skuElement.textContent.toLowerCase().includes('sku:')) {
          itemNo = skuElement.textContent.replace(/sku:/i, '').trim();
        }
        
        const finalName = rawName;

        // For meta, we want to handle both .product-item__meta (div with spans) and .gallery__item-meta (p tag)
        const metaElement = item.querySelector('.product-item__meta') || item.querySelector('.gallery__item-meta');
        const meta = metaElement ? metaElement.innerHTML : '';
        
        // Show finish swatches only for bathtub products
        const isBathtub = !!item.closest('#bathtub-grid');
        
        openLightbox(img.src, finalName, meta, isBathtub);
      }
    }
  });

  lightboxClose.addEventListener('click', (e) => {
    e.stopPropagation();
    closeLightbox();
  });
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox__content')) {
      closeLightbox();
    }
  });

  // ESC key to close, +/- keys to zoom
  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === '+' || e.key === '=') {
      zoomLevel = Math.min(ZOOM_MAX, zoomLevel + ZOOM_STEP * 2);
      applyZoom();
    } else if (e.key === '-') {
      zoomLevel = Math.max(ZOOM_MIN, zoomLevel - ZOOM_STEP * 2);
      applyZoom();
    }
  });

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
        glowColor: '45 15 15', // Warm Beige Glow
        colors: ['#000000', '#B0A080', '#DEDAD2'], // Black, Sand, Pearl
        glowRadius: 30,
      });
    });
  }
});

