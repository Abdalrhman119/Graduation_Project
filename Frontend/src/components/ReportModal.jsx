import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ReportModal({ isOpen, reportId, onClose }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !reportId) return;

        const loadReport = async () => {
            setLoading(true);
            try {
                const r = await api.getReport(reportId);
                setReport(r);
            } catch (err) {
                console.error('Failed to load report:', err);
            } finally {
                setLoading(false);
            }
        };

        loadReport();
    }, [isOpen, reportId]);

    if (!isOpen) return null;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

    const handlePrint = () => {
        if (!report) return;
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) return;
        
        const html = `
            <html>
            <head>
                <title>GastroAI Medical Report - ID ${report.reportId}</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        color: #333;
                        padding: 40px;
                        line-height: 1.6;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 3px solid #00f2fe;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #1a1a1a;
                    }
                    .logo span {
                        color: #00f2fe;
                    }
                    .title {
                        text-align: right;
                    }
                    .title h1 {
                        margin: 0;
                        font-size: 22px;
                        color: #2c3e50;
                    }
                    .title p {
                        margin: 5px 0 0 0;
                        font-size: 14px;
                        color: #7f8c8d;
                    }
                    .meta-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 30px;
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #eaedf1;
                    }
                    .meta-item {
                        font-size: 14px;
                    }
                    .meta-item strong {
                        color: #2c3e50;
                    }
                    .section-title {
                        font-size: 16px;
                        font-weight: bold;
                        color: #2c3e50;
                        border-bottom: 1px solid #eaedf1;
                        padding-bottom: 8px;
                        margin-top: 30px;
                        margin-bottom: 15px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .prescription-card {
                        background: #fdfefe;
                        border: 1px solid #eaedf1;
                        border-left: 4px solid #00f2fe;
                        padding: 20px;
                        border-radius: 4px;
                        margin-bottom: 25px;
                    }
                    .prescription-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                    }
                    .notes-box {
                        background: #fcfcfc;
                        border: 1px solid #eaedf1;
                        padding: 20px;
                        border-radius: 4px;
                        white-space: pre-wrap;
                        font-size: 14px;
                    }
                    .footer {
                        margin-top: 50px;
                        border-top: 1px solid #eaedf1;
                        padding-top: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #95a5a6;
                    }
                    .signature-area {
                        margin-top: 40px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .signature-box {
                        text-align: center;
                        width: 200px;
                    }
                    .signature-line {
                        border-top: 1px solid #7f8c8d;
                        margin-top: 50px;
                        padding-top: 5px;
                        font-size: 12px;
                        color: #7f8c8d;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">Gastro<span>AI</span> Medical Center</div>
                    <div class="title">
                        <h1>OFFICIAL MEDICAL REPORT</h1>
                        <p>Report ID: #${report.reportId}</p>
                    </div>
                </div>
                
                <div class="meta-grid">
                    <div class="meta-item">
                        <strong>Patient ID:</strong> P-${report.patientId || 'N/A'}<br/>
                        <strong>Diagnosis:</strong> ${report.diagnosis || '—'}<br/>
                    </div>
                    <div class="meta-item" style="text-align: right;">
                        <strong>Date:</strong> ${fmtDate(report.createdAt)}<br/>
                        <strong>Status:</strong> Completed & Verified
                    </div>
                </div>
                
                <div class="section-title">Prescription & Medication</div>
                <div class="prescription-card">
                    <div class="prescription-grid">
                        <div><strong>Medication:</strong> ${report.medicationName || 'None'}</div>
                        <div><strong>Dosage:</strong> ${report.dosage || '—'}</div>
                        <div><strong>Frequency:</strong> ${report.frequency ? report.frequency + ' times/day' : '—'}</div>
                        <div><strong>Duration:</strong> ${report.duration || '—'}</div>
                    </div>
                    ${report.instructions ? `<div style="margin-top: 15px; font-size: 14px;"><strong>Instructions:</strong> ${report.instructions}</div>` : ''}
                </div>
                
                <div class="section-title">Clinical Findings & Notes</div>
                <div class="notes-box">${report.notes || 'No notes provided.'}</div>
                
                <div class="signature-area">
                    <div class="signature-box">
                        <div class="signature-line">Attending Physician</div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line">GastroAI Lab Director</div>
                    </div>
                </div>
                
                <div class="footer">
                    This is a digitally verified medical document generated via GastroAI platform.<br/>
                    © ${new Date().getFullYear()} GastroAI Inc. All rights reserved.
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div id="view-report-modal" className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="glass-card review-modal-card" style={{ maxWidth: '500px', position: 'relative', zIndex: 1000 }}>
                <div className="review-modal-header">
                    <h3>📄 Medical Report</h3>
                    <button className="icon-btn" onClick={onClose}>✕</button>
                </div>
                <div className="review-preview-content" style={{ textAlign: 'left', fontSize: '0.95rem' }}>
                    {loading ? (
                        <div className="empty-state">Loading...</div>
                    ) : !report ? (
                        <div style={{ color: 'var(--danger)' }}>Failed to load report details.</div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                <p><strong>Diagnosis:</strong> {report.diagnosis || '—'}</p>
                                <p><strong>Created:</strong> {fmtDate(report.createdAt)}</p>
                            </div>
                            
                            <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Prescription</h4>
                            <div style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px' }}>
                                <p><strong>Medication:</strong> {report.medicationName || 'None'}</p>
                                <p><strong>Dosage:</strong> {report.dosage || '—'}</p>
                                <p><strong>Frequency:</strong> {report.frequency ? report.frequency + ' times/day' : '—'}</p>
                                <p><strong>Duration:</strong> {report.duration || '—'}</p>
                                <p><strong>Instructions:</strong> {report.instructions || '—'}</p>
                            </div>
                            
                            <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Detailed Notes</h4>
                            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                                {report.notes || '—'}
                            </div>
                        </>
                    )}
                </div>
                <div className="review-modal-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <button className="btn btn-outline" onClick={onClose}>Close</button>
                    {report && (
                        <button className="btn btn-primary" onClick={handlePrint}>
                            🖨️ Download PDF / Print
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
