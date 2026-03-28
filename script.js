/* PATATA — Professional Luxury Interactions */

document.addEventListener('DOMContentLoaded', () => {

    // === 0. MUSIC TOGGLE ===
    const bgMusic = document.getElementById('bgMusic');
    const musicBtn = document.getElementById('musicToggle');
    let isMusicPlaying = false;

    if (musicBtn && bgMusic) {
        musicBtn.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play().then(() => {
                    musicBtn.classList.remove('muted');
                    musicBtn.style.color = "var(--text-gold)";
                    musicBtn.style.borderColor = "var(--text-gold)";
                }).catch(() => { });
            } else {
                bgMusic.pause();
                musicBtn.classList.add('muted');
                musicBtn.style.color = "";
                musicBtn.style.borderColor = "";
            }
        });

        // Sync initial state (if autoplay worked)
        bgMusic.addEventListener('play', () => {
            musicBtn.classList.remove('muted');
            musicBtn.style.color = "var(--text-gold)";
            musicBtn.style.borderColor = "var(--text-gold)";
        });
    }

    // === 1. SHOPPING CART LOGIC ===
    let cart = [];
    const cartSidebar = document.getElementById('cartSidebar');
    const cartBackdrop = document.getElementById('cartBackdrop');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotalValue');
    const cartCountEl = document.getElementById('cartCount');
    const cartTrigger = document.getElementById('cartTrigger');
    const cartClose = document.getElementById('cartClose');
    const checkoutBtn = document.getElementById('checkoutBtn');

    // Open/Close Cart
    function toggleCart(show) {
        if (show) {
            cartSidebar.classList.add('active');
            cartBackdrop.classList.add('active');
        } else {
            cartSidebar.classList.remove('active');
            cartBackdrop.classList.remove('active');
        }
    }

    if (cartTrigger) cartTrigger.addEventListener('click', () => toggleCart(true));
    if (cartClose) cartClose.addEventListener('click', () => toggleCart(false));
    if (cartBackdrop) cartBackdrop.addEventListener('click', () => toggleCart(false));

    // Add to Cart Buttons
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const name = btn.dataset.name;
            const price = parseInt(btn.dataset.price);

            addToCart(name, price);

            // Visual feedback
            const originalText = btn.innerText;
            btn.innerText = "Eklendi";
            btn.style.color = "var(--text-gold)";
            btn.style.borderColor = "var(--text-gold)";
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.color = "";
                btn.style.borderColor = "";
            }, 1000);
        });
    });

    function addToCart(name, price) {
        cart.push({ name, price });
        renderCart();
        // Sepet otomatik açılmıyor - sadece sepet butonuna basınca açılır
    }

    function removeFromCart(index) {
        cart.splice(index, 1);
        renderCart();
    }

    function renderCart() {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Sepetiniz boş.</div>';
        } else {
            cart.forEach((item, index) => {
                total += item.price;
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <span>₺${item.price}</span>
                    </div>
                    <button class="cart-item-remove" data-index="${index}">Kaldır</button>
                `;
                cartItemsContainer.appendChild(itemEl);
            });

            // Add remove event listeners
            document.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    removeFromCart(parseInt(e.target.dataset.index));
                });
            });
        }

        cartTotalEl.innerText = `₺${total}`;
        cartCountEl.innerText = cart.length;
    }

    // Checkout via PatataAPI
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (cart.length === 0) return;

            const customerName = document.getElementById('customerName')?.value || 'Misafir';
            const customerPhone = document.getElementById('customerPhone')?.value || '';

            // Build items with qty=1 each (cart stores individual adds)
            const itemMap = {};
            cart.forEach(item => {
                if (itemMap[item.name]) {
                    itemMap[item.name].qty++;
                } else {
                    itemMap[item.name] = { name: item.name, price: item.price, qty: 1 };
                }
            });
            const items = Object.values(itemMap);

            // Save via API
            let order = null;
            try {
                order = await PatataAPI.addOrder(items, { name: customerName, phone: customerPhone });
            } catch (e) {
                console.error("Order creation failed", e);
            }

            if (!order) {
                alert("Sipariş oluşturulurken bir hata oluştu.");
                return;
            }

            // Show confirmation
            showOrderConfirmation(order);

            // Reset cart
            cart = [];
            renderCart();
            toggleCart(false);
        });
    }

    function showOrderConfirmation(order) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9000;display:flex;align-items:center;justify-content:center;';
        overlay.innerHTML = `
            <div style="background:#121212;border:1px solid rgba(255,255,255,0.08);padding:3rem;max-width:450px;text-align:center;font-family:Inter,sans-serif;">
                <div style="color:#c5a059;font-size:2rem;margin-bottom:1rem;">✓</div>
                <h3 style="font-family:Cinzel,serif;color:#e2e2e2;margin-bottom:0.5rem;">Sipariş Alındı</h3>
                <p style="color:#888;margin-bottom:1.5rem;font-size:0.95rem;">Siparişiniz başarıyla oluşturuldu.</p>
                <div style="background:rgba(197,160,89,0.1);border:1px solid rgba(197,160,89,0.2);padding:1rem;margin-bottom:1.5rem;">
                    <span style="color:#888;font-size:0.8rem;">Sipariş No:</span><br>
                    <span style="color:#c5a059;font-family:Cinzel,serif;font-size:1.1rem;letter-spacing:0.1em;">${order.id}</span>
                </div>
                <p style="color:#888;font-size:0.85rem;">Toplam: <strong style="color:#c5a059;">₺${order.total}</strong></p>
                <button onclick="this.closest('div').parentElement.remove()" style="margin-top:2rem;background:transparent;border:1px solid rgba(255,255,255,0.08);color:#e2e2e2;padding:0.75rem 2rem;cursor:pointer;font-family:Inter,sans-serif;text-transform:uppercase;letter-spacing:0.1em;font-size:0.8rem;">Tamam</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    // === 2. Custom Cursor (Desktop) ===
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');

    if (cursorDot && cursorOutline && window.matchMedia('(pointer: fine)').matches) {
        let mouseX = 0, mouseY = 0;
        let outlineX = 0, outlineY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Dot follows instantly
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        });

        // Outline follows with lag/ease
        const animateCursor = () => {
            outlineX += (mouseX - outlineX) * 0.15;
            outlineY += (mouseY - outlineY) * 0.15;

            cursorOutline.style.left = `${outlineX}px`;
            cursorOutline.style.top = `${outlineY}px`;

            requestAnimationFrame(animateCursor);
        };
        animateCursor();

        // Hover effects
        const interactives = 'a, button, input, select';
        document.body.addEventListener('mouseover', (e) => {
            if (e.target.closest(interactives)) {
                cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
                cursorOutline.style.backgroundColor = 'rgba(197, 160, 89, 0.1)';
            }
        });
        document.body.addEventListener('mouseout', (e) => {
            if (e.target.closest(interactives)) {
                cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorOutline.style.backgroundColor = 'transparent';
            }
        });
    }

    // === 3. Navigation Scroll Effect ===
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // === 4. Mobile Navigation Toggle ===
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }

    // === 5. Scroll Animations (Fade Up & Reveal) ===
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up, .reveal-text').forEach(el => {
        // Hero items are handled by gate open event, skip them here if gate is present
        if (!el.closest('.hero')) {
            observer.observe(el);
        }
    });

    // === 6. Parallax Image Effect (Simple) ===
    const parallaxImages = document.querySelectorAll('.parallax-img');

    window.addEventListener('scroll', () => {
        parallaxImages.forEach(img => {
            const speed = 0.15;
            const rect = img.parentElement.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const yPos = (window.innerHeight - rect.top) * speed;
                img.style.transform = `translateY(${yPos - 50}px)`;
            }
        });
    });

    // === 7. Booking Form Submission ===
    const form = document.getElementById('bookingForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('.btn-submit');
            const originalText = btn.innerHTML;

            // Get values
            const name = document.getElementById('name').value;
            const date = document.getElementById('date').value;
            const person = document.getElementById('person').value;

            // API Call
            const res = await PatataAPI.addReservation({ name, date, person });

            if (res) {
                btn.innerHTML = '<span class="btn-text" style="color:var(--text-gold)">Talep Alındı</span>';
                btn.style.borderColor = 'var(--text-gold)';
                form.reset();
            } else {
                btn.innerHTML = '<span class="btn-text" style="color:red">Hata Oluştu</span>';
            }

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.borderColor = 'rgba(255,255,255,0.1)';
            }, 3000);
        });
    }
});
