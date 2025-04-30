import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Axios from 'axios';
import { domain } from '../../env';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const history = useHistory();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: New Password
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await Axios({
                method: 'post',
                url: `${domain}/api/send-otp/`,
                data: {
                    phone_number: phoneNumber
                }
            });

            if (response.data.success) {
                setStep(2);
                setError('');
                
                // Show OTP in development mode
                if (response.data.otp) {
                    const message = `
🔐 Your OTP Details:
---------------------
📱 Phone: ${phoneNumber}
🔑 OTP: ${response.data.otp}
⏳ Expires in: ${response.data.expiry}

Please use this OTP to verify your account.`;
                    
                    alert(message);
                }
            } else {
                setError(response.data.message || 'Failed to send OTP');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await Axios({
                method: 'post',
                url: `${domain}/api/verify-otp/`,
                data: {
                    phone_number: phoneNumber,
                    otp: otp
                }
            });

            if (response.data.success) {
                setStep(3);
                setError('');
            } else {
                setError('Invalid OTP');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');

        if (!newPassword || !confirmPassword) {
            setError('Please enter both passwords');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await Axios({
                method: 'post',
                url: `${domain}/api/reset-password/`,
                data: {
                    phone_number: phoneNumber,
                    otp: otp,
                    new_password: newPassword
                }
            });

            if (response.data.success) {
                alert('Password reset successful! Please login with your new password.');
                history.push('/login');
            } else {
                setError(response.data.message || 'Password reset failed');
            }
        } catch (error) {
            console.error('Password reset error:', error.response?.data);
            setError(error.response?.data?.message || 'Password reset failed');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <form onSubmit={handlePhoneSubmit} className="forgot-password-form">
                        <h2>Forgot Password</h2>
                        <p>Enter your registered phone number to receive an OTP</p>
                        <div className="form-group">
                            <input
                                type="tel"
                                className="form-control"
                                placeholder="Phone Number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                );

            case 2:
                return (
                    <form onSubmit={handleOtpSubmit} className="forgot-password-form">
                        <h2>Enter OTP</h2>
                        <p>Please enter the OTP sent to {phoneNumber}</p>
                        <div className="form-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                maxLength={6}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-link" 
                            onClick={() => setStep(1)}
                        >
                            Change Phone Number
                        </button>
                    </form>
                );

            case 3:
                return (
                    <form onSubmit={handlePasswordReset} className="forgot-password-form">
                        <h2>Reset Password</h2>
                        <p>Enter your new password</p>
                        <div className="form-group">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                            <small className="form-text text-muted">
                                Password must be at least 8 characters long
                            </small>
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </form>
                );

            default:
                return null;
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-box">
                {error && <div className="alert alert-danger">{error}</div>}
                {renderStep()}
            </div>
        </div>
    );
};

export default ForgotPassword; 