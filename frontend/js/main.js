
let cartPopup;
let cartCountSpan;
let cartTotalSpan;
let cartTableBody;
let allMenuItems = [];
let currentCategoryFilter = 'all';
let currentSearchTerm = '';

// API constants (retained as cart/checkout/chat still use API)
const OWNER_USER_ID = 1; 
const API_BASE_URL = 'https://fooddelivery-6q1l.onrender.com';



// Function to populate allMenuItems from the HTML structure
function populateMenuItemsFromHTML() {
    const menuContainer = document.getElementById("main-menu-container");
    if (!menuContainer) {
        console.warn("Menu container (main-menu-container) not found. Cannot populate menu items.");
        return;
    }

    // Get all elements with class 'menu-item' within the main menu container
    const rawMenuItems = menuContainer.querySelectorAll(".menu-item");

    allMenuItems = Array.from(rawMenuItems).map(itemDiv => {
        const name = itemDiv.getAttribute('data-name');
        const category = itemDiv.getAttribute('data-category');
        const priceText = itemDiv.querySelector('.price')?.innerText;
        const price = priceText ? parseFloat(priceText.replace('$', '')) : 0;
        const description = itemDiv.querySelector('.detail-sub')?.innerText || '';
        const imageUrl = itemDiv.querySelector('.detail-img')?.src || '';

        return {
            name: name,
            category: category,
            price: price,
            description: description,
            imageUrl: imageUrl
        };
    });

    console.log("Populated allMenuItems from HTML:", allMenuItems);
}

// Renders a single menu item into the DOM
function renderMenuItem(item) {
    const menuContainer = document.getElementById("main-menu-container");
    if (!menuContainer) {
        console.warn("Menu container (main-menu-container) not found for rendering.");
        return;
    }

    const menuItemDiv = document.createElement("div");
    menuItemDiv.classList.add("detail-card", "menu-item"); // Add both classes
    menuItemDiv.setAttribute("data-name", item.name);
    menuItemDiv.setAttribute("data-category", item.category || 'Uncategorized');

    menuItemDiv.innerHTML = `
        <img class="detail-img" src="${item.imageUrl || 'https://via.placeholder.com/150'}" alt="${item.name}">
        <div class="detail-desc">
            <div class="detail-name">
                <h4>${item.name}</h4>
                <p class="detail-sub">${item.description || 'No description available.'}</p>
                <p class="price">$${parseFloat(item.price).toFixed(2)}</p>
                <button class="add-to-cart-btn" onclick="addToCart('${item.name}', ${parseFloat(item.price).toFixed(2)})">Add to Cart</button>
            </div>
        </div>
    `;
    menuContainer.appendChild(menuItemDiv);
}

// Filters and displays menu items based on current category and search term
function displayMenuItems() {
    const menuContainer = document.getElementById("main-menu-container");
    if (!menuContainer) {
        console.warn("Menu container (main-menu-container) not found for rendering in displayMenuItems.");
        return;
    }

    console.log("--- displayMenuItems Called ---");
    console.log("Total items available (allMenuItems.length):", allMenuItems.length);
    console.log("Current Category Filter:", currentCategoryFilter);
    console.log("Current Search Term:", currentSearchTerm);

    menuContainer.innerHTML = ''; // Clear existing items before rendering filtered ones

    const filteredAndSearchedItems = allMenuItems.filter(item => {
        // Ensure item.category and item.name exist and are strings for toLowerCase
        const itemCategory = item.category ? String(item.category).toLowerCase() : '';
        const itemName = item.name ? String(item.name).toLowerCase() : '';
        const searchTermLower = currentSearchTerm.toLowerCase();

        const matchesCategory = (currentCategoryFilter === 'all' || itemCategory === currentCategoryFilter.toLowerCase());
        const matchesSearch = (itemName.includes(searchTermLower) || itemCategory.includes(searchTermLower));

        return matchesCategory && matchesSearch;
    });

    console.log("Filtered and searched items count:", filteredAndSearchedItems.length);

    if (filteredAndSearchedItems.length === 0) {
        menuContainer.innerHTML = '<p>No items found matching your criteria.</p>';
    } else {
        filteredAndSearchedItems.forEach(item => renderMenuItem(item));
    }
}


