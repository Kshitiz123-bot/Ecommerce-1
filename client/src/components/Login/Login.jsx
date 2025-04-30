import Axios from 'axios';
import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {domain, header2} from '../../env';
import styles from './Login.module.css';

const Login = () => {
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^\d{10}$/;  // Validates 10-digit phone numbers
        return phoneRegex.test(phone);
    };

    const loginButton = (e) => {
        e.preventDefault();
        setErrors({});

        Axios({
            url: `${domain}/api/login/`,
            method: 'post',
            headers: header2,
            data: {
                login_id: loginId,
                password: password,
            },
        })
            .then((response) => {
                window.localStorage.setItem('token', response.data['token']);
                window.location.href = '/';
            })
            .catch((error) => {
                if (error.response.status === 400)
                    setErrors({[Object.keys(error.response.data)[0]]: 'Username/Phone number OR Password is invalid. Try Again!'});
                else
                    setErrors({'error': 'Internal Server Error Try Again!!!'});
            });
    };

    return (
        <div className="container">
            <div className="row m-5 no-gutters shadow-lg">
                <div className="col-md-6 bg-white p-5">
                    <h3 className="pb-3">Login</h3>
                    <div className="form-style">
                        <form>
                            <div className="form-group pb-3">
                                <input
                                    type="text"
                                    placeholder="Username or Phone Number"
                                    className="form-control"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    required
                                />
                                <small className="text-muted">Enter your username or registered phone number</small>
                            </div>
                            <div className="form-group pb-3">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="form-control"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <div className="text-right mt-2">
                                    <Link to="/forgot-password" className="forgot-password-link">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>
                            <div className="pb-2">
                                <button
                                    type="submit"
                                    className="btn btn-dark w-100 font-weight-bold mt-2"
                                    onClick={(e) => loginButton(e)}
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                        <div className="mt-4 text-center">
                            Haven't Registered Yet?{' '}
                            <Link to="/register" style={{textDecoration: 'none'}}>
                                Register Now
                            </Link>
                        </div>
                        <div className="mt-4">
                            {Object.keys(errors).map((keyName, i) => (
                                <div key={i} className={styles.errorMsg}>
                                    <i className="fa fa-times-circle"/>
                                    <span style={{marginLeft: '5px'}}>{errors[keyName]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div
                    className="col-md-6 d-none d-md-block"
                    style={{height: '500px', paddingLeft: 0, paddingRight: 0}}
                >
                    <img
                        src="https://images.unsplash.com/photo-1566888596782-c7f41cc184c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=2134&q=80"
                        className="img-fluid"
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        alt="login"
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
