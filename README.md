
🍕 Food Delivery Website
✨ Overview
This is a full-stack food delivery web application that allows users to browse food items, add them to a cart, place orders, and manage their user accounts. The platform provides a seamless ordering experience from Browse to checkout.

🚀 Features
User Authentication: Secure registration and login for customers.
Browse Menu: View a variety of food items with details (name, price).
Shopping Cart: Add, update, and remove items from the cart.
Order Placement: A streamlined checkout process for placing orders.
Order History: (If implemented) Users can view their past orders.
Responsive Design: (If applicable) User-friendly interface across various devices.


🛠️ Technologies Used
Frontend
HTML5: For structuring the web pages.
CSS3: For styling and design.
JavaScript (Vanilla JS): For interactive elements and fetching data from the backend.
Libraries: (Mention if you're using any specific ones like jQuery, Ion Icons - which you are using)
Ionicons: For icons.
jQuery: (If used for specific functionality, otherwise remove if not actively used beyond basic HTML structure).
Backend
Node.js: JavaScript runtime environment.
Express.js: Web application framework for Node.js.
PostgreSQL: Relational database management system.
Middleware: (e.g., jsonwebtoken for authentication, bcrypt for password hashing, cors for cross-origin requests).
Deployment
Frontend: Vercel
Backend: Render


💻 Getting Started
Follow these instructions to set up and run the project locally for development.

Prerequisites
Node.js (LTS version recommended)
PostgreSQL installed and running
Git (for cloning the repository)
Installation


Clone the repository:
Bash
git clone https://github.com/iamvnlyn/FoodDelivery
cd C:\Users\JOHN PAUL G. GALIT\OneDrive\Desktop\WS101 LAB4- Galit\Documents\WS101>



Backend Setup:

Navigate to the backend directory:
Bash

cd backend 
node src/server.js

Install backend dependencies:
Bash
npm install

Database Configuration:
Create a PostgreSQL database (fooddelivery_db).
Create a .env file in the backend root directory and add your database connection string and JWT secret:
DATABASE_URL="postgresql://food_delivery_postgres_db_user:69syivr6svY7rihqH6kBZuxLuhYoAk8i@dpg-d0ueniadbo4c73b00n3g-a.ohio-postgres.render.com/food_delivery_postgres_db"
PORT=5000

Frontend Setup:

Navigate to the frontend directory (frontend/index.html)


Simply open your index.html file in your web browser. You can often just double-click it.


💡 Usage
Register/Login: Create a new account or log in with existing credentials.
Browse Food: Explore the available food items on the main page.
Add to Cart: Click on food items to add them to your shopping cart.
View Cart: Open the cart popup to review your selected items.
Checkout: Proceed to the checkout page, fill in delivery details, and place your order.
Manage Cart: Remove items from your cart on the checkout page.


🌐 Deployment
The application is deployed live:

Frontend (Vercel): https://food-delivery-red-ten.vercel.app/index.html
Backend (Render): https://dashboard.render.com/