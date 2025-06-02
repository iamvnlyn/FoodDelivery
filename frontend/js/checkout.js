const API_BASE_URL = "https://fooddelivery-6q1l.onrender.com/api";

// Get references to your UI elements specific to checkout.html
const checkoutCartTableBody = document.getElementById("checkout-cart-items");
const checkoutTotalAmountSpan = document.getElementById("checkout-total-amount");
const checkoutMessageDiv = document.getElementById("checkout-message"); // For messages like "cart empty"

// --- Helper Functions for Rendering (Adapted from main.js) ---
// These functions use the 'checkout' specific element references

function renderCheckoutCartItem(itemName, quantity, itemPrice) {
    if (!checkoutCartTableBody) {
        console.warn("Checkout cart table body not found for rendering cart item.");
        return;
    }
    let newRow = checkoutCartTableBody.insertRow();
        newRow.innerHTML = `
        <td>${itemName}</td>
        <td>${quantity}</td>
        <td>${itemPrice.toFixed(2)}</td>
        <td>${(quantity * itemPrice).toFixed(2)}</td>
        <td>
        <button class="delete-item-btn" data-item-name="${encodeURIComponent(itemName)}">
            <ion-icon name="trash-outline"></ion-icon>
        </button>
    </td>
    `;
}

function updateCheckoutCartSummary() {
    if (!checkoutTotalAmountSpan) {
        console.warn("Checkout total amount element not found for updating.");
        return;
    }

    let totalItems = 0; // Not explicitly used for display on checkout.html, but good to calculate
    let totalAmount = 0;

    if (checkoutCartTableBody) {
        Array.from(checkoutCartTableBody.rows).forEach(row => {
            const qty = parseInt(row.cells[1].textContent);
            const price = parseFloat(row.cells[2].textContent); // Assuming price is in 3rd column (index 2)
            totalItems += qty;
            totalAmount += qty * price;
        });
    }

    checkoutTotalAmountSpan.textContent = totalAmount.toFixed(2);
}


async function deleteCartItem(itemName) {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to modify your cart.");
        window.location.href = "login.html"; // Redirect to login if no token
        return;
    }

    // Ask for user confirmation before deleting
    if (!confirm(`Are you sure you want to remove "${itemName}" from your cart?`)) {
        return; // User cancelled, so stop here
    }

    try {
        // API_BASE_URL is already defined at the top of your file
        const response = await fetch(`${API_BASE_URL}/cart/${encodeURIComponent(itemName)}`, {
            method: "DELETE", // This is the HTTP DELETE method
            headers: {
                "Authorization": `Bearer ${token}` // Send the authentication token
            }
        });

        const data = await response.json(); // Parse the JSON response from the server

        if (!response.ok) {
            // If the response status is not 2xx, throw an error
            throw new Error(data.message || `Failed to remove ${itemName} from cart.`);
        }

        alert(`"${itemName}" removed from cart successfully.`);
        // Re-fetch and re-render the cart to update the UI after deletion
        await fetchAndRenderCheckoutCartItems();

    } catch (error) {
        console.error("Error deleting item from cart:", error);
        alert(`Could not remove "${itemName}" from cart: ${error.message}`);
    }
}

// Function to clear cart UI if needed (e.g., logout, order placed)
window.clearCheckoutCartUI = function() {
    if (checkoutCartTableBody) checkoutCartTableBody.innerHTML = "";
    if (checkoutTotalAmountSpan) checkoutTotalAmountSpan.textContent = "0.00";
    if (checkoutMessageDiv) {
        checkoutMessageDiv.textContent = "";
        checkoutMessageDiv.className = "";
    }
};

// --- Main Function to Fetch and Render Cart Items ---
async function fetchAndRenderCheckoutCartItems() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.clearCheckoutCartUI(); // Clear UI
        if (checkoutMessageDiv) {
            checkoutMessageDiv.className = "error";
            checkoutMessageDiv.textContent = "Please log in to view your cart.";
        }
        // Optional: Redirect to login after a delay
        // setTimeout(() => { window.location.href = "login.html"; }, 2000);
        return;
    }

    if (!checkoutCartTableBody || !checkoutTotalAmountSpan) {
        console.error("Checkout UI elements not found. Cannot display cart.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle specific errors like 401/403 (Unauthorized/Forbidden)
            if (response.status === 401 || response.status === 403) {
                alert("Your session has expired or you are not authorized. Please log in again.");
                localStorage.removeItem("token"); // Clear invalid token
                window.location.href = "login.html";
                return;
            }
            throw new Error(data.message || "Failed to fetch cart items.");
        }

        // Clear existing rows before populating
        checkoutCartTableBody.innerHTML = "";

        if (data.length === 0) {
            if (checkoutMessageDiv) {
                checkoutMessageDiv.className = "success"; // Or info if it's not an error state
                checkoutMessageDiv.textContent = "Your cart is empty. Please add items from the main page.";
            }
            let emptyRow = checkoutCartTableBody.insertRow();
            emptyRow.innerHTML = `<td colspan="5" style="text-align: center;">Your cart is empty. Please add items from the main page.</td>`;

        } else {
            if (checkoutMessageDiv) checkoutMessageDiv.textContent = ""; // Clear any previous messages
            checkoutMessageDiv.className = "";
            data.forEach(item => {
                const numericPrice = parseFloat(item.price); // Ensure price is numeric
                renderCheckoutCartItem(item.name, item.quantity, isNaN(numericPrice) ? 0 : numericPrice);
            });
        }
        updateCheckoutCartSummary(); // Update total amount

         document.querySelectorAll('.delete-item-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const itemName = event.currentTarget.dataset.itemName;
            deleteCartItem(decodeURIComponent(itemName)); // Decode before passing to the function
        });
    });

    } catch (error) {
        console.error("Error fetching checkout cart items:", error);
        window.clearCheckoutCartUI(); // Clear UI on error
        if (checkoutMessageDiv) {
            checkoutMessageDiv.className = "error";
            checkoutMessageDiv.textContent = `Error loading cart: ${error.message}`;
        }
        let errorRow = checkoutCartTableBody.insertRow();
        errorRow.innerHTML = `<td colspan="5" style="text-align: center;">Error loading cart details.</td>`;
    }
}

