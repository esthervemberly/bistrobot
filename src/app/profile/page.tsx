'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useOrderStore } from '@/stores/orderStore';
import AuthGuard from '@/components/auth/AuthGuard';
import styles from './page.module.css';

const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free', 'Dairy-Free', 'Low-Carb'];

function ProfileContent() {
    const router = useRouter();
    const { user, profile, loading, signOut, updateProfile, fetchProfile } = useAuthStore();
    const orders = useOrderStore(s => s.orders);
    const resetOrders = useOrderStore(s => s.reset);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Populate form from profile data
    useEffect(() => {
        if (profile) {
            setName(profile.display_name || '');
            setPhone(profile.phone || '');
            setSelectedDietary(profile.dietary_preferences || []);
        } else if (user) {
            setName(user.user_metadata?.display_name || user.email?.split('@')[0] || '');
        }
    }, [profile, user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const email = user?.email || '';

    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'March 2026';

    const toggleDietary = (option: string) => {
        setSelectedDietary(prev =>
            prev.includes(option)
                ? prev.filter(d => d !== option)
                : [...prev, option]
        );
    };

    const handleSave = async () => {
        setSaveError('');
        const { error } = await updateProfile({
            display_name: name.trim() || null,
            phone: phone.trim() || null,
            dietary_preferences: selectedDietary,
        });
        if (error) {
            setSaveError(error);
        } else {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const handleSignOut = async () => {
        resetOrders();
        await signOut();
        router.replace('/');
    };

    return (
        <div className="page">
            <div className={styles.container}>
                <div className="page-header">
                    <h1 className="page-title">Profile</h1>
                    <p className="page-subtitle">Manage your preferences and account settings.</p>
                </div>

                {/* Avatar */}
                <div className={styles.avatarSection}>
                    <div className={styles.avatar}>
                        {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            <span>👤</span>
                        )}
                    </div>
                    <div>
                        <h2 className={styles.userName}>{name || 'User'}</h2>
                        <p className={styles.memberSince}>
                            Member since {memberSince} · {orders.length} order{orders.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                {/* Personal Info */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Personal Information</h3>
                    <div className={styles.fields}>
                        <div className={styles.field}>
                            <label>Display Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className={styles.field}>
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                title="Email cannot be changed"
                                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className={styles.field}>
                            <label>Phone</label>
                            <input type="tel" placeholder="+62" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Dietary Preferences */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Dietary Preferences</h3>
                    <p className={styles.sectionDesc}>Select your dietary preferences for better recommendations.</p>
                    <div className={styles.dietaryGrid}>
                        {dietaryOptions.map(option => (
                            <button
                                key={option}
                                className={`chip ${selectedDietary.includes(option) ? 'active' : ''}`}
                                onClick={() => toggleDietary(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Account Security */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Account Security</h3>
                    <p className={styles.sectionDesc}>
                        Signed in as <strong>{email}</strong>
                        {user?.app_metadata?.provider === 'google' && ' via Google'}
                    </p>
                </div>

                {saveError && (
                    <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{saveError}</p>
                )}

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        className={`btn btn-primary ${saved ? styles.savedBtn : ''}`}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        className="btn btn-ghost"
                        onClick={handleSignOut}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return (
        <AuthGuard>
            <ProfileContent />
        </AuthGuard>
    );
}
