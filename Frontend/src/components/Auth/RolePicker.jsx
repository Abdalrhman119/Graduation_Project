import React from 'react';

export default function RolePicker({ onSelectRole, onGoToLogin }) {
    return (
        <section id="view-role-picker" className="view active">
            <div className="center-wrap">
                <div className="glass-card auth-card">
                    <div className="brand">
                        <div className="brand-icon">🔬</div>
                        <h1>Gastro<span>AI</span></h1>
                        <p>Intelligent Medical Image Analysis Platform</p>
                    </div>

                    <div className="auth-switcher">
                        <button className="auth-switch-btn active" id="btn-go-register">Create Account</button>
                        <button className="auth-switch-btn" onClick={onGoToLogin} id="btn-go-login">Sign In</button>
                    </div>

                    <div className="role-picker-section">
                        <h2 className="picker-title">Who are you?</h2>
                        <p class="picker-sub">Choose your role to get started</p>
                        <div className="role-cards">
                            <button className="role-card" onClick={() => onSelectRole('patient')} id="pick-patient">
                                <div className="role-icon">🧑‍⚕️</div>
                                <h3>Patient</h3>
                                <p>Upload scans, track results &amp; connect with doctors</p>
                                <span className="role-arrow">→</span>
                            </button>
                            <button className="role-card" onClick={() => onSelectRole('doctor')} id="pick-doctor">
                                <div className="role-icon">👨‍⚕️</div>
                                <h3>Doctor</h3>
                                <p>Review AI results, manage patients &amp; respond to cases</p>
                                <span className="role-arrow">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
