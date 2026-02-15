
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const router = useRouter();

    // States for password change
    const [name, setName] = useState(session?.user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI states
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Initial load sync with session if name is empty
    if (!name && session?.user?.name) {
        setName(session.user.name);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ text: 'New passwords do not match', type: 'error' });
            setLoading(false);
            return;
        }

        if (newPassword && !currentPassword) {
            setMessage({ text: 'Current password is required to change password', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    currentPassword: currentPassword || undefined,
                    newPassword: newPassword || undefined
                })
            });

            if (res.ok) {
                setMessage({ text: 'Profile updated successfully', type: 'success' });
                // Reset password fields
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                // Update session
                await update({ name });
                router.refresh();
                setTimeout(() => router.push('/'), 1000); // Redirect to home
            } else {
                const text = await res.text();
                setMessage({ text: text || 'Failed to update profile', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'An unexpected error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: '500px' }}>
                <div className="auth-header">
                    <h1 className="auth-title">Edit Profile</h1>
                    <p className="auth-subtitle">Update your personal information</p>
                </div>

                {message && (
                    <div className={`auth-error`} style={{
                        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: message.type === 'success' ? '#34d399' : '#fca5a5',
                        borderColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                    }}>
                        {message.text}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-group">
                        <label className="auth-label">Email Address</label>
                        <input
                            type="email"
                            className="auth-input"
                            value={session?.user?.email || ''}
                            disabled
                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                        />
                    </div>

                    <div className="auth-group">
                        <label className="auth-label">Full Name</label>
                        <input
                            type="text"
                            className="auth-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ margin: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                        <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '16px' }}>Change Password</h3>

                        <div className="auth-group">
                            <label className="auth-label">Current Password</label>
                            <input
                                type="password"
                                className="auth-input"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Required only if changing password"
                            />
                        </div>

                        <div className="auth-group" style={{ marginTop: '16px' }}>
                            <label className="auth-label">New Password</label>
                            <input
                                type="password"
                                className="auth-input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Leave blank to keep current"
                            />
                        </div>

                        <div className="auth-group" style={{ marginTop: '16px' }}>
                            <label className="auth-label">Confirm New Password</label>
                            <input
                                type="password"
                                className="auth-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link href="/" className="auth-button" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', textDecoration: 'none' }}>
                            Cancel
                        </Link>
                        <button type="submit" className="auth-button" disabled={loading} style={{ flex: 1 }}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
