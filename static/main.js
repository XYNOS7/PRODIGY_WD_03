// Showing Menu
const showMenu = (toggleId, navId) => {
    const toggle = document.getElementById(toggleId);
    const nav = document.getElementById(navId);
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            nav.classList.toggle('show');
        })
    }
}
showMenu('nav-toggle', 'nav-menu');

//Removing Menu by clicking links
const navLink = document.querySelectorAll('.nav-link');
const navMenu = document.getElementById('nav-menu');
function linkAction() {
    if (navMenu) {
        navMenu.classList.remove('show');
    }
}
navLink.forEach(n => n.addEventListener('click', linkAction));

//Changing Active Link by scrolling
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', scrollActive);
function scrollActive() {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 50;
        const sectionId = current.getAttribute('id');
        const navLink = document.querySelector('.nav-menu a[href*=' + sectionId + ']');
        if (navLink) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink.classList.add('active');
            } else {
                navLink.classList.remove('active');
            }
        }
    })
}

//Changing Color Header
window.onscroll = () => {
    const nav = document.getElementById('header');
    if (nav) {
        if (this.scrollY >= 200) nav.classList.add('scroll-header'); else nav.classList.remove('scroll-header');
    }
}

// --- NEW CODE FOR CART COUNTER AND LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    // Cart DOM elements
    const cartOverlay = document.getElementById('cart-overlay');
    const cartCloseBtn = document.getElementById('cart-close');
    const cartIcon = document.querySelector('.nav-shop');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total-price');
    const cartCounter = document.getElementById('cart-counter');
    const placeOrderBtn = document.getElementById('place-order-btn');

    // Function to update the cart counter
    async function updateCartCount() {
        if (!cartCounter) return;
        try {
            const response = await fetch('http://127.0.0.1:5000/get_cart');
            const cartItems = await response.json();
            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            cartCounter.textContent = totalItems > 0 ? totalItems : 0;
        } catch (error) {
            console.error('Error updating cart count:', error);
            cartCounter.textContent = '0';
        }
    }

    // Call updateCartCount on page load to set initial value
    updateCartCount();

    // Function to open the cart panel
    function openCart() {
        if (cartOverlay) {
            cartOverlay.classList.add('show-cart');
            fetchCartItems();
        }
    }

    // Function to close the cart panel
    function closeCart() {
        if (cartOverlay) {
            cartOverlay.classList.remove('show-cart');
        }
    }

    // Event listeners for the cart icon and close button
    if (cartIcon) {
        cartIcon.addEventListener('click', openCart);
    }
    if (cartCloseBtn) {
        cartCloseBtn.addEventListener('click', closeCart);
    }

    // Function to fetch cart items from the backend
    async function fetchCartItems() {
        if (!cartItemsContainer || !cartTotalSpan) return;
        try {
            const response = await fetch('http://127.0.0.1:5000/get_cart');
            if (!response.ok) {
                throw new Error('Failed to fetch cart items.');
            }
            const cartItems = await response.json();
            displayCartItems(cartItems);
        } catch (error) {
            console.error('Error fetching cart:', error);
            cartItemsContainer.innerHTML = '<p class="cart-empty-message">Failed to load cart. Please try again.</p>';
            cartTotalSpan.textContent = '$0.00';
        }
    }

    // Function to display cart items dynamically
    function displayCartItems(items) {
        if (!cartItemsContainer || !cartTotalSpan) return;
        if (items.length === 0) {
            cartItemsContainer.innerHTML = '<p class="cart-empty-message">Your cart is empty.</p>';
            cartTotalSpan.textContent = '$0.00';
            return;
        }
        let total = 0;
        cartItemsContainer.innerHTML = ''; // Clear existing items
        items.forEach(item => {
            const itemPrice = item.price * item.quantity;
            total += itemPrice;
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            let productImageUrl = 'https://i.postimg.cc/k4Zj2mXv/featured3.png';
            cartItemDiv.innerHTML = `
                <img src="${productImageUrl}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <span>$${item.price.toFixed(2)}</span>
                </div>
                <div class="cart-item-actions">
                    <button>+</button>
                    <span>${item.quantity}</span>
                    <button>-</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });
        cartTotalSpan.textContent = `$${total.toFixed(2)}`;
    }

    // Get all "Add to Cart" buttons on the page, using both class selectors
    const addToCartButtons = document.querySelectorAll('.button-light, .new-sneaker .button');

    if (addToCartButtons && addToCartButtons.length > 0) {
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const productId = event.currentTarget.getAttribute('data-product-id');
                if (!productId) {
                    console.error('Product ID not found on this button.');
                    return;
                }
                fetch('http://127.0.0.1:5000/add_to_cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        product_id: parseInt(productId),
                        quantity: 1
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log(data.message);
                    alert(data.message);
                    updateCartCount();
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to add item to cart. Please check your backend connection.');
                });
            });
        });
    }

    document.querySelectorAll('.truck-button').forEach(button => {
    button.addEventListener('click', e => {

        e.preventDefault();
        
        let box = button.querySelector('.box'),
            truck = button.querySelector('.truck');
        
        if(!button.classList.contains('done')) {
            
            if(!button.classList.contains('animation')) {

                button.classList.add('animation');

                gsap.to(button, {
                    '--box-s': 1,
                    '--box-o': 1,
                    duration: .3,
                    delay: .5
                });

                gsap.to(box, {
                    x: 0,
                    duration: .4,
                    delay: .7
                });

                gsap.to(button, {
                    '--hx': -5,
                    '--bx': 50,
                    duration: .18,
                    delay: .92
                });

                gsap.to(box, {
                    y: 0,
                    duration: .1,
                    delay: 1.15
                });

                gsap.set(button, {
                    '--truck-y': 0,
                    '--truck-y-n': -26
                });

                gsap.to(button, {
                    '--truck-y': 1,
                    '--truck-y-n': -25,
                    duration: .2,
                    delay: 1.25,
                    onComplete() {
                        gsap.timeline({
                            onComplete() {
                                button.classList.add('done');
                            }
                        }).to(truck, {
                            x: 0,
                            duration: .4
                        }).to(truck, {
                            x: 40,
                            duration: 1
                        }).to(truck, {
                            x: 20,
                            duration: .6
                        }).to(truck, {
                            x: 96,
                            duration: .4
                        });
                        gsap.to(button, {
                            '--progress': 1,
                            duration: 2.4,
                            ease: "power2.in"
                        });
                    }
                });
                
            }
            
        } else {
            button.classList.remove('animation', 'done');
            gsap.set(truck, {
                x: 4
            });
            gsap.set(button, {
                '--progress': 0,
                '--hx': 0,
                '--bx': 0,
                '--box-s': .5,
                '--box-o': 0,
                '--truck-y': 0,
                '--truck-y-n': -26
            });
            gsap.set(box, {
                x: -24,
                y: -6
            });
        }

    });
});

});
