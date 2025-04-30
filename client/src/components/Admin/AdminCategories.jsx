import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import { domain } from '../../env';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalAction, setModalAction] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        date: ''
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const openAddModal = () => {
        setSelectedCategory(null);
        setFormData({
            title: '',
            date: new Date().toISOString().split('T')[0]
        });
        setModalAction('add');
    };

    const openEditModal = (category) => {
        setSelectedCategory(category);
        setFormData({
            title: category.title,
            date: new Date(category.date).toISOString().split('T')[0]
        });
        setModalAction('edit');
    };

    const openDeleteModal = (category) => {
        setSelectedCategory(category);
        setModalAction('delete');
    };

    const submitForm = async (e) => {
        e.preventDefault();
        
        try {
            if (modalAction === 'add') {
                await Axios({
                    method: 'post',
                    url: `${domain}/api/category/`,
                    headers: {
                        Authorization: `token ${window.localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    data: formData
                });
            } else if (modalAction === 'edit') {
                await Axios({
                    method: 'put',
                    url: `${domain}/api/category/${selectedCategory.id}/`,
                    headers: {
                        Authorization: `token ${window.localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    data: formData
                });
            }
            // Close modal and refresh category list
            document.getElementById('closeModal').click();
            fetchCategories();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error saving category. Please try again.');
        }
    };

    const deleteCategory = async () => {
        try {
            await Axios({
                method: 'delete',
                url: `${domain}/api/category/${selectedCategory.id}/`,
                headers: {
                    Authorization: `token ${window.localStorage.getItem('token')}`
                }
            });
            // Close modal and refresh category list
            document.getElementById('closeModalDelete').click();
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Error deleting category. Please try again.');
        }
    };

    return (
        <div className="admin-categories">
            <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
                <h2>Categories Management</h2>
                <button className="btn btn-primary" onClick={openAddModal} data-bs-toggle="modal" data-bs-target="#categoryModal">
                    <i className="fas fa-plus"></i> Add Category
                </button>
            </div>

            {/* Categories table */}
            <div className="card">
                <div className="card-body">
                    {loading ? (
                        <div className="text-center my-5">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Created Date</th>
                                        <th>Products Count</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.length > 0 ? (
                                        categories.map(category => (
                                            <tr key={category.id}>
                                                <td>{category.id}</td>
                                                <td>{category.title}</td>
                                                <td>{new Date(category.date).toLocaleDateString()}</td>
                                                <td>{category.category_product?.length || 0}</td>
                                                <td className="actions">
                                                    <button 
                                                        className="btn btn-sm btn-info me-2"
                                                        onClick={() => openEditModal(category)}
                                                        data-bs-toggle="modal" 
                                                        data-bs-target="#categoryModal"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => openDeleteModal(category)}
                                                        data-bs-toggle="modal" 
                                                        data-bs-target="#deleteModal"
                                                        disabled={category.category_product?.length > 0}
                                                        title={category.category_product?.length > 0 ? "Can't delete category with products" : "Delete category"}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center">No categories found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Category Modal */}
            <div className="modal fade" id="categoryModal" tabIndex="-1" aria-labelledby="categoryModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="categoryModalLabel">
                                {modalAction === 'add' ? 'Add New Category' : 'Edit Category'}
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="closeModal"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={submitForm}>
                                <div className="mb-3">
                                    <label htmlFor="title" className="form-label">Category Title</label>
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
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" className="btn btn-primary">
                                        {modalAction === 'add' ? 'Add Category' : 'Save Changes'}
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
                            {selectedCategory?.category_product?.length > 0 ? (
                                <div className="alert alert-warning">
                                    Cannot delete this category because it contains products. Please remove or reassign the products first.
                                </div>
                            ) : (
                                <p>
                                    Are you sure you want to delete the category: <strong>{selectedCategory?.title}</strong>? This action cannot be undone.
                                </p>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button 
                                type="button" 
                                className="btn btn-danger" 
                                onClick={deleteCategory}
                                disabled={selectedCategory?.category_product?.length > 0}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCategories; 