import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Axios from 'axios';
import { domain } from '../../env';
import Product from '../Product/Product';
import './CategoryPage.css';

const CategoryPage = () => {
    const { id } = useParams();
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [categoryTitle, setCategoryTitle] = useState('');

    useEffect(() => {
        const fetchCategoryProducts = async () => {
            try {
                const response = await Axios({
                    method: 'get',
                    url: `${domain}/api/category/${id}/`,
                });
                setCategoryProducts(response.data[0]?.category_product || []);
                setCategoryTitle(response.data[0]?.title || '');
            } catch (error) {
                console.error('Error fetching category products:', error);
            }
        };

        fetchCategoryProducts();
    }, [id]);

    return (
        <div className="category-page">
            <div className="container py-5">
                <h2 className="category-title">{categoryTitle}</h2>
                {categoryProducts.length > 0 ? (
                    <div className="product-grid">
                        {categoryProducts.map((product) => (
                            <Product key={product.id} item={product} />
                        ))}
                    </div>
                ) : (
                    <div className="no-products">
                        <p>No products found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;