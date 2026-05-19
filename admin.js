// Erfolg Living — CMS JS Engine
// Handles GitHub API uploads, product JSON sync, and state management

let githubConfig = {
  token: '',
  repo: '',
  branch: 'main'
};

let allProducts = [];
let selectedImageBase64 = null;
let selectedImageName = null;

// Map of categories to their subcategories/filters
const SUBCATEGORY_MAP = {
  'accessories': [
    { value: 'cutleries', label: 'Cutleries' },
    { value: 'wall-tiles', label: 'Wall Tiles' }
  ],
  'barwares': [
    { value: 'mugs', label: 'Moscow Mule Mugs' },
    { value: 'tumblers', label: 'Copper Tumblers' },
    { value: 'shot-glass', label: 'Copper Shot Glass' },
    { value: 'wine-glass', label: 'Copper Wine Glass' },
    { value: 'jigger', label: 'Copper Jigger' },
    { value: 'bottles', label: 'Copper Bottles' },
    { value: 'ice-buckets', label: 'Copper Ice Buckets' }
  ],
  'bathtubs': [
    { value: 'ClawFoot&ChineseClawfoot', label: 'ClawFoot & Chinese Clawfoot' },
    { value: 'Slipper&DoubleSlipper', label: 'Slipper & Double Slipper' },
    { value: 'RollTop', label: 'Roll Top' },
    { value: 'DoubleWall&Round', label: 'Double Wall & Round' },
    { value: 'Japenese', label: 'Japenese' }
  ],
  'lighting': [
    { value: 'table', label: 'Table Lamps' },
    { value: 'floor', label: 'Floor Lamps' }
  ],
  'sentinel-showers': [
    { value: 'sentinels', label: 'Sentinels' },
    { value: 'shower-pods', label: 'Shower Pods / Trays' }
  ],
  'sinks-basins': [
    { value: 'kitchen-sinks', label: 'Kitchen Sinks' },
    { value: 'double-bowls', label: 'Double Bowls' },
    { value: 'basins', label: 'Round Sinks / Basins' }
  ],
  'gallery': [
    { value: 'Bath Tub', label: 'Bath Tub' },
    { value: 'Basin', label: 'Basin' },
    { value: 'Sink', label: 'Sink' },
    { value: 'RangeHood', label: 'RangeHood' },
    { value: 'Shower Tray', label: 'Shower Tray' },
    { value: 'Mirror', label: 'Mirror' }
  ]
};

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const logoutBtn = document.getElementById('logout-btn');
const authForm = document.getElementById('auth-form');
const authRepoInput = document.getElementById('auth-repo');
const authBranchInput = document.getElementById('auth-branch');
const authKeyInput = document.getElementById('auth-key');
const authRememberCheckbox = document.getElementById('auth-remember');