// --- Global Cart Functions ---

window.toggleCartPopup = function () {
    cartPopup?.classList.toggle("active");
};

window.closeCart = function () {
    cartPopup?.classList.remove("active");
};

window.addToCart = async function(itemName, itemPrice) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in to add items to your cart.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                itemName: itemName,
                quantity: 1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to add item to cart.");
        }

        await fetchCartItems();
        showCartPopup();
        alert(`${itemName} added to cart!`);

    } catch (error) {
        console.error("Error adding to cart:", error);
        alert(`Could not add ${itemName} to cart: ${error.message}`);
    }
};

function renderCartItem(itemName, quantity, itemPrice) {
    if (!cartTableBody) {
        console.warn("Cart table body not found for rendering cart item.");
        return;
    }

    let existingRow = Array.from(cartTableBody.rows).find(row =>
        row.cells[0].textContent === itemName
    );

    if (existingRow) {
        let qtyCell = existingRow.cells[1];
        qtyCell.textContent = quantity;
        existingRow.cells[3].textContent = (quantity * itemPrice).toFixed(2);
    } else {
        let newRow = cartTableBody.insertRow();
        newRow.innerHTML = `
            <td>${itemName}</td>
            <td>${quantity}</td>
            <td>${itemPrice.toFixed(2)}</td>
            <td>${(quantity * itemPrice).toFixed(2)}</td>
        `;
    }
}

function updateCartSummary() {
    if (!cartCountSpan || !cartTotalSpan) {
        console.warn("Cart summary elements not found for updating.");
        return;
    }

    let totalItems = 0;
    let totalAmount = 0;

    if (cartTableBody) {
        Array.from(cartTableBody.rows).forEach(row => {
            const qty = parseInt(row.cells[1].textContent);
            const price = parseFloat(row.cells[2].textContent);
            totalItems += qty;
            totalAmount += qty * price;
        });
    }

    cartCountSpan.textContent = totalItems;
    cartTotalSpan.textContent = totalAmount.toFixed(2);
}

async function fetchCartItems() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.clearCartUI?.(); // Assuming clearCartUI is defined elsewhere or will be added
        return;
    }

    if (!cartTableBody || !cartCountSpan || !cartTotalSpan) {
        console.warn("Cart UI elements (table body, count, total) not found. Skipping cart display.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert("Your session has expired or you are not authorized. Please log in again.");
                window.location.href = "login.html";
                return;
            }
            throw new Error(data.message || "Failed to fetch cart items.");
        }

        cartTableBody.innerHTML = "";
        data.forEach(item => {
            const numericPrice = parseFloat(item.price);
            if (isNaN(numericPrice)) {
                console.warn(`Invalid price received for item ${item.name}: "${item.price}". Using 0.`);
                renderCartItem(item.name, item.quantity, 0);
            } else {
                renderCartItem(item.name, item.quantity, numericPrice);
            }
        });
        updateCartSummary();

    } catch (error) {
        console.error("Error fetching cart items:", error);
        alert(`Error loading cart: ${error.message}`);
        window.clearCartUI?.(); // Assuming clearCartUI is defined elsewhere or will be added
    }
}

function getCartItemsFromUI() {
    if (!cartTableBody) {
        return [];
    }
    return Array.from(cartTableBody.rows).map(row => {
        const name = row.cells[0].textContent.trim();
        const quantity = parseInt(row.cells[1].textContent);
        const price = parseFloat(row.cells[2].textContent);
        return { name, quantity, price };
    });
}

function showCartPopup() {
    const popup = document.getElementById("cart-popup");
    if (popup) {
        popup.classList.add("active");
    }
}


// --- Checkout page specific functions ---

