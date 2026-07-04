import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ReviewModal({ isOpen, resultId, disease, confidence, patientName, patientId, onClose, onReviewSubmitted }) {
    const { currentUser, showToast } = useAuth();
    const [diagnosis, setDiagnosis] = useState(disease || '');
    const [medication, setMedication] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
    const [instructions, setInstructions] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const confPct = confidence > 1 ? confidence : confidence * 100;
    const confBadge = (c) => {
        if (c >= 80) return <span className="badge badge-danger">{c.toFixed(1)}%</span>;
        if (c >= 50) return <span className="badge badge-warning">{c.toFixed(1)}%</span>;
        return <span className="badge badge-info">{c.toFixed(1)}%</span>;
    };

    const handleSubmitReport = async () => {
        if (!diagnosis.trim() || !notes.trim()) {
            showToast('Diagnosis and Detailed Notes are required.', 'warning');
            return;
        }

        setLoading(true);
        try {
            // 1. Submit the detailed report
            const reportData = {
                patientId: parseInt(patientId),
                doctorId: currentUser.doctorId,
                diagnosis: diagnosis.trim(),
                notes: notes.trim(),
                medicationName: medication.trim() || "None",
                dosage: dosage.trim() || "N/A",
                frequency: parseInt(frequency) || null,
                duration: duration.trim() || "N/A",
                instructions: instructions.trim() || "None"
            };
            const createdReport = await api.createReport(reportData);

            // 2. Mark the AI Result as reviewed
            await api.submitReview(resultId, currentUser.doctorId, `[REPORT_ID:${createdReport.reportId}] ` + notes.trim());

            showToast('Report and Review submitted successfully!', 'success');
            onReviewSubmitted();
            onClose();
        } catch (err) {
            showToast(err.message || 'Failed to submit review', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="review-modal" className="modal" role="dialog" aria-modal="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="glass-card review-modal-card" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 1000 }}>
                <div className="review-modal-header">
                    <h3>📝 Write Medical Report</h3>
                    <button className="icon-btn" onClick={onClose}>✕</button>
                </div>

                <div id="review-result-preview" className="review-preview-content">
                    <p><strong>Patient:</strong> {patientName}</p>
                    <p><strong>Diagnosis:</strong> {disease}</p>
                    <p><strong>Confidence:</strong> {confBadge(confPct)}</p>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Diagnosis *</label>
                        <input type="text" placeholder="Primary diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Medication Name</label>
                        <input type="text" placeholder="e.g. Omeprazole" value={medication} onChange={(e) => setMedication(e.target.value)} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Dosage</label>
                        <input type="text" placeholder="e.g. 20mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Frequency (times/day)</label>
                        <input type="number" placeholder="e.g. 2" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Duration</label>
                        <input type="text" placeholder="e.g. 14 days" value={duration} onChange={(e) => setDuration(e.target.value)} />
                    </div>
                </div>

                <div className="form-group">
                    <label>Instructions</label>
                    <input type="text" placeholder="e.g. Take before breakfast" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                </div>

                <div className="form-group">
                    <label>Detailed Notes *</label>
                    <textarea rows="3" placeholder="Write your professional notes here…" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                </div>

                <div className="review-modal-actions">
                    <button className="btn btn-primary" onClick={handleSubmitReport} disabled={loading}>
                        {loading ? 'Please wait…' : '✔ Submit Report'}
                    </button>
                    <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
                </div>
            </div>
        </div>
    );
}