const productForm = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const prodIdInput = document.getElementById('prod-id');
const prodNameInput = document.getElementById('prod-name');
const prodSkuInput = document.getElementById('prod-sku');
const prodCategorySelect = document.getElementById('prod-category');
const prodSubcategoryInput = document.getElementById('prod-subcategory');
const prodGalleryToggle = document.getElementById('prod-gallery-toggle');
const gallerySettings = document.getElementById('gallery-settings');
const prodGalleryClassSelect = document.getElementById('prod-gallery-class');
const prodGallerySubInput = document.getElementById('prod-gallery-sub');
const prodImageFileInput = document.getElementById('prod-image-file');
const prodImageUrlInput = document.getElementById('prod-image-url');
const imagePreview = document.getElementById('image-preview');
const saveBtn = document.getElementById('save-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const uploadLabel = document.getElementById('upload-label');

const searchInput = document.getElementById('search-input');
const filterCategorySelect = document.getElementById('filter-category');
const productListContainer = document.getElementById('product-list');

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const statusToast = document.getElementById('status-toast');

// Initialize APP
document.addEventListener('DOMContentLoaded', () => {
  // Load saved credentials from localStorage
  const savedToken = localStorage.getItem('el_cms_token');
  const savedRepo = localStorage.getItem('el_cms_repo');
  const savedBranch = localStorage.getItem('el_cms_branch') || 'main';

  if (savedToken && savedRepo) {
    authRepoInput.value = savedRepo;
    authBranchInput.value = savedBranch;
    authKeyInput.value = savedToken;
    
    // Auto-login
    validateAndLogin(savedRepo, savedBranch, savedToken, false);
  }

  // Bind Form toggles
  prodGalleryToggle.addEventListener('change', (e) => {
    gallerySettings.style.display = e.target.checked ? 'block' : 'none';
  });

  prodCategorySelect.addEventListener('change', (e) => {
    const category = e.target.value;
    updateSubcategoryOptions(category);

    if (category === 'gallery') {
      prodGalleryToggle.checked = true;
      prodGalleryToggle.disabled = true;
      gallerySettings.style.display = 'block';
    } else {
      prodGalleryToggle.disabled = false;
    }
  });

  // Handle Image Selection
  prodImageFileInput.addEventListener('change', handleImageSelect);

  // Bind Search and Filters
  searchInput.addEventListener('input', renderProductsList);
  filterCategorySelect.addEventListener('change', renderProductsList);

  // Form submits
  authForm.addEventListener('submit', handleLoginSubmit);
  productForm.addEventListener('submit', handleProductFormSubmit);
  cancelEditBtn.addEventListener('click', resetForm);
  logoutBtn.addEventListener('click', logout);
});

// Show status message toast
function showToast(message, type = 'success') {
  statusToast.textContent = message;
  statusToast.className = 'cms-status';
  if (type === 'error') statusToast.classList.add('cms-status--error');
  if (type === 'success') statusToast.classList.add('cms-status--success');
  
  statusToast.classList.add('active');
  setTimeout(() => {
    statusToast.classList.remove('active');
  }, 4000);
}

// Show/Hide Loading
function showLoading(text) {
  loadingText.textContent = text;
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}

// Check credentials with GitHub API
async function validateAndLogin(repo, branch, token, saveToStorage = true) {
  showLoading('Connecting to GitHub...');
  
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Invalid credentials or repository path. Please check your token and repo name.');
    }

    // Success! Configure global state
    githubConfig.repo = repo;
    githubConfig.branch = branch;
    githubConfig.token = token;

    if (saveToStorage) {
      localStorage.setItem('el_cms_repo', repo);
      localStorage.setItem('el_cms_branch', branch);
      localStorage.setItem('el_cms_token', token);
    }

    // Hide auth, show dashboard
    authView.style.display = 'none';
    dashboardView.style.display = 'grid';
    logoutBtn.style.display = 'inline-block';
    
    showToast('Access Granted. Welcome.');
    
    // Fetch products
    await fetchProductsFromGitHub();

  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
    logout(); // reset
  } finally {
    hideLoading();
  }
}

// Handle Login submit
function handleLoginSubmit() {
  const repo = authRepoInput.value.trim();
  const branch = authBranchInput.value.trim();
  const token = authKeyInput.value.trim();
  const remember = authRememberCheckbox.checked;

  validateAndLogin(repo, branch, token, remember);
}

// Fetch products.json from Github
async function fetchProductsFromGitHub() {
  showLoading('Loading product database...');
  try {
    const fileData = await fetchGitHubFile('products.json');
    allProducts = JSON.parse(fileData.content);
    renderProductsList();
  } catch (error) {
    // If file doesn't exist, start with empty array
    if (error.message.includes('404')) {
      allProducts = [];
      renderProductsList();
      showToast('No products.json found. Created a new database.', 'success');
    } else {
      showToast('Error loading products.json: ' + error.message, 'error');
    }
  } finally {
    hideLoading();
  }
}

// Helper to fetch file content and SHA from GitHub
async function fetchGitHubFile(path) {
  const url = `https://api.github.com/repos/${githubConfig.repo}/contents/${path}?ref=${githubConfig.branch}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${githubConfig.token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API Error (${response.status}): Failed to fetch ${path}`);
  }

  const data = await response.json();
  // Decode Base64 content
  // Decode handles utf-8 characters properly
  const decodedContent = decodeURIComponent(atob(data.content.replace(/\s/g, '')).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return {
    content: decodedContent,
    sha: data.sha
  };
}

// Dynamic subcategory populate
function updateSubcategoryOptions(category, selectedVal = '') {
  const group = document.getElementById('subcategory-group');
  const select = document.getElementById('prod-subcategory');
  
  const options = SUBCATEGORY_MAP[category] || [];
  
  if (options.length > 0) {
    select.innerHTML = '<option value="">No Subcategory / Unassigned</option>' + 
      options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
    select.value = selectedVal;
    group.style.display = 'block';
  } else {
    select.innerHTML = '<option value="">No Subcategory</option>';
    select.value = '';
    group.style.display = 'none';
  }
}

// Helper to fetch just the SHA of a file from GitHub (works for images/binary)
async function getFileSha(path) {
  try {
    const url = `https://api.github.com/repos/${githubConfig.repo}/contents/${path}?ref=${githubConfig.branch}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${githubConfig.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      return data.sha;
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

// Helper to write/create file on GitHub (supports raw base64 encoding for images)
async function writeGitHubFile(path, content, sha = null, commitMessage, isBase64 = false) {
  const url = `https://api.github.com/repos/${githubConfig.repo}/contents/${path}`;
  const body = {
    message: commitMessage,
    content: isBase64 ? content : btoa(unescape(encodeURIComponent(content))),
    branch: githubConfig.branch
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${githubConfig.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to write file to GitHub.');
  }

  return await response.json();
}

// Handle Image reading
function handleImageSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    selectedImageBase64 = evt.target.result.split(',')[1];
    selectedImageName = file.name;
    imagePreview.src = evt.target.result;
    imagePreview.style.display = 'block';
    uploadLabel.textContent = `Selected: ${file.name}`;
  };
  reader.readAsDataURL(file);
}

