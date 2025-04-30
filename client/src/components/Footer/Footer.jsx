import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Footer = () => {
return (
<footer className="footer">
<div className="footer-container">
<div className="footer-section">
<h3>SK Electronics</h3>
<p>Your one-stop shop for all electronic needs. Quality products at affordable prices.</p>
<div className="social-icons">
<a href="https://www.facebook.com/skelectronic/" className="social-icon"><i className="fab fa-facebook-f"></i></a>
<a href="https://twitter.com/YourProfile" className="social-icon"><i className="fab fa-twitter"></i></a>
<a href="https://www.instagram.com/YourProfile" className="social-icon"><i className="fab fa-instagram"></i></a>
<a href="https://www.linkedin.com/in/YourProfile" className="social-icon"><i className="fab fa-linkedin-in"></i></a>
</div>
</div>

<div className="footer-section">
<h3>Quick Links</h3>
<ul className="footer-links">
<li><Link to="/">Home</Link></li>
<li><Link to="/products">Products</Link></li>
<li><Link to="/cart">Cart</Link></li>
<li><Link to="/profile">Profile</Link></li>
<li><Link to="/oldOrders">Orders</Link></li>
</ul>
</div>

<div className="footer-section">
<h3>Contact Us</h3>
<p><i className="fas fa-map-marker-alt"></i> Ason Chowk, Kathamandu </p>
<p><i className="fas fa-phone"></i> +977 9841329068</p>
<p><i className="fas fa-envelope"></i> info@skelectronics.com</p>
</div>
</div>

<div className="footer-bottom">
<p>&copy; {new Date().getFullYear()} SK Electronics. All Rights Reserved.</p>
<div className="footer-bottom-links">
<Link to="/privacy-policy">Privacy Policy</Link>
<Link to="/terms-of-service">Terms of Service</Link>
</div>
</div>
</footer>
);
};

export default Footer;

 
