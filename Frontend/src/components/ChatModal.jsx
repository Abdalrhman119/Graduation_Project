import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatModal({ isOpen, chatId, partnerName, partnerPhoto, partnerId, partnerRole, onOpenImagePreview, onClose }) {
    const { currentUser, showToast } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [partnerProfile, setPartnerProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const loadMessages = useCallback(async (showSpinner = false) => {
        if (!chatId || !currentUser) return;
        if (showSpinner) setLoading(true);

        try {
            const msgs = await api.getChatMessages(chatId);
            setMessages(msgs || []);

            const myIdStr = String(currentUser.patientId || currentUser.doctorId || '');
            const myRole = currentUser.role;

            const unreadIncoming = (msgs || []).filter(
                m => (String(m.senderId) !== myIdStr || m.senderType?.toLowerCase() !== myRole?.toLowerCase()) && !m.isRead
            );

            if (unreadIncoming.length > 0) {
                unreadIncoming.forEach(m => {
                    api.markMessageAsRead(m.messageId, true).catch(() => { });
                });
            }
        } catch (err) {
            console.error('loadMessages Error:', err);
        } finally {
            if (showSpinner) setLoading(false);
        }
    }, [chatId, currentUser]);

    // Reset profile panel when chat closes or partner changes
    useEffect(() => {
        if (!isOpen) {
            setShowProfile(false);
            setPartnerProfile(null);
        }
    }, [isOpen, chatId]);

    const handleToggleProfile = async () => {
        if (showProfile) {
            setShowProfile(false);
            return;
        }

        setShowProfile(true);

        // Only fetch if not yet loaded for this partner
        if (partnerProfile) return;

        setProfileLoading(true);
        try {
            if (partnerRole?.toLowerCase() === 'doctor') {
                const doctors = await api.getAllDoctors();
                const doc = doctors.find(d => String(d.doctorId) === String(partnerId));
                setPartnerProfile(doc || null);
            } else {
                const p = await api.getPatientById(partnerId);
                setPartnerProfile(p || null);
            }
        } catch (e) {
            console.error('Failed to load partner profile', e);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            showToast('Uploading image... ⏳', 'info');
            const res = await api.uploadProfilePhoto(file);
            if (res && res.url) {
                const senderId = String(currentUser.patientId || currentUser.doctorId);
                const senderType = currentUser.role.toLowerCase() === 'patient' ? 'Patient' : 'Doctor';
                await api.sendMessage(chatId, senderId, res.url, senderType);
                loadMessages(false);
                showToast('Image sent successfully! 📷', 'success');
            }
        } catch (err) {
            showToast(err.message || 'Image upload failed', 'error');
        }
    };

    // Initial load + poll
    useEffect(() => {
        if (!isOpen || !chatId) return;

        const timer = setTimeout(() => { loadMessages(true); }, 0);
        const pollTimer = setInterval(() => { loadMessages(false); }, 3000);

        return () => {
            clearTimeout(timer);
            clearInterval(pollTimer);
        };
    }, [isOpen, chatId, loadMessages]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const text = inputText.trim();
        if (!text || !chatId || !currentUser) return;

        const senderId = String(currentUser.patientId || currentUser.doctorId);
        const senderType = currentUser.role.toLowerCase() === 'patient' ? 'Patient' : 'Doctor';

        if (!currentUser.patientId && !currentUser.doctorId) {
            showToast('Cannot send: profile ID not resolved. Please re-login.', 'error');
            return;
        }

        setInputText('');
        try {
            await api.sendMessage(chatId, senderId, text, senderType);
            loadMessages(false);
        } catch (err) {
            showToast(err.message || 'Send failed', 'error');
            setInputText(text);
        }
    };

    if (!isOpen) return null;

    const myIdStr = String(currentUser.patientId || currentUser.doctorId || '');
    const myRole = currentUser.role;
    const isDoctor = partnerRole?.toLowerCase() === 'doctor';

    const getAvatarHTML = (photo, defaultChar) => {
        if (photo) {
            return <img src={`http://localhost:5170${photo}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="Avatar" />;
        }
        return defaultChar;
    };

    const formatMessageDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }); }
        catch { return ''; }
    };

    const groupedMessages = [];
    let lastDate = null;
    messages.forEach((m, idx) => {
        const msgDateStr = m.sentAt ? new Date(m.sentAt).toDateString() : 'Unknown';
        if (msgDateStr !== lastDate) {
            groupedMessages.push({ type: 'date', label: formatMessageDate(m.sentAt), key: `date-${m.messageId || m.sentAt || idx}` });
            lastDate = msgDateStr;
        }
        groupedMessages.push({ type: 'message', data: m, key: m.messageId || `msg-${idx}` });
    });

    // Profile panel content
    const renderProfilePanel = () => {
        if (profileLoading) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                    <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }}></div>
                </div>
            );
        }

        if (!partnerProfile) {
            return (
                <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '2rem', fontSize: '0.85rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😕</div>
                    Could not load profile.
                </div>
            );
        }

        const photo = partnerProfile.profilePhoto;
        const firstName = partnerProfile.firstName || '';
        const lastName = partnerProfile.lastName || '';
        const fullName = isDoctor ? `Dr. ${firstName} ${lastName}`.trim() : `${firstName} ${lastName}`.trim();

        return (
            <div className="chat-profile-panel-inner">
                {/* Avatar + Name */}
                <div className="cpp-avatar-section">
                    <div className="cpp-avatar">
                        {photo
                            ? <img src={`http://localhost:5170${photo}`} alt={fullName} />
                            : firstName[0]?.toUpperCase() || '?'
                        }
                    </div>
                    <p className="cpp-name">{fullName}</p>
                    <span className="cpp-role-badge">{isDoctor ? '🩺 Doctor' : '🧑 Patient'}</span>
                </div>

                {/* Info rows */}
                {isDoctor ? (
                    <div>
                        <p className="cpp-section-title">Professional Info</p>
                        {partnerProfile.specialization && (
                            <div className="cpp-row">
                                <span className="cpp-label">Specialization</span>
                                <span className="cpp-value" style={{ color: 'var(--primary)' }}>{partnerProfile.specialization}</span>
                            </div>
                        )}
                        {partnerProfile.yearsOfExperience != null && (
                            <div className="cpp-row">
                                <span className="cpp-label">Experience</span>
                                <span className="cpp-value">{partnerProfile.yearsOfExperience} yrs</span>
                            </div>
                        )}
                        {partnerProfile.rating != null && (
                            <div className="cpp-row">
                                <span className="cpp-label">Rating</span>
                                <span className="cpp-value">⭐ {partnerProfile.rating?.toFixed(1)}</span>
                            </div>
                        )}
                        {partnerProfile.affiliations && (
                            <div className="cpp-row">
                                <span className="cpp-label">Affiliations</span>
                                <span className="cpp-value">{partnerProfile.affiliations}</span>
                            </div>
                        )}
                        {partnerProfile.workingHours && (
                            <div className="cpp-row">
                                <span className="cpp-label">Hours</span>
                                <span className="cpp-value">{partnerProfile.workingHours}</span>
                            </div>
                        )}
                        {partnerProfile.about && (
                            <div style={{ marginTop: '0.75rem' }}>
                                <p className="cpp-section-title">About</p>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted-white)', lineHeight: 1.55 }}>
                                    {partnerProfile.about}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <p className="cpp-section-title">Patient Info</p>
                        {partnerProfile.age != null && (
                            <div className="cpp-row">
                                <span className="cpp-label">Age</span>
                                <span className="cpp-value">{partnerProfile.age} yrs</span>
                            </div>
                        )}
                        {partnerProfile.gender && (
                            <div className="cpp-row">
                                <span className="cpp-label">Gender</span>
                                <span className="cpp-value">{partnerProfile.gender}</span>
                            </div>
                        )}
                        {partnerProfile.bloodType && (
                            <div className="cpp-row">
                                <span className="cpp-label">Blood</span>
                                <span className="cpp-value">🩸 {partnerProfile.bloodType}</span>
                            </div>
                        )}
                        {(partnerProfile.height || partnerProfile.weight) && (
                            <div className="cpp-row">
                                <span className="cpp-label">H / W</span>
                                <span className="cpp-value">{partnerProfile.height || '—'} cm / {partnerProfile.weight || '—'} kg</span>
                            </div>
                        )}
                        {partnerProfile.chronicDiseases && (
                            <div className="cpp-row">
                                <span className="cpp-label">Chronic</span>
                                <span className="cpp-value">{partnerProfile.chronicDiseases}</span>
                            </div>
                        )}
                        {partnerProfile.allergies && (
                            <div className="cpp-row">
                                <span className="cpp-label">Allergies</span>
                                <span className="cpp-value" style={{ color: '#f87171' }}>{partnerProfile.allergies}</span>
                            </div>
                        )}
                        {partnerProfile.isSmoker != null && (
                            <div className="cpp-row">
                                <span className="cpp-label">Smoker</span>
                                <span className="cpp-value">{partnerProfile.isSmoker ? 'Yes 🚬' : 'No 🚭'}</span>
                            </div>
                        )}
                        {partnerProfile.dietType && (
                            <div className="cpp-row">
                                <span className="cpp-label">Diet</span>
                                <span className="cpp-value">{partnerProfile.dietType}</span>
                            </div>
                        )}
                        {partnerProfile.pastSurgeries && (
                            <div className="cpp-row">
                                <span className="cpp-label">Surgeries</span>
                                <span className="cpp-value">{partnerProfile.pastSurgeries}</span>
                            </div>
                        )}
                        {partnerProfile.familyHistory && (
                            <div className="cpp-row">
                                <span className="cpp-label">Family Hx</span>
                                <span className="cpp-value">{partnerProfile.familyHistory}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div id="chat-modal" className="modal" role="dialog" aria-modal="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="modal-backdrop" onClick={onClose}></div>

            {/* Wrapper: chat + profile panel side by side */}
            <div className={`chat-with-profile-wrapper ${showProfile ? 'profile-open' : ''}`}>

                {/* ── Chat Card ── */}
                <div className="chat-card glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="chat-header">
                        <div className="chat-user-info">
                            {/* Clickable Avatar */}
                            <div
                                className="user-avatar"
                                title={`View ${partnerName}'s profile`}
                                onClick={handleToggleProfile}
                                style={{
                                    position: 'relative', width: '42px', height: '42px',
                                    borderRadius: '50%',
                                    border: showProfile ? '2px solid rgba(59,130,246,0.6)' : '2px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                                    boxShadow: showProfile ? '0 0 0 3px rgba(59,130,246,0.25)' : 'none'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                {getAvatarHTML(partnerPhoto, partnerName?.[0]?.toUpperCase() || '?')}
                                <span className="pulsate-dot" style={{ position: 'absolute', bottom: '1px', right: '1px', border: '2px solid rgba(15,23,42,0.9)' }}></span>
                            </div>
                            <div style={{ cursor: 'pointer' }} onClick={handleToggleProfile}>
                                <h3 id="chat-with-name" style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-white-to-dark)', margin: 0 }}>{partnerName}</h3>
                                <div className="chat-status-sub">
                                    <span className="pulsate-dot"></span>
                                    <span>Active now · <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                        {showProfile ? 'Hide info ←' : 'View info →'}
                                    </span></span>
                                </div>
                            </div>
                        </div>
                        <button className="icon-btn" onClick={onClose} aria-label="Close chat">✕</button>
                    </div>

                    <div className="chat-messages" id="chat-messages-container" style={{ flexGrow: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
                        {loading ? (
                            <div className="empty-state">Loading chat history...</div>
                        ) : messages.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No messages yet. Say hi! 👋</p>
                        ) : (
                            groupedMessages.map((item) => {
                                if (item.type === 'date') {
                                    return (
                                        <div key={item.key} className="chat-date-divider">
                                            <span className="chat-date-badge">{item.label}</span>
                                        </div>
                                    );
                                }

                                const m = item.data;
                                const mine = String(m.senderId) === myIdStr && m.senderType?.toLowerCase() === myRole?.toLowerCase();
                                const isImage = m.content && m.content.startsWith('/uploads/');

                                return (
                                    <div key={item.key} className={`msg-wrapper ${mine ? 'sent' : 'received'}`} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start', width: '100%' }}>
                                        <div className={`msg ${mine ? 'msg-sent' : 'msg-received'}`} dir="auto" style={{
                                            margin: 0,
                                            position: 'relative',
                                            padding: isImage ? '6px' : undefined,
                                            background: isImage ? 'rgba(255,255,255,0.02)' : undefined,
                                            border: isImage ? '1px solid rgba(255,255,255,0.1)' : undefined,
                                            borderRadius: isImage ? '12px' : undefined
                                        }}>
                                            {isImage ? (
                                                <img
                                                    src={`http://localhost:5170${m.content}`}
                                                    alt="Shared in chat"
                                                    style={{ maxWidth: '220px', maxHeight: '220px', borderRadius: '8px', cursor: 'pointer', display: 'block' }}
                                                    onClick={() => onOpenImagePreview && onOpenImagePreview(`http://localhost:5170${m.content}`)}
                                                />
                                            ) : (
                                                m.content
                                            )}
                                        </div>
                                        <div className="msg-time">
                                            {formatTime(m.sentAt)}
                                            {mine && (
                                                <span style={{ color: m.isRead ? '#2ecc71' : 'var(--muted)', fontSize: '0.8rem', marginLeft: '4px', display: 'inline-flex', alignItems: 'center' }}>
                                                    {m.isRead ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-bar" onSubmit={handleSendMessage}>
                        <div className="chat-input-container">
                            <button type="button" className="chat-input-attach-btn" onClick={() => fileInputRef.current?.click()} title="Send Image">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            </button>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                            <input
                                type="text"
                                id="chat-input-field"
                                dir="auto"
                                placeholder="Type a message…"
                                autoComplete="off"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="chat-input-send-btn" title="Send Message">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)', marginLeft: '-2px', marginTop: '1px' }}>
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>

                {/* ── Profile Slide Panel ── */}
                <div className={`chat-profile-panel ${showProfile ? 'open' : ''}`}>
                    {renderProfilePanel()}
                </div>

            </div>
        </div>
    );
}
