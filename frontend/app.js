/**
 * Frontend JavaScript for NOVARA demo storefront
 * Handles API interactions, UI updates, and interactive features
 */

(() => {
  // Configuration
  const API_BASE = 'http://localhost:5000/api'; // Change this to point to your backend
  const MOCK_MODE_KEY = 'novaraMockMode'; // localStorage key to force mock mode

  // State
  let state = {
    products: [],
    categories: [],
    cart: JSON.parse(localStorage.getItem('novaraCart') || '[]'),
    user: JSON.parse(localStorage.getItem('novaraUser') || null),
    token: localStorage.getItem('novaraToken') || null,
    mockMode: false,
    currentPage: 1,
    productsPerPage: 12,
    filters: {
      category: '',
      search: '',
      sort: 'new'
    }
  };

  // DOM Elements
  const els = {
    // Cursor glow
    cursorGlow: document.getElementById('cursorGlow'),
    // Toast stack
    toastStack: document.getElementById('toastStack'),
    // API status
    apiBadge: document.getElementById('apiBadge'),
    apiDot: document.getElementById('apiDot'),
    apiBadgeText: document.getElementById('apiBadgeText'),
    // Auth
    authBtn: document.getElementById('authBtn'),
    authBtnLabel: document.getElementById('authBtnLabel'),
    authBackdrop: document.getElementById('authBackdrop'),
    authModal: document.getElementById('authModal'),
    closeAuth: document.getElementById('closeAuth'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    loginError: document.getElementById('loginError'),
    registerError: document.getElementById('registerError'),
    // Cart
    cartBtn: document.getElementById('cartBtn'),
    cartCount: document.getElementById('cartCount'),
    cartDrawer: document.getElementById('cartDrawer'),
    overlay: document.getElementById('overlay'),
    closeCart: document.getElementById('closeCart'),
    cartItems: document.getElementById('cartItems'),
    cartTotal: document.getElementById('cartTotal'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    cartHint: document.getElementById('cartHint'),
    // Hero
    heroCardImg: document.getElementById('heroCardImg'),
    heroCardName: document.getElementById('heroCardName'),
    heroCardDesc: document.getElementById('heroCardDesc'),
    heroCardPrice: document.getElementById('heroCardPrice'),
    heroCardAdd: document.getElementById('heroCardAdd'),
    // Marquee
    marqueeTrack: document.getElementById('marqueeTrack'),
    // Categories
    categoryRow: document.getElementById('categoryRow'),
    // Product grid
    productGrid: document.getElementById('productGrid'),
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    // Reviews marquee
    reviewsTrack: document.getElementById('reviewsTrack'),
    // Newsletter
    newsletterForm: document.getElementById('newsletterForm'),
    newsletterEmail: document.getElementById('newsletterEmail'),
    // Quick view modal
    quickBackdrop: document.getElementById('quickBackdrop'),
    quickModal: document.getElementById('quickModal'),
    closeQuick: document.getElementById('closeQuick'),
    quickImg: document.getElementById('quickImg'),
    quickCategory: document.getElementById('quickCategory'),
    quickName: document.getElementById('quickName'),
    quickDesc: document.getElementById('quickDesc'),
    quickPrice: document.getElementById('quickPrice'),
    quickStock: document.getElementById('quickStock'),
    qtyMinus: document.getElementById('qtyMinus'),
    qtyValue: document.getElementById('qtyValue'),
    qtyPlus: document.getElementById('qtyPlus'),
    quickAddBtn: document.getElementById('quickAddBtn'),
    quickSource: document.getElementById('quickSource'),
    // How it works modal
    howBackdrop: document.getElementById('howBackdrop'),
    howModal: document.querySelector('.how-modal'),
    closeHow: document.getElementById('closeHow'),
    howItWorksBtn: document.getElementById('howItWorksBtn'),
    // Hamburger menu
    hamburger: document.getElementById('hamburger'),
    navLinks: document.getElementById('navLinks'),
    // Stats
    statProducts: document.getElementById('statProducts')
  };

  // Initialize
  const init = async () => {
    // Check if we should force mock mode from localStorage
    state.mockMode = localStorage.getItem(MOCK_MODE_KEY) === 'true';

    // Set up event listeners
    setupEventListeners();

    // Update auth UI based on login state
    updateAuthUI();

    // Update cart UI
    updateCartUI();

    // Load initial data
    await loadCategories();
    await loadHeroProduct();
    await loadProducts(); // initial load
    await loadMarqueeLogs(); // for marquee-track (tags/logos)
    await loadReviewsMarquee(); // testimonials
    checkAPIStatus(); // start polling API health

    // Start cursor glow effect
    initCursorGlow();

    // Check if we should show a toast about mock mode
    if (state.mockMode) {
      showToast('Running in demo mode (API not reachable)', 'info');
    }
  };

  // Event Listeners Setup
  const setupEventListeners = () => {
    // Auth modal
    els.closeAuth.addEventListener('click', () => {
      els.authBackdrop.classList.remove('open');
      els.authModal.classList.remove('open');
    });
    els.authBackdrop.addEventListener('click', (e) => {
      if (e.target === els.authBackdrop) {
        els.authBackdrop.classList.remove('open');
        els.authModal.classList.remove('open');
      }
    });
    // Tab switching in auth modal
    document.querySelectorAll('.tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        if (tabName === 'login') {
          els.loginForm.classList.remove('hidden');
          els.registerForm.classList.add('hidden');
        } else {
          els.loginForm.classList.add('hidden');
          els.registerForm.classList.remove('hidden');
        }
      });
    });
    els.authBtn.addEventListener('click', () => {
      els.authBackdrop.classList.add('open');
      els.authModal.classList.add('open');
      // Clear errors
      els.loginError.textContent = '';
      els.registerError.textContent = '';
      els.loginEmail.value = '';
      els.loginPassword.value = '';
      els.registerName.value = '';
      els.registerEmail.value = '';
      els.registerPassword.value = '';
    });
    // Login form
    els.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      els.loginError.textContent = 'Signing in...';
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: els.loginEmail.value.trim(),
            password: els.loginPassword.value
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        // Store user and token
        localStorage.setItem('novaraToken', data.token);
        localStorage.setItem('novaraUser', JSON.stringify(data.user));
        state.token = data.token;
        state.user = data.user;
        updateAuthUI();
        els.authBackdrop.classList.remove('open');
        els.authModal.classList.remove('open');
        showToast('Signed in successfully', 'success');
      } catch (err) {
        els.loginError.textContent = err.message;
        showToast(err.message, 'error');
      }
    });
    // Register form
    els.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      els.registerError.textContent = 'Creating account...';
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: els.registerName.value.trim(),
            email: els.registerEmail.value.trim(),
            password: els.registerPassword.value
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        // Auto login after registration?
        showToast('Account created! Please sign in.', 'success');
        // Switch to login tab
        document.querySelector('.tab-btn[data-tab="login"]').click();
        els.registerForm.reset();
      } catch (err) {
        els.registerError.textContent = err.message;
        showToast(err.message, 'error');
      }
    });
    // Cart
    els.cartBtn.addEventListener('click', () => {
      els.cartDrawer.classList.add('open');
      els.overlay.classList.add('open');
    });
    els.closeCart.addEventListener('click', closeCartDrawer);
    els.overlay.addEventListener('click', closeCartDrawer);
    els.checkoutBtn.addEventListener('click', () => {
      if (state.cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
      }
      if (!state.token) {
        showToast('Please sign in to checkout', 'error');
        els.authBtn.click();
        return;
      }
      // In a real app, we would send order to API
      showToast('Checkout feature would send order to /api/orders', 'info');
      // For demo, just clear cart
      state.cart = [];
      saveCart();
      updateCartUI();
      closeCartDrawer();
    });
    // Search and sort
    els.searchInput.addEventListener('input', debounce(() => {
      state.filters.search = els.searchInput.value.trim();
      state.currentPage = 1;
      loadProducts();
    }, 300));
    els.sortSelect.addEventListener('change', () => {
      state.filters.sort = els.sortSelect.value;
      state.currentPage = 1;
      loadProducts();
    });
    els.loadMoreBtn.addEventListener('click', () => {
      state.currentPage++;
      loadProducts();
    });
    // Newsletter
    els.newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = els.newsletterEmail.value.trim();
      if (email) {
        showToast(`Thanks! We'll notify ${email} about new drops.`, 'success');
        els.newsletterForm.reset();
      } else {
        showToast('Please enter a valid email', 'error');
      }
    });
    // Quick view modal
    els.closeQuick.addEventListener('click', () => {
      els.quickBackdrop.classList.remove('open');
      els.quickModal.classList.remove('open');
    });
    els.quickBackdrop.addEventListener('click', (e) => {
      if (e.target === els.quickBackdrop) {
        els.quickBackdrop.classList.remove('open');
        els.quickModal.classList.remove('open');
      }
    });
    els.qtyMinus.addEventListener('click', () => {
      let val = parseInt(els.qtyValue.textContent);
      if (val > 1) {
        val--;
        els.qtyValue.textContent = val;
      }
    });
    els.qtyPlus.addEventListener('click', () => {
      let val = parseInt(els.qtyValue.textContent);
      val++;
      els.qtyValue.textContent = val;
    });
    els.quickAddBtn.addEventListener('click', () => {
      const productId = els.quickModal.dataset.productId;
      if (!productId) return;
      const product = state.products.find(p => p._id === productId) ||
                      state.mockProducts?.find(p => p._id === productId);
      if (product) {
        addToCart(product, parseInt(els.qtyValue.textContent));
        showToast(`${product.name} added to cart`, 'success');
        els.quickBackdrop.classList.remove('open');
        els.quickModal.classList.remove('open');
        els.qtyValue.textContent = '1';
      }
    });
    // How it works
    els.howItWorksBtn.addEventListener('click', () => {
      els.howBackdrop.classList.add('open');
      els.howModal.classList.add('open');
    });
    els.closeHow.addEventListener('click', () => {
      els.howBackdrop.classList.remove('open');
      els.howModal.classList.remove('open');
    });
    els.howBackdrop.addEventListener('click', (e) => {
      if (e.target === els.howBackdrop) {
        els.howBackdrop.classList.remove('open');
        els.howModal.classList.remove('open');
      }
    });
    // Hamburger menu
    els.hamburger.addEventListener('click', () => {
      els.navLinks.classList.toggle('open');
      els.hamburger.classList.toggle('active');
    });
    // Close nav links when clicking a link (mobile)
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        els.navLinks.classList.remove('open');
        els.hamburger.classList.remove('active');
      });
    });
  };

  // Cart Functions
  const addToCart = (product, quantity = 1) => {
    const existingItem = state.cart.find(item => item.productId === product._id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      state.cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image || product.thumbnail || '',
        quantity
      });
    }
    saveCart();
    updateCartUI();
  };

  const removeFromCart = (productId) => {
    state.cart = state.cart.filter(item => item.productId !== productId);
    saveCart();
    updateCartUI();
  };

  const updateCartQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const item = state.cart.find(item => item.productId === productId);
    if (item) item.quantity = newQty;
    saveCart();
    updateCartUI();
  };

  const saveCart = () => {
    localStorage.setItem('novaraCart', JSON.stringify(state.cart));
  };

  const updateCartUI = () => {
    // Update cart count badge
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    els.cartCount.textContent = totalItems;

    // Update cart drawer items
    if (state.cart.length === 0) {
      els.cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
      els.cartHint.textContent = 'Add some products to get started';
      els.checkoutBtn.disabled = true;
    } else {
      els.cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
          <img src="${item.image || '/placeholder.svg'}" alt="${item.name}">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p class="cart-item-price">$${item.price.toFixed(2)}</p>
            <div class="cart-item-qty">
              <button class="qty-btn" data-id="${item.productId}" data-action="minus">−</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" data-id="${item.productId}" data-action="plus">+</button>
              <button class="remove-item" data-id="${item.productId}">×</button>
            </div>
          </div>
        </div>
      `).join('');

      // Add event listeners to cart item buttons
      els.cartItems.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          const item = state.cart.find(i => i.productId === id);
          if (!item) return;
          let newQty = item.quantity;
          if (action === 'minus') newQty = Math.max(1, item.quantity - 1);
          if (action === 'plus') newQty = item.quantity + 1;
          updateCartQuantity(id, newQty);
        });
      });
      els.cartItems.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.dataset.id;
          removeFromCart(id);
        });
      });

      // Calculate total
      const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      els.cartTotal.textContent = total.toFixed(2);
      els.cartHint.textContent = '';
      els.checkoutBtn.disabled = false;
    }
  };

  const closeCartDrawer = () => {
    els.cartDrawer.classList.remove('open');
    els.overlay.classList.remove('open');
  };

  // Product Loading
  const loadProducts = async () => {
    // Show skeletons
    showProductSkeletons(true);

    try {
      const params = new URLSearchParams();
      if (state.filters.category) params.append('category', state.filters.category);
      if (state.filters.search) params.append('search', state.filters.search);
      if (state.filters.sort) params.append('sort', state.filters.sort);
      params.append('limit', state.productsPerPage);
      params.append('page', state.currentPage);

      const res = await fetch(`${API_BASE}/products?${params}`);
      if (!res.ok) throw new Error('Failed to fetch products');

      const data = await res.json();
      // Assuming API returns { success: true, data: [...], pagination: {...} }
      state.products = state.currentPage === 1 ? data.data : [...state.products, ...data.data];
      // Update total products stat
      if (els.statProducts) els.statProducts.textContent = data.total || state.products.length;

      renderProductGrid();
    } catch (err) {
      console.error('Product load error:', err);
      // Fallback to mock data
      state.mockMode = true;
      localStorage.setItem(MOCK_MODE_KEY, 'true');
      loadMockProducts();
      showToast('API not reachable, using demo data', 'warning');
    } finally {
      showProductSkeletons(false);
    }
  };

  const showProductSkeletons = (show) => {
    if (show) {
      els.productGrid.innerHTML = Array.from({length: state.productsPerPage}).map(() => `
        <div class="product-skeleton">
          <div class="skeleton-img"></div>
          <div class="skeleton-content">
            <h4 class="skeleton-title"></h4>
            <p class="skeleton-price"></p>
          </div>
        </div>
      `).join('');
    } else {
      // Will be rendered by renderProductGrid
    }
  };

  const renderProductGrid = () => {
    if (state.products.length === 0) {
      els.productGrid.innerHTML = '<p class="no-products">No products found</p>';
      els.loadMoreBtn.style.display = 'none';
      return;
    }

    els.productGrid.innerHTML = state.products.map(product => `
      <div class="product-card glass" data-id="${product._id}">
        <div class="product-tag">${product.category || 'New'}</div>
        <img src="${product.image || product.thumbnail || '/placeholder.svg'}" alt="${product.name}" class="product-img">
        <div class="product-info">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-desc">${product.shortDesc || product.description?.substring(0, 100) || ''}...</p>
          <div class="product-price">$${product.price.toFixed(2)}</p>
          <button class="btn btn-small btn-primary magnetic quick-view-btn" data-id="${product._id}">
            <span>Quick view</span>
          </button>
          <button class="btn btn-small btn-outline magnetic add-to-cart-btn" data-id="${product._id}">
            <span>Add to cart</span>
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners to product cards
    els.productGrid.querySelectorAll('.quick-view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.closest('[data-id]').dataset.id;
        loadProductDetails(id);
      });
    });
    els.productGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.closest('[data-id]').dataset.id;
        const product = state.products.find(p => p._id === id);
        if (product) {
          addToCart(product, 1);
          showToast(`${product.name} added to cart`, 'success');
        }
      });
    });

    // Show/hide load more button based on whether there are more products
    // Assuming API returns total count
    // For simplicity, we'll hide if less than productsPerPage returned
    // This should be improved with actual pagination info
    els.loadMoreBtn.style.display = state.products.length % state.productsPerPage === 0 && state.products.length > 0 ? 'block' : 'none';
  };

  const loadProductDetails = async (productId) => {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      const product = await res.json();
      // Assuming API returns { success: true, data: product }
      showQuickView(product.data || product);
    } catch (err) {
      console.error('Error loading product details:', err);
      showToast('Could not load product details', 'error');
    }
  };

  const showQuickView = (product) => {
    els.quickModal.dataset.productId = product._id;
    els.quickImg.src = product.image || product.thumbnail || '/placeholder.svg';
    els.quickImg.alt = product.name;
    els.quickCategory.textContent = product.category || '';
    els.quickName.textContent = product.name;
    els.quickDesc.textContent = product.description || 'No description available';
    els.quickPrice.textContent = `$${product.price.toFixed(2)}`;
    els.quickStock.textContent = product.stock > 0 ? `In stock (${product.stock} available)` : 'Out of stock';
    els.quickSource.textContent = `Source: ${state.mockMode ? 'Mock data' : 'API'}`;
    els.qtyValue.textContent = '1';

    els.quickBackdrop.classList.add('open');
    els.quickModal.classList.add('open');
  };

  // Hero Product
  const loadHeroProduct = async () => {
    try {
      const res = await fetch(`${API_BASE}/products?limit=1&sort=new`);
      if (!res.ok) throw new Error('Failed to fetch hero product');
      const data = await res.json();
      const product = data.data?.[0] || data[0]; // adjust based on actual response
      if (product) {
        els.heroCardImg.src = product.image || product.thumbnail || '/placeholder.svg';
        els.heroCardImg.alt = product.name;
        els.heroCardName.textContent = product.name;
        els.heroCardDesc.textContent = product.description || 'Discover the latest innovation';
        els.heroCardPrice.textContent = `$${product.price.toFixed(2)}`;
        // Add to cart button for hero product
        els.heroCardAdd.onclick = () => {
          addToCart(product, 1);
          showToast(`${product.name} added to cart`, 'success');
        };
      }
    } catch (err) {
      console.error('Hero product load error:', err);
      // Use mock data for hero
      loadMockHeroProduct();
    }
  };

  // Categories
  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/products?category=`); // This might not return categories; we need a separate endpoint
      // Since there's no explicit categories endpoint, we'll extract from products or use mock
      // For demo, we'll use a static set or infer from products
      // We'll call a function to extract unique categories from products after loading
    } catch (err) {
      console.warn('Could not load categories API, using mock');
    }
    // After products are loaded, we can update category buttons
    updateCategoryButtons();
  };

  const updateCategoryButtons = () => {
    // Extract unique categories from products
    const categories = [...new Set(state.products.map(p => p.category).filter(Boolean))];
    state.categories = ['', ...categories]; // empty string for "All"

    // Keep the "All" button, then add others
    els.categoryRow.innerHTML = ''; // clear existing
    state.categories.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'chip-btn';
      btn.dataset.category = category;
      btn.textContent = category === '' ? 'All' : category;
      if (category === state.filters.category) btn.classList.add('active');
      btn.addEventListener('click', () => {
        // Update active state
        els.categoryRow.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filters.category = category;
        state.currentPage = 1;
        loadProducts();
      });
      els.categoryRow.appendChild(btn);
    });
    // Ensure the All button is first
    // Already handled by inserting empty string first
  };

  // Marquee for logos/tags
  const loadMarqueeLogs = () => {
    const logos = [
      'GET /api/products',
      'GET /api/products/:id',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/orders',
      'GET /api/orders/my-orders',
      'JWT secured',
      'MongoDB · Express',
      'Node.js',
      'REST API'
    ];
    const track = els.marqueeTrack;
    track.innerHTML = '';
    logos.forEach(logo => {
      const span = document.createElement('div');
      span.className = 'marquee-item';
      span.textContent = logo;
      track.appendChild(span);
    });
    // Duplicate for seamless loop
    logos.forEach(logo => {
      const span = document.createElement('div');
      span.className = 'marquee-item';
      span.textContent = logo;
      track.appendChild(span);
    });
  };

  // Reviews marquee (testimonials)
  const loadReviewsMarquee = () => {
    const testimonials = [
      "The audio quality is insane! Worth every satoshi. - Alex, Berlin",
      "Finally, a wearable that actually looks futuristic. - Sam, Tokyo",
      "These limited drops are addictive. - Riley, SF",
      "The haptic feedback on these gloves is next-level. - Jordan, London",
      "Wore the jacket to the metaverse summit, got so many compliments. - Taylor, NYC",
      "Best purchase I've made all quarter. The battery lasts days. - Casey, LA",
      "The AR glasses actually work outside the demo environment. - Morgan, Seattle",
      "Streetwear that actually tech? Mind blown. - Jamie, Chicago"
    ];
    const track = els.reviewsTrack;
    track.innerHTML = '';
    testimonials.forEach(testi => {
      const div = document.createElement('div');
      div.className = 'marquee-item';
      div.textContent = testi;
      track.appendChild(div);
    });
    // Duplicate
    testimonials.forEach(testi => {
      const div = document.createElement('div');
      div.className = 'marquee-item';
      div.textContent = testi;
      track.appendChild(div);
    });
  };

  // API Status Polling
  const checkAPIStatus = () => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, { timeout: 3000 });
        if (res.ok) {
          els.apiDot.classList.add('online');
          els.apiDot.classList.remove('offline');
          els.apiBadgeText.textContent = 'API Live';
          els.apiBadge.title = 'Backend connection status: Online';
          // If we were in mock mode due to earlier failure, we could optionally reset
          // but we'll respect user's manual mock mode toggle
        } else {
          throw new Error('HTTP ' + res.status);
        }
      } catch (err) {
        els.apiDot.classList.add('offline');
        els.apiDot.classList.remove('online');
        els.apiBadgeText.textContent = 'API Offline';
        els.apiBadge.title = 'Backend connection status: Offline';
        // If not forced mock mode, we can switch to mock
        if (!localStorage.getItem(MOCK_MODE_KEY)) {
          state.mockMode = true;
          loadMockProducts();
          loadMockHeroProduct();
          showToast('API unreachable, switched to demo mode', 'warning');
        }
      }
    };
    check(); // immediate check
    setInterval(check, 10000); // every 10 seconds
  };

  // Mock Data Functions (for demo when API unavailable)
  const loadMockProducts = () => {
    // Generate mock products similar to what the API might return
    state.mockProducts = Array.from({length: 20}).map((_, i) => ({
      _id: `mock${i + 1}`,
      name: `Mock Product ${i + 1}`,
      category: ['Audio', 'Wearables', 'Streetwear', 'Lighting'][i % 4],
      price: Math.floor(Math.random() * 200) + 50,
      image: `https://picsum.photos/seed/product${i + 1}/400/300`,
      thumbnail: `https://picsum.photos/seed/product${i + 1}/200/150`,
      description: `This is a mock product description for item ${i + 1}. It demonstrates the UI without requiring a backend.`,
      shortDesc: `Mock product ${i + 1}`,
      stock: Math.floor(Math.random() * 100)
    }));
    state.products = state.mockProducts;
    if (els.statProducts) els.statProducts.textContent = state.products.length;
    updateCategoryButtons();
    renderProductGrid();
  };

  const loadMockHeroProduct = () => {
    if (state.mockProducts && state.mockProducts.length > 0) {
      const product = state.mockProducts[0];
      els.heroCardImg.src = product.image;
      els.heroCardImg.alt = product.name;
      els.heroCardName.textContent = product.name;
      els.heroCardDesc.textContent = product.description;
      els.heroCardPrice.textContent = `$${product.price.toFixed(2)}`;
      els.heroCardAdd.onclick = () => {
        addToCart(product, 1);
        showToast(`${product.name} added to cart`, 'success');
      };
    }
  };

  // Cursor Glow Effect
  const initCursorGlow = () => {
    if (!els.cursorGlow) return;
    document.addEventListener('mousemove', (e) => {
      els.cursorGlow.style.left = `${e.pageX}px`;
      els.cursorGlow.style.top = `${e.pageY}px`;
    });
    document.addEventListener('mouseenter', () => {
      els.cursorGlow.style.opacity = '0.5';
    });
    document.addEventListener('mouseleave', () => {
      els.cursorGlow.style.opacity = '0';
    });
  };

  // Toast System
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add progress bar
    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    toast.appendChild(progress);

    els.toastStack.appendChild(toast);

    // Remove after animation
    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('transitionend', () => {
        toast.remove();
      });
    }, 3000);

    // Progress bar animation
    setTimeout(() => {
      progress.style.transition = 'width 300ms linear';
      progress.style.width = '0%';
    }, 10);
  };

  // Debounce helper
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Update auth UI based on login state
  function updateAuthUI() {
    if (state.token && state.user) {
      els.authBtnLabel.textContent = 'Account';
      els.authBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor"
              d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
        </svg>
      `;
      // Optionally show user name or email
      // els.authBtn.title = `Signed in as ${state.user.name || state.user.email}`;
    } else {
      els.authBtnLabel.textContent = 'Sign In';
      els.authBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor"
              d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
        </svg>
      `;
    }
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose some functions for debugging if needed
  window.novara = {
    state,
    showToast,
    loadProducts,
    updateAuthUI: updateAuthUI
  };
})();