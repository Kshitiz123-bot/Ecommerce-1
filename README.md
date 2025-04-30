# E-commerce Project

This is an e-commerce platform built with Django and React.

## Features
- User authentication and authorization
- Product catalog
- Shopping cart functionality
- Order management
- Admin dashboard

## Tech Stack
- Backend: Django
- Frontend: React
- Database: SQLite (Development)

## Setup Instructions

### Backend Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

4. Start the development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Install Node.js dependencies:
   ```bash
   cd client
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## Project Structure
- `Ecommerce/` - Django project settings
- `Product/` - Product management app
- `cart/` - Shopping cart functionality
- `order/` - Order management
- `client/` - React frontend

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
