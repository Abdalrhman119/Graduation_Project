import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function RegisterForm({ role, onGoBack, onGoToLogin }) {
    const { register, showToast } = useAuth();
    
    // Lookups
    const [specializations, setSpecializations] = useState([]);
    const [bloodTypes, setBloodTypes] = useState([]);
    const [dietTypes, setDietTypes] = useState([]);
    const [familyHistoryOptions, setFamilyHistoryOptions] = useState([]);
    const [chronicDiseases, setChronicDiseases] = useState([]);

    // Form inputs - Common
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('Male');
    const [birthDate, setBirthDate] = useState('');
    const [age, setAge] = useState('');
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [emailCheckMsg, setEmailCheckMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Form inputs - Patient Only
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [allergies, setAllergies] = useState('');
    const [dietType, setDietType] = useState('');
    const [smokingHabit, setSmokingHabit] = useState('false');
    const [familyHistory, setFamilyHistory] = useState('');
    const [pastSurgeries, setPastSurgeries] = useState('');
    const [selectedChronic, setSelectedChronic] = useState([]);

    // Form inputs - Doctor Only
    const [licenceNum, setLicenceNum] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState('');
    const [affiliations, setAffiliations] = useState('');
    const [workingHoursFrom, setWorkingHoursFrom] = useState('');
    const [workingHoursTo, setWorkingHoursTo] = useState('');
    const [about, setAbout] = useState('');

    // Fetch lookups
    useEffect(() => {
        const loadLookups = async () => {
            const fetchSafe = async (fn, fallback) => {
                try { return await fn(); }
                catch (err) { console.warn('Lookup fetch failed, using fallback:', err); return fallback; }
            };

            const specs = await fetchSafe(() => api.getSpecializations(), ["Gastroenterology", "Hepatology", "Internal Medicine", "General Surgery", "Endoscopy"]);
            const bloods = await fetchSafe(() => api.getBloodTypes(), ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
            const diets = await fetchSafe(() => api.getDietTypes(), ["Standard", "Low Carb", "Vegetarian", "Vegan", "Gluten Free", "Ketogenic"]);
            const family = await fetchSafe(() => api.getFamilyHistoryOptions(), ["None", "Diabetes", "Hypertension", "Gastrointestinal Cancer", "Heart Disease"]);
            const chronic = await fetchSafe(() => api.getChronicDiseases(), ["Diabetes", "Hypertension", "Asthma", "Heart Disease", "Arthritis"]);

            setSpecializations(specs);
            setBloodTypes(bloods);
            setDietTypes(diets);
            setFamilyHistoryOptions(family);
            setChronicDiseases(chronic);
        };
        loadLookups();
    }, []);

    // Calculate age from birthdate
    useEffect(() => {
        if (birthDate) {
            const diff = Date.now() - new Date(birthDate).getTime();
            const calcAge = new Date(diff).getUTCFullYear() - 1970;
            setAge(calcAge > 0 ? calcAge : 0);
        }
    }, [birthDate]);

    // Check email uniqueness
    useEffect(() => {
        if (email.trim().length > 4 && email.includes('@')) {
            const delayDebounce = setTimeout(async () => {
                try {
                    const res = await api.checkEmailExists(email.trim());
                    if (res && res.exists) {
                        setEmailCheckMsg('❌ Email already registered');
                    } else {
                        setEmailCheckMsg('✅ Email is available');
                    }
                } catch (e) {
                    setEmailCheckMsg('');
                }
            }, 500);
            return () => clearTimeout(delayDebounce);
        } else {
            setEmailCheckMsg('');
        }
    }, [email]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setPhotoPreview(ev.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleChronicSelect = (e) => {
        const options = Array.from(e.target.selectedOptions).map(option => option.value);
        setSelectedChronic(options);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!fullName.trim()) {
            showToast('Full Name is required!', 'warning');
            return;
        }
        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length < 2) {
            showToast('Please enter both your First Name and Last Name (e.g. Ahmed Hassan)', 'warning');
            return;
        }
        const derivedFirstName = nameParts[0];
        const derivedLastName = nameParts.slice(1).join(' ');

        if (!email.trim() || !password) {
            showToast('Email and Password are required!', 'warning');
            return;
        }
        if (role === 'doctor' && !licenceNum.trim()) {
            showToast('Licence Number is required for doctors!', 'warning');
            return;
        }

        setLoading(true);
        let uploadedPhotoUrl = '';
        if (photoFile) {
            try {
                const upRes = await api.uploadProfilePhoto(photoFile);
                uploadedPhotoUrl = upRes.url;
            } catch (err) {
                console.error(err);
                showToast('Failed to upload profile photo: ' + (err.message || 'Unknown error'), 'error');
                setLoading(false);
                return;
            }
        }

        const base = {
            email: email.trim(),
            password: password,
            phoneNum: phone.trim(),
            firstName: derivedFirstName,
            lastName: derivedLastName,
            gender: gender,
            birthDate: birthDate || undefined,
            age: parseInt(age) || 0,
            profilePhoto: uploadedPhotoUrl
        };

        let payload = { ...base };
        if (role === 'patient') {
            payload = {
                ...base,
                weight: parseFloat(weight) || 0,
                height: parseFloat(height) || 0,
                bloodType: bloodType,
                allergies: allergies.trim(),
                dietType: dietType,
                familyHistory: familyHistory,
                pastSurgeries: pastSurgeries.trim(),
                isSmoker: smokingHabit === 'true',
                chronicDiseases: selectedChronic.join(', ')
            };
        } else {
            payload = {
                ...base,
                licenceNum: licenceNum.trim(),
                specialization: specialization,
                yearsOfExperience: parseInt(yearsOfExperience) || 0,
                about: about.trim(),
                affiliations: affiliations.trim(),
                workingHours: (workingHoursFrom && workingHoursTo) ? `${workingHoursFrom} - ${workingHoursTo}` : (workingHoursFrom || workingHoursTo || '')
            };
        }

        try {
            await register(payload, role);
        } catch (err) {
            // Error handled by AuthContext
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="view-register" className="view active">
            <div className="center-wrap">
                <div className="glass-card auth-card auth-card-wide">
                    <div className="form-header">
                        <button className="back-btn" type="button" onClick={onGoBack}>← Back</button>
                        <div className="brand-sm">Gastro<span>AI</span></div>
                        <div className="role-badge">{role === 'patient' ? '🧑‍⚕️ Patient' : '👨‍⚕️ Doctor'}</div>
                    </div>

                    <h2 className="form-title">Create Your Account</h2>

                    <form onSubmit={handleSubmit} noValidate autoComplete="off">
                        {/* Photo Upload */}
                        <div className="photo-upload-wrap">
                            <div className="photo-preview" id="photo-preview">
                                {!photoPreview ? (
                                    <span className="photo-placeholder">📷</span>
                                ) : (
                                    <img src={photoPreview} alt="Profile photo" style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                )}
                            </div>
                            <div>
                                <label className="btn btn-outline btn-sm" htmlFor="reg-photo">Upload Photo</label>
                                <input type="file" id="reg-photo" accept="image/*" hidden onChange={handlePhotoChange} />
                                <p className="hint">JPG or PNG, optional</p>
                            </div>
                        </div>

                        {/* Common Fields */}
                        <div className="form-group">
                            <label htmlFor="reg-fullname">Full Name *</label>
                            <input type="text" id="reg-fullname" placeholder="Ahmed Hassan" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-email">Email Address *</label>
                            <input
                                type="email"
                                id="reg-email"
                                placeholder="john@example.com"
                                autoComplete="new-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {emailCheckMsg && (
                                <span style={{ fontSize: '0.75rem', marginTop: '0.2rem', display: 'block', color: emailCheckMsg.includes('❌') ? 'var(--danger)' : '#2ecc71' }}>
                                    {emailCheckMsg}
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-password">Password *</label>
                            <div className="pass-wrap">
                                <input
                                    type={showPass ? "text" : "password"}
                                    id="reg-password"
                                    placeholder="Min. 6 characters"
                                    required
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                                    {showPass ? '🙈' : '👁'}
                                </button>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="reg-phone">Phone Number *</label>
                                <input type="tel" id="reg-phone" placeholder="+20 100 000 0000" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="reg-gender">Gender</label>
                                <select id="reg-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="reg-birthdate">Date of Birth</label>
                                <input type="date" id="reg-birthdate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="reg-age">Age</label>
                                <input type="number" id="reg-age" placeholder="—" readOnly style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed' }} value={age} />
                            </div>
                        </div>

                        {/* Patient-only Fields */}
                        {role === 'patient' && (
                            <div id="patient-extra-fields" className="extra-fields">
                                <div className="fields-divider"><span>Medical Info</span></div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="reg-weight">Weight (kg)</label>
                                        <input type="number" step="0.1" id="reg-weight" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reg-height">Height (cm)</label>
                                        <input type="number" step="0.1" id="reg-height" placeholder="175" value={height} onChange={(e) => setHeight(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="reg-blood">Blood Type</label>
                                        <select id="reg-blood" value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                                            <option value="">Select...</option>
                                            {bloodTypes.map(item => <option key={item} value={item}>{item}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reg-allergies">Allergies</label>
                                        <input type="text" id="reg-allergies" placeholder="None" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="reg-diet">Diet Type</label>
                                        <select id="reg-diet" value={dietType} onChange={(e) => setDietType(e.target.value)}>
                                            <option value="">Select...</option>
                                            {dietTypes.map(item => <option key={item} value={item}>{item}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reg-smoker">Smoking Habit</label>
                                        <select id="reg-smoker" value={smokingHabit} onChange={(e) => setSmokingHabit(e.target.value)}>
                                            <option value="false">Non-Smoker</option>
                                            <option value="true">Smoker</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="reg-familyhistory">Family History</label>
                                        <select id="reg-familyhistory" value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)}>
                                            <option value="">Select...</option>
                                            {familyHistoryOptions.map(item => <option key={item} value={item}>{item}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reg-pastsurgeries">Past Surgeries</label>
                                        <input type="text" id="reg-pastsurgeries" placeholder="e.g. Appendectomy" value={pastSurgeries} onChange={(e) => setPastSurgeries(e.target.value)} />
                                    </div>
                                </div>
                                 <div className="form-group">
                                     <label htmlFor="reg-chronic">Chronic Diseases</label>
                                     <div style={{
                                         display: 'flex',
                                         flexWrap: 'wrap',
                                         gap: '0.6rem',
                                         marginTop: '0.6rem',
                                         padding: '0.5rem 0'
                                     }}>
                                         {chronicDiseases.map(item => {
                                             const isChecked = selectedChronic.includes(item);
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
                                                     color: isChecked ? '#00f2fe' : 'rgba(255, 255, 255, 0.7)',
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
                                                                 setSelectedChronic([...selectedChronic, item]);
                                                             } else {
                                                                 setSelectedChronic(selectedChronic.filter(c => c !== item));
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
                            </div>
                        )}

                        {/* Doctor-only Fields */}
                        {role === 'doctor' && (
                            <div id="doctor-extra-fields" className="extra-fields">
                                <div className="fields-divider"><span>Professional Info</span></div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="reg-licence">Licence Number *</label>
                                        <input type="text" id="reg-licence" placeholder="LIC-00000" value={licenceNum} onChange={(e) => setLicenceNum(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reg-specialization">Specialization</label>
                                        <select id="reg-specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                                            <option value="">Select...</option>
                                            {specializations.map(item => <option key={item} value={item}>{item}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="reg-experience">Years of Experience</label>
                                        <input type="number" id="reg-experience" placeholder="5" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="reg-affiliations">Affiliations / Hospitals</label>
                                        <input type="text" id="reg-affiliations" placeholder="e.g. General Hospital" value={affiliations} onChange={(e) => setAffiliations(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="reg-workinghours-from">Working Hours From</label>
                                        <input type="time" id="reg-workinghours-from" value={workingHoursFrom} onChange={(e) => setWorkingHoursFrom(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reg-workinghours-to">Working Hours To</label>
                                        <input type="time" id="reg-workinghours-to" value={workingHoursTo} onChange={(e) => setWorkingHoursTo(e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="reg-about">About / Specialization</label>
                                    <textarea id="reg-about" rows="2" placeholder="Brief description of your specialty…" value={about} onChange={(e) => setAbout(e.target.value)}></textarea>
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Creating Account…' : 'Create Account'}
                        </button>
                        <p className="form-footer">Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onGoToLogin(); }}>Sign in</a></p>
                    </form>
                </div>
            </div>
        </section>
    );
}
