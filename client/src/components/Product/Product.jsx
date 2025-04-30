import Axios from 'axios'
import React, { useState, useEffect } from 'react';
import {Link, useHistory} from 'react-router-dom'
import {domain} from '../../env'
import {useGlobalState} from '../../state/provider'
import './Product.css'


const Product = ({item}) => {
    const [{profile}, dispatch] = useGlobalState()
    const history = useHistory();
    const [notification, setNotification] = useState({show: false, message: '', type: ''});

    // Hide notification after 3 seconds
    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => {
                setNotification({...notification, show: false});
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const addToCart = async (id) => {
        profile !== null ? (
            await Axios({
                method: 'post',
                url: `${domain}/api/addToCart/`,
                headers: {
                    Authorization: `token ${window.localStorage.getItem('token')}`
                },
                data: {"id": id}
            }).then(response => {
                dispatch({
                    type: "ADD_RELOAD_PAGE_DATA",
                    reloadPage: response
                });
                setNotification({
                    show: true,
                    message: response.data.message || 'Product added to cart',
                    type: response.data.error ? 'danger' : 'success'
                });
            })
        ) : (
            history.push("/login")
        )
    };

    return (
        <>
            {/* Notification Message */}
            {notification.show && (
                <div className={`alert alert-${notification.type} alert-dismissible fade show position-fixed`} 
                     style={{top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 1050, minWidth: '300px', textAlign: 'center'}}>
                    {notification.message}
                    <button type="button" className="btn-close" onClick={() => setNotification({...notification, show: false})}></button>
                </div>
            )}
            
            <div className="card mt-4">
                <Link
                    to={`/product/${item.id}`}
                    className="product_image"
                    style={{display: 'block', marginLeft: 'auto', marginRight: 'auto'}}
                >
                    <img 
                        className="card-img" 
                        src={item.image ? 
                            (item.image.startsWith('http') ? 
                                item.image : 
                                `${domain}/media/${item.image.replace(/^\/?media\/?/, '')}`
                            ) : 
                            `${domain}/media/products/default.jpg`
                        }
                        alt={item.title}
                        style={{ 
                            width: '100%', 
                            height: '200px', 
                            objectFit: 'contain',
                            padding: '10px',
                            display: 'block'
                        }}
                        onError={(e) => {
                            console.log('Image load error:', e.target.src);
                            e.target.src = `${domain}/media/products/default.jpg`;
                        }}
                    />
                </Link>
                <div className="card-body">
                    <h4 className="card-title">{item.title}</h4>
                    <p className="card-text">
                        {item.description.substring(0, 50)}...{' '}
                        <Link to={`/product/${item.id}`} style={{textDecoration: 'none'}}>
                            {' '}
                            Read more
                        </Link>
                    </p>
                    <div className="buy d-flex justify-content-between align-items-center">
                        <div className="price">
                            <h5 className="mt-4">
                                {' '}
                                Price: <del className="text-danger">
                                {item.market_price}NPR
                            </del>{' '}
                                <i className="text-success">{item.selling_price}NPR</i>
                            </h5>
                        </div>
                        <button onClick={() => addToCart(item.id)} className="btn btn-warning mt-3">
                            <i className="fas fa-shopping-cart"/> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Product;
