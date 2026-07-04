

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="modal" role="dialog" aria-modal="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div className="modal-backdrop" onClick={onCancel}></div>
            <div className="glass-card confirm-modal-card animate-fade-in" style={{
                maxWidth: '400px',
                width: '90%',
                padding: '2rem',
                position: 'relative',
                zIndex: 10001,
                textAlign: 'center',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                background: 'rgba(20, 30, 55, 0.9)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-white-to-dark)', marginBottom: '0.75rem' }}>
                    {title || 'Are you sure?'}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.75rem', lineHeight: '1.5' }}>
                    {message}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button className="btn btn-danger" onClick={onConfirm} style={{ flex: 1, borderRadius: '50px', padding: '0.65rem' }}>
                        Yes, Delete
                    </button>
                    <button className="btn btn-outline" onClick={onCancel} style={{ flex: 1, borderRadius: '50px', padding: '0.65rem' }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
