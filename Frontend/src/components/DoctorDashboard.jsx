import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DoctorDashboard({
    theme,
    toggleTheme,
    onOpenChat,
    onOpenReport,
    onOpenPatientProfile,
    onOpenImagePreview,
    onOpenReviewModal
}) {
    const { currentUser, logout, showToast, updateProfileState } = useAuth();
    const [activeTab, setActiveTab] = useState('dr-profile');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Profile States
    const [editMode, setEditMode] = useState(false);
    const [editFname, setEditFname] = useState('');
    const [editLname, setEditLname] = useState('');
    const [editSpec, setEditSpec] = useState('');
    const [editExp, setEditExp] = useState('');
    const [editAffil, setEditAffil] = useState('');
    const [editHoursFrom, setEditHoursFrom] = useState('');
    const [editHoursTo, setEditHoursTo] = useState('');
    const [editAbout, setEditAbout] = useState('');
    const [editPhoto, setEditPhoto] = useState('');
    const [availability, setAvailability] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const profilePhotoInputRef = useRef(null);

    // AI Analysis (Direct Assistant) States
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Review Requests States
    const [pendingReviews, setPendingReviews] = useState([]);
    const [completedReviews, setCompletedReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);

    // Inbox States
    const [chats, setChats] = useState([]);
    const [chatsLoading, setChatsLoading] = useState(false);

    // Unread count badges
    const [unreadMessages, setUnreadMessages] = useState(0);

    // Initial setup
    useEffect(() => {
        const d = currentUser?.profileInfo || {};
        setAvailability(d.isAvailable || false);

        // Check if there is a saved tab in sessionStorage
        const savedTab = sessionStorage.getItem('gastroai_last_section');
        if (savedTab && savedTab.startsWith('dr-')) {
            setActiveTab(savedTab);
        }
    }, [currentUser]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('gastroai_last_section', tabId);
        setSidebarOpen(false);
    };

    // Load data based on active tab
    useEffect(() => {
        if (activeTab === 'dr-reviews') {
            loadReviewRequests();
        }
    }, [activeTab]);

    // Poll inbox messages when messages tab is active
    useEffect(() => {
        if (activeTab !== 'dr-messages' || !currentUser?.doctorId) return;

        loadInbox();
        const interval = setInterval(loadInbox, 3000);
        return () => clearInterval(interval);
    }, [activeTab, currentUser]);

    // Poll for unread messages and pending reviews count
    useEffect(() => {
        if (!currentUser?.doctorId) return;

        const updateBadges = async () => {
            try {
                // Chats
                const list = await api.getDoctorChats(currentUser.doctorId);
                let totalUnread = 0;
                for (const ch of list) {
                    const res = await api.getUnreadMessageCount(ch.chatId, String(currentUser.doctorId), 'Doctor');
                    totalUnread += (res.unreadCount || 0);
                }
                setUnreadMessages(totalUnread);

                // Reviews count (update pending reviews count directly)
                const results = await api.getDoctorResults(currentUser.doctorId);
                const pending = (results || []).filter(r => !r.isReviewedByDoctor);
                setPendingReviews(prev => {
                    return pending.map(r => {
                        const found = prev.find(x => x.resultId === r.resultId);
                        if (found) {
                            return {
                                ...r,
                                patientName: r.patientName || found.patientName,
                                patientPhoto: r.patientPhoto || found.patientPhoto
                            };
                        }
                        return r;
                    });
                });
                const completed = (results || []).filter(r => r.isReviewedByDoctor);
                setCompletedReviews(prev => {
                    return completed.map(r => {
                        const found = prev.find(x => x.resultId === r.resultId);
                        if (found) {
                            return {
                                ...r,
                                patientName: r.patientName || found.patientName,
                                patientPhoto: r.patientPhoto || found.patientPhoto
                            };
                        }
                        return r;
                    });
                });
            } catch (e) { }
        };

        updateBadges();
        const interval = setInterval(updateBadges, 3000);
        return () => clearInterval(interval);
    }, [currentUser]);

    // Load reviews
    const loadReviewRequests = async () => {
        if (!currentUser?.doctorId) return;
        setReviewsLoading(true);
        try {
            const results = await api.getDoctorResults(currentUser.doctorId);
            // Fetch patient names/photos if missing
            const enrichedResults = [];
            for (const r of (results || [])) {
                if (!r.patientPhoto || !r.patientName || r.patientName.trim() === '') {
                    try {
                        const pt = await api.getPatientById(r.patientId);
                        if (pt && pt.firstName) {
                            r.patientName = `${pt.firstName} ${pt.lastName}`.trim();
                            r.patientPhoto = pt.profilePhoto;
                        }
                    } catch (e) {
                        console.error('Failed to fetch patient name:', e);
                    }
                }
                enrichedResults.push(r);
            }
            const pending = enrichedResults.filter(r => !r.isReviewedByDoctor);
            const completed = enrichedResults.filter(r => r.isReviewedByDoctor);
            setPendingReviews(pending);
            setCompletedReviews(completed);
        } catch (e) {
            showToast('Failed to load review requests.', 'error');
        } finally {
            setReviewsLoading(false);
        }
    };

    // Load Inbox
    const loadInbox = async () => {
        if (!currentUser?.doctorId) return;
        setChatsLoading(true);
        try {
            const list = await api.getDoctorChats(currentUser.doctorId);
            const enrichedChats = [];
            for (const ch of (list || [])) {
                try {
                    const unreadRes = await api.getUnreadMessageCount(ch.chatId, String(currentUser.doctorId), 'Doctor');
                    ch.unreadCount = unreadRes.unreadCount || 0;

                    const pt = await api.getPatientById(ch.patientId);
                    if (pt) {
                        ch.patientName = `${pt.firstName} ${pt.lastName}`.trim();
                        ch.profilePhoto = pt.profilePhoto;
                    }
                    enrichedChats.push(ch);
                } catch (e) { }
            }
            enrichedChats.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
            setChats(enrichedChats);
        } catch (e) {
            showToast('Failed to load inbox.', 'error');
        } finally {
            setChatsLoading(false);
        }
    };

    // Edit Profile
    const startEdit = () => {
        const d = currentUser?.profileInfo || {};
        setEditFname(currentUser.displayName.split(' ')[0] || '');
        setEditLname(currentUser.displayName.split(' ')[1] || '');
        setEditSpec(d.specialization || '');
        setEditExp(d.yearsOfExperience || 0);
        setEditAffil(d.affiliations || '');
        const hours = d.workingHours || '';
        let fromVal = '';
        let toVal = '';
        if (hours.includes(' - ')) {
            const parts = hours.split(' - ');
            fromVal = parts[0] || '';
            toVal = parts[1] || '';
        } else if (hours.includes('-')) {
            const parts = hours.split('-');
            fromVal = parts[0] || '';
            toVal = parts[1] || '';
        } else {
            fromVal = hours;
        }
        setEditHoursFrom(fromVal.trim());
        setEditHoursTo(toVal.trim());
        setEditAbout(d.about || '');
        setEditPhoto(d.profilePhoto || '');
        setEditMode(true);
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...currentUser.profileInfo,
                doctorId: currentUser.doctorId,
                firstName: editFname.trim(),
                lastName: editLname.trim(),
                specialization: editSpec.trim(),
                yearsOfExperience: parseInt(editExp) || 0,
                affiliations: editAffil.trim(),
                workingHours: (editHoursFrom && editHoursTo) ? `${editHoursFrom} - ${editHoursTo}` : (editHoursFrom || editHoursTo || ''),
                about: editAbout.trim(),
                profilePhoto: editPhoto
            };
            const updated = await api.updateDoctor(data);
            showToast('Profile updated successfully!', 'success');
            updateProfileState(updated);
            setEditMode(false);
        } catch (e) {
            showToast(e.message || 'Failed to update profile', 'error');
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPhotoUploading(true);
        try {
            const res = await api.uploadProfilePhoto(file);
            if (res && res.url) {
                setEditPhoto(res.url);
                showToast('Photo uploaded successfully! Save profile to apply.', 'success');
            }
        } catch (err) {
            showToast(err.message || 'Photo upload failed', 'error');
        } finally {
            setPhotoUploading(false);
            if (profilePhotoInputRef.current) profilePhotoInputRef.current.value = '';
        }
    };

    // Availability Toggle
    const toggleAvailability = async () => {
        const nextVal = !availability;
        try {
            await api.updateDoctorAvailability(currentUser.doctorId, nextVal);
            showToast(`Status updated to ${nextVal ? 'Available' : 'Busy'}`, 'success');
            setAvailability(nextVal);
            if (currentUser?.profileInfo) {
                currentUser.profileInfo.isAvailable = nextVal;
            }
        } catch (err) {
            showToast('Failed to update availability status', 'error');
        }
    };

    // Direct Analysis file actions
    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        processFile(file);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        processFile(file);
    };

    const processFile = (file) => {
        if (!file) return;
        setFile(file);
        setAnalysisResult(null);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setFilePreview(ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const triggerDirectAnalysis = async () => {
        if (!file) return;
        setAnalysisLoading(true);
        try {
            const res = await api.analyzeDirect(file);
            setAnalysisResult(res);
            showToast('AI analysis completed! 🔬', 'success');
        } catch (err) {
            showToast(err.message || 'Analysis failed', 'error');
        } finally {
            setAnalysisLoading(false);
        }
    };

    const cancelUpload = () => {
        setFile(null);
        setFilePreview('');
        setAnalysisResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getAvatarHTML = (profilePhoto, defaultChar) => {
        if (profilePhoto) return <img src={`http://localhost:5170${profilePhoto}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="Avatar" />;
        return defaultChar;
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
    const confBadge = (c) => {
        const p = c > 1 ? c : c * 100;
        if (p >= 80) return <span className="badge badge-danger">{p.toFixed(1)}%</span>;
        if (p >= 50) return <span className="badge badge-warning">{p.toFixed(1)}%</span>;
        return <span className="badge badge-info">{p.toFixed(1)}%</span>;
    };

    const d = currentUser?.profileInfo || {};
    const topBarTitleMap = {
        'dr-profile': 'My Profile',
        'dr-upload': 'AI Analysis',
        'dr-reviews': 'Review Requests',
        'dr-messages': 'Messages'
    };

    return (
        <section id="view-doctor" className="view active">
            {/* Sidebar Overlay */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    Gastro<span>AI</span> <span className="role-tag">Doctor</span>
                    <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
                </div>
                <nav className="sidebar-nav">
                    <a href="#" className={`snav-link ${activeTab === 'dr-profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('dr-profile'); }}>
                        <span className="snav-icon">👤</span> My Profile
                    </a>
                    <a href="#" className={`snav-link ${activeTab === 'dr-upload' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('dr-upload'); }}>
                        <span className="snav-icon">🔬</span> AI Analysis
                    </a>
                    <a href="#" className={`snav-link ${activeTab === 'dr-reviews' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('dr-reviews'); }}>
                        <span className="snav-icon">📝</span> Review Requests
                        {pendingReviews.length > 0 && <span className="badge-count">{pendingReviews.length}</span>}
                    </a>
                    <a href="#" className={`snav-link ${activeTab === 'dr-messages' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('dr-messages'); }}>
                        <span className="snav-icon">💬</span> Messages
                        {unreadMessages > 0 && <span className="badge-count">{unreadMessages}</span>}
                    </a>
                </nav>
                <div className="sidebar-footer">
                    <button className="btn btn-outline btn-sm btn-block" onClick={logout}>🚪 Logout</button>
                </div>
            </aside>

            <div className="main-content">
                {/* Top Bar */}
                <header className="topbar">
                    <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
                    <div className="topbar-title">{topBarTitleMap[activeTab]}</div>
                    <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Light/Dark Mode">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <div className="topbar-user">
                        <div className="user-avatar" style={{ cursor: 'pointer' }} onClick={() => handleTabChange('dr-profile')}>
                            {getAvatarHTML(d.profilePhoto, currentUser.displayName?.[0]?.toUpperCase() || 'D')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 600 }}>Dr. {currentUser.displayName}</span>
                            <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>Doctor</span>
                        </div>
                    </div>
                </header>

                {/* ── Section: Doctor Profile ── */}
                {activeTab === 'dr-profile' && (
                    <div id="dr-profile" className="dash-section active">
                        {/* Welcome Banner */}
                        <div className="welcome-banner">
                            <div>
                                <div className="welcome-banner-greeting">
                                    {(() => {
                                        const hr = new Date().getHours();
                                        const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
                                        return `${greet}, Dr. ${currentUser.displayName.split(' ')[0]} 👋`;
                                    })()}
                                </div>
                                <div className="welcome-banner-sub">Here's your GastroAI workspace overview</div>
                            </div>
                            <div className="welcome-banner-stats">
                                <div className="welcome-stat-pill">
                                    📝 <strong>{pendingReviews.length + completedReviews.length}</strong> <span>Total Cases</span>
                                </div>
                                <div className="welcome-stat-pill">
                                    ⏳ <strong>{pendingReviews.length}</strong> <span>Pending</span>
                                </div>
                                <div className="welcome-stat-pill">
                                    ✅ <strong>{completedReviews.length}</strong> <span>Completed</span>
                                </div>
                            </div>
                        </div>

                        <h2 className="section-title">👤 My Profile</h2>

                        {/* Bento Grid Profile Layout */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '1.5rem',
                            marginTop: '1.5rem'
                        }}>
                            {/* Bento Item 1: Main User Card */}
                            <div className="glass-card" style={{
                                padding: '2rem 1.5rem',
                                borderRadius: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                                justifyContent: 'center'
                            }}>
                                <div style={{
                                    width: '110px',
                                    height: '110px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '3px solid var(--primary)',
                                    boxShadow: '0 0 25px rgba(0, 242, 254, 0.15)',
                                    marginBottom: '1rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    position: 'relative',
                                    cursor: editMode ? 'pointer' : 'default'
                                }}
                                    onClick={() => editMode && profilePhotoInputRef.current?.click()}
                                >
                                    {getAvatarHTML(editMode ? editPhoto : d.profilePhoto, currentUser.displayName?.[0]?.toUpperCase() || 'D')}
                                    {editMode && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0, left: 0, right: 0, height: '40%',
                                            background: 'rgba(0,0,0,0.6)',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                            color: '#fff', fontSize: '1.2rem', paddingBottom: '10px'
                                        }}>
                                            {photoUploading ? '⏳' : '📷'}
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={profilePhotoInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handlePhotoUpload}
                                    />
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-white-to-dark)', margin: '0 0 6px 0' }}>
                                    Dr. {currentUser.displayName}
                                </h3>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <span className="badge badge-success" style={{ padding: '4px 12px', fontSize: '0.75rem', background: 'rgba(46, 204, 113, 0.12)', color: '#2ecc71', border: '1px solid rgba(46, 204, 113, 0.25)', borderRadius: '20px' }}>
                                        Doctor Profile
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: '#f1c40f', fontWeight: 600 }}>★ {d.rating?.toFixed(1) || '—'} Rating</span>
                                </div>

                                <div style={{ width: '100%', display: 'grid', gap: '0.75rem', textAlign: 'left', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>📧 Email</span>
                                        <span style={{ color: 'var(--text-white-to-dark)', fontWeight: 500 }}>{currentUser.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>📞 Phone</span>
                                        <span style={{ color: 'var(--text-white-to-dark)', fontWeight: 500 }}>{d.phoneNum || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>🪪 Licence No.</span>
                                        <span style={{ color: 'var(--text-white-to-dark)', fontWeight: 600 }}>{d.licenceNum || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--muted)' }}>Status:</span>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${availability ? 'btn-success' : 'btn-danger'}`}
                                            onClick={toggleAvailability}
                                            style={{
                                                minWidth: '100px',
                                                height: '28px',
                                                borderRadius: '8px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '5px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                margin: 0,
                                                padding: '0 8px'
                                            }}
                                        >
                                            {availability ? '● Available' : '● Busy'}
                                        </button>
                                    </div>
                                </div>

                                {!editMode && (
                                    <button className="btn btn-outline" onClick={startEdit} style={{
                                        width: '100%',
                                        borderRadius: '12px',
                                        borderColor: 'rgba(0, 242, 254, 0.4)',
                                        color: '#00f2fe',
                                        height: '40px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600'
                                    }}>✏️ Edit Details</button>
                                )}
                            </div>

                            {/* Bento Item 2: Professional Information */}
                            <div className="glass-card" style={{
                                padding: '1.75rem',
                                borderRadius: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                            }}>
                                <h4 style={{ fontSize: '1rem', color: 'var(--text-white-to-dark)', fontWeight: '700', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.15rem' }}>🩺</span> Professional Experience
                                </h4>

                                <div className="doc-experience-grid">
                                    <div className="doc-experience-item spec">
                                        <div className="doc-experience-icon-wrap">🩺</div>
                                        <div className="doc-experience-details">
                                            <div className="doc-experience-label">Specialization</div>
                                            <div className="doc-experience-value">
                                                {d.specialization || 'General Practitioner'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="doc-experience-item exp">
                                        <div className="doc-experience-icon-wrap">💼</div>
                                        <div className="doc-experience-details">
                                            <div className="doc-experience-label">Experience</div>
                                            <div className="doc-experience-value">
                                                {d.yearsOfExperience || 0} Years
                                            </div>
                                        </div>
                                    </div>

                                    <div className="doc-experience-item affil">
                                        <div className="doc-experience-icon-wrap">🏥</div>
                                        <div className="doc-experience-details">
                                            <div className="doc-experience-label">Affiliations</div>
                                            <div className="doc-experience-value">
                                                {d.affiliations || '—'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="doc-experience-item hours">
                                        <div className="doc-experience-icon-wrap">🕒</div>
                                        <div className="doc-experience-details">
                                            <div className="doc-experience-label">Working Hours</div>
                                            <div className="doc-experience-value" style={{ color: '#2ecc71' }}>
                                                {d.workingHours || '—'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bento Item 3: Biography / About */}
                            <div className="glass-card" style={{
                                padding: '1.75rem',
                                borderRadius: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'var(--card-bg-inline)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <h4 style={{ fontSize: '1rem', color: 'var(--text-white-to-dark)', fontWeight: '600', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📝</span> Biography / About
                                </h4>
                                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-muted-white)', margin: 0, whiteSpace: 'pre-line', flexGrow: 1 }}>
                                    {d.about || 'No biography or description provided yet.'}
                                </p>
                            </div>
                        </div>


                        {editMode && (
                            <div id="dr-profile-edit" style={{ marginTop: '2rem' }}>
                                <h3 className="section-title" style={{ fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                    Edit Profile
                                </h3>
                                <form onSubmit={saveProfile} className="glass-card" style={{ marginTop: '1rem' }}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Specialization</label>
                                            <input type="text" value={editSpec} onChange={(e) => setEditSpec(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Experience (Years)</label>
                                            <input type="number" value={editExp} onChange={(e) => setEditExp(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Affiliations</label>
                                            <input type="text" value={editAffil} onChange={(e) => setEditAffil(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Working Hours From</label>
                                            <input type="time" value={editHoursFrom} onChange={(e) => setEditHoursFrom(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Working Hours To</label>
                                            <input type="time" value={editHoursTo} onChange={(e) => setEditHoursTo(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>About</label>
                                        <textarea value={editAbout} onChange={(e) => setEditAbout(e.target.value)}></textarea>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                        <button type="submit" className="btn btn-primary">Save Changes</button>
                                        <button type="button" className="btn btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Section: Doctor Upload ── */}
                {activeTab === 'dr-upload' && (
                    <div id="dr-upload" className="dash-section active">
                        <div className="ai-hub-container">
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <h2 className="section-title" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem', justifyContent: 'center' }}>
                                    🔬 AI Second Opinion
                                </h2>
                                <p className="section-sub" style={{ margin: 0 }}>
                                    Upload a patient scan for instant hybrid neural-network analysis
                                </p>
                            </div>

                            {!filePreview ? (
                                <div
                                    className={`ai-upload-zone ${dragOver ? 'drag-over' : ''}`}
                                    onClick={() => fileInputRef.current.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleFileDrop}
                                >
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--primary)', marginBottom: '1.25rem', filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))' }}>
                                        <path d="M12 16V9M12 9L9 12M12 9L15 12" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M15 6C14.5 4.5 13.5 3.5 12 3.5C9.5 3.5 8 5.5 8.5 7.5C6.5 7.5 5 9 5 11C5 13.2 6.8 15 9 15H15C17.2 15 19 13.2 19 11C19 9.3 17.7 8 16 7.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-white-to-dark)', marginBottom: '0.4rem' }}>
                                        Select Gastroscopy Scan
                                    </h3>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                                        Drag &amp; drop file here, or click to browse (JPEG, PNG)
                                    </p>
                                    <button className="btn btn-primary" style={{ padding: '0.55rem 1.6rem', borderRadius: '50px', fontSize: '0.85rem' }}>
                                        Browse Scan
                                    </button>
                                    <input type="file" ref={fileInputRef} accept="image/jpeg,image/png" hidden onChange={handleFileChange} />
                                </div>
                            ) : (
                                <div>
                                    {/* Preview Box */}
                                    <div className="ai-preview-card">
                                        <div className="scanner-frame">
                                            <img id="dr-preview-img" src={filePreview} alt="Preview" />
                                            <div className="scanner-corner scanner-corner-tl"></div>
                                            <div className="scanner-corner scanner-corner-tr"></div>
                                            <div className="scanner-corner scanner-corner-bl"></div>
                                            <div className="scanner-corner scanner-corner-br"></div>
                                            <div className="scanner-grid-overlay"></div>
                                            {analysisLoading && <div className="scanner-line"></div>}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
                                            {!analysisResult && (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ flex: 2, borderRadius: '50px', fontSize: '0.9rem', padding: '0.65rem' }}
                                                    onClick={triggerDirectAnalysis}
                                                    disabled={analysisLoading}
                                                >
                                                    {analysisLoading ? 'AI Classification Running...' : '⚡ Analyze with AI'}
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-outline"
                                                style={{ flex: 1, borderRadius: '50px', fontSize: '0.9rem', padding: '0.65rem' }}
                                                onClick={cancelUpload}
                                                disabled={analysisLoading}
                                            >
                                                {analysisResult ? '✕ Clear & Start New' : '✕ Clear'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Loading State */}
                                    {analysisLoading && (
                                        <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                                            <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px', margin: '0 auto 0.75rem auto' }}></div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-white)', margin: 0 }}>
                                                🔬 Running AI classification pipeline...
                                            </p>
                                        </div>
                                    )}

                                    {/* AI Diagnostic Result */}
                                    {analysisResult && !analysisLoading && (
                                        <div className="diagnostic-dashboard">
                                            <div className="diag-title-area">
                                                <div>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detected Condition</span>
                                                    <h3 style={{ margin: '3px 0 0 0', fontSize: '1.4rem', color: 'var(--text-white-to-dark)', fontWeight: '800' }}>
                                                        {analysisResult.diseaseName || 'Healthy Tissue'}
                                                    </h3>
                                                </div>

                                                {/* Severity tag */}
                                                {(() => {
                                                    const isNormal = (analysisResult.diseaseName || '').toLowerCase().includes('normal');
                                                    const isPolyp = (analysisResult.diseaseName || '').toLowerCase().includes('polyp') || (analysisResult.diseaseName || '').toLowerCase().includes('colitis');
                                                    const severityText = isNormal ? 'Normal / Healthy' : isPolyp ? 'Pathological (Polyp/Colitis)' : 'Inflamed (Esophagitis)';
                                                    const severityColor = isNormal ? '#2ecc71' : isPolyp ? '#e74c3c' : '#f1c40f';
                                                    const severityBg = isNormal ? 'rgba(46, 204, 113, 0.1)' : isPolyp ? 'rgba(231, 76, 60, 0.1)' : 'rgba(241, 196, 15, 0.1)';
                                                    return (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 12px', borderRadius: '50px', background: severityBg, color: severityColor, border: `1px solid ${severityColor}25` }}>
                                                            {severityText}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            {/* Confidence meter */}
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                                                    <span style={{ color: 'var(--muted)' }}>Prediction Confidence</span>
                                                    <strong style={{ color: 'var(--text-white-to-dark)' }}>
                                                        {analysisResult.confidence > 1 ? analysisResult.confidence.toFixed(1) : (analysisResult.confidence * 100).toFixed(1)}%
                                                    </strong>
                                                </div>
                                                <div className="confidence-meter">
                                                    <div
                                                        className="confidence-fill"
                                                        style={{
                                                            width: `${analysisResult.confidence > 1 ? analysisResult.confidence : analysisResult.confidence * 100}%`,
                                                            background: (analysisResult.confidence > 1 ? analysisResult.confidence : analysisResult.confidence * 100) >= 75
                                                                ? 'linear-gradient(90deg, #10b981, #059669)'
                                                                : (analysisResult.confidence > 1 ? analysisResult.confidence : analysisResult.confidence * 100) >= 50
                                                                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                                                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                                                            boxShadow: (analysisResult.confidence > 1 ? analysisResult.confidence : analysisResult.confidence * 100) >= 75
                                                                ? '0 0 10px rgba(16, 185, 129, 0.3)'
                                                                : '0 0 10px rgba(245, 158, 11, 0.3)'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Recommendations */}
                                            <div style={{ background: 'var(--card-bg-inline)', border: '1px solid var(--card-border-inline)', borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                                                <h4 style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clinical Recommendations</h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-white)', margin: 0, lineHeight: '1.4' }}>
                                                    {analysisResult.recommendations || 'No specific recommendations generated. Use clinical judgment for further steps.'}
                                                </p>
                                            </div>

                                            {/* Status badge */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>✔ Direct Review Mode</span>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Result not linked to patient record</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Section: Review Requests ── */}
                {activeTab === 'dr-reviews' && (() => {
                    const totalAssigned = pendingReviews.length + completedReviews.length;
                    const completionRate = totalAssigned > 0 ? Math.round((completedReviews.length / totalAssigned) * 100) : 0;

                    return (
                        <div id="dr-reviews" className="dash-section active">
                            <h2 className="section-title">📝 Review Requests</h2>
                            <p className="section-sub" style={{ marginBottom: '1.25rem' }}>AI results awaiting your professional review</p>

                            {/* Doctor Analytics Stats Cards */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '1rem',
                                marginBottom: '2rem'
                            }}>
                                {/* Total Assigned */}
                                <div className="glass-card" style={{
                                    padding: '1rem 1.25rem',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.03), rgba(0, 242, 254, 0.01))',
                                    border: '1px solid rgba(0, 242, 254, 0.12)',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ fontSize: '1.5rem', padding: '8px', background: 'rgba(0, 242, 254, 0.1)', color: '#00f2fe', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔬</div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Assigned</h4>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                                            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-white-to-dark)', lineHeight: 1.1 }}>{totalAssigned}</span>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>scans</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Completed Reviews */}
                                <div className="glass-card" style={{
                                    padding: '1rem 1.25rem',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.03), rgba(46, 204, 113, 0.01))',
                                    border: '1px solid rgba(46, 204, 113, 0.12)',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ fontSize: '1.5rem', padding: '8px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✔️</div>
                                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                                        <h4 style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</h4>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                                            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-white-to-dark)', lineHeight: 1.1 }}>{completedReviews.length}</span>
                                            <span style={{ fontSize: '0.72rem', color: '#2ecc71', fontWeight: '600' }}>({completionRate}%)</span>
                                        </div>
                                        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                                            <div style={{ width: `${completionRate}%`, height: '100%', background: '#2ecc71' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Pending Reviews */}
                                <div className="glass-card" style={{
                                    padding: '1rem 1.25rem',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: 'linear-gradient(135deg, rgba(241, 196, 15, 0.03), rgba(241, 196, 15, 0.01))',
                                    border: '1px solid rgba(241, 196, 15, 0.12)',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ fontSize: '1.5rem', padding: '8px', background: 'rgba(241, 196, 15, 0.1)', color: '#f1c40f', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-white-to-dark)', lineHeight: 1.1 }}>{pendingReviews.length}</span>
                                            {pendingReviews.length > 0 && (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '0.7rem',
                                                    color: '#f1c40f',
                                                    background: 'rgba(241, 196, 15, 0.1)',
                                                    padding: '1px 6px',
                                                    borderRadius: '8px',
                                                    fontWeight: '600'
                                                }}>
                                                    <span style={{
                                                        width: '4px',
                                                        height: '4px',
                                                        background: '#f1c40f',
                                                        borderRadius: '50%',
                                                        display: 'inline-block',
                                                        animation: 'pulse 1.5s infinite'
                                                    }} />
                                                    Action
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {reviewsLoading ? (
                                <div className="empty-state">Loading review requests…</div>
                            ) : pendingReviews.length === 0 && completedReviews.length === 0 ? (
                                <div className="empty-state"><div className="empty-state-icon">📭</div>No review requests assigned to you yet.</div>
                            ) : (
                                <>
                                    {pendingReviews.length > 0 && (
                                        <div style={{ marginBottom: '3rem' }}>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '1.25rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ display: 'inline-flex', padding: '6px', background: 'rgba(245,158,11,0.15)', borderRadius: '8px' }}>⏳</span>
                                                Pending Reviews ({pendingReviews.length})
                                            </h3>
                                            <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                                                {pendingReviews.map(r => (
                                                    <div key={r.resultId} style={{
                                                        background: 'linear-gradient(145deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.6) 100%)',
                                                        border: '1px solid rgba(245,158,11,0.2)',
                                                        borderRadius: '20px',
                                                        padding: '1.25rem',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, border-color 0.3s',
                                                    }}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'; }}
                                                    >
                                                        {/* Top Ribbon */}
                                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />

                                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                            {r.imagePath ? (
                                                                <img
                                                                    src={`http://localhost:5170${r.imagePath}`}
                                                                    alt="Scan"
                                                                    onClick={() => onOpenImagePreview(`http://localhost:5170${r.imagePath}`)}
                                                                    title="Click to enlarge"
                                                                    style={{ width: '85px', height: '85px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.05)', cursor: 'zoom-in', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                />
                                                            ) : (
                                                                <div style={{ width: '85px', height: '85px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    <span style={{ fontSize: '2rem', opacity: 0.5 }}>🔬</span>
                                                                </div>
                                                            )}

                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-white-to-dark)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                                                    {r.diseaseName || 'Unknown'}
                                                                    <span style={{ fontSize: '0.65rem', padding: '3px 8px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', borderRadius: '50px', border: '1px solid rgba(245,158,11,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '800' }}>Awaiting</span>
                                                                </h4>

                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '8px' }}>
                                                                    <span style={{ color: 'var(--text-white-to-dark)', fontWeight: '600' }}>{r.patientName || 'Patient #' + r.patientId}</span>
                                                                    <span>·</span>
                                                                    <span>{fmtDate(r.analyzedAt)}</span>
                                                                </div>

                                                                <div style={{ marginBottom: '10px' }}>
                                                                    {confBadge(r.confidence)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                            <button
                                                                className="btn"
                                                                style={{ width: '100%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.65rem', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
                                                                onClick={() => onOpenReviewModal(r.resultId, r.diseaseName, r.confidence, r.patientName, r.patientId, loadReviewRequests)}
                                                            >
                                                                <span>✏️</span> Write &amp; Submit Review
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {completedReviews.length > 0 && (
                                        <div>
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '1.25rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ display: 'inline-flex', padding: '6px', background: 'rgba(16,185,129,0.15)', borderRadius: '8px' }}>✔</span>
                                                Completed Reviews ({completedReviews.length})
                                            </h3>
                                            <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                                                {completedReviews.map(r => {
                                                    let reportId = null;
                                                    let cleanNotes = r.doctorNotes || '';
                                                    if (r.doctorNotes) {
                                                        const match = r.doctorNotes.match(/^\[REPORT_ID:(\d+)\]\s*(.*)/);
                                                        if (match) {
                                                            reportId = parseInt(match[1]);
                                                            cleanNotes = match[2];
                                                        }
                                                    }

                                                    return (
                                                        <div key={r.resultId} style={{
                                                            background: 'var(--card-bg-inline)',
                                                            border: '1px solid var(--card-border-inline)',
                                                            borderRadius: '20px',
                                                            padding: '1.25rem',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            transition: 'all 0.3s ease',
                                                        }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                                                        >
                                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                                {r.imagePath ? (
                                                                    <img
                                                                        src={`http://localhost:5170${r.imagePath}`}
                                                                        alt="Scan"
                                                                        onClick={() => onOpenImagePreview(`http://localhost:5170${r.imagePath}`)}
                                                                        title="Click to enlarge"
                                                                        style={{ width: '85px', height: '85px', objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.05)', cursor: 'zoom-in', flexShrink: 0, opacity: 0.8 }}
                                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ width: '85px', height: '85px', borderRadius: '12px', background: 'var(--card-bg-inline)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                        <span style={{ fontSize: '2rem', opacity: 0.3 }}>🔬</span>
                                                                    </div>
                                                                )}

                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-muted-white)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                                                                        {r.diseaseName || 'Unknown'}
                                                                        <span style={{ fontSize: '0.65rem', padding: '3px 8px', background: 'rgba(16,185,129,0.1)', color: '#34d399', borderRadius: '50px', border: '1px solid rgba(16,185,129,0.2)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '800' }}>Reviewed</span>
                                                                    </h4>

                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '8px' }}>
                                                                        <span style={{ color: 'var(--text-muted-white)', fontWeight: '600' }}>{r.patientName || 'Patient #' + r.patientId}</span>
                                                                        <span>·</span>
                                                                        <span>{fmtDate(r.analyzedAt)}</span>
                                                                    </div>

                                                                    <div style={{ marginBottom: '10px', opacity: 0.8 }}>
                                                                        {confBadge(r.confidence)}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                                {reportId ? (
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        <button
                                                                            className="btn btn-outline"
                                                                            style={{ flex: 1, borderRadius: '10px', padding: '0.5rem', fontSize: '0.8rem', borderColor: 'rgba(255,255,255,0.1)' }}
                                                                            onClick={() => onOpenReport(reportId)}
                                                                        >📄 View Report</button>
                                                                        <button
                                                                            className="btn btn-primary"
                                                                            style={{ flex: 1, borderRadius: '10px', padding: '0.5rem', fontSize: '0.8rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.3)' }}
                                                                            onClick={() => onOpenChat(r.patientId, r.patientName || 'Patient', r.patientPhoto)}
                                                                        >💬 Chat</button>
                                                                    </div>
                                                                ) : (
                                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted-white)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
                                                                        "{cleanNotes}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )
                })()}

                {/* ── Section: Messages ── */}
                {activeTab === 'dr-messages' && (
                    <div id="dr-messages" className="dash-section active">

                        {/* Hero Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.05) 100%)',
                            border: '1px solid rgba(59,130,246,0.1)',
                            borderRadius: '24px',
                            padding: '1.75rem 2rem',
                            marginBottom: '1.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '1rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute', top: '-60px', right: '-40px',
                                width: '200px', height: '200px',
                                background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                                pointerEvents: 'none'
                            }} />
                            <div>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-white-to-dark)', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                                    💬 Patient Inbox
                                </h2>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                                    {chats.length > 0
                                        ? `${chats.length} active conversation${chats.length > 1 ? 's' : ''} · ${chats.filter(c => c.unreadCount > 0).length} unread`
                                        : 'No patient conversations yet'
                                    }
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {chats.filter(c => c.unreadCount > 0).length > 0 && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        color: '#fff', borderRadius: '50px',
                                        padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700',
                                        boxShadow: '0 4px 14px rgba(59,130,246,0.35)'
                                    }}>
                                        {chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0)} unread
                                    </div>
                                )}
                                <div style={{
                                    padding: '6px 14px',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px',
                                    fontSize: '0.82rem', color: 'var(--muted)'
                                }}>
                                    🩺 Doctor View
                                </div>
                            </div>
                        </div>

                        {/* Loading */}
                        {chatsLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '1.1rem 1.25rem',
                                        background: 'var(--card-bg-inline)',
                                        border: '1px solid var(--card-border-inline)',
                                        borderRadius: '18px'
                                    }}>
                                        <div className="skeleton" style={{ width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0 }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div className="skeleton" style={{ width: '45%', height: '13px', borderRadius: '6px', marginBottom: '10px' }}></div>
                                            <div className="skeleton" style={{ width: '65%', height: '11px', borderRadius: '6px' }}></div>
                                        </div>
                                        <div className="skeleton" style={{ width: '80px', height: '34px', borderRadius: '10px', flexShrink: 0 }}></div>
                                    </div>
                                ))}
                            </div>

                        ) : chats.length === 0 ? (
                            /* Empty State */
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '90px', height: '90px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.08))',
                                    border: '1px solid rgba(59,130,246,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '2.5rem', marginBottom: '1.5rem',
                                    boxShadow: '0 0 40px rgba(59,130,246,0.1)'
                                }}>💬</div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-muted-white)', margin: '0 0 0.5rem 0' }}>
                                    No patient messages yet
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '300px', lineHeight: 1.6 }}>
                                    When patients start conversations with you, they'll appear here.
                                </p>
                            </div>

                        ) : (
                            /* Conversations List */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                {chats.map((ch, idx) => {
                                    const pName = ch.patientName || 'Patient #' + ch.patientId;
                                    const hasUnread = ch.unreadCount > 0;
                                    const gradients = [
                                        'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                        'linear-gradient(135deg, #0ea5e9, #2563eb)',
                                        'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                        'linear-gradient(135deg, #06b6d4, #3b82f6)',
                                        'linear-gradient(135deg, #10b981, #059669)',
                                    ];
                                    const grad = gradients[idx % gradients.length];

                                    return (
                                        <div
                                            key={ch.chatId}
                                            onClick={() => onOpenChat(ch.patientId, pName, ch.profilePhoto, ch.chatId)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                padding: '1rem 1.25rem',
                                                borderRadius: '20px',
                                                background: hasUnread
                                                    ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.04))'
                                                    : 'var(--card-bg-inline)',
                                                border: hasUnread
                                                    ? '1px solid rgba(59,130,246,0.18)'
                                                    : '1px solid var(--card-border-inline)',
                                                cursor: 'pointer',
                                                transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.25)';
                                                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                                e.currentTarget.style.borderColor = hasUnread ? 'rgba(59,130,246,0.18)' : 'var(--card-border-inline)';
                                            }}
                                        >
                                            {/* Left glow accent for unread */}
                                            {hasUnread && (
                                                <div style={{
                                                    position: 'absolute', left: 0, top: '15%', bottom: '15%',
                                                    width: '3px', borderRadius: '0 3px 3px 0',
                                                    background: 'linear-gradient(180deg, #3b82f6, #8b5cf6)',
                                                    boxShadow: '0 0 8px rgba(59,130,246,0.6)'
                                                }} />
                                            )}

                                            {/* Avatar */}
                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                <div
                                                    style={{
                                                        width: '54px', height: '54px', borderRadius: '50%',
                                                        overflow: 'hidden',
                                                        background: grad,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: '800', fontSize: '1.15rem', color: '#fff',
                                                        border: hasUnread ? '2px solid rgba(59,130,246,0.45)' : '2px solid rgba(255,255,255,0.06)',
                                                        boxShadow: hasUnread ? '0 0 18px rgba(59,130,246,0.25)' : '0 2px 10px rgba(0,0,0,0.3)',
                                                        flexShrink: 0, cursor: 'pointer'
                                                    }}
                                                    onClick={e => { e.stopPropagation(); onOpenPatientProfile(ch.patientId); }}
                                                >
                                                    {getAvatarHTML(ch.profilePhoto, pName[0].toUpperCase())}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{
                                                        fontWeight: '700', fontSize: '0.96rem', color: '#fff',
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                    }}>
                                                        {pName}
                                                    </span>
                                                    {hasUnread && (
                                                        <span style={{
                                                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                                            color: '#fff', fontSize: '0.62rem', fontWeight: '800',
                                                            padding: '2px 7px', borderRadius: '50px',
                                                            boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
                                                            flexShrink: 0
                                                        }}>
                                                            {ch.unreadCount} NEW
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                                                    🩺 Patient · Tap to open conversation
                                                </div>
                                            </div>

                                            {/* Action icon */}
                                            <div style={{
                                                width: '42px', height: '42px', borderRadius: '50%',
                                                background: hasUnread ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.1rem', flexShrink: 0,
                                                boxShadow: hasUnread ? '0 4px 14px rgba(59,130,246,0.35)' : 'none',
                                                transition: 'all 0.2s ease'
                                            }}>
                                                💬
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
