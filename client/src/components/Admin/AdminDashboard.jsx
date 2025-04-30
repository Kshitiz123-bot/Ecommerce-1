import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import { Link, Switch, Route, useRouteMatch, Redirect } from 'react-router-dom';
import { domain } from '../../env';
import { useGlobalState } from '../../state/provider';
import './Admin.css';
import AdminProducts from './AdminProducts';
import AdminUsers from './AdminUsers';
import AdminOrders from './AdminOrders';
import AdminCategories from './AdminCategories';

const AdminDashboard = () => {
    const [{ profile }] = useGlobalState();
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalUsers: 0,
        totalOrders: 0,
        totalCategories: 0
    });
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const { path, url } = useRouteMatch();

    useEffect(() => {
        // Check if user is logged in
        if (!profile) {
            // For development purposes, allow access even without profile
            console.log("No profile detected, but allowing access for development");
            
            const fetchStats = async () => {
                setLoading(true);
                setStats({
                    totalProducts: true,
                    totalUsers: true,
                    totalOrders: true,
                    totalCategories: true
                });
                setTimeout(() => setLoading(false), 1000);
            };
            
            fetchStats();
            return;
        }
        
        // Check if user has admin privileges - in the user object or in profile
        const isAdmin = profile.is_admin === true || 
                       profile.user?.is_staff === true || 
                       profile.user?.is_superuser === true;
        
        // For development, allow access regardless of admin status
        if (!isAdmin) {
            console.log("User is not an admin but allowing access:", profile);
        }
        
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Use dummy stats for now since we don't have a specific endpoint
                // You can replace this with an actual API call when available
                setStats({
                    totalProducts: 15,
                    totalUsers: 25,
                    totalOrders: 8,
                    totalCategories: 5
                });
                
                // Simulate API call delay
                setTimeout(() => {
                    setLoading(false);
                }, 1000);
                
                // Uncomment this when you have the actual endpoint
                /*
                const response = await Axios({
                    method: 'get',
                    url: `${domain}/api/admin/stats/`,
                    headers: {
                        Authorization: `token ${window.localStorage.getItem('token')}`
                    }
                });
                setStats(response.data);
                */
            } catch (error) {
                console.error('Error fetching admin stats:', error);
                // Check if the error is due to authorization
                if (error.response && error.response.status === 403) {
                    setAccessDenied(true);
                }
                setLoading(false);
            }
        };
        
        fetchStats();
    }, [profile]);

    // For development, skip the access denied check
    /*
    // If access is denied, show access denied message
    if (accessDenied) {
        return (
            <div className="container mt-5">
                <div className="card text-center">
                    <div className="card-header bg-danger text-white">
                        <h4>Access Denied</h4>
                    </div>
                    <div className="card-body">
                        <h5 className="card-title">You do not have permission to access the admin panel</h5>
                        <p className="card-text">This area is restricted to admin users only. If you believe you should have access, please contact the system administrator.</p>
                        <Link to="/" className="btn btn-primary">Go to Homepage</Link>
                    </div>
                </div>
            </div>
        );
    }
    */

    // If still loading, show loading
    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading admin dashboard...</p>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-dashboard container-fluid">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-3 col-lg-2 d-md-block sidebar">
                        <div className="position-sticky">
                            <div className="text-center my-4">
                                <h3 className="mb-0">ADMIN PANEL</h3>
                                <div className="small text-muted">SK ELECTRONIC</div>
                            </div>
                            <hr className="my-3" style={{borderColor: 'rgba(255,255,255,0.1)'}} />
                            <ul className="nav flex-column">
                                <li className="nav-item">
                                    <Link className={`nav-link ${path === url ? 'active' : ''}`} to={url}>
                                        <i className="fas fa-tachometer-alt"></i> Dashboard
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${path.includes('/products') ? 'active' : ''}`} to={`${url}/products`}>
                                        <i className="fas fa-box"></i> Products
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${path.includes('/categories') ? 'active' : ''}`} to={`${url}/categories`}>
                                        <i className="fas fa-list"></i> Categories
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${path.includes('/orders') ? 'active' : ''}`} to={`${url}/orders`}>
                                        <i className="fas fa-shopping-cart"></i> Orders
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${path.includes('/users') ? 'active' : ''}`} to={`${url}/users`}>
                                        <i className="fas fa-users"></i> Users
                                    </Link>
                                </li>
                            </ul>
                            <hr className="my-3" style={{borderColor: 'rgba(255,255,255,0.1)'}} />
                            <div className="px-3 mb-3">
                                <Link to="/" className="btn btn-outline-light btn-sm w-100">
                                    <i className="fas fa-home me-1"></i> Back to Site
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main-content">
                        <Switch>
                            <Route exact path={path}>
                                <div className="dashboard-home">
                                    <div className="admin-header d-flex justify-content-between align-items-center mb-4 mt-4">
                                        <h2 className="m-0">Dashboard</h2>
                                        <span>Welcome, {profile?.user?.username || 'Admin'}</span>
                                    </div>
                                    
                                    <div className="row row-cols-1 row-cols-md-4 g-4 mb-4">
                                        <div className="col">
                                            <div className="card text-white bg-primary dashboard-card">
                                                <div className="card-body">
                                                    <h5 className="card-title">Products</h5>
                                                    <p className="card-text h2">{stats.totalProducts}</p>
                                                    <Link to={`${url}/products`} className="btn btn-sm btn-light mt-2">Manage</Link>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="card text-white bg-success dashboard-card">
                                                <div className="card-body">
                                                    <h5 className="card-title">Categories</h5>
                                                    <p className="card-text h2">{stats.totalCategories}</p>
                                                    <Link to={`${url}/categories`} className="btn btn-sm btn-light mt-2">Manage</Link>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="card text-white bg-warning dashboard-card">
                                                <div className="card-body">
                                                    <h5 className="card-title">Orders</h5>
                                                    <p className="card-text h2">{stats.totalOrders}</p>
                                                    <Link to={`${url}/orders`} className="btn btn-sm btn-light mt-2">Manage</Link>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="card text-white bg-danger dashboard-card">
                                                <div className="card-body">
                                                    <h5 className="card-title">Users</h5>
                                                    <p className="card-text h2">{stats.totalUsers}</p>
                                                    <Link to={`${url}/users`} className="btn btn-sm btn-light mt-2">Manage</Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="card mb-4 dashboard-card">
                                                <div className="card-header bg-dark text-white">
                                                    <i className="fas fa-clipboard-list me-2"></i> Recent Orders
                                                </div>
                                                <div className="card-body">
                                                    <p>Recent order data will be displayed here</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Route>
                            <Route path={`${path}/products`}>
                                <AdminProducts />
                            </Route>
                            <Route path={`${path}/categories`}>
                                <AdminCategories />
                            </Route>
                            <Route path={`${path}/orders`}>
                                <AdminOrders />
                            </Route>
                            <Route path={`${path}/users`}>
                                <AdminUsers />
                            </Route>
                        </Switch>
                        
                        {/* Admin footer */}
                        <footer className="admin-page-footer py-3 bg-dark text-white text-center">
                            <div className="container">
                                <p className="mb-0">© 2023 SK ELECTRONIC Admin Panel. All Rights Reserved.</p>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 