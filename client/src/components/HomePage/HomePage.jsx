import Axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { domain } from '../../env';
import Product from '../Product/Product';
import './HomePage.css';

const getCategoryIcon = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('smartphone') || titleLower.includes('phone')) return 'fas fa-mobile-alt';
    if (titleLower.includes('laptop') || titleLower.includes('computer')) return 'fas fa-laptop';
    if (titleLower.includes('accessory') || titleLower.includes('accessories')) return 'fas fa-headphones';
    if (titleLower.includes('smart home') || titleLower.includes('home')) return 'fas fa-home';
    if (titleLower.includes('electronic') || titleLower.includes('electronics')) return 'fas fa-microchip';
    if (titleLower.includes('gadget')) return 'fas fa-tablet-alt';
    return 'fas fa-box'; // Default icon
};

const HomePage = () => {
    const [products, setProducts] = useState(null);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryProducts, setCategoryProducts] = useState({});

    useEffect(() => {
        const getData = async () => {
            setLoading(true);
            try {
                // Get all products
                const productsResponse = await Axios.get(`${domain}/api/product/`);
                console.log('Products API Response:', productsResponse);
                if (productsResponse.data?.results) {
                    setProducts(productsResponse.data);
                    // Set featured products (using the first 3 products as featured for now)
                    setFeaturedProducts(productsResponse.data.results.slice(0, 3));
                } else {
                    console.error('No data received from products API');
                    setProducts([]);
                    setFeaturedProducts([]);
                }

                // Get all categories
                const categoriesResponse = await Axios({
                    method: 'get',
                    url: `${domain}/api/category/`,
                });
                
                const categoriesWithIcons = categoriesResponse.data.map(category => ({
                    ...category,
                    icon: getCategoryIcon(category.title)
                }));
                
                setCategories(categoriesWithIcons);

                // Fetch products for each category
                const categoryProductsData = {};
                for (const category of categoriesResponse.data) {
                    const categoryProductsResponse = await Axios({
                        method: 'get',
                        url: `${domain}/api/category/${category.id}/`,
                    });
                    categoryProductsData[category.id] = categoryProductsResponse.data[0]?.category_product || [];
                }
                setCategoryProducts(categoryProductsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                setProducts([]);
                setFeaturedProducts([]);
                setCategories([]);
                setCategoryProducts({});
            } finally {
                setLoading(false);
            }
        };

        getData();
    }, []);

    const nextPage = async () => {
        try {
            const res = await Axios({
                method: 'get',
                url: products?.next,
            });
            setProducts(res.data);
        } catch (error) {
            console.error('Error fetching next page:', error);
        }
    };

    const previousPage = async () => {
        try {
            const res = await Axios({
                method: 'get',
                url: products?.previous,
            });
            setProducts(res.data);
        } catch (error) {
            console.error('Error fetching previous page:', error);
        }
    };

    return (
        <div className="homepage">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <h1>Welcome to SK Electronics</h1>
                    <p>Discover the latest technology and gadgets</p>
                    <button
                        onClick={() => {
                            document.querySelector('.all-products-section').scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="btn btn-primary btn-lg"
                    >
                        Shop Now <i className="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>

            {/* Categories Section */}
            <div className="container mt-5">
                <h2 className="section-title">Shop by Category</h2>
                <div className="categories-container">
                    {categories.map((category) => (
                        <div className="category-card" key={category.id}>
                            <div className="category-icon">
                                <i className={getCategoryIcon(category.title)}></i>
                            </div>
                            <h3>{category.title}</h3>
                            <div className="category-info">
                                <span className="product-count">{category.product_count || 0} Products</span>
                            </div>
                            <Link 
                                to={`/category/${category.id}`} 
                                className="category-link"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setLoading(true);
                                    const categoryProductsList = categoryProducts[category.id] || [];
                                    setProducts({ results: categoryProductsList });
                                    setLoading(false);
                                    document.querySelector('.all-products-section').scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Browse All <i className="fas fa-chevron-right"></i>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* Featured Products Section */}
            <div className="container mt-5">
                <h2 className="section-title">Featured Products</h2>
                <div className="row">
                    {featuredProducts.length > 0 ? (
                        featuredProducts.map((item, i) => (
                            <div className="col-12 col-sm-6 col-md-4" key={i}>
                                <Product item={item} />
                            </div>
                        ))
                    ) : (
                        <div className="col-12 text-center">
                            <p>No featured products available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* All Products Section */}
            <div className="container mt-5 all-products-section">
                <h2 className="section-title">All Products</h2>
                <div className="row">
                    <div className="col-md-12">
                        <div className="row g-4">
                            {loading ? (
                                <div className="col-12 text-center">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="sr-only">Loading...</span>
                                    </div>
                                </div>
                            ) : products?.results?.length > 0 ? (
                                products.results.map((item, i) => (
                                    <div className="col-6 col-sm-4 col-md-3" key={i}>
                                        <Product item={item} />
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center">
                                    <p>No products available</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Pagination */}
                        {products && (
                            <div className="homepage__pagination mt-4">
                                <div className="">
                                    {products?.previous !== null ? (
                                        <button onClick={previousPage} className="btn btn-lg btn-success">
                                            <i className="fas fa-backward" /> Previous
                                        </button>
                                    ) : (
                                        <button className="btn btn-lg btn-success" disabled>
                                            <i className="fas fa-backward" /> Previous
                                        </button>
                                    )}
                                </div>
                                <div className="">
                                    {products?.next !== null ? (
                                        <button onClick={nextPage} className="btn btn-lg btn-danger">
                                            Next <i className="fas fa-forward" />
                                        </button>
                                    ) : (
                                        <button className="btn btn-lg btn-danger" disabled>
                                            Next <i className="fas fa-forward" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    

                </div>
            </div>
        </div>
    );
};

export default HomePage;
