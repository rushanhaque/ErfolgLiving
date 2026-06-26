// Erfolg Living — CMS JS Engine
// Handles GitHub API uploads, product JSON sync, and state management

let githubConfig = {
  token: '',
  repo: '',
  branch: 'main'
};

let allProducts = [];
let originalProducts = [];
let pendingImages = {};
let selectedImageBase64 = null;
let selectedImageName = null;

// Default category -> subcategories map (fallback until categories.json loads).
// The live source of truth is categories.json: fetched on login, edited via the
// Subcategory Manager, and published back to the repo alongside products.json.
const DEFAULT_SUBCATEGORY_MAP = {
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
  'sentinel-showers': [
    { value: 'sentinels', label: 'Sentinels' },
    { value: 'shower-pods', label: 'Shower Pods / Trays' }
  ],
  'sinks-basins': [
    { value: 'kitchen-sink', label: 'Kitchen Sink' },
    { value: 'double-bowl-kitchen-sink', label: 'Double Bowl Kitchen Sink' },
    { value: 'bar-sinks', label: 'Bar Sinks' },
    { value: 'bathtub-style-basins', label: 'Bathtub Style Basins' },
    { value: 'round-sinks-basins', label: 'Round Sinks / Basins' }
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

// Live, editable subcategory map (loaded from categories.json on login)
let subcategoryMap = JSON.parse(JSON.stringify(DEFAULT_SUBCATEGORY_MAP));
let originalSubcategoryMap = JSON.parse(JSON.stringify(DEFAULT_SUBCATEGORY_MAP));

// Categories available in the Subcategory Manager (mirrors the product category list)
const MANAGEABLE_CATEGORIES = [
  { value: 'coffee-tables', label: 'Coffee Tables' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'bathtubs', label: 'Luxury Bathtubs' },
  { value: 'sinks-basins', label: 'Sinks & Basins' },
  { value: 'rangehoods', label: 'Rangehoods' },
  { value: 'sentinel-showers', label: 'Sentinel Showers' },
  { value: 'barwares', label: 'Barwares' },
  { value: 'bespoke', label: 'Bespoke Metalwork' },
  { value: 'accessories', label: 'Bathroom Accessories' },
  { value: 'gallery', label: 'Gallery' }
];

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
const publishBtn = document.getElementById('publish-btn');
const syncStatus = document.getElementById('sync-status');

// Subcategory manager elements
const subcatCategorySelect = document.getElementById('subcat-category');
const subcatListContainer = document.getElementById('subcat-list');
const subcatNewInput = document.getElementById('subcat-new-input');
const subcatAddBtn = document.getElementById('subcat-add-btn');

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
  publishBtn.addEventListener('click', handlePublishChanges);

  // Subcategory manager
  populateSubcatCategorySelect();
  subcatCategorySelect.addEventListener('change', renderSubcatList);
  subcatAddBtn.addEventListener('click', handleAddSubcategory);
  subcatNewInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(); }
  });

  // Warn user if leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
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
    originalProducts = JSON.parse(JSON.stringify(allProducts));
    pendingImages = {};
    await loadCategoriesFromGitHub();
    updateUnsavedChangesUI();
    renderProductsList();
  } catch (error) {
    // If file doesn't exist, start with empty array
    if (error.message.includes('404')) {
      allProducts = [];
      originalProducts = [];
      pendingImages = {};
      await loadCategoriesFromGitHub();
      updateUnsavedChangesUI();
      renderProductsList();
      showToast('No products.json found. Created a new database.', 'success');
    } else {
      showToast('Error loading products.json: ' + error.message, 'error');
    }
  } finally {
    hideLoading();
  }
}

// Helpers for batch save / publish state
function hasUnsavedChanges() {
  const hasDataChanges = JSON.stringify(allProducts) !== JSON.stringify(originalProducts);
  const hasImageChanges = Object.keys(pendingImages).length > 0;
  const hasCategoryChanges = JSON.stringify(subcategoryMap) !== JSON.stringify(originalSubcategoryMap);
  return hasDataChanges || hasImageChanges || hasCategoryChanges;
}

