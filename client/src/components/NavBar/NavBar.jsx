import React, { useState, useEffect } from 'react';
import {Link} from 'react-router-dom';
import {useGlobalState} from '../../state/provider';
import './NavBar.css';

const NavBar = () => {
    const [{profile, cart_product_incomplete}, dispatch] = useGlobalState()
    const [isVisible, setIsVisible] = useState(true);
    const [prevScrollPos, setPrevScrollPos] = useState(window.pageYOffset);

    // For development, always show admin link
    const isAdmin = true; // Override for development
    // In production, use: profile?.is_admin === true || profile?.user?.is_staff === true || profile?.user?.is_superuser === true;

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPos = window.pageYOffset;
            setIsVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [prevScrollPos]);
    let cart_product_length = 0;
    if (cart_product_incomplete !== null) {
        cart_product_length = cart_product_incomplete[0]?.cart_product.length;
    } else {
        cart_product_length = 0;
    }
    const logoutButton = () => {
        window.localStorage.clear();
        dispatch({
            type: 'ADD_PROFILE',
            profile: null,
        });
        window.location.href = '/';
    };

    return (
        <nav className={`navbar navbar-expand-lg navbar-dark bg-dark navbar_className ${!isVisible ? 'hide' : ''}`}>
            <div className="container">
                <Link className="navbar-brand d-flex align-items-center" to="/">
                    
                    SK ELECTRONIC
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                    <ul className="navbar-nav">
                        {/* Always show admin link for development */}
                        
                        
                        {
                            profile !== null ? (
                                    <>
                                        <li className="nav-item">
                                            <Link to="/oldOrders" className="nav-link btn-dark active">
                                                <i className="fas fa-clipboard-list me-1"></i>My Orders
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/cart" className="nav-link btn-dark">
                                                <i className="fas fa-cart-plus me-1"/>
                                                <span>({cart_product_length})</span>
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/profile" className="nav-link btn-dark active">Profile</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link onClick={logoutButton} className="nav-link active btn-dark">Logout</Link>
                                        </li>
                                    </>
                                ) :
                                (
                                    <>
                                        <li className="nav-item">
                                            <Link to="/login" className="nav-link active btn-dark">Login</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/login" className="nav-link active btn-dark">
                                                <i className="fas fa-user-shield me-1"></i>Admin Login
                                            </Link>
                                        </li>
                                    </>
                                )
                        }
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
