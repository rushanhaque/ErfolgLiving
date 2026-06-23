// Erfolg Living — Dynamic Product Loader
// Fetches products.json and renders items on category pages and the gallery page

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  let fileName = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

  // Normalize clean URLs (remove .html if present to handle consistently)
  if (fileName.endsWith('.html')) {
    fileName = fileName.slice(0, -5);
  }

  if (fileName === 'gallery') {
    initGalleryLoader();
  } else if (fileName.startsWith('collection-')) {
    const category = fileName.replace('collection-', '');
    initCollectionLoader(category);
  }
});

// Helper to determine the site base path (handles subdirectories like GitHub Pages and file://)
function getBaseUrl() {
  const path = window.location.pathname;
  const segments = path.split('/');
  segments.pop();
  
  // If running via file:// protocol
  if (window.location.protocol === 'file:') {
    return window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
  }
  
  return window.location.origin + segments.join('/') + '/';
}

// Fetch products database
async function getProducts() {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(baseUrl + 'products.json');
    if (!response.ok) {
      throw new Error('Database file not found');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

// Set up IntersectionObserver for scroll-reveal animations
function setupScrollReveal(container) {
  const revealElements = container.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  // Stagger transition delays for items in grid
  revealElements.forEach((el, index) => {
    const staggerDelay = (index % 6) * 0.1;
    el.style.transitionDelay = `${staggerDelay}s`;
    revealObserver.observe(el);
  });
}

// 1. Loader for Collection category pages
async function initCollectionLoader(category) {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  const products = await getProducts();
  const categoryProducts = products.filter(p => p.category === category);

  if (categoryProducts.length > 0) {
    // Clear grid (remove placeholder text if any)
    grid.innerHTML = '';
    grid.style.display = ''; // Reset display style in case it was set to block for fallback
    grid.style.textAlign = '';

    categoryProducts.forEach(p => {
      const item = document.createElement('div');
      item.className = 'product-item reveal';
      
      // Pass subcategory/tag as data attribute for filter script
      if (p.subcategory) {
        item.setAttribute('data-category', p.subcategory);
      }

      item.innerHTML = `
        <img src="${p.image}" alt="${p.name}" class="product-item__img" loading="lazy" decoding="async">
        <div class="product-item__overlay">
          <div class="product-item__content">
            <h3 class="product-item__name">${p.name}</h3>
            <div class="product-item__meta">
              <span class="product-item__spec">SKU: ${p.sku}</span>
            </div>
          </div>
        </div>
      `;

      grid.appendChild(item);
    });

    // Initialize Scroll Reveal for new elements
    setupScrollReveal(grid);

    // Initialize Page Filters if present
    initCategoryFilters(grid);
  }
}

// 2. Loader for Gallery page
async function initGalleryLoader() {
  const masonry = document.querySelector('.gallery__masonry');
  if (!masonry) return;

  const products = await getProducts();
  // Filter items intended for gallery
  const galleryProducts = products.filter(p => p.category === 'gallery' || p.showInGallery === true);

  if (galleryProducts.length > 0) {
    masonry.innerHTML = '';

    galleryProducts.forEach(p => {
      const item = document.createElement('div');
      // Set grid sizing classes
      item.className = `gallery__item ${p.galleryClass || ''} reveal`;

      item.innerHTML = `
        <img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">
        <div class="gallery__item-overlay">
          <div class="gallery__item-content">
            <h3 class="gallery__item-name">${p.name}</h3>
            <p class="gallery__item-meta">${p.gallerySub || p.subcategory || ''} <span class="gallery__item-sku-inline">/ ${p.sku}</span></p>
          </div>
        </div>
      `;

      masonry.appendChild(item);
    });

    // Initialize Scroll Reveal
    setupScrollReveal(masonry);
  }
}

// 3. Setup Filter buttons logic dynamically
function initCategoryFilters(grid) {
  const filterBtns = document.querySelectorAll('.filter-bar .filter-btn');
  if (filterBtns.length === 0) return;

  const productItems = grid.querySelectorAll('.product-item');

  filterBtns.forEach(btn => {
    // Clone to remove previous static listeners and prevent double triggers
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', () => {
      document.querySelectorAll('.filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
      newBtn.classList.add('active');

      const filter = newBtn.getAttribute('data-filter');

      productItems.forEach(item => {
        const itemCat = item.getAttribute('data-category');
        if (filter === 'all' || itemCat === filter) {
          item.classList.remove('hidden');
          // Reset animation opacity
          setTimeout(() => {
            item.classList.add('visible');
          }, 10);
        } else {
          item.classList.add('hidden');
          item.classList.remove('visible');
        }
      });
    });
  });
}
