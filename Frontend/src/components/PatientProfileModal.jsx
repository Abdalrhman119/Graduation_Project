import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function PatientProfileModal({ isOpen, targetId, targetType, onClose }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !targetId) return;

        const loadProfile = async () => {
            setLoading(true);
            try {
                if (targetType === 'patient') {
                    const p = await api.getPatientById(targetId);
                    setProfile(p);
                } else {
                    const doctors = await api.getAllDoctors();
                    const doc = doctors.find(d => d.doctorId === targetId);
                    setProfile(doc);
                }
            } catch (err) {
                console.error('Failed to load profile details in modal:', err);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [isOpen, targetId, targetType]);

    if (!isOpen) return null;

    const getAvatarHTML = (profilePhoto, defaultChar) => {
        if (profilePhoto) {
            return <img src={`http://localhost:5170${profilePhoto}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="Avatar" />;
        }
        return defaultChar;
    };

    return (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="glass-card review-modal-card" style={{ maxWidth: '500px', position: 'relative', zIndex: 1000 }}>
                <div className="review-modal-header">
                    <h3>👤 {targetType === 'patient' ? 'Patient Profile' : 'Doctor Profile'}</h3>
                    <button className="icon-btn" onClick={onClose}>✕</button>
                </div>
                <div className="review-preview-content" style={{ textAlign: 'left', fontSize: '0.9rem' }}>
                    {loading ? (
                        <div className="empty-state">Loading...</div>
                    ) : !profile ? (
                        <div className="empty-state" style={{ color: 'var(--danger)' }}>Failed to load profile.</div>
                    ) : targetType === 'patient' ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="profile-big-avatar" style={{ width: '70px', height: '70px', margin: 0 }}>
                                    {getAvatarHTML(profile.profilePhoto, (profile.firstName?.[0] || 'P'))}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem' }}>{profile.firstName} {profile.lastName}</h4>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Patient #{profile.patientId}</p>
                                </div>
                            </div>
                            <div className="profile-row"><span className="profile-label">Gender / Age</span><span className="profile-value">{profile.gender} / {profile.age} yrs</span></div>
                            <div className="profile-row"><span class="profile-label">Blood Type</span><span className="profile-value">🩸 {profile.bloodType || '—'}</span></div>
                            <div className="profile-row"><span className="profile-label">Height / Weight</span><span className="profile-value">{profile.height || '—'} cm / {profile.weight || '—'} kg</span></div>
                            <div className="profile-row"><span className="profile-label">Diet Type</span><span className="profile-value">{profile.dietType || '—'}</span></div>
                            <div className="profile-row"><span className="profile-label">Smoker</span><span className="profile-value">{profile.isSmoker ? 'Yes 🚬' : 'No 🚭'}</span></div>
                            <div className="profile-row"><span className="profile-label">Chronic Diseases</span><span className="profile-value">{profile.chronicDiseases || 'None'}</span></div>
                            <div className="profile-row"><span className="profile-label">Allergies</span><span className="profile-value" style={{ color: 'var(--danger)' }}>{profile.allergies || 'None'}</span></div>
                            <div className="profile-row"><span className="profile-label">Past Surgeries</span><span className="profile-value">{profile.pastSurgeries || 'None'}</span></div>
                            <div className="profile-row"><span className="profile-label">Family History</span><span className="profile-value">{profile.familyHistory || 'None'}</span></div>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="profile-big-avatar" style={{ width: '70px', height: '70px', margin: 0 }}>
                                    {getAvatarHTML(profile.profilePhoto, (profile.firstName?.[0] || 'D'))}
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem' }}>Dr. {profile.firstName} {profile.lastName}</h4>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{profile.specialization || 'Specialist'}</p>
                                </div>
                            </div>
                            <div className="profile-row"><span className="profile-label">Specialization</span><span className="profile-value" style={{ color: 'var(--primary)', fontWeight: 600 }}>{profile.specialization || 'Specialist'}</span></div>
                            <div className="profile-row"><span className="profile-label">Experience</span><span className="profile-value">{profile.yearsOfExperience} yrs</span></div>
                            <div className="profile-row"><span className="profile-label">Rating</span><span className="profile-value">⭐ {profile.rating?.toFixed(1) || '0.0'}</span></div>
                            <div className="profile-row"><span className="profile-label">Affiliations</span><span className="profile-value">{profile.affiliations || '—'}</span></div>
                            <div className="profile-row"><span className="profile-label">Working Hours</span><span className="profile-value">{profile.workingHours || '—'}</span></div>
                            <div style={{ marginTop: '1rem' }}>
                                <p style={{ fontSize: '0.83rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>About:</p>
                                <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{profile.about || 'No description.'}</p>
                            </div>
                        </>
                    )}
                </div>
                <div className="review-modal-actions">
                    <button className="btn btn-outline" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
