import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ConfirmModal from './ConfirmModal';

export default function PatientDashboard({
    theme,
    toggleTheme,
    onOpenChat,
    onOpenReport,
    onOpenPatientProfile,
    onOpenDoctorProfile,
    onOpenImagePreview
}) {
    const { currentUser, logout, showToast, updateProfileState } = useAuth();
    const [activeTab, setActiveTab] = useState('pt-profile');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [allDoctors, setAllDoctors] = useState([]);

    // Lookups for filters
    const [specializations, setSpecializations] = useState([]);

    const DIET_TYPES = ["Standard", "Low Carb", "Vegetarian", "Vegan", "Gluten Free", "Ketogenic"];
    const FAMILY_HISTORY_OPTIONS = ["None", "Diabetes", "Hypertension", "Gastrointestinal Cancer", "Heart Disease"];
    const CHRONIC_DISEASES_OPTIONS = ["Diabetes", "Hypertension", "Asthma", "Heart Disease", "Arthritis", "Thyroid Disorder", "Chronic Kidney Disease", "IBS", "Crohn's Disease", "Ulcerative Colitis"];

    // Profile Edit States
    const [editMode, setEditMode] = useState(false);
    const [editFname, setEditFname] = useState('');
    const [editLname, setEditLname] = useState('');
    const [editWeight, setEditWeight] = useState('');
    const [editHeight, setEditHeight] = useState('');
    const [editDiet, setEditDiet] = useState('');
    const [editAllergies, setEditAllergies] = useState('');
    const [editSmoker, setEditSmoker] = useState('false');
    const [editFamilyHistory, setEditFamilyHistory] = useState('');
    const [editPastSurgeries, setEditPastSurgeries] = useState('');
    const [editChronic, setEditChronic] = useState([]);
    const [editPhoto, setEditPhoto] = useState('');
    const [photoUploading, setPhotoUploading] = useState(false);
    const profilePhotoInputRef = useRef(null);

    // AI Analysis States
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [loadingStepIdx, setLoadingStepIdx] = useState(0);
    const fileInputRef = useRef(null);

    // History States
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Confirm Modal States
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // Messaging States
    const [chats, setChats] = useState([]);
    const [chatsLoading, setChatsLoading] = useState(false);

    // Doctor Find States
    const [searchVal, setSearchVal] = useState('');
    const [specVal, setSpecVal] = useState('');

    // Unread messages count badge
    const [unreadMessages, setUnreadMessages] = useState(0);

    // Initial configuration
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const docs = await api.getAllDoctors();
                setAllDoctors(docs || []);

                const specs = await api.getSpecializations().catch(() => ["Gastroenterology", "Hepatology", "Internal Medicine", "General Surgery", "Endoscopy"]);
                setSpecializations(specs || []);

                if (currentUser?.patientId) {
                    const hist = await api.getPatientHistory(currentUser.patientId);
                    setHistory(hist || []);
                }
            } catch (e) {
                console.error(e);
            }
        };
        loadInitialData();

        // Check if there is a saved tab in sessionStorage
        const savedTab = sessionStorage.getItem('gastroai_last_section');
        if (savedTab && savedTab.startsWith('pt-')) {
            setActiveTab(savedTab);
        }
    }, []);

    // Set tab clicker
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('gastroai_last_section', tabId);
        setSidebarOpen(false);
    };

    // Load data based on active tab
    useEffect(() => {
        if (activeTab === 'pt-history') {
            loadHistory();
        } else if (activeTab === 'pt-doctors') {
            loadDoctorsList();
        }
    }, [activeTab]);

    // Poll chat list when messages tab is active
    useEffect(() => {
        if (activeTab !== 'pt-my-messages' || !currentUser?.patientId) return;

        loadChats();
        const interval = setInterval(loadChats, 3000);
        return () => clearInterval(interval);
    }, [activeTab, currentUser]);

    // Poll for unread messages badge
    useEffect(() => {
        if (!currentUser?.patientId) return;

        const updateUnreadBadge = async () => {
            try {
                const list = await api.getPatientChats(currentUser.patientId);
                let totalUnread = 0;
                for (const ch of list) {
                    const res = await api.getUnreadMessageCount(ch.chatId, String(currentUser.patientId), 'Patient');
                    totalUnread += (res.unreadCount || 0);
                }
                setUnreadMessages(totalUnread);
            } catch (e) { }
        };

        updateUnreadBadge();
        const interval = setInterval(updateUnreadBadge, 3000);
        return () => clearInterval(interval);
    }, [currentUser]);

    // Load history
    const loadHistory = async () => {
        if (!currentUser?.patientId) return;
        setHistoryLoading(true);
        try {
            const hist = await api.getPatientHistory(currentUser.patientId);
            setHistory(hist || []);
        } catch (e) {
            showToast('Failed to load scan history.', 'error');
        } finally {
            setHistoryLoading(false);
        }
    };

    // Load chats list
    const loadChats = async () => {
        if (!currentUser?.patientId) return;
        setChatsLoading(true);
        try {
            const list = await api.getPatientChats(currentUser.patientId);
            const formattedChats = [];
            for (const chat of list) {
                try {
                    const unreadRes = await api.getUnreadMessageCount(chat.chatId, String(currentUser.patientId), 'Patient');
                    chat.unreadCount = unreadRes.unreadCount || 0;

                    const doc = await api.getDoctorById(chat.doctorId);
                    if (doc) {
                        doc.unreadCount = chat.unreadCount;
                        doc.chatId = chat.chatId;
                        formattedChats.push(doc);
                    }
                } catch (e) { }
            }
            formattedChats.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
            setChats(formattedChats);
        } catch (e) {
            showToast('Failed to load conversations.', 'error');
        } finally {
            setChatsLoading(false);
        }
    };

    const loadDoctorsList = async () => {
        try {
            const docs = await api.getAllDoctors();
            setAllDoctors(docs || []);
        } catch (e) { }
    };

    const handleChronicSelect = (e) => {
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(options[i].value);
            }
        }
        setEditChronic(selected);
    };

    // Profile edits
    const startEdit = () => {
        const p = currentUser?.profileInfo || {};
        setEditFname(currentUser.displayName.split(' ')[0] || '');
        setEditLname(currentUser.displayName.split(' ')[1] || '');
        setEditWeight(p.weight || '');
        setEditHeight(p.height || '');
        setEditDiet(p.dietType || '');
        setEditAllergies(p.allergies || '');
        setEditSmoker(p.isSmoker ? 'true' : 'false');
        setEditFamilyHistory(p.familyHistory || '');
        setEditPastSurgeries(p.pastSurgeries || '');
        setEditChronic(p.chronicDiseases ? p.chronicDiseases.split(', ').map(c => c.trim()) : []);
        setEditPhoto(p.profilePhoto || '');
        setEditMode(true);
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...currentUser.profileInfo,
                patientId: currentUser.patientId,
                firstName: editFname.trim(),
                lastName: editLname.trim(),
                weight: parseFloat(editWeight) || 0,
                height: parseFloat(editHeight) || 0,
                allergies: editAllergies.trim(),
                dietType: editDiet,
                isSmoker: editSmoker === 'true',
                familyHistory: editFamilyHistory,
                pastSurgeries: editPastSurgeries.trim(),
                chronicDiseases: editChronic.join(', '),
                profilePhoto: editPhoto
            };
            const updated = await api.updatePatient(data);
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

    // AI Analysis file actions
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

    const triggerUploadAnalysis = async () => {
        if (!file || !currentUser?.patientId) return;
        setAnalysisLoading(true);
        setAnalysisResult(null);
        setLoadingStepIdx(0);
        const interval = setInterval(() => {
            setLoadingStepIdx(prev => (prev < 4 ? prev + 1 : prev));
        }, 500);
        try {
            const res = await api.uploadImage(currentUser.patientId, file);
            clearInterval(interval);
            setLoadingStepIdx(5);
            setAnalysisResult(res);
            showToast('Analysis completed successfully! 🔬', 'success');
            loadHistory();
        } catch (err) {
            clearInterval(interval);
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

    // Request doctor review
    const handleRequestReview = async (resultId, selectId) => {
        const doctorId = parseInt(document.getElementById(selectId)?.value);
        if (!doctorId) {
            showToast('Please select a doctor.', 'warning');
            return;
        }
        try {
            await api.requestReview(resultId, doctorId);
            showToast('Review request sent to doctor! ✅', 'success');
            loadHistory();
        } catch (err) {
            showToast(err.message || 'Failed to send review request', 'error');
        }
    };

    // Delete Scan
    const handleDeleteAnalysis = (resultId) => {
        setDeleteTargetId(resultId);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            await api.deleteAnalysis(deleteTargetId);
            showToast('Scan history deleted! ✅', 'success');
            loadHistory();
        } catch (err) {
            showToast(err.message || 'Failed to delete scan', 'error');
        } finally {
            setIsConfirmOpen(false);
            setDeleteTargetId(null);
        }
    };

    // Submit rating
    const handleRateDoctor = async (doctorId, rating) => {
        try {
            await api.rateDoctor(doctorId, rating);
            showToast(`Thank you! You rated the doctor with ${rating} stars. ⭐`, 'success');
            loadDoctorsList();
        } catch (err) {
            showToast(err.message || 'Failed to submit rating', 'error');
        }
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

    // Filter doctors
    const filteredDoctors = allDoctors.filter(d => {
        const matchesName = `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchVal.toLowerCase());
        const matchesSpec = specVal === '' || d.specialization === specVal;
        return matchesName && matchesSpec;
    });

    const p = currentUser?.profileInfo || {};
    const topBarTitleMap = {
        'pt-profile': 'My Profile',
        'pt-upload': 'AI Analysis',
        'pt-history': 'My History',
        'pt-my-messages': 'Messages',
        'pt-doctors': 'Find Doctors'
    };

    return (
        <section id="view-patient" className="view active">
            {/* Sidebar Overlay */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    Gastro<span>AI</span> <span className="role-tag">Patient</span>
                    <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
                </div>
                <nav className="sidebar-nav">
                    <a href="#" className={`snav-link ${activeTab === 'pt-profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('pt-profile'); }}>
                        <span className="snav-icon">👤</span> My Profile
                    </a>
                    <a href="#" className={`snav-link ${activeTab === 'pt-upload' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('pt-upload'); }}>
                        <span className="snav-icon">🔬</span> AI Analysis
                    </a>
                    <a href="#" className={`snav-link ${activeTab === 'pt-history' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('pt-history'); }}>
                        <span className="snav-icon">📋</span> My History
                    </a>
                    <a href="#" className={`snav-link ${activeTab === 'pt-my-messages' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('pt-my-messages'); }}>
                        <span className="snav-icon">💬</span> Messages
                        {unreadMessages > 0 && <span className="badge-count">{unreadMessages}</span>}
                    </a>
                    <a href="#" className={`snav-link ${activeTab === 'pt-doctors' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleTabChange('pt-doctors'); }}>
                        <span className="snav-icon">👨‍⚕️</span> Find Doctors
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
                        <div className="user-avatar" style={{ cursor: 'pointer' }} onClick={() => handleTabChange('pt-profile')}>
                            {getAvatarHTML(p.profilePhoto, currentUser.displayName?.[0]?.toUpperCase() || 'P')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 600 }}>{currentUser.displayName}</span>
                            <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>Patient</span>
                        </div>
                    </div>
                </header>

                {/* ── Section: Profile ── */}
                {activeTab === 'pt-profile' && (
                    <div id="pt-profile" className="dash-section active">
                        {/* Welcome Banner */}
                        <div className="welcome-banner">
                            <div>
                                <div className="welcome-banner-greeting">
                                    {(() => {
                                        const hr = new Date().getHours();
                                        const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
                                        return `${greet}, ${currentUser.displayName.split(' ')[0]} 👋`;
                                    })()}
                                </div>
                                <div className="welcome-banner-sub">Here's a summary of your GastroAI account</div>
                            </div>
                            <div className="welcome-banner-stats">
                                <div className="welcome-stat-pill">
                                    🔬 <strong>{history.length}</strong> <span>Total Scans</span>
                                </div>
                                <div className="welcome-stat-pill">
                                    ✅ <strong>{history.filter(h => h.isReviewedByDoctor).length}</strong> <span>Reviewed</span>
                                </div>
                                <div className="welcome-stat-pill">
                                    ⏳ <strong>{history.filter(h => !h.isReviewedByDoctor).length}</strong> <span>Pending</span>
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
                                    {getAvatarHTML(editMode ? editPhoto : p.profilePhoto, currentUser.displayName?.[0]?.toUpperCase() || 'P')}
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
                                    {currentUser.displayName}
                                </h3>
                                <span className="badge badge-primary" style={{ padding: '4px 12px', fontSize: '0.75rem', background: 'rgba(0, 242, 254, 0.12)', color: '#00f2fe', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: '20px', marginBottom: '1.5rem' }}>
                                    Patient Profile
                                </span>

                                <div style={{ width: '100%', display: 'grid', gap: '0.75rem', textAlign: 'left', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>📧 Email</span>
                                        <span style={{ color: 'var(--text-white-to-dark)', fontWeight: 500 }}>{currentUser.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>📞 Phone</span>
                                        <span style={{ color: 'var(--text-white-to-dark)', fontWeight: 500 }}>{p.phoneNum || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)' }}>⚧️ Gender / Age</span>
                                        <span style={{ color: 'var(--text-white-to-dark)', fontWeight: 500 }}>{p.gender || '—'} ({p.age || '—'} yrs)</span>
                                    </div>
                                </div>

                                {!editMode && (
                                    <button className="btn btn-outline" onClick={startEdit} style={{
                                        marginTop: '1.5rem',
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

                            {/* Bento Item 2: Vitals & Primary Metrics */}
                            <div className="glass-card" style={{
                                padding: '1.75rem',
                                borderRadius: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'var(--card-bg-inline)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <h4 style={{ fontSize: '1rem', color: 'var(--text-white-to-dark)', fontWeight: '600', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📊</span> Physical Vitals
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                                    {/* Blood Card */}
                                    <div style={{ background: 'rgba(231, 76, 60, 0.06)', border: '1px solid rgba(231, 76, 60, 0.15)', borderRadius: '16px', padding: '1rem 0.5rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '1.5rem' }}>🩸</span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '4px 0' }}>Blood Type</div>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e74c3c' }}>{p.bloodType || '—'}</div>
                                    </div>

                                    {/* Height Card */}
                                    <div style={{ background: 'rgba(52, 152, 219, 0.06)', border: '1px solid rgba(52, 152, 219, 0.15)', borderRadius: '16px', padding: '1rem 0.5rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '1.5rem' }}>📏</span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '4px 0' }}>Height</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3498db' }}>{p.height ? `${p.height} cm` : '—'}</div>
                                    </div>

                                    {/* Weight Card */}
                                    <div style={{ background: 'rgba(46, 204, 113, 0.06)', border: '1px solid rgba(46, 204, 113, 0.15)', borderRadius: '16px', padding: '1rem 0.5rem', textAlign: 'center' }}>
                                        <span style={{ fontSize: '1.5rem' }}>⚖️</span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '4px 0' }}>Weight</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2ecc71' }}>{p.weight ? `${p.weight} kg` : '—'}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--muted)' }}>🥦 Diet Type</span>
                                        <span style={{ color: '#2ecc71', fontWeight: 600 }}>{p.dietType || '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)' }}>🚬 Smoking Habit</span>
                                        <span style={{ color: p.isSmoker ? '#f1c40f' : 'var(--muted)', fontWeight: 600 }}>{p.isSmoker ? 'Smoker' : 'Non-Smoker'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bento Item 3: Medical Diagnostics & Allergies */}
                            <div className="glass-card" style={{
                                padding: '1.75rem',
                                borderRadius: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'var(--card-bg-inline)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <h4 style={{ fontSize: '1rem', color: 'var(--text-white-to-dark)', fontWeight: '600', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>🩺</span> Medical Risks & History
                                    </h4>

                                    <div style={{ display: 'grid', gap: '1rem', fontSize: '0.85rem' }}>
                                        <div>
                                            <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>⚠️ Allergies</div>
                                            <span className="badge" style={{
                                                fontSize: '0.75rem',
                                                padding: '4px 10px',
                                                background: p.allergies && p.allergies.toLowerCase() !== 'none' ? 'rgba(231, 76, 60, 0.12)' : 'rgba(255,255,255,0.05)',
                                                color: p.allergies && p.allergies.toLowerCase() !== 'none' ? '#e74c3c' : 'rgba(255,255,255,0.5)',
                                                border: p.allergies && p.allergies.toLowerCase() !== 'none' ? '1px solid rgba(231, 76, 60, 0.25)' : '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px'
                                            }}>{p.allergies || 'None'}</span>
                                        </div>

                                        <div>
                                            <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>🧬 Family History</div>
                                            <span style={{ color: 'var(--text-white-to-dark)', fontWeight: 500 }}>{p.familyHistory || 'None'}</span>
                                        </div>

                                        <div>
                                            <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>🔪 Past Surgeries</div>
                                            <span style={{ color: 'var(--text-white-to-dark)', fontWeight: 500 }}>{p.pastSurgeries || 'None'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.75rem' }}>
                                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '6px' }}>🦠 Chronic Diseases</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {p.chronicDiseases ? p.chronicDiseases.split(',').map((cd, i) => (
                                            <span key={i} className="badge badge-info" style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px' }}>{cd.trim()}</span>
                                        )) : <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>None</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {editMode && (
                            <div id="pt-profile-edit" style={{ marginTop: '2rem' }}>
                                <h3 className="section-title" style={{ fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                    Edit Profile
                                </h3>
                                <form onSubmit={saveProfile} className="glass-card" style={{ marginTop: '1rem' }}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Weight (kg)</label>
                                            <input type="number" step="0.1" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Height (cm)</label>
                                            <input type="number" step="0.1" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Allergies</label>
                                            <input type="text" value={editAllergies} onChange={(e) => setEditAllergies(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Diet Type</label>
                                            <select value={editDiet} onChange={(e) => setEditDiet(e.target.value)}>
                                                <option value="">Select...</option>
                                                {DIET_TYPES.map(item => <option key={item} value={item}>{item}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Smoking Habit</label>
                                            <select value={editSmoker} onChange={(e) => setEditSmoker(e.target.value)}>
                                                <option value="false">Non-Smoker</option>
                                                <option value="true">Smoker</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Family History</label>
                                            <select value={editFamilyHistory} onChange={(e) => setEditFamilyHistory(e.target.value)}>
                                                <option value="">Select...</option>
                                                {FAMILY_HISTORY_OPTIONS.map(item => <option key={item} value={item}>{item}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Past Surgeries</label>
                                            <input type="text" placeholder="e.g. Appendectomy" value={editPastSurgeries} onChange={(e) => setEditPastSurgeries(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Chronic Diseases</label>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '0.6rem',
                                            marginTop: '0.6rem',
                                            padding: '0.5rem 0'
                                        }}>
                                            {CHRONIC_DISEASES_OPTIONS.map(item => {
                                                const isChecked = editChronic.includes(item);
                                                return (
                                                    <label key={item} style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '0.5rem 1.1rem',
                                                        borderRadius: '50px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem',
                                                        fontWeight: '500',
                                                        background: isChecked
                                                            ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 172, 254, 0.2))'
                                                            : 'rgba(255, 255, 255, 0.03)',
                                                        border: isChecked
                                                            ? '1px solid #00f2fe'
                                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                                        color: isChecked ? '#00f2fe' : 'var(--text-muted-white)',
                                                        boxShadow: isChecked ? '0 0 10px rgba(0, 242, 254, 0.2)' : 'none',
                                                        transition: 'all 0.2s ease',
                                                        userSelect: 'none'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            value={item}
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setEditChronic([...editChronic, item]);
                                                                } else {
                                                                    setEditChronic(editChronic.filter(c => c !== item));
                                                                }
                                                            }}
                                                            style={{ display: 'none' }}
                                                        />
                                                        {isChecked && <span style={{ marginRight: '0.4rem', fontSize: '0.85rem' }}>✓</span>}
                                                        {item}
                                                    </label>
                                                );
                                            })}
                                        </div>
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

                {/* ── Section: Upload ── */}
                {activeTab === 'pt-upload' && (
                    <div id="pt-upload" className="dash-section active">
                        <div className="ai-hub-container">
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <h2 className="section-title" style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.4rem', justifyContent: 'center' }}>
                                    🔬 AI Image Diagnosis
                                </h2>
                                <p className="section-sub" style={{ margin: 0 }}>
                                    Upload gastroscopy scans for instant hybrid neural-network analysis
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
                                    {/* Futuristic Glowing Cloud Icon */}
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
                                            <img id="pt-preview-img" src={filePreview} alt="Preview" />
                                            {/* Corner elements for medical scan framing */}
                                            <div className="scanner-corner scanner-corner-tl"></div>
                                            <div className="scanner-corner scanner-corner-tr"></div>
                                            <div className="scanner-corner scanner-corner-bl"></div>
                                            <div className="scanner-corner scanner-corner-br"></div>

                                            {/* High tech grid overlay */}
                                            <div className="scanner-grid-overlay"></div>

                                            {/* Glowing scanner sweep bar */}
                                            {analysisLoading && <div className="scanner-line"></div>}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
                                            {!analysisResult && (
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ flex: 2, borderRadius: '50px', fontSize: '0.9rem', padding: '0.65rem' }}
                                                    onClick={triggerUploadAnalysis}
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

                                    {/* Loading State bar */}
                                    {analysisLoading && (
                                        <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                                            <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '3px', margin: '0 auto 0.75rem auto' }}></div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-white)', margin: 0 }}>
                                                {loadingStepIdx === 0 && "🖥️ Initializing hybrid DenseNet-Swin framework..."}
                                                {loadingStepIdx === 1 && "🧬 Loading weights and local feature maps..."}
                                                {loadingStepIdx === 2 && "🔬 Computing global self-attention relationships..."}
                                                {loadingStepIdx === 3 && "⚡ Classifying gastrointestinal scan tissue..."}
                                                {loadingStepIdx >= 4 && "📊 Finalizing diagnostics logs..."}
                                            </p>
                                        </div>
                                    )}

                                    {/* AI Diagnostic Report Console */}
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
                                                    const severityText = isNormal ? 'Normal Cecum / Healthy Z-Line' : isPolyp ? 'Pathological Scan (Polyp/Colitis)' : 'Inflamed Tissue (Esophagitis)';
                                                    const severityColor = isNormal ? '#2ecc71' : isPolyp ? '#e74c3c' : '#f1c40f';
                                                    const severityBg = isNormal ? 'rgba(46, 204, 113, 0.1)' : isPolyp ? 'rgba(231, 76, 60, 0.1)' : 'rgba(241, 196, 15, 0.1)';
                                                    return (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 12px', borderRadius: '50px', background: severityBg, color: severityColor, border: `1px solid ${severityColor}25` }}>
                                                            {severityText}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            {/* Confidence Progress Meter */}
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                                                    <span style={{ color: 'var(--muted)' }}>Prediction Confidence</span>
                                                    <strong style={{ color: 'var(--text-white-to-dark)' }}>{analysisResult.confidence}%</strong>
                                                </div>
                                                <div className="confidence-meter">
                                                    <div
                                                        className="confidence-fill"
                                                        style={{
                                                            width: `${analysisResult.confidence}%`,
                                                            background: analysisResult.confidence >= 75 ? 'linear-gradient(90deg, #10b981, #059669)' : analysisResult.confidence >= 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)',
                                                            boxShadow: analysisResult.confidence >= 75 ? '0 0 10px rgba(16, 185, 129, 0.3)' : '0 0 10px rgba(245, 158, 11, 0.3)'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Next Steps / Advice */}
                                            <div style={{ background: 'var(--card-bg-inline)', border: '1px solid var(--card-border-inline)', borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                                                <h4 style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clinical Guidance</h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-white)', margin: 0, lineHeight: '1.4' }}>
                                                    {analysisResult.recommendations || 'Scan registered successfully. Ask a clinical specialist to confirm treatment details.'}
                                                </p>
                                            </div>

                                            {/* Action panel */}
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderRadius: '12px' }}
                                                    onClick={() => {
                                                        setActiveTab('pt-history');
                                                        showToast('Scroll down history list to request physician review.', 'info');
                                                    }}
                                                >
                                                    📨 Request Physician Review
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Section: History ── */}
                {activeTab === 'pt-history' && (
                    <div id="pt-history" className="dash-section active">
                        <h2 className="section-title">📋 Analysis History</h2>
                        <p className="section-sub">All your past scans and their review status</p>

                        {/* Minimal horizontal status summary */}
                        {!historyLoading && history.length > 0 && (
                            <div style={{
                                display: 'flex',
                                gap: '1rem',
                                flexWrap: 'wrap',
                                background: 'var(--card-bg-inline)',
                                border: '1px solid var(--card-border-inline)',
                                borderRadius: '16px',
                                padding: '1rem 1.5rem',
                                marginBottom: '1.5rem',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--primary)' }}>🔬</span>
                                    <span style={{ color: 'var(--text-muted-white)' }}>Total uploaded scans:</span>
                                    <strong style={{ color: 'var(--text-white-to-dark)' }}>{history.length}</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ color: '#2ecc71' }}>●</span>
                                        <span style={{ color: 'var(--text-muted-white)' }}>Reviewed:</span>
                                        <strong style={{ color: '#2ecc71' }}>{history.filter(h => h.isReviewedByDoctor).length}</strong>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ color: '#f1c40f' }}>●</span>
                                        <span style={{ color: 'var(--text-muted-white)' }}>Pending:</span>
                                        <strong style={{ color: '#f1c40f' }}>{history.filter(h => !h.isReviewedByDoctor).length}</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {historyLoading ? (
                            <div className="empty-state">Loading your history…</div>
                        ) : history.length === 0 ? (
                            <div className="empty-state"><div className="empty-state-icon">📋</div>No scans yet. Upload your first scan!</div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1.5rem',
                                marginTop: '1rem'
                            }}>
                                {history.map(h => {
                                    const reviewed = h.isReviewedByDoctor;
                                    const selectId = `doc-sel-${h.resultId}`;

                                    // Parse report ID if present
                                    let reportId = null;
                                    let cleanNotes = h.doctorNotes || '';
                                    if (h.doctorNotes) {
                                        const match = h.doctorNotes.match(/^\[REPORT_ID:(\d+)\]\s*(.*)/);
                                        if (match) {
                                            reportId = parseInt(match[1]);
                                            cleanNotes = match[2];
                                        }
                                    }

                                    // Let's decide severity status badge based on disease name and confidence
                                    const isCritical = h.diseaseName && !h.diseaseName.toLowerCase().includes('normal') && h.confidence >= 0.7;
                                    const isNormal = h.diseaseName && h.diseaseName.toLowerCase().includes('normal');

                                    let statusBadge = (
                                        <span className="badge" style={{
                                            background: 'rgba(46, 204, 113, 0.15)',
                                            color: '#2ecc71',
                                            border: '1px solid rgba(46, 204, 113, 0.3)',
                                            boxShadow: '0 0 8px rgba(46, 204, 113, 0.2)'
                                        }}>Normal</span>
                                    );
                                    if (isCritical) {
                                        statusBadge = (
                                            <span className="badge" style={{
                                                background: 'rgba(231, 76, 60, 0.15)',
                                                color: '#e74c3c',
                                                border: '1px solid rgba(231, 76, 60, 0.3)',
                                                boxShadow: '0 0 8px rgba(231, 76, 60, 0.2)'
                                            }}>Critical</span>
                                        );
                                    } else if (!isNormal) {
                                        statusBadge = (
                                            <span className="badge" style={{
                                                background: 'rgba(241, 196, 15, 0.15)',
                                                color: '#f1c40f',
                                                border: '1px solid rgba(241, 196, 15, 0.3)',
                                                boxShadow: '0 0 8px rgba(241, 196, 15, 0.2)'
                                            }}>Requires Review</span>
                                        );
                                    }

                                    const accentColor = reviewed ? '#2ecc71' : isCritical ? '#e74c3c' : '#f59e0b';
                                    return (
                                        <div className="glass-card" key={h.resultId} style={{
                                            padding: '1.25rem',
                                            paddingLeft: '1.5rem',
                                            borderRadius: '16px',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderLeft: `3px solid ${accentColor}`,
                                            background: 'var(--card-bg-inline)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 242, 254, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                        {h.imagePath ? (
                                                            <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                                                                onClick={() => onOpenImagePreview(`http://localhost:5170${h.imagePath}`)}>
                                                                <img
                                                                    src={`http://localhost:5170${h.imagePath}`}
                                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    alt="Scan thumb"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🔬</div>
                                                        )}
                                                        <div>
                                                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '600' }}>{h.diseaseName || 'Unknown'}</h4>
                                                            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>{fmtDate(h.analyzedAt)}</p>
                                                        </div>
                                                    </div>
                                                    <button className="icon-btn" onClick={() => handleDeleteAnalysis(h.resultId)} style={{ color: 'var(--danger)', padding: '4px' }} title="Delete Scan">🗑️</button>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                                    {statusBadge}
                                                    {confBadge(h.confidence)}
                                                    <span className={`badge ${reviewed ? 'badge-success' : 'badge-warning'}`} style={{ boxShadow: reviewed ? '0 0 8px rgba(46, 204, 113, 0.2)' : '0 0 8px rgba(241, 196, 15, 0.2)' }}>
                                                        {reviewed ? '✔ Reviewed' : '⏳ Pending'}
                                                    </span>
                                                </div>

                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-white)', lineHeight: '1.4', marginBottom: '1rem' }}>
                                                    {h.description || 'No detailed analysis description available.'}
                                                </p>
                                            </div>

                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginTop: 'auto' }}>
                                                {reviewed ? (
                                                    <div>
                                                        {reportId ? (
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => onOpenReport(reportId)}>📄 View Report</button>
                                                                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onOpenChat(h.doctorId || 1, h.doctorName || 'Doctor')}>💬 Chat</button>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Doctor Notes:</span>
                                                                <p style={{ fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>"{cleanNotes || 'No notes left.'}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : h.doctorId ? (
                                                    <div style={{ background: 'rgba(241, 196, 15, 0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(241, 196, 15, 0.1)' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--warning)', display: 'block', textAlign: 'center' }}>⏳ Awaiting review from Dr. {h.doctorName || 'Assigned'}</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Request Doctor Review:</label>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <select id={selectId} style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem' }}>
                                                                {allDoctors.map(d => (
                                                                    <option key={d.doctorId} value={d.doctorId}>Dr. {d.firstName} {d.lastName}</option>
                                                                ))}
                                                            </select>
                                                            <button className="btn btn-outline btn-sm" onClick={() => handleRequestReview(h.resultId, selectId)}>📨 Request</button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Section: Messages ── */}
                {activeTab === 'pt-my-messages' && (
                    <div id="pt-my-messages" className="dash-section active">

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
                                    💬 Inbox
                                </h2>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                                    {chats.length > 0
                                        ? `${chats.length} active conversation${chats.length > 1 ? 's' : ''} · ${chats.filter(c => c.unreadCount > 0).length} unread`
                                        : 'No conversations yet'
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
                                <button
                                    className="btn btn-outline btn-sm"
                                    style={{ borderRadius: '12px' }}
                                    onClick={() => handleTabChange('pt-doctors')}
                                >
                                    + New Conversation
                                </button>
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
                                    Your inbox is empty
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '300px', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                    Start a conversation with a doctor about your health concerns or scan results.
                                </p>
                                <button className="btn btn-primary" style={{ borderRadius: '14px', padding: '10px 24px' }} onClick={() => handleTabChange('pt-doctors')}>
                                    👨‍⚕️ Find a Doctor
                                </button>
                            </div>

                        ) : (
                            /* Conversations List */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                {chats.map((d, idx) => {
                                    const hasUnread = d.unreadCount > 0;
                                    // Pick a unique gradient per doctor
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
                                            key={d.doctorId}
                                            onClick={() => onOpenChat(d.doctorId, `${d.firstName} ${d.lastName}`, d.profilePhoto)}
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
                                                        boxShadow: hasUnread ? `0 0 18px rgba(59,130,246,0.25)` : '0 2px 10px rgba(0,0,0,0.3)',
                                                        flexShrink: 0
                                                    }}
                                                    onClick={e => { e.stopPropagation(); onOpenDoctorProfile(d.doctorId); }}
                                                >
                                                    {getAvatarHTML(d.profilePhoto, d.firstName?.[0]?.toUpperCase())}
                                                </div>
                                                {/* Online pulse dot */}
                                                <span
                                                    className={`avail-dot ${d.isAvailable ? 'online' : 'offline'}`}
                                                    style={{ position: 'absolute', bottom: '1px', right: '1px', border: '2px solid var(--bg2)', width: '11px', height: '11px' }}
                                                />
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{
                                                        fontWeight: '700', fontSize: '0.96rem', color: 'var(--text-white-to-dark)',
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                    }}>
                                                        Dr. {d.firstName} {d.lastName}
                                                    </span>
                                                    {hasUnread && (
                                                        <span style={{
                                                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                                            color: '#fff', fontSize: '0.62rem', fontWeight: '800',
                                                            padding: '2px 7px', borderRadius: '50px',
                                                            boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
                                                            flexShrink: 0
                                                        }}>
                                                            {d.unreadCount} NEW
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                                                    <span style={{ color: d.isAvailable ? '#10b981' : 'var(--muted)', fontWeight: 500 }}>
                                                        {d.isAvailable ? '● Online' : '● Offline'}
                                                    </span>
                                                    {d.specialization && (
                                                        <>
                                                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                                                            <span style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {d.specialization}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action button */}
                                            <div
                                                style={{
                                                    width: '42px', height: '42px', borderRadius: '50%',
                                                    background: hasUnread ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.06)',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.1rem', flexShrink: 0,
                                                    boxShadow: hasUnread ? '0 4px 14px rgba(59,130,246,0.35)' : 'none',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                💬
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Section: Doctors ── */}
                {activeTab === 'pt-doctors' && (
                    <div id="pt-doctors" className="dash-section active">
                        {/* Header + Search */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
                            <div>
                                <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>👨‍⚕️ Find a Doctor</h2>
                                <p className="section-sub" style={{ margin: 0 }}>{filteredDoctors.length} specialists available</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--muted)', pointerEvents: 'none' }}>🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        style={{
                                            padding: '0.55rem 0.75rem 0.55rem 2rem',
                                            fontSize: '0.85rem', width: '190px',
                                            background: 'var(--card-bg-inline)',
                                            border: '1px solid var(--card-border-inline)',
                                            borderRadius: '12px', color: 'var(--text)', outline: 'none'
                                        }}
                                        value={searchVal}
                                        onChange={(e) => setSearchVal(e.target.value)}
                                    />
                                </div>
                                <select
                                    style={{
                                        padding: '0.55rem 0.75rem', fontSize: '0.85rem',
                                        background: 'var(--card-bg-inline)',
                                        border: '1px solid var(--card-border-inline)',
                                        borderRadius: '12px', color: 'var(--text)', outline: 'none'
                                    }}
                                    value={specVal}
                                    onChange={(e) => setSpecVal(e.target.value)}
                                >
                                    <option value="">All Specializations</option>
                                    {specializations.map(item => <option key={item} value={item}>{item}</option>)}
                                </select>
                            </div>
                        </div>

                        {filteredDoctors.length === 0 ? (
                            <div className="empty-state-premium">
                                <span className="esp-icon">🔍</span>
                                <h3>No doctors found</h3>
                                <p>Try adjusting your search or specialization filter.</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '1.25rem'
                            }}>
                                {filteredDoctors.map(d => (
                                    <div
                                        key={d.doctorId}
                                        style={{
                                            background: 'var(--card-bg-inline)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                            borderRadius: '24px',
                                            overflow: 'hidden',
                                            transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-7px)';
                                            e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.35), 0 0 0 1px rgba(59,130,246,0.2)';
                                            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                        }}
                                    >
                                        {/* ── Gradient Header ── */}
                                        <div style={{
                                            height: '100px',
                                            background: d.isAvailable
                                                ? 'linear-gradient(135deg, rgba(59,130,246,0.35) 0%, rgba(139,92,246,0.25) 60%, rgba(16,185,129,0.15) 100%)'
                                                : 'linear-gradient(135deg, rgba(71,85,105,0.35) 0%, rgba(51,65,85,0.2) 100%)',
                                            position: 'relative'
                                        }}>
                                            {/* Mesh circles decoration */}
                                            <div style={{
                                                position: 'absolute', top: '-20px', right: '-20px',
                                                width: '100px', height: '100px', borderRadius: '50%',
                                                background: d.isAvailable ? 'rgba(59,130,246,0.08)' : 'rgba(100,116,139,0.08)',
                                                pointerEvents: 'none'
                                            }} />

                                            {/* Availability badge */}
                                            <div style={{
                                                position: 'absolute', top: '12px', right: '12px',
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                fontSize: '0.7rem', fontWeight: '700',
                                                letterSpacing: '0.3px',
                                                color: d.isAvailable ? '#2ecc71' : 'var(--muted)',
                                                background: d.isAvailable ? 'rgba(46,204,113,0.13)' : 'rgba(255,255,255,0.05)',
                                                border: d.isAvailable ? '1px solid rgba(46,204,113,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                                padding: '4px 10px', borderRadius: '50px',
                                                backdropFilter: 'blur(8px)'
                                            }}>
                                                <span className={`avail-dot ${d.isAvailable ? 'online' : 'offline'}`} style={{ width: '6px', height: '6px' }}></span>
                                                {d.isAvailable ? 'Available' : 'Busy'}
                                            </div>
                                        </div>

                                        {/* ── Card Body ── */}
                                        <div style={{ padding: '0 1.25rem 1.25rem', marginTop: '-40px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>

                                            {/* Avatar */}
                                            <div
                                                style={{
                                                    width: '76px', height: '76px', borderRadius: '50%',
                                                    overflow: 'hidden',
                                                    background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                                                    border: '3px solid rgba(10,15,30,0.9)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: '800', fontSize: '1.4rem', color: 'var(--text-white-to-dark)',
                                                    cursor: 'pointer', marginBottom: '0.65rem',
                                                    boxShadow: '0 0 0 2px rgba(59,130,246,0.25), 0 6px 20px rgba(0,0,0,0.4)',
                                                    transition: 'box-shadow 0.2s'
                                                }}
                                                onClick={() => onOpenDoctorProfile(d.doctorId)}
                                                title="View full profile"
                                            >
                                                {getAvatarHTML(d.profilePhoto, (d.firstName?.[0] || '') + (d.lastName?.[0] || ''))}
                                            </div>

                                            {/* Name + Specialization */}
                                            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-white-to-dark)', margin: '0 0 3px 0', lineHeight: 1.2 }}>
                                                Dr. {d.firstName} {d.lastName}
                                            </h3>
                                            <p style={{
                                                fontSize: '0.76rem', fontWeight: '700', margin: '0 0 10px 0',
                                                color: 'var(--primary)', letterSpacing: '0.3px',
                                                textTransform: 'uppercase'
                                            }}>
                                                {d.specialization || 'Specialist'}
                                            </p>

                                            {/* Info pills row */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', justifyContent: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    fontSize: '0.72rem', fontWeight: '600',
                                                    background: 'var(--badge-gold-bg)', color: 'var(--badge-gold-text)',
                                                    border: '1px solid var(--badge-gold-border)',
                                                    padding: '3px 9px', borderRadius: '50px'
                                                }}>
                                                    ⭐ {d.rating?.toFixed(1) || '—'}
                                                </span>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    fontSize: '0.72rem', fontWeight: '600',
                                                    background: 'var(--badge-indigo-bg)', color: 'var(--badge-indigo-text)',
                                                    border: '1px solid var(--badge-indigo-border)',
                                                    padding: '3px 9px', borderRadius: '50px'
                                                }}>
                                                    💼 {d.yearsOfExperience || 0} yrs
                                                </span>
                                                {d.affiliations && (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        fontSize: '0.72rem', fontWeight: '600',
                                                        background: 'var(--badge-green-bg)', color: 'var(--badge-green-text)',
                                                        border: '1px solid var(--badge-green-border)',
                                                        padding: '3px 9px', borderRadius: '50px',
                                                        maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                    }}>
                                                        🏥 {d.affiliations.slice(0, 14)}{d.affiliations.length > 14 ? '…' : ''}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Star rating row */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                marginBottom: '14px',
                                                background: 'var(--card-bg-inline)',
                                                padding: '7px 12px', borderRadius: '12px',
                                                border: '1px solid var(--card-border-inline)',
                                                width: '100%'
                                            }}>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', marginRight: '4px', fontWeight: 600 }}>Rate</span>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span
                                                        key={star}
                                                        style={{ cursor: 'pointer', fontSize: '1.05rem', transition: 'transform 0.15s' }}
                                                        onClick={() => handleRateDoctor(d.doctorId, star)}
                                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.35)'}
                                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                        title={`${star} star${star > 1 ? 's' : ''}`}
                                                    >⭐</span>
                                                ))}
                                            </div>

                                            {/* Action buttons */}
                                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' }}>
                                                <button
                                                    className="btn btn-outline btn-sm"
                                                    style={{ flex: 1, borderRadius: '14px', fontSize: '0.8rem', padding: '8px 0' }}
                                                    onClick={() => onOpenDoctorProfile(d.doctorId)}
                                                >👁 Profile</button>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    style={{ flex: 2, borderRadius: '14px', fontSize: '0.8rem', padding: '8px 0' }}
                                                    onClick={() => onOpenChat(d.doctorId, `${d.firstName} ${d.lastName}`, d.profilePhoto)}
                                                >💬 Message</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Delete Scan History"
                message="Are you sure you want to delete this scan history? 🗑️"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setDeleteTargetId(null);
                }}
            />
        </section>
    );
}
