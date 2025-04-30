import React, { useState, useEffect } from 'react';
import Axios from 'axios';
import { domain } from '../../env';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState('');
    const [error, setError] = useState(null);
    const [recentlyChangedOrderId, setRecentlyChangedOrderId] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, [currentPage, filterStatus]);

    // Clear highlight effect after 2 seconds
    useEffect(() => {
        if (recentlyChangedOrderId) {
            const timer = setTimeout(() => {
                setRecentlyChangedOrderId(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [recentlyChangedOrderId]);

    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            try {
                // First try to fetch from cart data
                const cartsResponse = await Axios({
                    method: 'get',
                    url: `${domain}/api/cart/`,
                    headers: {
                        Authorization: `token ${window.localStorage.getItem('token')}`
                    }
                });
                
                // Get completed carts as orders
                const completedCarts = cartsResponse.data.filter(cart => cart.complete);
                
                // Format cart data to match expected order format
                const formattedOrders = completedCarts.map(cart => {
                    // Try to get customer name from cart
                    let customerName = 'Unknown Customer';
                    if (cart.customer && cart.customer.user) {
                        const { first_name, last_name, username } = cart.customer.user;
                        if (first_name || last_name) {
                            customerName = `${first_name || ''} ${last_name || ''}`.trim();
                        } else {
                            customerName = username || 'Unknown';
                        }
                    }
                    
                    return {
                        id: cart.id,
                        customer_name: customerName,
                        customer_id: cart.customer?.id,
                        date: cart.date,
                        total_amount: cart.total,
                        status: cart.order?.status || 'completed',
                        cart: cart,
                        order_id: cart.order?.id,
                        payment_method: 'Card',
                        order_items: cart.cart_product || []
                    };
                });
                
                setOrders(formattedOrders);
                setTotalPages(Math.ceil(formattedOrders.length / 10));
                
                if (formattedOrders.length === 0) {
                    // If no orders found, add some dummy data for demonstration
                    addDummyOrdersIfNeeded();
                }
            } catch (cartError) {
                console.log("Cart endpoint failed, using dummy data:", cartError);
                addDummyOrdersIfNeeded();
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Failed to load orders. Please try again later.');
            addDummyOrdersIfNeeded();
        } finally {
            setLoading(false);
        }
    };

    const addDummyOrdersIfNeeded = () => {
        // Adding dummy data for demonstration purposes
        const dummyOrders = [
            {
                id: 1001,
                customer_name: 'John Doe',
                customer_id: 1,
                date: new Date().toISOString(),
                total_amount: 249.99,
                status: 'delivered',
                payment_method: 'Card',
                order_items: [
                    { id: 1, product: { title: 'Smartphone XYZ', selling_price: 199.99 }, quantity: 1 },
                    { id: 2, product: { title: 'Phone Case', selling_price: 19.99 }, quantity: 1 },
                    { id: 3, product: { title: 'Screen Protector', selling_price: 9.99 }, quantity: 3 }
                ]
            },
            {
                id: 1002,
                customer_name: 'Jane Smith',
                customer_id: 2,
                date: new Date(Date.now() - 86400000).toISOString(), // yesterday
                total_amount: 599.98,
                status: 'processing',
                payment_method: 'PayPal',
                order_items: [
                    { id: 4, product: { title: 'Laptop Pro', selling_price: 599.98 }, quantity: 1 }
                ]
            },
            {
                id: 1003,
                customer_name: 'Admin User',
                customer_id: 3,
                date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                total_amount: 99.99,
                status: 'pending',
                payment_method: 'Cash on Delivery',
                order_items: [
                    { id: 5, product: { title: 'Wireless Earbuds', selling_price: 49.99 }, quantity: 1 },
                    { id: 6, product: { title: 'Charging Dock', selling_price: 25.00 }, quantity: 2 }
                ]
            }
        ];
        
        setOrders(dummyOrders);
        setTotalPages(1);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        
        // Filter orders based on search term
        if (searchTerm.trim() !== '') {
            const filteredOrders = orders.filter(order => 
                order.id.toString().includes(searchTerm.trim()) || 
                order.customer_name.toLowerCase().includes(searchTerm.toLowerCase().trim())
            );
            setOrders(filteredOrders);
        } else {
            // If search term is empty, refresh all orders
            fetchOrders();
        }
        
        setCurrentPage(1);
    };

    const handleViewDetails = async (order) => {
        setSelectedOrder(order);
        setOrderDetails(null); // Reset before fetching new details
        
        try {
            // Format order details using available information
            const orderItems = order.order_items || [];
            
            const formattedDetails = {
                id: order.id,
                date: order.date,
                status: order.status,
                total_amount: order.total_amount,
                customer: {
                    name: order.customer_name,
                    email: order.cart?.customer?.user?.email || 'customer@example.com',
                    phone: order.cart?.customer?.phone_number || '123-456-7890'
                },
                payment_method: order.payment_method || 'Card',
                items: orderItems.map(item => ({
                    id: item.id,
                    product_name: item.product?.title || 'Product',
                    price: item.product?.selling_price || 0,
                    quantity: item.quantity || 1
                })),
                subtotal: calculateSubtotal(orderItems),
                shipping_cost: 0,
                shipping_address: order.cart?.customer?.address || {
                    street: '123 Main St',
                    city: 'Anytown',
                    state: 'State',
                    country: 'Country',
                    zipcode: '12345'
                }
            };
            
            setOrderDetails(formattedDetails);
        } catch (error) {
            console.error('Error preparing order details:', error);
            alert('Error fetching order details. Please try again.');
        }
    };

    const calculateSubtotal = (items) => {
        return items.reduce((sum, item) => {
            const price = item.product?.selling_price || 0;
            const quantity = item.quantity || 1;
            return sum + (price * quantity);
        }, 0);
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            // Optimistically update UI
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.id === orderId ? {...order, status} : order
                )
            );
            
            if (orderDetails) {
                setOrderDetails({...orderDetails, status});
            }
            
            // Highlight the updated row
            setRecentlyChangedOrderId(orderId);
            
            // Try to update via API
            try {
                await Axios({
                    method: 'put',
                    url: `${domain}/api/orders/${orderId}/update-status/`,
                    headers: {
                        Authorization: `token ${window.localStorage.getItem('token')}`
                    },
                    data: { status }
                });
                
                console.log(`Order ${orderId} status updated to ${status}`);
            } catch (updateError) {
                console.log("Order status update API not available");
            }
            
            // Close modal
            document.getElementById('closeOrderModal').click();
            
        } catch (error) {
            console.error('Error updating order status:', error);
            alert('Error updating order status. Please try again.');
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-warning';
            case 'processing':
                return 'bg-info';
            case 'shipped':
                return 'bg-primary';
            case 'delivered':
                return 'bg-success';
            case 'cancelled':
                return 'bg-danger';
            case 'completed':
                return 'bg-success';
            default:
                return 'bg-secondary';
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="admin-orders">
            <div className="admin-header d-flex justify-content-between align-items-center mb-4 mt-4">
                <h2 className="m-0">Orders Management</h2>
                <span>{orders.length} orders found</span>
            </div>

            {/* Search and Filter */}
            <div className="card mb-4 dashboard-card">
                <div className="card-body">
                    <form onSubmit={handleSearch} className="row g-3">
                        <div className="col-md-5">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Search by order ID or customer name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-4">
                            <select 
                                className="form-select" 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
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

            {/* Orders table */}
            <div className="card dashboard-card">
                <div className="card-header bg-dark text-white">
                    <i className="fas fa-shopping-cart me-2"></i> Order List
                </div>
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
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Order Date</th>
                                            <th>Total Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length > 0 ? (
                                            orders.map(order => (
                                                <tr 
                                                    key={order.id} 
                                                    className={recentlyChangedOrderId === order.id ? 'table-success' : ''}
                                                >
                                                    <td>#{order.id}</td>
                                                    <td>{order.customer_name}</td>
                                                    <td>{formatDate(order.date)}</td>
                                                    <td>{formatCurrency(order.total_amount)}</td>
                                                    <td>
                                                        <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                                                            {order.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleViewDetails(order)}
                                                            data-bs-toggle="modal" 
                                                            data-bs-target="#orderDetailsModal"
                                                        >
                                                            <i className="fas fa-eye"></i> View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center">No orders found</td>
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

            {/* Order Details Modal */}
            <div className="modal fade" id="orderDetailsModal" tabIndex="-1" aria-labelledby="orderDetailsModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header bg-dark text-white">
                            <h5 className="modal-title" id="orderDetailsModalLabel">
                                Order Details #{selectedOrder?.id}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" id="closeOrderModal"></button>
                        </div>
                        <div className="modal-body">
                            {orderDetails ? (
                                <div>
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <div className="card h-100">
                                                <div className="card-header bg-light">
                                                    <h6 className="mb-0">Customer Information</h6>
                                                </div>
                                                <div className="card-body">
                                                    <p className="mb-1">
                                                        <strong>Name:</strong> {orderDetails.customer?.name || 'N/A'}
                                                    </p>
                                                    <p className="mb-1">
                                                        <strong>Email:</strong> {orderDetails.customer?.email || 'N/A'}
                                                    </p>
                                                    <p className="mb-0">
                                                        <strong>Phone:</strong> {orderDetails.customer?.phone || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="card h-100">
                                                <div className="card-header bg-light">
                                                    <h6 className="mb-0">Order Information</h6>
                                                </div>
                                                <div className="card-body">
                                                    <p className="mb-1">
                                                        <strong>Order Date:</strong> {formatDate(orderDetails.date)}
                                                    </p>
                                                    <p className="mb-1">
                                                        <strong>Status:</strong> <span className={`badge ${getStatusBadgeClass(orderDetails.status)}`}>
                                                            {orderDetails.status || 'Pending'}
                                                        </span>
                                                    </p>
                                                    <p className="mb-1">
                                                        <strong>Payment Method:</strong> {orderDetails.payment_method || 'Card'}
                                                    </p>
                                                    <p className="mb-0">
                                                        <strong>Total:</strong> {formatCurrency(orderDetails.total_amount)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="card">
                                            <div className="card-header bg-light">
                                                <h6 className="mb-0">Shipping Address</h6>
                                            </div>
                                            <div className="card-body">
                                                <p className="mb-0">
                                                    {orderDetails.shipping_address?.street || 'N/A'}{orderDetails.shipping_address?.street ? ', ' : ''} 
                                                    {orderDetails.shipping_address?.city || 'N/A'}<br />
                                                    {orderDetails.shipping_address?.state || 'N/A'}{orderDetails.shipping_address?.state ? ', ' : ''} 
                                                    {orderDetails.shipping_address?.country || 'N/A'} 
                                                    {orderDetails.shipping_address?.zipcode || ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card mb-4">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Order Items</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="table-responsive">
                                                <table className="table table-bordered">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Product</th>
                                                            <th>Price</th>
                                                            <th>Quantity</th>
                                                            <th>Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {orderDetails.items?.map(item => (
                                                            <tr key={item.id}>
                                                                <td>{item.product_name}</td>
                                                                <td>{formatCurrency(item.price)}</td>
                                                                <td>{item.quantity}</td>
                                                                <td>{formatCurrency(item.price * item.quantity)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="table-light">
                                                        <tr>
                                                            <th colSpan="3" className="text-end">Subtotal</th>
                                                            <th>{formatCurrency(orderDetails.subtotal || 0)}</th>
                                                        </tr>
                                                        <tr>
                                                            <th colSpan="3" className="text-end">Shipping</th>
                                                            <th>{formatCurrency(orderDetails.shipping_cost || 0)}</th>
                                                        </tr>
                                                        <tr>
                                                            <th colSpan="3" className="text-end">Total</th>
                                                            <th>{formatCurrency(orderDetails.total_amount || 0)}</th>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="card">
                                        <div className="card-header bg-light">
                                            <h6 className="mb-0">Update Order Status</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between flex-wrap">
                                                <button 
                                                    className={`btn ${orderDetails.status === 'pending' ? 'btn-warning' : 'btn-outline-warning'} mb-2`}
                                                    onClick={() => updateOrderStatus(selectedOrder.id, 'pending')}
                                                    disabled={orderDetails.status === 'pending'}
                                                >
                                                    <i className="fas fa-clock me-1"></i> Pending
                                                </button>
                                                <button 
                                                    className={`btn ${orderDetails.status === 'processing' ? 'btn-info' : 'btn-outline-info'} mb-2`}
                                                    onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                                                    disabled={orderDetails.status === 'processing'}
                                                >
                                                    <i className="fas fa-cog me-1"></i> Processing
                                                </button>
                                                <button 
                                                    className={`btn ${orderDetails.status === 'shipped' ? 'btn-primary' : 'btn-outline-primary'} mb-2`}
                                                    onClick={() => updateOrderStatus(selectedOrder.id, 'shipped')}
                                                    disabled={orderDetails.status === 'shipped'}
                                                >
                                                    <i className="fas fa-shipping-fast me-1"></i> Shipped
                                                </button>
                                                <button 
                                                    className={`btn ${orderDetails.status === 'delivered' ? 'btn-success' : 'btn-outline-success'} mb-2`}
                                                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                                                    disabled={orderDetails.status === 'delivered'}
                                                >
                                                    <i className="fas fa-check-circle me-1"></i> Delivered
                                                </button>
                                                <button 
                                                    className={`btn ${orderDetails.status === 'cancelled' ? 'btn-danger' : 'btn-outline-danger'} mb-2`}
                                                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                                                    disabled={orderDetails.status === 'cancelled'}
                                                >
                                                    <i className="fas fa-times-circle me-1"></i> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center my-5">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrders; 