// Get image path folder depending on category selection
function getFolderPathForCategory(category) {
  switch (category) {
    case 'coffee-tables':
    case 'furniture':
      return 'assets/images/Tables/';
    case 'floor-lamps':
      return 'assets/images/FloorLamps/';
    case 'table-lamps':
      return 'assets/images/TableLamps/';
    case 'lighting':
      return 'assets/images/Lighting/';
    case 'gallery':
      return 'assets/images/Gallery/';
    case 'bathtubs':
      return 'assets/images/BathTubs/';
    case 'sinks-basins':
      return 'assets/images/Sinks/';
    case 'rangehoods':
      return 'assets/images/RangeHoods/';
    case 'sentinel-showers':
      return 'assets/images/SentinelShowers/';
    case 'barwares':
      return 'assets/images/Barwares/';
    case 'bespoke':
      return 'assets/images/Bespoke/';
    case 'accessories':
      return 'assets/images/Accessories/';
    default:
      return 'assets/images/Uploads/';
  }
}

// Handle Product Add / Edit submit
async function handleProductFormSubmit() {
  const id = prodIdInput.value;
  const name = prodNameInput.value.trim();
  const sku = prodSkuInput.value.trim();
  const category = prodCategorySelect.value;
  const subcategory = prodSubcategoryInput.value; // Dropdown value
  
  const showInGallery = prodGalleryToggle.checked;
  const galleryClass = showInGallery ? prodGalleryClassSelect.value : '';
  const gallerySub = showInGallery ? prodGallerySubInput.value.trim() : '';
  
  let imageUrl = prodImageUrlInput.value;

  if (!id && !selectedImageBase64) {
    showToast('Please select a product image.', 'error');
    return;
  }

  showLoading(id ? 'Updating product...' : 'Creating product...');

  try {
    // 1. Upload new image if selected
    if (selectedImageBase64) {
      const folder = getFolderPathForCategory(showInGallery && category === 'gallery' ? 'gallery' : category);
      
      // Clean name: replace spaces and special characters with dashes
      const fileExt = selectedImageName.substring(selectedImageName.lastIndexOf('.'));
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const uniqueFileName = `${sku}-${cleanName}${fileExt}`;
      const imagePath = `${folder}${uniqueFileName}`;

      showLoading('Uploading image to GitHub repository...');
      
      // Get image SHA safely (if exists) without downloading content
      const imageSha = await getFileSha(imagePath);

      // Commit image with raw base64 content
      await writeGitHubFile(imagePath, selectedImageBase64, imageSha, `CMS Upload image: ${uniqueFileName}`, true);
      imageUrl = imagePath;
    }

    // 2. Fetch fresh products.json to avoid conflicts
    showLoading('Syncing database...');
    let dbSha = null;
    let currentDbContent = [];
    try {
      const dbFile = await fetchGitHubFile('products.json');
      dbSha = dbFile.sha;
      currentDbContent = JSON.parse(dbFile.content);
    } catch (err) {
      if (!err.message.includes('404')) {
        throw err;
      }
    }

    // 3. Add or update item
    if (id) {
      // Find and update item
      const index = currentDbContent.findIndex(p => p.id === id);
      if (index !== -1) {
        currentDbContent[index] = {
          id: id,
          name: name,
          sku: sku,
          image: imageUrl,
          category: category,
          subcategory: subcategory,
          showInGallery: showInGallery,
          galleryClass: galleryClass,
          gallerySub: gallerySub || subcategory // Fallback to category sub if not specified
        };
      } else {
        throw new Error('Product not found in current database.');
      }
    } else {
      // Push new item
      currentDbContent.push({
        id: 'prod_' + Math.random().toString(36).substr(2, 9),
        name: name,
        sku: sku,
        image: imageUrl,
        category: category,
        subcategory: subcategory,
        showInGallery: showInGallery,
        galleryClass: galleryClass,
        gallerySub: gallerySub || subcategory
      });
    }

    // 4. Save updated products.json
    showLoading('Saving product data...');
    await writeGitHubFile(
      'products.json',
      JSON.stringify(currentDbContent, null, 2),
      dbSha,
      id ? `CMS Update product: ${name}` : `CMS Add product: ${name}`
    );

    allProducts = currentDbContent;
    renderProductsList();
    resetForm();
    showToast(id ? 'Product updated successfully.' : 'Product added successfully.');

  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Delete product
async function handleDeleteProduct(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return;
  }

  showLoading('Deleting product...');

  try {
    // 1. Fetch fresh products.json
    const dbFile = await fetchGitHubFile('products.json');
    const currentDbContent = JSON.parse(dbFile.content);

    // 2. Filter out item
    const updatedContent = currentDbContent.filter(p => p.id !== id);

    // 3. Write back to GitHub
    await writeGitHubFile(
      'products.json',
      JSON.stringify(updatedContent, null, 2),
      dbFile.sha,
      `CMS Delete product: ${name}`
    );

    allProducts = updatedContent;
    renderProductsList();
    showToast(`Deleted product "${name}".`);

  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
  } finally {
    hideLoading();
  }
}

// Edit product (Populate form)
function handleEditProduct(product) {
  formTitle.textContent = 'Edit Product';
  saveBtn.textContent = 'Update Product';
  cancelEditBtn.style.display = 'block';

  prodIdInput.value = product.id;
  prodNameInput.value = product.name;
  prodSkuInput.value = product.sku;
  
  prodCategorySelect.value = product.category;
  // Dynamic populate subcategory options and set value
  updateSubcategoryOptions(product.category, product.subcategory || '');
  
  prodGalleryToggle.checked = !!product.showInGallery;
  gallerySettings.style.display = product.showInGallery ? 'block' : 'none';
  prodGalleryClassSelect.value = product.galleryClass || '';
  prodGallerySubInput.value = product.gallerySub || '';

  prodImageUrlInput.value = product.image;
  imagePreview.src = product.image;
  imagePreview.style.display = 'block';
  uploadLabel.textContent = 'Change product image (optional)';
  
  // Scroll to form
  document.querySelector('.cms-card').scrollIntoView({ behavior: 'smooth' });
}

// Reset the Add/Edit form
function resetForm() {
  formTitle.textContent = 'Add Product';
  saveBtn.textContent = 'Save Product';
  cancelEditBtn.style.display = 'none';

  prodIdInput.value = '';
  prodNameInput.value = '';
  prodSkuInput.value = '';
  
  prodCategorySelect.value = '';
  // Clear and hide subcategory
  updateSubcategoryOptions('');
  
  prodGalleryToggle.checked = false;
  prodGalleryToggle.disabled = false;
  gallerySettings.style.display = 'none';
  prodGalleryClassSelect.value = '';
  prodGallerySubInput.value = '';

  prodImageUrlInput.value = '';
  prodImageFileInput.value = '';
  imagePreview.src = '';
  imagePreview.style.display = 'none';
  uploadLabel.textContent = 'Drag & Drop or Click to Upload';

  selectedImageBase64 = null;
  selectedImageName = null;
}

// Render product list with filters & search
function renderProductsList() {
  const query = searchInput.value.toLowerCase().trim();
  const filterCat = filterCategorySelect.value;

  const filtered = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    const matchesFilter = filterCat === 'all' || p.category === filterCat;
    return matchesSearch && matchesFilter;
  });

  // Sort: show newest first (bottom of array from push, so let's reverse copy)
  const sorted = [...filtered].reverse();

  if (sorted.length === 0) {
    productListContainer.innerHTML = `<div style="padding: 3rem; text-align: center; color: #888;">No products match your search.</div>`;
    return;
  }

  productListContainer.innerHTML = sorted.map(p => {
    return `
      <div class="cms-item">
        <img src="${p.image}" alt="${p.name}" class="cms-item__thumb" onerror="this.src='https://placehold.co/80?text=No+Image'">
        <div class="cms-item__info">
          <span class="cms-item__name">${p.name}</span>
          <span class="cms-item__sku">SKU: ${p.sku}</span>
          <span class="cms-item__meta">${p.category} ${p.subcategory ? `(${p.subcategory})` : ''} ${p.showInGallery ? '• in Gallery' : ''}</span>
        </div>
        <div class="cms-item__actions">
          <button class="cms-item-btn edit-btn" data-id="${p.id}">Edit</button>
          <button class="cms-item-btn cms-item-btn--delete delete-btn" data-id="${p.id}">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  // Bind Actions on buttons dynamically
  productListContainer.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = allProducts.find(p => p.id === id);
      if (prod) handleEditProduct(prod);
    });
  });

  productListContainer.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = allProducts.find(p => p.id === id);
      if (prod) handleDeleteProduct(id, prod.name);
    });
  });
}

// Logout
function logout() {
  localStorage.removeItem('el_cms_token');
  localStorage.removeItem('el_cms_repo');
  localStorage.removeItem('el_cms_branch');
  
  authRepoInput.value = '';
  authKeyInput.value = '';
  
  authView.style.display = 'block';
  dashboardView.style.display = 'none';
  logoutBtn.style.display = 'none';
  
  resetForm();
  allProducts = [];
  productListContainer.innerHTML = '';
}
