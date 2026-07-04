// GastroAI – api.js
const API_BASE = 'http://localhost:5170/api';

// Decode JWT payload
export function decodeJwt(token) {
    try {
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(b64));
    } catch { return {}; }
}

class ApiService {
    constructor() {
        this.token = sessionStorage.getItem('gastroai_token');
    }

    setToken(t) {
        this.token = t;
        sessionStorage.setItem('gastroai_token', t);
    }

    clearToken() {
        this.token = null;
        sessionStorage.removeItem('gastroai_token');
    }

    // Extract GUID userId from stored JWT
    getUserIdFromToken() {
        if (!this.token) return null;
        const p = decodeJwt(this.token);
        return p['sub']
            || p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
            || p['nameid']
            || null;
    }

    headers(isForm = false) {
        const h = {};
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        if (!isForm) h['Content-Type'] = 'application/json';
        return h;
    }

    async req(endpoint, opts = {}) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, opts);
            const ct = res.headers.get('content-type') || '';
            const data = ct.includes('application/json') ? await res.json() : await res.text();
            if (!res.ok) {
                let msg = data?.message || `HTTP ${res.status}`;
                if (data?.errors) msg = Object.values(data.errors).flat().join(' ');
                else if (typeof data === 'object' && !data?.message) msg = JSON.stringify(data);
                else if (typeof data === 'string') msg = data;
                throw new Error(msg);
            }
            return data;
        } catch (e) {
            console.error('API:', endpoint, e);
            throw e;
        }
    }

    // ── Auth ──────────────────────────────────────────────────────
    async uploadProfilePhoto(file) {
        const fd = new FormData();
        fd.append('photo', file);
        return this.req('/Authentication/upload-photo', {
            method: 'POST', headers: this.headers(true), body: fd
        });
    }

    async login(email, password) {
        const d = await this.req('/Authentication/login', {
            method: 'POST', headers: this.headers(),
            body: JSON.stringify({ email, password })
        });
        if (d.token) this.setToken(d.token);
        return d;
    }

    async registerPatient(payload) {
        const d = await this.req('/Authentication/register/patient', {
            method: 'POST', headers: this.headers(),
            body: JSON.stringify(payload)
        });
        if (d.token) this.setToken(d.token);
        return d;
    }

    async registerDoctor(payload) {
        const d = await this.req('/Authentication/register/doctor', {
            method: 'POST', headers: this.headers(),
            body: JSON.stringify(payload)
        });
        if (d.token) this.setToken(d.token);
        return d;
    }

    // ── Patients & Doctors ────────────────────────────────────────
    async getAllPatients() {
        return this.req('/Patients', { method: 'GET', headers: this.headers() });
    }
    async getPatientById(id) {
        return this.req(`/Patients/${id}`, { method: 'GET', headers: this.headers() });
    }
    // Fetch patient directly by GUID userId (most reliable way)
    async getPatientByUserId(userId) {
        return this.req(`/Patients/user/${encodeURIComponent(userId)}`, { method: 'GET', headers: this.headers() });
    }
    async getAllDoctors() {
        return this.req('/Doctors', { method: 'GET', headers: this.headers() });
    }
    async getDoctorById(id) {
        return this.req(`/Doctors/${id}`, { method: 'GET', headers: this.headers() });
    }
    async getDoctorByUserId(userId) {
        return this.req(`/Doctors/user/${encodeURIComponent(userId)}`, { method: 'GET', headers: this.headers() });
    }

    async updatePatient(payload) {
        return this.req('/Patients', {
            method: 'PUT', headers: this.headers(),
            body: JSON.stringify(payload)
        });
    }

    async updateDoctor(payload) {
        return this.req('/Doctors', {
            method: 'PUT', headers: this.headers(),
            body: JSON.stringify(payload)
        });
    }

    async rateDoctor(doctorId, rating) {
        return this.req(`/Doctors/${doctorId}/rating`, {
            method: 'PATCH', headers: this.headers(),
            body: JSON.stringify(rating)
        });
    }

    // ── AI Analysis ───────────────────────────────────────────────
    async uploadImage(patientId, file) {
        const fd = new FormData();
        fd.append('PatientId', patientId);
        fd.append('Image', file);
        return this.req('/AIAnalysis/upload', {
            method: 'POST', headers: this.headers(true), body: fd
        });
    }

    async analyzeDirect(file) {
        const fd = new FormData();
        fd.append('image', file);
        return this.req('/AIAnalysis/analyze-direct', {
            method: 'POST', headers: this.headers(true), body: fd
        });
    }

    async createReport(data) {
        return this.req('/Reports', {
            method: 'POST', headers: this.headers(),
            body: JSON.stringify(data)
        });
    }

    async getReport(id) {
        return this.req(`/Reports/${id}`, { method: 'GET', headers: this.headers() });
    }
    async getPatientHistory(patientId) {
        return this.req(`/AIAnalysis/patient/${patientId}`, { method: 'GET', headers: this.headers() });
    }
    async getDoctorResults(doctorId) {
        return this.req(`/AIAnalysis/doctor/${doctorId}`, { method: 'GET', headers: this.headers() });
    }
    // Assign result to a doctor for review
    async requestReview(resultId, doctorId) {
        return this.req('/AIAnalysis/assign', {
            method: 'POST', headers: this.headers(),
            body: JSON.stringify({ resultId, doctorId })
        });
    }
    // Doctor submits final review with notes
    async submitReview(resultId, doctorId, notes) {
        return this.req('/AIAnalysis/review', {
            method: 'POST', headers: this.headers(),
            body: JSON.stringify({ resultId, doctorId, doctorNotes: notes })
        });
    }

    // ── Chats ─────────────────────────────────────────────────────
    async getPatientChats(patientId) {
        return this.req(`/Chats/patient/${patientId}`, { method: 'GET', headers: this.headers() });
    }
    async getDoctorChats(doctorId) {
        return this.req(`/Chats/doctor/${doctorId}`, { method: 'GET', headers: this.headers() });
    }
    // patientId and doctorId are the integer PKs from their tables
    async createChat(patientId, doctorId) {
        return this.req('/Chats', {
            method: 'POST', headers: this.headers(),
            body: JSON.stringify({ patientId, doctorId })
        });
    }

    // ── Messages ──────────────────────────────────────────────────
    async getChatMessages(chatId) {
        return this.req(`/Messages/chat/${chatId}`, { method: 'GET', headers: this.headers() });
    }
    // senderId = GUID string (ApplicationUser.Id), senderType = 'Patient' | 'Doctor'
    async sendMessage(chatId, senderId, content, senderType) {
        return this.req('/Messages', {
            method: 'POST', headers: this.headers(),
            body: JSON.stringify({ chatId, senderId, content, senderType })
        });
    }

    // ── Lookups ───────────────────────────────────────────────────
    async getSpecializations() { return this.req('/Lookups/specializations'); }
    async getBloodTypes() { return this.req('/Lookups/blood-types'); }
    async getDietTypes() { return this.req('/Lookups/diet-types'); }
    async getFamilyHistoryOptions() { return this.req('/Lookups/family-history'); }
    async getChronicDiseases() { return this.req('/Lookups/chronic-diseases'); }

    // ── Additional Authentication ──────────────────────────────────
    async checkEmailExists(email) {
        return this.req(`/Authentication/check-email/${encodeURIComponent(email)}`, { method: 'GET' });
    }
    async getUserByEmail(email) {
        return this.req(`/Authentication/user/${encodeURIComponent(email)}`, { method: 'GET', headers: this.headers() });
    }

    // ── Additional AIAnalysis ──────────────────────────────────────
    async getAllAnalyses() {
        return this.req('/AIAnalysis', { method: 'GET', headers: this.headers() });
    }
    async getAnalysisById(id) {
        return this.req(`/AIAnalysis/${id}`, { method: 'GET', headers: this.headers() });
    }
    async deleteAnalysis(id) {
        return this.req(`/AIAnalysis/${id}`, { method: 'DELETE', headers: this.headers() });
    }
    async getUnreviewedAnalyses() {
        return this.req('/AIAnalysis/unreviewed', { method: 'GET', headers: this.headers() });
    }

    // ── Additional Chats ──────────────────────────────────────────
    async getAllChats() {
        return this.req('/Chats', { method: 'GET', headers: this.headers() });
    }
    async getChatById(id) {
        return this.req(`/Chats/${id}`, { method: 'GET', headers: this.headers() });
    }
    async deleteChat(id) {
        return this.req(`/Chats/${id}`, { method: 'DELETE', headers: this.headers() });
    }

    // ── Additional Doctors ────────────────────────────────────────
    async getAvailableDoctors() {
        return this.req('/Doctors/available', { method: 'GET', headers: this.headers() });
    }
    async deleteDoctor(id) {
        return this.req(`/Doctors/${id}`, { method: 'DELETE', headers: this.headers() });
    }
    async updateDoctorAvailability(id, isAvailable) {
        return this.req(`/Doctors/${id}/availability`, {
            method: 'PATCH', headers: this.headers(),
            body: JSON.stringify(isAvailable)
        });
    }

    // ── MedicalRecords ────────────────────────────────────────────
    async getMedicalRecordById(id) {
        return this.req(`/MedicalRecords/${id}`, { method: 'GET', headers: this.headers() });
    }
    async deleteMedicalRecord(id) {
        return this.req(`/MedicalRecords/${id}`, { method: 'DELETE', headers: this.headers() });
    }
    async getMedicalRecordsByPatient(patientId) {
        return this.req(`/MedicalRecords/patient/${patientId}`, { method: 'GET', headers: this.headers() });
    }
    async createMedicalRecord(payload) {
        return this.req('/MedicalRecords', {
            method: 'POST', headers: this.headers(),
            body: JSON.stringify(payload)
        });
    }
    async updateMedicalRecord(payload) {
        return this.req('/MedicalRecords', {
            method: 'PUT', headers: this.headers(),
            body: JSON.stringify(payload)
        });
    }

    // ── Additional Messages ────────────────────────────────────────
    async getMessageById(id) {
        return this.req(`/Messages/${id}`, { method: 'GET', headers: this.headers() });
    }
    async deleteMessage(id) {
        return this.req(`/Messages/${id}`, { method: 'DELETE', headers: this.headers() });
    }
    async markMessageAsRead(id, isRead) {
        return this.req(`/Messages/${id}/read`, {
            method: 'PATCH', headers: this.headers(),
            body: JSON.stringify(isRead)
        });
    }
    async getUnreadMessageCount(chatId, userId, senderType) {
        const query = senderType ? `?senderType=${encodeURIComponent(senderType)}` : '';
        return this.req(`/Messages/chat/${chatId}/unread/${encodeURIComponent(userId)}${query}`, { method: 'GET', headers: this.headers() });
    }

    // ── Additional Patients ────────────────────────────────────────
    async deletePatient(id) {
        return this.req(`/Patients/${id}`, { method: 'DELETE', headers: this.headers() });
    }

    // ── Additional Reports ────────────────────────────────────────
    async getAllReports() {
        return this.req('/Reports', { method: 'GET', headers: this.headers() });
    }
    async deleteReport(id) {
        return this.req(`/Reports/${id}`, { method: 'DELETE', headers: this.headers() });
    }
    async getReportsByPatient(patientId) {
        return this.req(`/Reports/patient/${patientId}`, { method: 'GET', headers: this.headers() });
    }
    async getReportsByDoctor(doctorId) {
        return this.req(`/Reports/doctor/${doctorId}`, { method: 'GET', headers: this.headers() });
    }
}

const api = new ApiService();
export default api;