function updateUnsavedChangesUI() {
  const changed = hasUnsavedChanges();
  if (changed) {
    let imageChangesCount = Object.keys(pendingImages).length;
    
    // Compare allProducts and originalProducts to find additions, edits, deletions
    const origMap = new Map(originalProducts.map(p => [p.id, p]));
    const currentMap = new Map(allProducts.map(p => [p.id, p]));
    
    let dataChangesCount = 0;
    
    // Check deletions
    for (const id of origMap.keys()) {
      if (!currentMap.has(id)) {
        dataChangesCount++;
      }
    }
    
    // Check additions and edits
    for (const [id, p] of currentMap.entries()) {
      const orig = origMap.get(id);
      if (!orig) {
        dataChangesCount++;
      } else if (JSON.stringify(orig) !== JSON.stringify(p)) {
        dataChangesCount++;
      }
    }
    
    const hasCategoryChanges = JSON.stringify(subcategoryMap) !== JSON.stringify(originalSubcategoryMap);
    const totalChanges = imageChangesCount + dataChangesCount + (hasCategoryChanges ? 1 : 0);
    
    publishBtn.style.display = 'inline-block';
    publishBtn.textContent = `Publish Changes (${totalChanges})`;
    
    syncStatus.textContent = 'Unsaved Changes';
    syncStatus.style.color = '#b45309';
  } else {
    publishBtn.style.display = 'none';
    syncStatus.textContent = 'Synced';
    syncStatus.style.color = '#15803d';
  }
}

// Publish batch changes to GitHub
async function handlePublishChanges() {
  if (!hasUnsavedChanges()) {
    showToast('No unsaved changes to publish.', 'error');
    return;
  }

  if (!confirm('Are you sure you want to publish all changes to GitHub? This will push all updates to your repository.')) {
    return;
  }

  showLoading('Starting publish process...');

  try {
    // 1. Upload all pending images
    const imagePaths = Object.keys(pendingImages);
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const imgData = pendingImages[imagePath];
      showLoading(`Uploading image (${i + 1}/${imagePaths.length}): ${imgData.name}...`);
      
      const imageSha = await getFileSha(imagePath);
      await writeGitHubFile(imagePath, imgData.base64, imageSha, `CMS Upload image: ${imgData.name}`, true);
    }

    // 2. Fetch fresh products.json to avoid SHA conflict issues
    showLoading('Syncing remote database SHA...');
    let dbSha = null;
    try {
      const dbFile = await fetchGitHubFile('products.json');
      dbSha = dbFile.sha;
    } catch (err) {
      if (!err.message.includes('404')) {
        throw err;
      }
    }

    // 3. Save updated products.json
    showLoading('Saving product database...');
    await writeGitHubFile(
      'products.json',
      JSON.stringify(allProducts, null, 2),
      dbSha,
      `CMS Batch Publish: ${imagePaths.length} images, ${allProducts.length} products total`
    );

    // 3b. Save categories.json (subcategory definitions)
    showLoading('Saving categories...');
    let catSha = null;
    try {
      const catFile = await fetchGitHubFile('categories.json');
      catSha = catFile.sha;
    } catch (err) {
      if (!err.message.includes('404')) throw err;
    }
    await writeGitHubFile(
      'categories.json',
      JSON.stringify(subcategoryMap, null, 2),
      catSha,
      'CMS: update subcategories'
    );

    // 4. Update local state
    originalProducts = JSON.parse(JSON.stringify(allProducts));
    originalSubcategoryMap = JSON.parse(JSON.stringify(subcategoryMap));
    pendingImages = {};
    updateUnsavedChangesUI();
    showToast('All changes successfully published to GitHub.');

  } catch (error) {
    console.error(error);
    showToast('Publish failed: ' + error.message, 'error');
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
  
  const options = subcategoryMap[category] || [];
  
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

// ---- CATEGORIES (subcategory definitions) ----

// Load categories.json from GitHub into the editable map (falls back to default)
async function loadCategoriesFromGitHub() {
  try {
    const fileData = await fetchGitHubFile('categories.json');
    subcategoryMap = JSON.parse(fileData.content);
  } catch (error) {
    // categories.json may not exist yet — fall back to the built-in default
    subcategoryMap = JSON.parse(JSON.stringify(DEFAULT_SUBCATEGORY_MAP));
  }
  originalSubcategoryMap = JSON.parse(JSON.stringify(subcategoryMap));
  renderSubcatList();
}

// ---- SUBCATEGORY MANAGER ----

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function slugifySubcat(label) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function populateSubcatCategorySelect() {
  if (!subcatCategorySelect) return;
  subcatCategorySelect.innerHTML = MANAGEABLE_CATEGORIES
    .map(c => `<option value="${c.value}">${escapeHtml(c.label)}</option>`).join('');
  renderSubcatList();
}

function renderSubcatList() {
  if (!subcatListContainer || !subcatCategorySelect) return;
  const category = subcatCategorySelect.value;
  const subs = subcategoryMap[category] || [];

  if (subs.length === 0) {
    subcatListContainer.innerHTML = '<div class="cms-subcat-empty">No subcategories yet for this category. Add one below.</div>';
    return;
  }

  subcatListContainer.innerHTML = subs.map((s, i) => `
    <div class="cms-subcat-row">
      <div>
        <span class="cms-subcat-row__label">${escapeHtml(s.label)}</span>
        <span class="cms-subcat-row__value">${escapeHtml(s.value)}</span>
      </div>
      <div class="cms-subcat-row__actions">
        <button class="cms-item-btn" data-action="rename" data-index="${i}">Rename</button>
        <button class="cms-item-btn cms-item-btn--delete" data-action="delete" data-index="${i}">Delete</button>
      </div>
    </div>
  `).join('');

  subcatListContainer.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      const action = btn.getAttribute('data-action');
      if (action === 'rename') handleRenameSubcategory(category, idx);
      else if (action === 'delete') handleDeleteSubcategory(category, idx);
    });
  });
}