async function loadCheckoutSummary() {
    const checkoutCartItemsTable = document.getElementById("checkout-cart-items");
    const checkoutTotalAmountSpan = document.getElementById("checkout-total-amount");

    const storedCart = sessionStorage.getItem("currentCart");
    if (!storedCart) {
        alert("Your cart is empty. Please add items from the main page.");
        window.location.href = "main.html";
        return;
    }

    const cartItems = JSON.parse(storedCart);
    let totalAmount = 0;
    if (checkoutCartItemsTable) { // Added null check
        checkoutCartItemsTable.innerHTML = "";
        cartItems.forEach(item => {
            const itemPrice = parseFloat(item.price);
            const row = checkoutCartItemsTable.insertRow();
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${itemPrice.toFixed(2)}</td>
                <td>$${(item.quantity * itemPrice).toFixed(2)}</td>
            `;
            totalAmount += item.quantity * itemPrice;
        });
    }
    if (checkoutTotalAmountSpan) { // Added null check
        checkoutTotalAmountSpan.textContent = totalAmount.toFixed(2);
    }

    const thankYouContainer = document.getElementById("thankYouContainer");
    const checkoutForm = document.getElementById("checkoutForm");
    const orderSummary = document.getElementById("orderSummarySection");

    if (sessionStorage.getItem('orderPlaced') === 'true') {
        checkoutForm?.classList.add('hidden');
        orderSummary?.classList.add('hidden');
        thankYouContainer?.classList.remove('hidden');
        sessionStorage.removeItem('orderPlaced');
    }
}


window.handleCheckoutSubmission = async function() {
    const checkoutMessageDiv = document.getElementById("checkout-message");
    const checkoutForm = document.getElementById("checkoutForm");
    const thankYouContainer = document.getElementById("thankYouContainer");
    const orderSummarySection = document.getElementById("orderSummarySection");

    if (!checkoutMessageDiv || !checkoutForm || !thankYouContainer || !orderSummarySection) {
        console.error("One or more required checkout page elements not found.");
        return;
    }

    checkoutMessageDiv.textContent = "";
    checkoutMessageDiv.classList.remove("error", "success");

    const firstName = document.getElementById("firstName")?.value.trim();
    const middleName = document.getElementById("middleName")?.value.trim();
    const lastName = document.getElementById("lastName")?.value.trim();
    const street = document.getElementById("street")?.value.trim();
    const barangay = document.getElementById("barangay")?.value.trim();
    const houseNumber = document.getElementById("houseNumber")?.value.trim();
    const city = document.getElementById("city")?.value.trim();
    const paymentMethod = document.getElementById("paymentMethod")?.value;

    if (!firstName || !lastName || !street || !barangay || !city || !paymentMethod) {
        checkoutMessageDiv.classList.add("error");
        checkoutMessageDiv.textContent = "Please fill in all required delivery and payment details.";
        return;
    }

    const token = localStorage.getItem("token");
    const storedCart = sessionStorage.getItem("currentCart");

    if (!token) {
        checkoutMessageDiv.classList.add("error");
        checkoutMessageDiv.textContent = "You must be logged in to place an order.";
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }
    if (!storedCart) {
        checkoutMessageDiv.classList.add("error");
        checkoutMessageDiv.textContent = "Your cart is empty. Please add items to order.";
        return;
    }

    const cartItems = JSON.parse(storedCart);

    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                items: cartItems,
                firstName: firstName,
                middleName: middleName,
                lastName: lastName,
                street: street,
                barangay: barangay,
                houseNumber: houseNumber,
                city: city,
                paymentMethod: paymentMethod
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to place order.");
        }

        checkoutMessageDiv.classList.add("success");
        checkoutMessageDiv.textContent = "Order placed successfully!";

        checkoutForm.classList.add("hidden");
        orderSummarySection.classList.add("hidden");
        thankYouContainer.classList.remove("hidden");
        sessionStorage.setItem('orderPlaced', 'true');

        sessionStorage.removeItem("currentCart");
        window.clearCartUI?.(); // Assuming clearCartUI is defined elsewhere or will be added

        const goHomeButton = document.getElementById("goHomeButton");
        if (goHomeButton) {
            goHomeButton.onclick = () => {
                window.location.href = "main.html";
            };
        }

    } catch (error) {
        console.error("Order placement error:", error);
        checkoutMessageDiv.classList.add("error");
        checkoutMessageDiv.textContent = `Error placing order: ${error.message}`;

        checkoutForm.classList.remove("hidden");
        orderSummarySection.classList.remove("hidden");
        thankYouContainer.classList.add("hidden");
        sessionStorage.removeItem('orderPlaced');
    }
};

// --- New: Chat Functions ---

// Function to render a single chat message
function renderChatMessage(message, currentUserId) {
    const chatMessagesContainer = document.getElementById("chatMessages");
    if (!chatMessagesContainer) { return; }

    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    // Determine if the message was sent by the current user or received from the owner
    if (message.sender_id === currentUserId) {
        messageDiv.classList.add("sent");
    } else {
        messageDiv.classList.add("received");
    }

    const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.innerHTML = `
        <p>${message.message_text}</p>
        <span class="message-timestamp">${timestamp}</span>
    `;
    chatMessagesContainer.appendChild(messageDiv);
    // Scroll to the bottom of the chat
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

// Function to fetch chat history
window.loadChatHistory = async function() {
    const token = localStorage.getItem("token");
    const chatMessagesContainer = document.getElementById("chatMessages");
    const chatStatusMessage = document.getElementById("chat-status-message");

    if (!token) {
        chatStatusMessage.textContent = "Please log in to chat.";
        chatStatusMessage.classList.add("active");
        chatMessagesContainer.innerHTML = ''; // Clear loading message
        return;
    }

    if (!chatMessagesContainer || !chatStatusMessage) {
        console.error("Chat UI elements not found.");
        return;
    }

    chatMessagesContainer.innerHTML = '<p style="text-align: center; color: #888;">Loading chat history...</p>';
    chatStatusMessage.classList.remove("active"); // Hide any previous status

    try {
        // Fetch current user's ID from backend (if not already in token)
        const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!userResponse.ok) {
            throw new Error("Failed to get user info.");
        }
        const userData = await userResponse.json();
        const currentUserId = userData.id;

        // Fetch chat history between current user and owner
        const response = await fetch(`<span class="math-inline">\{API\_BASE\_URL\}/api/chat/</span>{OWNER_USER_ID}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Failed to load chat history.");
        }

        const messages = await response.json();

        chatMessagesContainer.innerHTML = ''; // Clear loading message
        if (messages.length === 0) {
            chatMessagesContainer.innerHTML = '<p style="text-align: center; color: #888;">No messages yet. Start a conversation!</p>';
        } else {
            messages.forEach(msg => renderChatMessage(msg, currentUserId));
        }
    } catch (error) {
        console.error("Error loading chat history:", error);
        chatMessagesContainer.innerHTML = '';
        chatStatusMessage.textContent = `Error: ${error.message}`;
        chatStatusMessage.classList.add("active");
    }
};

// Function to send a message
window.sendMessage = async function() {
    const token = localStorage.getItem("token");
    const messageInput = document.getElementById("messageInput");
    const chatStatusMessage = document.getElementById("chat-status-message");

    if (!token) {
        chatStatusMessage.textContent = "Please log in to send messages.";
        chatStatusMessage.classList.add("active");
        return;
    }
    if (!messageInput || !chatStatusMessage) {
        console.error("Chat input elements not found.");
        return;
    }

    const messageText = messageInput.value.trim();
    if (messageText === "") {
        chatStatusMessage.textContent = "Message cannot be empty.";
        chatStatusMessage.classList.add("active");
        return;
    }

    chatStatusMessage.classList.remove("active"); // Hide status message

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                receiverId: OWNER_USER_ID, // Always send to the owner
                messageText: messageText
            })
        });

        if (!response.ok) {
            throw new Error("Failed to send message.");
        }

        messageInput.value = ""; // Clear input field
        await window.loadChatHistory(); // Reload history to show new message
    } catch (error) {
        console.error("Error sending message:", error);
        chatStatusMessage.textContent = `Error: ${error.message}`;
        chatStatusMessage.classList.add("active");
    }
};


