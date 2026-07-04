import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { decodeJwt } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '', visible: false });

    const showToast = (message, type = 'success') => {
        setToast({ message, type, visible: true });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => {
                hideToast();
            }, 3600);
            return () => clearTimeout(timer);
        }
    }, [toast.visible]);

    // Handle token resolution and profile loading
    const resolveUserProfile = async (token, email, role, displayName) => {
        api.setToken(token);
        const userId = api.getUserIdFromToken();

        let userState = {
            email,
            role,
            displayName,
            token,
            userId,
            patientId: null,
            doctorId: null,
            profileInfo: null
        };

        try {
            if (role.toLowerCase() === 'patient') {
                try {
                    const me = await api.getPatientByUserId(userId);
                    if (me?.patientId) {
                        userState.patientId = me.patientId;
                        userState.profileInfo = me;
                    } else {
                        const patients = await api.getAllPatients();
                        const found = (patients || []).find(p => p.email === email);
                        if (found) {
                            userState.patientId = found.patientId;
                            userState.profileInfo = found;
                        }
                    }
                } catch (e) {
                    const patients = await api.getAllPatients();
                    const found = (patients || []).find(p => p.email === email);
                    if (found) {
                        userState.patientId = found.patientId;
                        userState.profileInfo = found;
                    }
                }
            } else {
                const doctors = await api.getAllDoctors();
                const me = (doctors || []).find(d => d.email === email);
                if (me) {
                    userState.doctorId = me.doctorId;
                    userState.profileInfo = me;
                }
            }
        } catch (err) {
            console.error('Error resolving user profile:', err);
        }

        setCurrentUser(userState);
        return userState;
    };

    // Auto-login check
    useEffect(() => {
        const initSession = async () => {
            const token = sessionStorage.getItem('gastroai_token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            const payload = decodeJwt(token);
            if (!payload || Object.keys(payload).length === 0) {
                api.clearToken();
                setIsLoading(false);
                return;
            }

            const email = payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
            const role = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            const name = payload.name || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || email?.split('@')[0] || 'User';

            if (email && role) {
                try {
                    await resolveUserProfile(token, email, role, name);
                } catch (e) {
                    console.error('Auto login failed', e);
                    api.clearToken();
                }
            }
            setIsLoading(false);
        };

        initSession();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const resp = await api.login(email.trim(), password);
            const payload = decodeJwt(resp.token);
            const resolvedEmail = payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || email;
            const resolvedRole = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || resp.role;
            const resolvedName = payload.name || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || resp.displayName || resolvedEmail.split('@')[0];

            const userState = await resolveUserProfile(resp.token, resolvedEmail, resolvedRole, resolvedName);
            showToast(`Welcome, ${userState.displayName}! 👋`, 'success');
            setIsLoading(false);
            return userState;
        } catch (err) {
            setIsLoading(false);
            showToast(err.message || 'Login failed. Check credentials.', 'error');
            throw err;
        }
    };

    const register = async (payload, role) => {
        setIsLoading(true);
        try {
            const resp = role === 'patient'
                ? await api.registerPatient(payload)
                : await api.registerDoctor(payload);

            const jwtPayload = decodeJwt(resp.token);
            const resolvedEmail = jwtPayload.email || jwtPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email;
            const resolvedRole = jwtPayload.role || jwtPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || resp.role;
            const resolvedName = jwtPayload.name || jwtPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || resp.displayName || `${payload.firstName} ${payload.lastName}`;

            const userState = await resolveUserProfile(resp.token, resolvedEmail, resolvedRole, resolvedName);
            showToast(`Welcome, ${userState.displayName}! 👋`, 'success');
            setIsLoading(false);
            return userState;
        } catch (err) {
            setIsLoading(false);
            showToast(err.message || 'Registration failed', 'error');
            throw err;
        }
    };

    const logout = () => {
        api.clearToken();
        setCurrentUser(null);
        showToast('Logged out successfully.', 'success');
    };

    const updateProfileState = (updatedProfile) => {
        setCurrentUser(prev => {
            if (!prev) return null;
            return {
                ...prev,
                displayName: updatedProfile.firstName + ' ' + updatedProfile.lastName,
                profileInfo: updatedProfile
            };
        });
    };

    return (
        <AuthContext.Provider value={{
            currentUser,
            isLoading,
            setIsLoading,
            toast,
            showToast,
            hideToast,
            login,
            register,
            logout,
            updateProfileState
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
