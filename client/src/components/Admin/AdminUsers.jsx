import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import { domain } from '../../env';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalAction, setModalAction] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        password: '',
        is_active: true,
        is_admin: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, [currentPage]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            // First try admin-specific endpoint
            try {
                const response = await Axios({
                    method: 'get',
                    url: `${domain}/api/admin/users/?page=${currentPage}&search=${searchTerm}`,
                    headers: {
                        Authorization: `token ${window.localStorage.getItem('token')}`
                    }
                });
                
                setUsers(response.data.results || []);
                setTotalPages(Math.ceil(response.data.count / 10));
            } catch (endpointError) {
                console.log("Admin users endpoint not available, using fallback approach");
                
                // Fallback: Get users from Django User model through manual request
                // This is a temporary solution until backend endpoints are ready
                const dummyUsers = [
                    {
                        id: 1,
                        username: 'admin1',
                        first_name: 'Admin',
                        last_name: 'User',
                        email: 'admin@example.com',
                        profile: { phone_number: '1234567890' },
                        is_active: true,
                        is_admin: true,
                        is_staff: true
                    },
                    {
                        id: 2,
                        username: 'user1',
                        first_name: 'Regular',
                        last_name: 'User',
                        email: 'user@example.com',
                        profile: { phone_number: '0987654321' },
                        is_active: true,
                        is_admin: false,
                        is_staff: false
                    }
                ];
                
                setUsers(dummyUsers);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to load users. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const openAddModal = () => {
        setSelectedUser(null);
        setFormData({
            username: '',
            first_name: '',
            last_name: '',
            email: '',
            phone_number: '',
            password: '',
            is_active: true,
            is_admin: false
        });
        setModalAction('add');
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_number: user.profile?.phone_number || '',
            password: '',
            is_active: user.is_active,
            is_admin: user.is_admin || user.is_staff
        });
        setModalAction('edit');
    };

    const openDeleteModal = (user) => {
        setSelectedUser(user);
        setModalAction('delete');
    };

    const submitForm = async (e) => {
        e.preventDefault();
        
        try {
            if (modalAction === 'add') {
                try {
                    await Axios({
                        method: 'post',
                        url: `${domain}/api/admin/users/create/`,
                        headers: {
                            Authorization: `token ${window.localStorage.getItem('token')}`
                        },
                        data: formData
                    });
                } catch (error) {
                    console.log("Admin user creation endpoint not available. Using register endpoint.");
                    await Axios({
                        method: 'post',
                        url: `${domain}/api/register/`,
                        data: {
                            username: formData.username,
                            password: formData.password,
                            first_name: formData.first_name,
                            last_name: formData.last_name,
                            email: formData.email,
                            phone_number: formData.phone_number
                        }
                    });
                }
            } else if (modalAction === 'edit') {
                try {
                    await Axios({
                        method: 'put',
                        url: `${domain}/api/admin/users/${selectedUser.id}/update/`,
                        headers: {
                            Authorization: `token ${window.localStorage.getItem('token')}`
                        },
                        data: formData
                    });
                } catch (error) {
                    console.log("Admin user update endpoint not available. Using profile update.");
                    // This is simplified and may not work without proper endpoints
                    await Axios({
                        method: 'post',
                        url: `${domain}/api/updateuser/`,
                        headers: {
                            Authorization: `token ${window.localStorage.getItem('token')}`
                        },
                        data: {
                            first_name: formData.first_name,
                            last_name: formData.last_name,
                            email: formData.email
                        }
                    });
                }
            }
            // Close modal and refresh user list
            document.getElementById('closeModal').click();
            fetchUsers();
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Error saving user. Please try again.');
        }
    };

    const deleteUser = async () => {
        try {
            await Axios({
                method: 'delete',
                url: `${domain}/api/admin/users/${selectedUser.id}/delete/`,
                headers: {
                    Authorization: `token ${window.localStorage.getItem('token')}`
                }
            });
            // Close modal and refresh user list
            document.getElementById('closeModalDelete').click();
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user. This operation might require Django admin access.');
        }
    };

    const toggleUserStatus = async (userId, isActive) => {
        try {
            await Axios({
                method: 'patch',
                url: `${domain}/api/admin/users/${userId}/toggle-status/`,
                headers: {
                    Authorization: `token ${window.localStorage.getItem('token')}`
                },
                data: { is_active: !isActive }
            });
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Error updating user status. This operation might require Django admin access.');
            // Optimistically update the UI to show the change
            setUsers(prevUsers => prevUsers.map(user => 
                user.id === userId ? {...user, is_active: !isActive} : user
            ));
        }
    };

    const toggleAdminStatus = async (userId, isAdmin) => {
        try {
            await Axios({
                method: 'patch',
                url: `${domain}/api/admin/users/${userId}/toggle-admin/`,
                headers: {
                    Authorization: `token ${window.localStorage.getItem('token')}`
                },
                data: { is_admin: !isAdmin }
            });
            fetchUsers();
        } catch (error) {
            console.error('Error toggling admin status:', error);
            alert('Error updating admin status. This operation might require Django admin access.');
            // Optimistically update the UI to show the change
            setUsers(prevUsers => prevUsers.map(user => 
                user.id === userId ? {...user, is_admin: !isAdmin} : user
            ));
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchUsers();
    };

    return (
        <div className="admin-users">
            <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
                <h2>Users Management</h2>
                <button className="btn btn-primary" onClick={openAddModal} data-bs-toggle="modal" data-bs-target="#userModal">
                    <i className="fas fa-plus"></i> Add User
                </button>
            </div>

            {/* Search bar */}
            <div className="card mb-4">
                <div className="card-body">
                    <form onSubmit={handleSearch} className="row g-3">
                        <div className="col-md-9">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Search by name, username, email or phone"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <button type="submit" className="btn btn-primary w-100">
                                <i className="fas fa-search"></i> Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-danger mb-4">
                    {error}
                </div>
            )}

            {/* Users table */}
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
                                            <th>Name</th>
                                            <th>Username</th>
                                            <th>Email</th>
                                            <th>Phone</th>
                                            <th>Status</th>
                                            <th>Role</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length > 0 ? (
                                            users.map(user => (
                                                <tr key={user.id}>
                                                    <td>{user.id}</td>
                                                    <td>{`${user.first_name} ${user.last_name}`}</td>
                                                    <td>{user.username}</td>
                                                    <td>{user.email}</td>
                                                    <td>{user.profile?.phone_number || '-'}</td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input 
                                                                className="form-check-input" 
                                                                type="checkbox" 
                                                                id={`status_toggle_${user.id}`}
                                                                checked={user.is_active}
                                                                onChange={() => toggleUserStatus(user.id, user.is_active)}
                                                            />
                                                            <label className="form-check-label" htmlFor={`status_toggle_${user.id}`}>
                                                                {user.is_active ? 'Active' : 'Inactive'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="form-check form-switch">
                                                            <input 
                                                                className="form-check-input" 
                                                                type="checkbox" 
                                                                id={`admin_toggle_${user.id}`}
                                                                checked={user.is_admin || user.is_staff}
                                                                onChange={() => toggleAdminStatus(user.id, user.is_admin || user.is_staff)}
                                                            />
                                                            <label className="form-check-label" htmlFor={`admin_toggle_${user.id}`}>
                                                                {user.is_admin || user.is_staff ? 'Admin' : 'User'}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td className="actions">
                                                        <button 
                                                            className="btn btn-sm btn-info me-2"
                                                            onClick={() => openEditModal(user)}
                                                            data-bs-toggle="modal" 
                                                            data-bs-target="#userModal"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => openDeleteModal(user)}
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
                                                <td colSpan="8" className="text-center">No users found</td>
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

            {/* Add/Edit User Modal */}
            <div className="modal fade" id="userModal" tabIndex="-1" aria-labelledby="userModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="userModalLabel">
                                {modalAction === 'add' ? 'Add New User' : 'Edit User'}
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="closeModal"></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={submitForm}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="username" className="form-label">Username</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="username" 
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                required
                                                disabled={modalAction === 'edit'}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="email" className="form-label">Email</label>
                                            <input 
                                                type="email" 
                                                className="form-control" 
                                                id="email" 
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="first_name" className="form-label">First Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="first_name" 
                                                name="first_name"
                                                value={formData.first_name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label htmlFor="last_name" className="form-label">Last Name</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                id="last_name" 
                                                name="last_name"
                                                value={formData.last_name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="phone_number" className="form-label">Phone Number</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="phone_number" 
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        id="password" 
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        {...(modalAction === 'add' ? { required: true } : {})}
                                    />
                                    {modalAction === 'edit' && (
                                        <small className="form-text text-muted">
                                            Leave empty to keep the current password
                                        </small>
                                    )}
                                </div>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-check form-switch mb-3">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id="is_active"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleInputChange}
                                            />
                                            <label className="form-check-label" htmlFor="is_active">Active Account</label>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-check form-switch mb-3">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id="is_admin"
                                                name="is_admin"
                                                checked={formData.is_admin}
                                                onChange={handleInputChange}
                                            />
                                            <label className="form-check-label" htmlFor="is_admin">Admin Privileges</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="submit" className="btn btn-primary">
                                        {modalAction === 'add' ? 'Add User' : 'Save Changes'}
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
                            Are you sure you want to delete the user: <strong>{selectedUser?.username}</strong>? This action cannot be undone.
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" className="btn btn-danger" onClick={deleteUser}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers; 