import React from 'react';

export default function SplashView() {
    return (
        <section id="view-splash" className="view active">
            <div className="center-wrap">
                <div className="logo-container" style={{ textAlign: 'center' }}>
                    <div className="brand-icon pulse" style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔬</div>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--text)', fontWeight: 800, letterSpacing: '-1px' }}>
                        Gastro<span style={{ color: 'var(--primary)' }}>AI</span>
                    </h1>
                    <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Initializing secure session...</p>
                </div>
            </div>
        </section>
    );
}
