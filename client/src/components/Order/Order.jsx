import Axios from 'axios'
import React, { useState, useEffect } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { domain } from '../../env'
import { useGlobalState } from '../../state/provider'
import './Order.css'

const Order = () => {
    const [{ cart_product_incomplete }, dispatch] = useGlobalState()
    const [address, setAddress] = useState("")
    const [mobile, setMobile] = useState("")
    const [email, setEmail] = useState("")
    const [selectedPayment, setSelectedPayment] = useState('')
    const [loading, setLoading] = useState(false)
    const history = useHistory()
    const orderData = {
        "cartId": cart_product_incomplete[0]?.id,
        "address": address,
        "mobile": mobile,
        "email": email,
        "payment_method": selectedPayment
    }
    const token = window.localStorage.getItem('token')
    const handleKhaltiPayment = async () => {
        // Validate required fields
        if (!address || !mobile || !email) {
            alert('Please fill in all required fields (address, mobile, email)');
            return;
        }

        if (!cart_product_incomplete?.[0]?.total) {
            alert('Invalid cart total. Please add items to your cart.');
            return;
        }

        setLoading(true);
        try {
            const khaltiConfig = {
                publicKey: 'live_public_dec8afdf818742188d5303529f631f2b',
                productIdentity: orderData.cartId,
                productName: 'SK Electronics Order',
                productUrl: window.location.href,
                amount: Math.round(cart_product_incomplete[0]?.total * 100), // Convert to paisa and ensure it's an integer
                eventHandler: {
                    onSuccess: async (payload) => {
                        try {
                            orderData.payment_details = payload;
                            await orderNow();
                        } catch (error) {
                            console.error('Order processing error:', error);
                            alert('Payment successful but order processing failed. Please contact support.');
                            setLoading(false);
                        }
                    },
                    onError: (error) => {
                        console.error('Khalti payment error:', error);
                        alert('Payment failed! Please try again or use a different payment method.');
                        setLoading(false);
                    },
                    onClose: () => {
                        setLoading(false);
                    }
                }
            };
            
            // Remove any existing Khalti script
            const existingScript = document.querySelector('script[src*="khalti-checkout"]');
            if (existingScript) {
                existingScript.remove();
            }

            // Load Khalti script
            const script = document.createElement('script');
            script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.22.0.0.0/khalti-checkout.iffe.js';
            script.async = true;
            script.onload = () => {
                try {
                    const checkout = new window.KhaltiCheckout(khaltiConfig);
                    checkout.show({ amount: Math.round(cart_product_incomplete[0]?.total * 100) });
                } catch (error) {
                    console.error('Khalti checkout initialization error:', error);
                    alert('Failed to initialize payment. Please try again.');
                    setLoading(false);
                }
            };
            script.onerror = () => {
                console.error('Failed to load Khalti script');
                alert('Failed to load payment system. Please try again later.');
                setLoading(false);
            };
            document.body.appendChild(script);
        } catch (error) {
            console.error('Khalti payment error:', error);
            alert('Payment initialization failed! Please try again.');
            setLoading(false);
        }
    };



    const [cardElements, setCardElements] = useState(null);
    const [stripe, setStripe] = useState(null);
    const [cardError, setCardError] = useState('');
    const [showCardForm, setShowCardForm] = useState(false);

    useEffect(() => {
        const loadStripe = async () => {
            if (!window.Stripe) {
                const script = document.createElement('script');
                script.src = 'https://js.stripe.com/v3/';
                script.async = true;
                await new Promise((resolve) => {
                    script.onload = resolve;
                    document.body.appendChild(script);
                });
            }

            if (!stripe) {
                const stripeInstance = window.Stripe('pk_test_51RJIz62V7QVzLQeSISo6eLkjzd7oEyiqxScFxCt4psXMGJXATVaYtnNcwdoJC1u9hfX1FxWt8ANPEG5tauqbM6AG00u5gYFLXg', {
                    apiVersion: '2023-10-16'
                });
                setStripe(stripeInstance);
            }
        };
        loadStripe();
    }, [stripe]);

    useEffect(() => {
        let mounted = true;

        const initializeCard = async () => {
            if (showCardForm && stripe && !cardElements) {
                const elements = stripe.elements();
                const card = elements.create('card', {
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#32325d',
                            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                            '::placeholder': {
                                color: '#aab7c4'
                            },
                            ':-webkit-autofill': {
                                color: '#32325d'
                            }
                        },
                        invalid: {
                            color: '#dc3545',
                            iconColor: '#dc3545'
                        }
                    },
                    hidePostalCode: true
                });

                const cardElement = document.getElementById('card-element');
                if (cardElement && mounted) {
                    card.mount('#card-element');
                    card.on('change', (event) => {
                        if (mounted) {
                            setCardError(event.error ? event.error.message : '');
                            const submitButton = document.querySelector('button[type="submit"]');
                            if (submitButton) {
                                submitButton.disabled = event.empty || !!event.error;
                            }
                        }
                    });
                    setCardElements(card);
                }
            }
        };

        initializeCard();

        return () => {
            mounted = false;
            if (cardElements) {
                cardElements.unmount();
            }
        };
    }, [showCardForm, stripe, cardElements]);

    const handleCardPayment = async (e) => {
        if (e) e.preventDefault();
        
        if (!showCardForm) {
            setShowCardForm(true);
            return;
        }

        if (!stripe || !cardElements) {
            setCardError('Please wait while we initialize the payment form.');
            return;
        }

        if (!address || !mobile || !email) {
            setCardError('Please fill in all required fields.');
            return;
        }

        if (!cart_product_incomplete?.[0]?.total) {
            setCardError('Invalid cart total.');
            return;
        }

        setLoading(true);
        setCardError('');

        try {
            // Create payment method
            const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElements,
                billing_details: {
                    address: {
                        line1: address
                    },
                    email: email,
                    phone: mobile
                }
            });

            if (paymentMethodError) {
                console.error('Payment method creation error:', paymentMethodError);
                setCardError(paymentMethodError.message);
                setLoading(false);
                return;
            }

            // Create order with payment method ID
            const orderResponse = await Axios({
                method: "post",
                url: `${domain}/api/orders/`,
                headers: {
                    Authorization: `token ${token}`
                },
                data: {
                    ...orderData,
                    payment_method_id: paymentMethod.id
                }
            });

            // Process the payment
            const response = await Axios.post(`${domain}/api/process-payment/`, {
                payment_method_id: paymentMethod.id,
                amount: cart_product_incomplete[0]?.total * 100,
                order_id: orderResponse.data.id
            });

            if (response.data.success) {
                dispatch({
                    type: "ADD_RELOAD_PAGE_DATA",
                    reloadPage: orderResponse
                });
                dispatch({
                    type: "ADD_CART_PRODUCT_INCOMPLETE",
                    cart_product_incomplete: null
                });
                history.push('/oldOrders');
            } else {
                throw new Error('Payment processing failed');
            }
        } catch (error) {
            console.error('Card payment error:', error);
            setCardError(error.message || 'An error occurred while processing your payment');
        } finally {
            setLoading(false);
        }
    };

    const orderNow = async () => {
        try {
            const response = await Axios({
                method: "post",
                url: `${domain}/api/orders/`,
                headers: {
                    Authorization: `token ${token}`
                },
                data: orderData
            });
            
            history.push('/oldOrders');
            dispatch({
                type: "ADD_RELOAD_PAGE_DATA",
                reloadPage: response
            });
            dispatch({
                type: "ADD_CART_PRODUCT_INCOMPLETE",
                cart_product_incomplete: null
            });
        } catch (error) {
            console.error('Order completion error:', error);
            alert('Failed to complete order!');
            setLoading(false);
        }
    };
    return (
        <div className="order-page-container">
            <div className="container py-4">
                <h2 className="page-title mb-4">Complete Your Order</h2>
                <div className="row">
                    <div className="col-lg-7 mb-4">
                        <div className="card order-summary-card">
                            <div className="card-header bg-primary text-white">
                                <h4 className="mb-0">Order Summary</h4>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="thead-light">
                                            <tr>
                                                <th>SN</th>
                                                <th>Product</th>
                                                <th>Rate</th>
                                                <th>Quantity</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                cart_product_incomplete[0]?.cart_product.map((data, i) => (
                                                    <tr key={i}>
                                                        <td>{i + 1}</td>
                                                        <td className="product-name">{data.product[0].title}</td>
                                                        <td>NPR{data.price}</td>
                                                        <td>{data.quantity}</td>
                                                        <td className="subtotal">NPR{data.subtotal}</td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                        <tfoot className="table-footer">
                                            <tr className="total-row">
                                                <th colSpan="4" className="text-right">Total</th>
                                                <th className="total-amount">NPR{cart_product_incomplete[0]?.total}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                <div className="card-footer d-flex justify-content-end">
                                    <Link to='/cart/' className="btn btn-outline-secondary">
                                        <i className="fa fa-edit mr-1"></i> Edit Cart
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-5">
                        <div className="card checkout-card">
                            <div className="card-header bg-success text-white">
                                <h4 className="mb-0">Shipping Information</h4>
                            </div>
                            <div className="card-body">
                                <form className="checkout-form">
                                    <div className="form-group">
                                        <label className="form-label">Delivery Address</label>
                                        <input 
                                            onChange={(e) => setAddress(e.target.value)} 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Enter your full address" 
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Mobile Number</label>
                                        <input 
                                            onChange={(e) => setMobile(e.target.value)} 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Enter your mobile number" 
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input 
                                            onChange={(e) => setEmail(e.target.value)} 
                                            type="email" 
                                            className="form-control" 
                                            placeholder="Enter your email address" 
                                            required
                                        />
                                    </div>
                                    <div className="payment-methods mt-4">
                                        <h4 className="mb-3">Select Payment Method</h4>
                                        <div className="payment-options">
                                            <button 
                                                className={`btn btn-block mb-2 ${selectedPayment === 'khalti' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => {
                                                    setSelectedPayment('khalti');
                                                    handleKhaltiPayment();
                                                }}
                                                disabled={loading || !address || !mobile || !email}
                                            >
                                                <i className="fas fa-wallet mr-2"></i>
                                                Pay with Khalti
                                            </button>

                                            <div>
                                                <button 
                                                    className={`btn btn-block ${selectedPayment === 'card' ? 'btn-info' : 'btn-outline-info'}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setSelectedPayment('card');
                                                        setShowCardForm(true);
                                                        handleCardPayment(e);
                                                    }}
                                                    disabled={loading || !address || !mobile || !email}
                                                    type="button"
                                                >
                                                    <i className="fas fa-credit-card mr-2"></i>
                                                    Pay with Card
                                                </button>
                                                
                                                {(selectedPayment === 'card' || showCardForm) && (
                                                    <div className="card-payment-form mt-3">
                                                        <div id="card-element" className="form-control mb-3"></div>
                                                        {cardError && (
                                                            <div className="alert alert-danger mb-3">
                                                                {cardError}
                                                            </div>
                                                        )}
                                                        <button 
                                                            className="btn btn-success btn-block"
                                                            onClick={handleCardPayment}
                                                            disabled={loading || !stripe || !cardElements}
                                                            type="button"
                                                        >
                                                            {loading ? 'Processing...' : 'Complete Payment'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {loading && (
                                        <div className="text-center mt-3">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="sr-only">Processing payment...</span>
                                            </div>
                                            <p className="mt-2">Processing payment...</p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Order;