window.handleCheckoutSubmission = async function() {
    console.log("Checkout form submitted!"); // Keep this log

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in to place an order.");
        window.location.href = "login.html";
        return;
    }

    const form = document.getElementById("checkoutForm");
    const formData = new FormData(form);
    const orderDetails = {};
    formData.forEach((value, key) => { orderDetails[key] = value; });

    // --- IMPORTANT CHANGE HERE ---
    // Adjust the filter and cells indexing to match your HTML table structure (5 cells)
    const cartItems = Array.from(checkoutCartTableBody.rows)
                            .filter(row => row.cells.length >= 4) // Ensure it's an item row, not the empty message. Can be >=4 or ===5
                            .map(row => {
                                const name = row.cells[0].textContent.trim();
                                const quantity = parseInt(row.cells[1].textContent);
                                // Price is in the 3rd cell (index 2)
                                const price = parseFloat(row.cells[2].textContent);
                                return { name, quantity, price };
                            });
    // --- END IMPORTANT CHANGE ---

    // NEW: Add a console log to see what cartItems are being submitted
    console.log("Cart items being submitted:", cartItems);

    if (cartItems.length === 0) {
        alert("Your cart is empty. Cannot place an order."); // This alert should ideally not be hit now if items are visible
        return;
    }
    orderDetails.items = cartItems; // Add the cart items to the order details

    try {
        // --- IMPORTANT CHANGE HERE: Make sure endpoint matches your backend route (e.g., /api/orders) ---
        const response = await fetch(`${API_BASE_URL}/orders`, { // Changed from /order to /orders, assuming this is correct
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(orderDetails)
        });

        const data = await response.json();
        // NEW: Add console logs for backend response
        console.log("Backend response status:", response.status);
        console.log("Backend response data:", data);

        if (!response.ok) {
            throw new Error(data.message || `Failed to place order: ${response.statusText}`);
        }

        // --- SUCCESS HANDLING START ---
        // Display success message
        checkoutMessageDiv.classList.remove("error"); // Ensure error class is removed
        checkoutMessageDiv.classList.add("success");
        checkoutMessageDiv.textContent = "Order placed successfully!";

        // Hide form and summary, show thank you message
        document.getElementById("checkoutForm").classList.add("hidden");
        document.getElementById("orderSummarySection").classList.add("hidden");
        document.getElementById("thankYouContainer").classList.remove("hidden");
        
        // Mark order as placed (if needed elsewhere)
        sessionStorage.setItem('orderPlaced', 'true');

        // Clear cart from frontend UI and sessionStorage
        sessionStorage.removeItem("currentCart"); // Remove cart data
        window.clearCheckoutCartUI?.(); // Clear displayed items

        // Redirect home button to index.html
        const goHomeButton = document.getElementById("goHomeButton");
        if (goHomeButton) {
            goHomeButton.onclick = () => {
                window.location.href = "index.html"; // Corrected to index.html
            };
        }
        // --- SUCCESS HANDLING END ---

    } catch (error) {
        console.error("Error placing order:", error);
        // Display the actual error message in the UI div
        if (checkoutMessageDiv) {
            checkoutMessageDiv.className = "error";
            checkoutMessageDiv.textContent = `Error placing order: ${error.message}`;
        }
        // Re-show form and summary in case of error
        document.getElementById("checkoutForm").classList.remove("hidden");
        document.getElementById("orderSummarySection").classList.remove("hidden");
        document.getElementById("thankYouContainer").classList.add("hidden");
        sessionStorage.removeItem('orderPlaced'); // Clear flag if error

    }
};

// --- Single DOMContentLoaded Listener ---
document.addEventListener("DOMContentLoaded", () => {
    const goHomeButton = document.getElementById("goHomeButton");
    if (goHomeButton) {
        goHomeButton.addEventListener("click", () => {
            window.location.href = "index.html"; // Ensure this is index.html
        });
    }

    // Call the main cart fetching function when the DOM is ready
    fetchAndRenderCheckoutCartItems();
});