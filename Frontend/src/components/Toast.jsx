import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Toast() {
    const { toast } = useAuth();
    if (!toast.visible) return null;
    return (
        <div className={`toast toast-${toast.type}`} role="alert" style={{ display: 'block' }}>
            {toast.message}
        </div>
    );
}
