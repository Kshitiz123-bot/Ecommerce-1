import React, { useState } from 'react';
import Axios from 'axios';
import { Link, useHistory } from 'react-router-dom';
import { domain, header2 } from '../../env';
import './PasswordReset.css';

const PasswordReset = () => {
    const [step, setStep] = useState(1);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const history = useHistory();

    // Function to normalize phone number (remove spaces, dashes, etc.)
    const normalizePhoneNumber = (phone) => {
        return phone.replace(/\D/g, '');
    };

    // Function to normalize OTP (remove spaces, etc.)
    const normalizeOTP = (otpValue) => {
        return otpValue.replace(/\s/g, '');
    };

    const handleRequestOTP = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        
        if (!normalizedPhone || normalizedPhone.length < 10) {
            setError('Please enter a valid phone number');
            setIsLoading(false);
            return;
        }

        Axios({
            method: 'post',
            url: `${domain}/api/generate-otp/`,
            headers: header2,
            data: {
                phone_number: normalizedPhone
            }
        })
        .then(response => {
            if (!response.data.error) {
                setMessage('OTP sent to your phone number. Please check your SMS.');
                setPhoneNumber(normalizedPhone); // Store normalized phone number
                setStep(2);
            } else {
                setError(response.data.message);
            }
            setIsLoading(false);
        })
        .catch(error => {
            console.error("OTP request error:", error);
            setError('Failed to send OTP. Please try again or contact support.');
            setIsLoading(false);
        });
    };

    const handleVerifyOTP = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        const normalizedOTP = normalizeOTP(otp);
        
        if (!normalizedOTP || normalizedOTP.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            setIsLoading(false);
            return;
        }

        Axios({
            method: 'post',
            url: `${domain}/api/verify-otp/`,
            headers: header2,
            data: {
                phone_number: phoneNumber,
                otp: normalizedOTP
            }
        })
        .then(response => {
            if (!response.data.error) {
                setMessage('OTP verified successfully');
                setStep(3);
            } else {
                setError(response.data.message);
            }
            setIsLoading(false);
        })
        .catch(error => {
            console.error("OTP verification error:", error);
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError('Failed to verify OTP. Please try again with the correct OTP.');
            }
            setIsLoading(false);
        });
    };

    const handleResetPassword = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            setIsLoading(false);
            return;
        }

        Axios({
            method: 'post',
            url: `${domain}/api/reset-password/`,
            headers: header2,
            data: {
                phone_number: phoneNumber,
                new_password: newPassword,
                confirm_password: confirmPassword
            }
        })
        .then(response => {
            if (!response.data.error) {
                setMessage('Password reset successfully');
                setTimeout(() => {
                    history.push('/login');
                }, 2000);
            } else {
                setError(response.data.message);
            }
            setIsLoading(false);
        })
        .catch(error => {
            console.error("Password reset error:", error);
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError('Failed to reset password. Please try again.');
            }
            setIsLoading(false);
        });
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <form onSubmit={handleRequestOTP}>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                className="form-control"
                                placeholder="Enter your phone number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                            <small className="form-text text-muted">
                                We'll send a one-time password to this number.
                            </small>
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                );
            case 2:
                return (
                    <form onSubmit={handleVerifyOTP}>
                        <div className="form-group">
                            <label>Enter OTP</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter the 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                required
                            />
                            <small className="form-text text-muted">
                                Enter the OTP sent to your phone number via SMS.
                            </small>
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-link btn-block"
                            onClick={() => setStep(1)}
                            disabled={isLoading}
                        >
                            Back
                        </button>
                    </form>
                );
            case 3:
                return (
                    <form onSubmit={handleResetPassword}>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group mt-3">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-link btn-block"
                            onClick={() => setStep(2)}
                            disabled={isLoading}
                        >
                            Back
                        </button>
                    </form>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center mt-5">
                <div className="col-md-6">
                    <div className="card password-reset-card">
                        <div className="card-body">
                            <h3 className="card-title text-center mb-4">Reset Password</h3>
                            
                            {message && (
                                <div className="alert alert-success" role="alert">
                                    {message}
                                </div>
                            )}
                            
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            
                            {renderStep()}
                            
                            <div className="text-center mt-3">
                                <Link to="/login">Back to Login</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordReset; 