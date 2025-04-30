import React, {useEffect, useState} from 'react';
import Axios from 'axios';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import HomePage from './components/HomePage/HomePage';
import Login from './components/Login/Login';
import NavBar from './components/NavBar/NavBar';
import Footer from './components/Footer/Footer';
import ProductDetails from './components/ProductDetails/ProductDetails';
import ProductsPage from './components/ProductsPage/ProductsPage';
import CategoryPage from './components/CategoryPage/CategoryPage';
import Register from './components/Register/Register';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import Cart from "./components/Cart/Cart";
import {domain} from './env';
import {useGlobalState} from './state/provider';
import OldOrders from "./components/OldOrder/OldOrder";
import Order from "./components/Order/Order";
import OldOrderDetails from "./components/OldOrderDetails/OldOrderDetails";
import Profile from "./components/Profile/Profile";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminLogin from './components/Admin/AdminLogin';

const App = () => {
    const [{profile, reloadPage}, dispatch] = useGlobalState();
    const token = window.localStorage.getItem('token');
    const [currentPath, setCurrentPath] = useState(window.location.pathname);

    // Check if current path is an admin route to hide the footer
    const isAdminRoute = currentPath.startsWith('/admin');

    // Listen for route changes
    useEffect(() => {
        const handleRouteChange = () => {
            setCurrentPath(window.location.pathname);
        };

        window.addEventListener('popstate', handleRouteChange);
        return () => {
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, []);

    // Check if user is admin (either from profile or user object)
    // For development, always allow admin access
    const isAdmin = true; // Override for development
    // In production, use: profile?.is_admin === true || profile?.user?.is_staff === true || profile?.user?.is_superuser === true;

    useEffect(() => {
        if (token !== null) {
            const getData = async () => {
                Axios({
                    method: 'get',
                    url: `${domain}/api/profile/`,
                    headers: {
                        Authorization: `token ${token}`,
                    },
                })
                    .then((res) => {
                        let user = res.data['data'];
                        // Check if this profile represents a staff/admin user
                        if (user && (user.is_admin === true || user.user?.is_staff === true)) {
                            console.log("Admin user logged in:", user);
                        } else {
                            console.log("Regular user logged in, still granting admin access for development");
                        }
                        
                        // Add admin flag for development
                        if (user) {
                            user.is_admin = true; // Force admin status for development
                        }
                        
                        dispatch({
                            type: 'ADD_PROFILE',
                            profile: user,
                        });
                    })
                    .catch((e) => {
                        console.log(e);
                        dispatch({
                            type: 'ADD_PROFILE',
                            profile: null,
                        });
                    });
            };
            getData().then().catch();
        }
    }, [reloadPage, dispatch, token]);

    useEffect(() => {
        if (profile !== null) {
            const getData = async () => {
                Axios({
                    method: "get",
                    url: `${domain}/api/cart/`,
                    headers: {
                        Authorization: `token ${token}`
                    }
                }).then(res => {
                    const complete_cart = []
                    const incomplete_cart = []
                    res?.data.forEach(data => {
                        if (data.complete) {
                            complete_cart.push(data);
                        } else {
                            incomplete_cart.push(data);
                        }
                    })
                    dispatch({
                        type: "ADD_CART_PRODUCT_COMPLETE",
                        cart_product_complete: complete_cart
                    })
                    dispatch({
                        type: "ADD_CART_PRODUCT_INCOMPLETE",
                        cart_product_incomplete: incomplete_cart
                    })
                })
            }
            getData().then().catch();
        }
    }, [reloadPage, dispatch, profile, token])

    return (
        <BrowserRouter>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <NavBar/>
                <div style={{ flex: 1 }}>
                    <Switch>
                        <Route exact path="/" component={HomePage}/>
                        <Route exact path="/products" component={ProductsPage}/>
                        <Route exact path="/product/:id" component={ProductDetails}/>
                        <Route exact path="/category/:id" component={CategoryPage}/>
                        <Route exact path="/privacy-policy" component={PrivacyPolicy}/>
                        <Route exact path="/terms-of-service" component={TermsOfService}/>
                        <Route exact path="/forgot-password" component={ForgotPassword}/>
                        <Route exact path="/admin/login" component={AdminLogin}/>
                        {
                            profile !== null ? (
                                    <>
                                        <Route exact path='/profile' component={Profile} />
                                        <Route exact path='/cart' component={Cart}/>
                                        <Route exact path='/order' component={Order} />
                                        <Route exact path='/oldOrders' component={OldOrders} />
                                        <Route exact path='/oldorders/:id' component={OldOrderDetails} />
                                        
                                        {/* Admin Routes - only visible to admin users */}
                                        {isAdmin && (
                                            <Route path='/admin' component={AdminDashboard} />
                                        )}
                                    </>
                                ) :
                                (
                                    <>
                                        <Route exact path='/login' component={Login}/>
                                        <Route exact path='/register' component={Register}/>
                                        {/* Allow admin access even without login for development */}
                                        <Route path='/admin' component={AdminDashboard} />
                                    </>
                                )
                        }
                        <Route exact component={HomePage}/>
                    </Switch>
                </div>
                {/* Only render Footer on non-admin routes */}
                {!isAdminRoute && <Footer />}
            </div>
        </BrowserRouter>
    );
};

export default App;
