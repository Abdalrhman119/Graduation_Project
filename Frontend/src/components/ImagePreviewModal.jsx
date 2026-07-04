import React, { useState, useRef, useEffect } from 'react';

export default function ImagePreviewModal({ isOpen, imageUrl, onClose }) {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);

    // Reset state when opened with a new image
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            // Lock body scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Unlock body scroll
            document.body.style.overflow = 'auto';
        }
        
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, imageUrl]);

    if (!isOpen) return null;

    const handleWheel = (e) => {
        e.preventDefault();
        const zoomSensitivity = 0.05;
        const delta = e.deltaY > 0 ? -zoomSensitivity : zoomSensitivity;
        
        setZoom(prev => {
            const next = prev + delta;
            if (next < 0.5) return 0.5;
            if (next > 5) return 5;
            return next;
        });
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoom = (delta) => {
        setZoom(prev => {
            const next = prev + delta;
            if (next < 0.5) return 0.5;
            if (next > 5) return 5;
            return next;
        });
    };

    const resetView = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    return (
        <div 
            style={{ 
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(12px)'
            }}
            onWheel={handleWheel}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div 
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: isDragging ? 'grabbing' : 'grab' }} 
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
            >
                <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}>
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Medical Scan Preview"
                        draggable="false"
                        style={{
                            transform: `scale(${zoom})`,
                            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            maxWidth: '90vw',
                            maxHeight: '85vh',
                            objectFit: 'contain',
                            borderRadius: '16px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                            pointerEvents: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Floating Glass Controls */}
            <div style={{
                position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '10px 20px', borderRadius: '50px',
                display: 'flex', alignItems: 'center', gap: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                zIndex: 100000
            }}>
                <button onClick={() => handleZoom(-0.25)} style={controlBtnStyle} title="Zoom Out">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', minWidth: '45px', textAlign: 'center' }}>
                    {Math.round(zoom * 100)}%
                </span>
                <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }}></div>
                <button onClick={() => handleZoom(0.25)} style={controlBtnStyle} title="Zoom In">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button onClick={resetView} style={{ ...controlBtnStyle, marginLeft: '5px' }} title="Reset View">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                </button>
            </div>

            {/* Close Button */}
            <button 
                onClick={onClose}
                style={{
                    position: 'absolute', top: '1.5rem', right: '1.5rem',
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', cursor: 'pointer', transition: 'all 0.2s ease',
                    zIndex: 100000
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'scale(1)'; }}
                title="Close"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    );
}

const controlBtnStyle = {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.2s ease'
};