// --- DOMContentLoaded Event Listener ---
document.addEventListener("DOMContentLoaded", function () {
    // Initialize DOM elements if they exist on the current page
    cartPopup = document.getElementById("cart-popup");
    cartCountSpan = document.getElementById("cart-count");
    cartTotalSpan = document.getElementById("cart-total");
    cartTableBody = document.querySelector("#cart-items tbody");

    // Only try to fetch cart items if we are on a page that has cart elements (like main.html)
    if (cartPopup && cartCountSpan && cartTableBody) {
        const token = localStorage.getItem("token");
        if (token) {
            fetchCartItems(); // Keep this call if cart uses API
        }
    }

    // Event listener for checkout button on main.html cart popup
    const checkoutButton = document.getElementById("checkout-button");
    if (checkoutButton) {
        checkoutButton.addEventListener("click", function() {
            const cartItems = getCartItemsFromUI();
            if (cartItems.length === 0) {
                alert("Your cart is empty. Please add items before checking out.");
                return;
            }
            if (!localStorage.getItem("token")) {
                alert("Please log in to proceed to checkout.");
                window.location.href = "login.html";
                return;
            }
            sessionStorage.setItem("currentCart", JSON.stringify(cartItems));
            window.location.href = "checkout.html";
        });
    }

    // MOBILE MENU TOGGLE
    const mobileToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    mobileToggle?.addEventListener("click", function () {
        mobileToggle.classList.toggle("is-active");
        sidebar.classList.toggle("active");
    });

    sidebar?.addEventListener("click", function () {
        if (window.innerWidth <= 768 && mobileToggle.classList.contains("is-active")) {
            mobileToggle.classList.remove("is-active");
            sidebar.classList.remove("active");
        }
    });

    // SCROLLING BUTTONS FOR HIGHLIGHT AND FILTERS
    const step = 100;
    const stepFilter = 60;

    document.querySelector(".back")?.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelector(".highlight-wrapper").scrollLeft -= step;
    });

    document.querySelector(".next")?.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelector(".highlight-wrapper").scrollLeft += step;
    });

    document.querySelector(".back-menus")?.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelector(".filter-wrapper").scrollLeft -= stepFilter;
    });

    document.querySelector(".next-menus")?.addEventListener("click", function (e) {
        e.preventDefault();
        document.querySelector(".filter-wrapper").scrollLeft += stepFilter;
    });

    // IMPORTANT: Populate allMenuItems from HTML first for Option 2
    populateMenuItemsFromHTML();
    // Then display them initially
    displayMenuItems();

    // Event listeners for category filter cards (filter-btn class)
    const filterButtons = document.querySelectorAll(".filter-btn");

    filterButtons.forEach(button => {
        button.addEventListener("click", function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentCategoryFilter = this.getAttribute('data-category');
            displayMenuItems(); // Re-display items after category filter changes
        });
    });

    // Search Functionality
    const searchInput = document.getElementById("menu-search");
    searchInput?.addEventListener("input", function () {
        currentSearchTerm = this.value.trim();
        displayMenuItems(); // Re-display items after search term changes
    });

    searchInput?.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            currentSearchTerm = this.value.trim();
            displayMenuItems();
            event.preventDefault();
        }
    });

    // --- New: Handle "Contact Us" navigation (if on main.html) ---
    const contactUsLink = document.querySelector('.sidebar-menus a[href="#contact"]');
    if (contactUsLink) {
        contactUsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'contact.html';
        });
    }

    // Event listener for "Place Order" button on checkout.html
    const placeOrderButton = document.getElementById("placeOrderButton");
    if (placeOrderButton) {
        placeOrderButton.addEventListener("click", window.handleCheckoutSubmission);
    }

    // Call loadCheckoutSummary if on checkout.html (checks for an element unique to checkout.html)
    if (document.getElementById("checkoutForm")) {
        loadCheckoutSummary();
    }

    // Event listener for chat message submission (if on chat.html or similar)
    const sendMessageButton = document.getElementById("sendMessageButton");
    const messageInput = document.getElementById("messageInput");

    if (sendMessageButton && messageInput) {
        sendMessageButton.addEventListener("click", window.sendMessage);
        messageInput.addEventListener("keydown", function(event) {
            if (event.key === "Enter") {
                window.sendMessage();
                event.preventDefault(); // Prevent new line in input field
            }
        });
        window.loadChatHistory(); // Load chat history when chat elements are present
    }

}); // End of DOMContentLoaded

// Global helper for clearing cart UI (useful if user logs out or cart is cleared)
window.clearCartUI = function() {
    if (cartTableBody) {
        cartTableBody.innerHTML = '';
    }
    if (cartCountSpan) {
        cartCountSpan.textContent = '0';
    }
    if (cartTotalSpan) {
        cartTotalSpan.textContent = '0.00';
    }
};