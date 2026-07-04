import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginForm({ onGoToRegister }) {
    const { login, showToast } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            showToast('Email and Password are required!', 'warning');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            // Error toast is shown inside AuthContext
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="view-login" className="view active">
            <div className="center-wrap">
                <div className="glass-card auth-card">
                    <div className="brand">
                        <div className="brand-icon">🔬</div>
                        <h1>Gastro<span>AI</span></h1>
                        <p>Welcome back</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="login-email">Email Address</label>
                            <input
                                type="email"
                                id="login-email"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <div className="pass-wrap">
                                <input
                                    type={showPass ? "text" : "password"}
                                    id="login-password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="toggle-pass"
                                    onClick={() => setShowPass(!showPass)}
                                >
                                    {showPass ? '🙈' : '👁'}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Please wait…' : 'Sign In'}
                        </button>
                        <p className="form-footer">
                            Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); onGoToRegister(); }}>Create one</a>
                        </p>
                    </form>
                </div>
            </div>
        </section>
    );
}
