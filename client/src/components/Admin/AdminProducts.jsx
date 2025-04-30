import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import { Link } from 'react-router-dom';
import { domain } from '../../env';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalAction, setModalAction] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        market_price: '',
        selling_price: '',
        image: null
    });
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Fetch products and categories on component mount
    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [currentPage]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await Axios({
                method: 'get',
                url: `${domain}/api/product/`,
                params: {
                    page: currentPage,
                    page_size: pageSize,
                    search: searchTerm
                },
                headers: {
                    Authorization: `token ${window.localStorage.getItem('token')}`
                }
            });
            
            // Update with new response format
            if (response.data) {
                setProducts(response.data.results || []);
                setTotalPages(response.data.total_pages || 1);
                setTotalCount(response.data.count || 0);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await Axios({
                method: 'get',
                url: `${domain}/api/category/`,
                headers: {
                    Authorization: `token ${window.localStorage.getItem('token')}`
                }
            });
            setCategories(response.data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image' && files.length > 0) {
            setFormData({
                ...formData,
                [name]: files[0]
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const openAddModal = () => {
        setSelectedProduct(null);
        setFormData({
            title: '',
            description: '',
            category: '',
            market_price: '',
            selling_price: '',
            image: null
        });
        setModalAction('add');
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            title: product.title,
            description: product.description,
            category: product.category.id,
            market_price: product.market_price,
            selling_price: product.selling_price,
            image: null
        });
        setModalAction('edit');
    };

    const openDeleteModal = (product) => {
        setSelectedProduct(product);
        setModalAction('delete');
    };

    const submitForm = async (e) => {
        e.preventDefault();
        
        const formDataObj = new FormData();
        formDataObj.append('title', formData.title);
        formDataObj.append('description', formData.description);
        formDataObj.append('category', formData.category);
        formDataObj.append('market_price', formData.market_price);
        formDataObj.append('selling_price', formData.selling_price);
        if (formData.image) {
            formDataObj.append('image', formData.image);
        }

        try {
            let response;
            if (modalAction === 'add') {
                response = await Axios({
                    method: 'post',
                    url: `${domain}/api/product/`,
                    headers: {
                        Authorization: `token ${window.localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    data: formDataObj
                });
            } else if (modalAction === 'edit') {
                response = await Axios({
                    method: 'put',
                    url: `${domain}/api/product/${selectedProduct.id}/`,
                    headers: {
                        Authorization: `token ${window.localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    data: formDataObj
                });
            }
            
            console.log('Product saved successfully:', response.data);
            // Close modal and refresh product list
            document.getElementById('closeModal').click();
            fetchProducts();
        } catch (error) {
            console.error('Error submitting form:', error);
            
            let errorMessage = 'Error saving product. Please try again.';
            
            if (error.response && error.response.data) {
                if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
                
                if (error.response.data.errors) {
                    const errors = error.response.data.errors;
                    errorMessage = Object.keys(errors)
                        .map(key => `${key}: ${errors[key].join(', ')}`)
                        .join('\n');
                }
                
                console.error('Server error details:', error.response.data);
            }
            
            alert(errorMessage);
        }
    };

    const deleteProduct = async () => {
        try {
            await Axios({
                method: 'delete',
                url: `${domain}/api/product/${selectedProduct.id}/`,
                headers: {
                    Authorization: `token ${window.localStorage.getItem('token')}`
                }
            });
            // Close modal and refresh product list
            document.getElementById('closeModalDelete').click();
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product. Please try again.');
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchProducts();
    };

    return (
        <div className="admin-products">
            <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
                <h2>Products Management</h2>
                <button className="btn btn-primary" onClick={openAddModal} data-bs-toggle="modal" data-bs-target="#productModal">
                    <i className="fas fa-plus"></i> Add Product
                </button>
            </div>

            {/* Search bar */}
            <div className="card mb-4">
                <div className="card-body">
                    <form onSubmit={handleSearch} className="row g-3">
                        <div className="col-md-8">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-4">
                            <button type="submit" className="btn btn-primary w-100">
                                <i className="fas fa-search"></i> Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Products table */}
            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="text-center my-5">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Image</th>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Market Price</th>
                                            <th>Selling Price</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.length > 0 ? (
                                            products.map(product => (
                                                <tr key={product.id}>
                                                    <td>{product.id}</td>
                                                    <td>
                                                        <img 
                                                            src={product.image ? 
                                                                (product.image.startsWith('http') ? 
                                                                    product.image : 
                                                                    product.image.startsWith('/media/') ?
                                                                        `${domain}${product.image}` :
                                                                        `${domain}/media/products/${product.image}`
                                                                ) : 
                                                                `${domain}/media/products/default.jpg`
                                                            }
                                                            alt={product.title}
                                                            className="img-thumbnail"
                                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                        />
                                                    </td>
                                                    <td>{product.title}</td>
                                                    <td>{product.category?.title}</td>
                                                    <td>${product.market_price}</td>
                                                    <td>${product.selling_price}</td>
                                                    <td className="actions">
                                                        <button 
                                                            className="btn btn-sm btn-info me-2"
                                                            onClick={() => openEditModal(product)}
                                                            data-bs-toggle="modal" 
                                                            data-bs-target="#productModal"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => openDeleteModal(product)}
                                                            data-bs-toggle="modal" 
                                                            data-bs-target="#deleteModal"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center">No products found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <nav className="mt-4 d-flex justify-content-center">
                                    <ul className="pagination">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                                                Previous
                                            </button>
                                        </li>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                                    {i + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add/Edit Product Modal */}
            <div className="modal fade" id="productModal" tabIndex="-1" aria-labelledby="productModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="productModalLabel">
                                {modalAction === 'add' ? 'Add New Product' : 'Edit Product'}
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="closeModal"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={submitForm}>
                                <div className="mb-3">
                                    <label htmlFor="title" className="form-label">Product Title</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="title" 
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Description</label>
                                    <textarea 
                                        className="form-control" 
                                        id="description" 
                                        name="description"
                                        rows="3"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="category" className="form-label">Category</label>
                                    <select 
                                        className="form-select" 
                                        id="category" 
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="market_price" className="form-label">Market Price ($)</label>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                id="market_price" 
                                                name="market_price"
                                                min="0"
                                                step="0.01"
                                                value={formData.market_price}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="selling_price" className="form-label">Selling Price ($)</label>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                id="selling_price" 
                                                name="selling_price"
                                                min="0"
                                                step="0.01"
                                                value={formData.selling_price}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="image" className="form-label">Product Image</label>
                                    <input 
                                        type="file" 
                                        className="form-control" 
                                        id="image" 
                                        name="image"
                                        onChange={handleInputChange}
                                        accept="image/*"
                                        {...(modalAction === 'add' ? { required: true } : {})}
                                    />
                                    {modalAction === 'edit' && (
                                        <small className="form-text text-muted">
                                            Leave empty to keep the current image
                                        </small>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" className="btn btn-primary">
                                        {modalAction === 'add' ? 'Add Product' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <div className="modal fade" id="deleteModal" tabIndex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="deleteModalLabel">Confirm Delete</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="closeModalDelete"></button>
                        </div>
                        <div className="modal-body">
                            Are you sure you want to delete the product: <strong>{selectedProduct?.title}</strong>? This action cannot be undone.
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-danger" onClick={deleteProduct}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProducts; 