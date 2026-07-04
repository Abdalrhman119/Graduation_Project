import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import api from './services/api';

// Views
import SplashView from './components/Auth/SplashView';
import RolePicker from './components/Auth/RolePicker';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';

// Modals
import Toast from './components/Toast';
import ChatModal from './components/ChatModal';
import ReviewModal from './components/ReviewModal';
import PatientProfileModal from './components/PatientProfileModal';
import ReportModal from './components/ReportModal';
import ImagePreviewModal from './components/ImagePreviewModal';

export default function App() {
    const { currentUser, isLoading, showToast } = useAuth();
    const [authView, setAuthView] = useState('login'); // 'login' | 'role-picker' | 'register'
    const [selectedRole, setSelectedRole] = useState('patient'); // 'patient' | 'doctor'

    // Theme Management
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('gastroai_theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('gastroai_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Modals State
    const [activeChat, setActiveChat] = useState({
        isOpen: false,
        chatId: null,
        partnerId: null,
        partnerName: '',
        partnerPhoto: '',
        partnerRole: ''
    });

    const [activeReport, setActiveReport] = useState({
        isOpen: false,
        reportId: null
    });

    const [activeProfile, setActiveProfile] = useState({
        isOpen: false,
        targetId: null,
        targetType: 'patient'
    });

    const [activePreview, setActivePreview] = useState({
        isOpen: false,
        imageUrl: ''
    });

    const [activeReview, setActiveReview] = useState({
        isOpen: false,
        resultId: null,
        diseaseName: '',
        confidence: 0,
        patientName: '',
        patientId: null,
        onReviewSubmitted: null
    });

    // Chat Opener
    const handleOpenChat = async (partnerId, partnerName, partnerPhoto = '', explicitChatId = null) => {
        if (!currentUser) return;

        let chatId = explicitChatId;
        if (!chatId) {
            try {
                const isPatient = currentUser.role.toLowerCase() === 'patient';

                // Get current list of chats to check if exists
                const list = isPatient
                    ? await api.getPatientChats(currentUser.patientId)
                    : await api.getDoctorChats(currentUser.doctorId);

                const existing = list.find(c => isPatient ? c.doctorId === partnerId : c.patientId === partnerId);
                if (existing) {
                    chatId = existing.chatId;
                } else {
                    const ptId = isPatient ? currentUser.patientId : partnerId;
                    const drId = isPatient ? partnerId : currentUser.doctorId;
                    const newChat = await api.createChat(ptId, drId);
                    chatId = newChat.chatId;
                }
            } catch (err) {
                showToast('Failed to initialize chat session.', 'error');
                return;
            }
        }

        setActiveChat({
            isOpen: true,
            chatId,
            partnerId,
            partnerName,
            partnerPhoto,
            partnerRole: currentUser.role.toLowerCase() === 'patient' ? 'doctor' : 'patient'
        });
    };

    if (isLoading) {
        return (
            <>
                <SplashView />
                <Toast />
            </>
        );
    }

    return (
        <div className="app-container">
            {/* Animated Background */}
            <div className="animated-bg">
                <div className="bg-bubble bubble-1"></div>
                <div className="bg-bubble bubble-2"></div>
                <div className="bg-bubble bubble-3"></div>
            </div>

            {/* View routing */}
            {!currentUser ? (
                <>
                    <button className="theme-toggle-btn floating-theme-toggle" onClick={toggleTheme} title="Toggle Light/Dark Mode">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    {authView === 'role-picker' && (
                        <RolePicker
                            onSelectRole={(role) => {
                                setSelectedRole(role);
                                setAuthView('register');
                            }}
                            onGoToLogin={() => setAuthView('login')}
                        />
                    )}
                    {authView === 'login' && (
                        <LoginForm
                            onGoToRegister={() => setAuthView('role-picker')}
                        />
                    )}
                    {authView === 'register' && (
                        <RegisterForm
                            role={selectedRole}
                            onGoBack={() => setAuthView('role-picker')}
                            onGoToLogin={() => setAuthView('login')}
                        />
                    )}
                </>
            ) : currentUser.role.toLowerCase() === 'patient' ? (
                <PatientDashboard
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onOpenChat={handleOpenChat}
                    onOpenReport={(reportId) => setActiveReport({ isOpen: true, reportId })}
                    onOpenPatientProfile={(id) => setActiveProfile({ isOpen: true, targetId: id, targetType: 'patient' })}
                    onOpenDoctorProfile={(id) => setActiveProfile({ isOpen: true, targetId: id, targetType: 'doctor' })}
                    onOpenImagePreview={(url) => setActivePreview({ isOpen: true, imageUrl: url })}
                />
            ) : (
                <DoctorDashboard
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onOpenChat={handleOpenChat}
                    onOpenReport={(reportId) => setActiveReport({ isOpen: true, reportId })}
                    onOpenPatientProfile={(id) => setActiveProfile({ isOpen: true, targetId: id, targetType: 'patient' })}
                    onOpenImagePreview={(url) => setActivePreview({ isOpen: true, imageUrl: url })}
                    onOpenReviewModal={(resId, disName, conf, ptName, ptId, onSub) => {
                        setActiveReview({
                            isOpen: true,
                            resultId: resId,
                            diseaseName: disName,
                            confidence: conf,
                            patientName: ptName,
                            patientId: ptId,
                            onReviewSubmitted: onSub
                        });
                    }}
                />
            )}

            {/* Global Modals */}
            <Toast />

            <ChatModal
                isOpen={activeChat.isOpen}
                chatId={activeChat.chatId}
                partnerName={activeChat.partnerName}
                partnerPhoto={activeChat.partnerPhoto}
                partnerId={activeChat.partnerId}
                partnerRole={activeChat.partnerRole}
                onOpenImagePreview={(url) => setActivePreview({ isOpen: true, imageUrl: url })}
                onClose={() => setActiveChat(prev => ({ ...prev, isOpen: false }))}
            />


            <ReportModal
                isOpen={activeReport.isOpen}
                reportId={activeReport.reportId}
                onClose={() => setActiveReport({ isOpen: false, reportId: null })}
            />

            <PatientProfileModal
                isOpen={activeProfile.isOpen}
                targetId={activeProfile.targetId}
                targetType={activeProfile.targetType}
                onClose={() => setActiveProfile({ isOpen: false, targetId: null, targetType: 'patient' })}
            />

            <ImagePreviewModal
                isOpen={activePreview.isOpen}
                imageUrl={activePreview.imageUrl}
                onClose={() => setActivePreview({ isOpen: false, imageUrl: '' })}
            />

            <ReviewModal
                isOpen={activeReview.isOpen}
                resultId={activeReview.resultId}
                disease={activeReview.diseaseName}
                confidence={activeReview.confidence}
                patientName={activeReview.patientName}
                patientId={activeReview.patientId}
                onClose={() => setActiveReview(prev => ({ ...prev, isOpen: false }))}
                onReviewSubmitted={() => {
                    if (activeReview.onReviewSubmitted) activeReview.onReviewSubmitted();
                }}
            />
        </div>
    );
}