function handleAddSubcategory() {
  const category = subcatCategorySelect.value;
  const label = subcatNewInput.value.trim();
  if (!label) { showToast('Enter a subcategory name.', 'error'); return; }

  if (!subcategoryMap[category]) subcategoryMap[category] = [];
  const list = subcategoryMap[category];

  if (list.some(s => s.label.toLowerCase() === label.toLowerCase())) {
    showToast('That subcategory already exists.', 'error');
    return;
  }

  // Generate a unique slug value
  const base = slugifySubcat(label) || 'subcategory';
  let value = base, n = 2;
  while (list.some(s => s.value === value)) { value = `${base}-${n++}`; }

  list.push({ value, label });
  subcatNewInput.value = '';
  renderSubcatList();
  updateUnsavedChangesUI();
  showToast(`Added "${label}". Click Publish to save.`);
}

function handleRenameSubcategory(category, index) {
  const list = subcategoryMap[category] || [];
  const sub = list[index];
  if (!sub) return;

  const input = prompt('Rename subcategory:', sub.label);
  if (input === null) return;
  const newLabel = input.trim();
  if (!newLabel) { showToast('Name cannot be empty.', 'error'); return; }
  if (newLabel === sub.label) return;

  if (list.some((s, i) => i !== index && s.label.toLowerCase() === newLabel.toLowerCase())) {
    showToast('Another subcategory already has that name.', 'error');
    return;
  }

  // Keep the value (internal id) stable so existing products stay matched
  sub.label = newLabel;
  renderSubcatList();
  updateUnsavedChangesUI();
  showToast(`Renamed to "${newLabel}". Click Publish to save.`);
}

function handleDeleteSubcategory(category, index) {
  const list = subcategoryMap[category] || [];
  const sub = list[index];
  if (!sub) return;

  const usedBy = allProducts.filter(p => p.category === category && p.subcategory === sub.value);
  let msg = `Delete subcategory "${sub.label}"?`;
  if (usedBy.length > 0) {
    msg += `\n\n${usedBy.length} product(s) use it and will become "Unassigned".`;
  }
  if (!confirm(msg)) return;

  usedBy.forEach(p => {
    p.subcategory = '';
    if (p.gallerySub === sub.value) p.gallerySub = '';
  });

  list.splice(index, 1);
  renderSubcatList();
  renderProductsList();
  updateUnsavedChangesUI();
  showToast(`Deleted "${sub.label}". Click Publish to save.`);
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

  try {
    // 1. Buffer new image if selected
    if (selectedImageBase64) {
      const folder = getFolderPathForCategory(showInGallery && category === 'gallery' ? 'gallery' : category);
      
      // Clean name: replace spaces and special characters with dashes
      const fileExt = selectedImageName.substring(selectedImageName.lastIndexOf('.'));
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const uniqueFileName = `${sku}-${cleanName}${fileExt}`;
      const imagePath = `${folder}${uniqueFileName}`;

      pendingImages[imagePath] = {
        base64: selectedImageBase64,
        name: uniqueFileName
      };
      imageUrl = imagePath;
    }

    // 2. Add or update item in memory
    if (id) {
      // Find and update item
      const index = allProducts.findIndex(p => p.id === id);
      if (index !== -1) {
        allProducts[index] = {
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
        throw new Error('Product not found in local database.');
      }
    } else {
      // Push new item
      allProducts.push({
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

    renderProductsList();
    resetForm();
    updateUnsavedChangesUI();
    showToast(id ? 'Product updated locally. Click Publish to save.' : 'Product added locally. Click Publish to save.');

  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
  }
}

// Delete product
async function handleDeleteProduct(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}" locally?`)) {
    return;
  }

  try {
    // Filter out item locally
    allProducts = allProducts.filter(p => p.id !== id);

    renderProductsList();
    updateUnsavedChangesUI();
    showToast(`Deleted product "${name}" locally. Click Publish to save.`);

  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
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
  publishBtn.style.display = 'none';
  
  resetForm();
  allProducts = [];
  originalProducts = [];
  pendingImages = {};
  subcategoryMap = JSON.parse(JSON.stringify(DEFAULT_SUBCATEGORY_MAP));
  originalSubcategoryMap = JSON.parse(JSON.stringify(DEFAULT_SUBCATEGORY_MAP));
  updateUnsavedChangesUI();
  productListContainer.innerHTML = '';
}
