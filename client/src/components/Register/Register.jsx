import Axios from 'axios';
import React, {useState} from 'react';
import {Link, useHistory} from 'react-router-dom';
import {domain, header2} from '../../env';
import styles from './Register.module.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [errors, setErrors] = useState({});
    const history = useHistory();

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^\d{10}$/;  // Validates 10-digit phone numbers
        return phoneRegex.test(phone);
    };

    const registerButton = async (e) => {
        e.preventDefault();
        setErrors({});

        // Validate phone number
        if (!validatePhoneNumber(phoneNumber)) {
            setErrors({...errors, 'phone': 'Please enter a valid 10-digit phone number'});
            return;
        }

        // Validate username
        if (!username.trim()) {
            setErrors({...errors, 'username': 'Username is required'});
            return;
        }

        if (password !== password2) {
            setErrors({...errors, 'password': 'Password not Matched try Again !'});
        } else {
            try {
                const response = await Axios({
                    method: 'post',
                    url: `${domain}/api/register/`,
                    headers: header2,
                    data: {
                        username: username,
                        password: password,
                        first_name: firstName,
                        last_name: lastName,
                        password2: password2,
                        email: email,
                        phone_number: phoneNumber
                    },
                });

                if (response.data['data']) {
                    history.push('/login');
                }
                if (response.data.error) {
                    setErrors({...errors, ...response.data.message});
                }
            } catch (error) {
                setErrors({...errors, ...error.response?.data?.message || {'error': 'Registration failed'}});
            }
        }
    };

    return (
        <div className="container">
            <div className="row m-5 no-gutters shadow-lg">
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
                <div className="col-md-6 bg-white p-5">
                    <h3 className="pb-3">Register</h3>
                    <div className="form-style">
                        <form>
                            <div className="row form-group pb-3">
                                <div className="col">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        className="form-control"
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div className="col">
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        className="form-control"
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group pb-3">
                                <input
                                    type="text"
                                    placeholder="Username"
                                    className="form-control"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group pb-3">
                                <input
                                    type="tel"
                                    placeholder="Phone Number (10 digits)"
                                    className="form-control"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    required
                                />
                                <small className="text-muted">Enter your mobile number for verification</small>
                            </div>
                            <div className="form-group pb-3">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    className="form-control"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="form-group pb-3">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="form-control"
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group pb-3">
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    className="form-control"
                                    onChange={(e) => setPassword2(e.target.value)}
                                />
                            </div>

                            <div className="pb-2">
                                <button
                                    type="submit"
                                    className="btn btn-dark w-100 font-weight-bold mt-2"
                                    onClick={(e) => registerButton(e)}
                                >
                                    Submit
                                </button>
                            </div>
                            <div className="pt-4 text-center">
                                Already Registered?{' '}
                                <Link to="/login" style={{textDecoration: 'none'}}>
                                    Login Now
                                </Link>
                            </div>
                            <div>
                                {Object.keys(errors).map((keyName, i) => (
                                    <div key={i} className={styles.errorMsg}>
                                        <i className="fa fa-times-circle"/>
                                        <span style={{marginLeft: '5px'}}>{errors[keyName]}</span>
                                    </div>
                                ))}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
