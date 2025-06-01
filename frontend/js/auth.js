document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const loginMessageDiv = document.getElementById("login-message");
    const signupMessageDiv = document.getElementById("signup-message");
    const usernameDisplay = document.getElementById("username-display");

    // --- Login Functionality ---
    if (loginForm) {
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            loginMessageDiv.textContent = ''; // Clear previous messages

            try {
                const response = await fetch("http://localhost:5000/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    const errorMessage = data.message || "Login failed";
                    const suggestion = data.suggestion ? `. ${data.suggestion}` : "";
                    loginMessageDiv.style.color = "red";
                    loginMessageDiv.textContent = `${errorMessage}${suggestion}`;
                    return;
                }

                localStorage.setItem("token", data.token);
                localStorage.setItem("username", data.user.username);
                localStorage.setItem("userId", data.user.id); // Store user ID
                localStorage.setItem("email", data.user.email); // Store email

                loginMessageDiv.style.color = "green";
                loginMessageDiv.textContent = "Login successful! Redirecting...";
                window.location.href = "main.html"; // Redirect to main page

            } catch (error) {
                console.error("Login error:", error);
                loginMessageDiv.style.color = "red";
                loginMessageDiv.textContent = "An unexpected error occurred. Please try again.";
            }
        });
    }

    // --- Signup Functionality ---
    if (signupForm) {
        signupForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            const username = signupForm.username.value;
            const email = signupForm.email.value;
            const password = signupForm.password.value;

            signupMessageDiv.textContent = ''; // Clear previous messages

            try {
                const response = await fetch("http://localhost:5000/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    signupMessageDiv.style.color = "red";
                    signupMessageDiv.textContent = data.message || "Sign up failed.";
                    return;
                }

                signupMessageDiv.style.color = "green";
                signupMessageDiv.textContent = "Registration successful! You can now log in.";
                setTimeout(() => {
                    window.location.href = "login.html"; // Redirect to login page
                }, 2000); // Redirect after 2 seconds
            } catch (error) {
                console.error("Signup error:", error);
                signupMessageDiv.style.color = "red";
                signupMessageDiv.textContent = "An unexpected error occurred. Please try again.";
            }
        });
    }

    // --- User Profile Display and Logout ---
    function updateUsernameDisplay() {
        const username = localStorage.getItem("username");
        const userLink = document.querySelector(".sidebar-menus .user");
        const usernameSpan = document.getElementById("username-display");

        if (username && usernameSpan) {
            usernameSpan.textContent = username;
            if (userLink) {
                userLink.style.display = "flex"; // Show user link
                userLink.innerHTML = `<ion-icon name="person-outline"></ion-icon> ${username}`;
            }
        } else {
            if (userLink) {
                userLink.style.display = "none"; // Hide if not logged in
            }
            if (usernameSpan) {
                 usernameSpan.textContent = '';
            }
        }

        const logoutLink = document.querySelector(".sidebar-logout a");
        if (logoutLink) {
            logoutLink.style.display = username ? "block" : "none"; // Show logout if logged in
        }

        // Adjust sidebar links based on login status
        const cartLink = document.querySelector(".sidebar-menus .cart");
        if (cartLink) {
            cartLink.style.display = username ? "flex" : "none";
        }
    }

    // Run this function on page load to update UI
    updateUsernameDisplay();

    // Attach logout function to window for onclick in HTML
    window.logout = function() {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        localStorage.removeItem("email");
        clearCartUI(); // Clear cart display on logout
        updateUsernameDisplay(); // Update UI after logout
        window.location.href = "login.html"; // Redirect to login
    };

    // Global function to clear cart UI, used after logout/purchase
    window.clearCartUI = function() {
        const cartTableBody = document.querySelector("#cart-items tbody");
        const cartCountSpan = document.getElementById("cart-count");
        const cartTotalSpan = document.getElementById("cart-total");

        if (cartTableBody) cartTableBody.innerHTML = "";
        if (cartCountSpan) cartCountSpan.textContent = "0";
        if (cartTotalSpan) cartTotalSpan.textContent = "0.00";
    };

    // Load cart items on main.html if user is logged in
    if (window.location.pathname.includes("main.html") || window.location.pathname === '/') {
        const token = localStorage.getItem("token");
        if (token) {
            fetchCartItems();
        }
    }

    // Handle checkout page specific logic
    if (window.location.pathname.includes("checkout.html")) {
        loadCheckoutSummary();

        const checkoutForm = document.getElementById("checkoutForm");
        if (checkoutForm) {
            checkoutForm.addEventListener("submit", async function(event) {
                event.preventDefault();
                await window.handleCheckoutSubmission();
            });
        }
    }
});