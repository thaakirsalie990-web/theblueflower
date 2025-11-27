/**
 * VELORA Main Scripts
 * Handles Mobile Menu, Store Data, Filtering, Sorting, and Pagination.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Menu Logic ---
    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const navDrawer = document.getElementById('navDrawer');

    function toggleMenu() {
        if(navDrawer) navDrawer.classList.toggle('is-active');
    }

    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if (menuClose) menuClose.addEventListener('click', toggleMenu);


    // --- STORE ENGINE ---
    const productGrid = document.getElementById('productGrid');
    
    if (productGrid) {
        
        // --- State Variables ---
        let allProducts = [];       // Original data from JSON
        let filteredProducts = [];  // Data after search/filter/sort
        let currentPage = 1;
        const itemsPerPage = 6;     // Show 6 items per page (so you can see pagination working)
        let currentCategory = 'all';

        // --- DOM Elements ---
        const searchInput = document.querySelector('.widget-search input');
        const searchBtn = document.querySelector('.widget-search button');
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        const sortSelect = document.querySelector('.shop-toolbar__sort');
        const resultsCount = document.querySelector('.shop-toolbar__results p');
        const categoryLinks = document.querySelectorAll('.widget-categories a');
        const paginationContainer = document.querySelector('.pagination');

        // 1. Fetch Data
        fetch('assets/content.json')
            .then(response => response.json())
            .then(data => {
                allProducts = data.products;
                // Initial Run
                applyFilters(); 
            })
            .catch(error => console.error('Error loading products:', error));


        // 2. The Master Filter Function
        // This runs whenever a user interacts with ANY control.
        function applyFilters() {
            // Start with all products
            let temp = [...allProducts];

            // A. Search Filter
            if (searchInput && searchInput.value.trim() !== "") {
                const term = searchInput.value.toLowerCase();
                temp = temp.filter(p => 
                    p.name.toLowerCase().includes(term) || 
                    p.category.toLowerCase().includes(term)
                );
            }

            // B. Category Filter
            if (currentCategory !== 'all') {
                temp = temp.filter(p => p.category === currentCategory);
            }

            // C. Price Filter
            if (priceRange) {
                const maxPrice = parseFloat(priceRange.value);
                temp = temp.filter(p => p.price <= maxPrice);
            }

            // D. Sorting
            if (sortSelect) {
                const sortValue = sortSelect.value;
                if (sortValue === 'price') {
                    temp.sort((a, b) => a.price - b.price);
                } else if (sortValue === 'popularity' || sortValue === 'rating') {
                    temp.sort((a, b) => b.rating - a.rating);
                } else if (sortValue === 'latest') {
                    temp.sort((a, b) => b.id - a.id);
                }
            }

            // Save result and reset to page 1
            filteredProducts = temp;
            currentPage = 1;
            
            // Update UI
            updateDisplay();
        }


        // 3. Update Display (Slicing & Rendering)
        function updateDisplay() {
            // Calculate Pagination
            const totalItems = filteredProducts.length;
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedItems = filteredProducts.slice(startIndex, endIndex);

            // Update Count Text
            if(resultsCount) {
                if(totalItems === 0) {
                    resultsCount.textContent = "No results found.";
                } else {
                    const showEnd = Math.min(endIndex, totalItems);
                    resultsCount.textContent = `Showing ${startIndex + 1}–${showEnd} of ${totalItems} results`;
                }
            }

            // Render Products
            renderProducts(paginatedItems);
            
            // Render Pagination Buttons
            renderPagination(totalItems);
        }


        // 4. Render HTML for Products
        function renderProducts(products) {
            if (products.length === 0) {
                productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No products found matching your selection.</p>';
                return;
            }

            productGrid.innerHTML = products.map(product => {
                // Stars logic
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    starsHtml += i <= product.rating 
                        ? '<i class="fa-solid fa-star"></i>' 
                        : '<i class="fa-regular fa-star"></i>';
                }

                // Price logic
                let priceHtml = `$${product.price.toFixed(2)}`;
                if (product.sale && product.old_price) {
                    priceHtml = `<span class="price--old">$${product.old_price.toFixed(2)}</span> $${product.price.toFixed(2)}`;
                }

                // Hue logic
                const imgStyle = product.hue ? `style="filter: hue-rotate(${product.hue});"` : '';

                return `
                <div class="product-card">
                    <div class="product-card__image-wrapper">
                        ${product.sale ? '<span class="product-card__badge">Sale!</span>' : ''}
                        <img src="${product.image}" alt="${product.name}" class="product-card__img" ${imgStyle}>
                    </div>
                    <div class="product-card__info">
                        <h3 class="product-card__title">${product.name}</h3>
                        <span class="product-card__category">${product.category}</span>
                        <div class="product-card__price">${priceHtml}</div>
                        <div class="product-card__rating">${starsHtml}</div>
                    </div>
                </div>
                `;
            }).join('');
        }


        // 5. Render Pagination Buttons
        function renderPagination(totalItems) {
            if (!paginationContainer) return;
            
            paginationContainer.innerHTML = '';
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            // Hide pagination if only 1 page
            if (totalPages <= 1) return;

            // Helper to create button
            const createBtn = (text, pageNum, isActive = false) => {
                const a = document.createElement('a');
                a.href = "#";
                a.className = `pagination__link ${isActive ? 'pagination__link--active' : ''}`;
                a.innerHTML = text;
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    if(pageNum !== currentPage) {
                        currentPage = pageNum;
                        updateDisplay();
                        // Smooth scroll to top of grid
                        productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
                return a;
            };

            // Generate Numbers
            for (let i = 1; i <= totalPages; i++) {
                paginationContainer.appendChild(createBtn(i, i, i === currentPage));
            }

            // Next Arrow (if not on last page)
            if (currentPage < totalPages) {
                paginationContainer.appendChild(createBtn('<i class="fa-solid fa-arrow-right"></i>', currentPage + 1));
            }
        }


        // 6. Event Listeners Setup
        
        // Search
        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (searchBtn) searchBtn.addEventListener('click', (e) => { e.preventDefault(); applyFilters(); });

        // Price
        if (priceRange) {
            priceRange.addEventListener('input', function() {
                priceValue.textContent = '$' + this.value;
                applyFilters();
            });
        }

        // Sort
        if (sortSelect) sortSelect.addEventListener('change', applyFilters);

        // Categories
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove bold/active style from others (optional visual cue)
                categoryLinks.forEach(l => l.style.fontWeight = 'normal');
                e.target.style.fontWeight = 'bold';

                // Set category
                currentCategory = link.dataset.val;
                applyFilters();
            });
        });

    }
});