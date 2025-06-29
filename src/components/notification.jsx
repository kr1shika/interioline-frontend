import { useEffect, useRef, useState } from 'react';
import { FaBell, FaBriefcase, FaCheckDouble, FaCog, FaComment, FaCreditCard, FaStar, FaTimes } from 'react-icons/fa';

const NotificationComponent = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');
    const [markingAsRead, setMarkingAsRead] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        console.log('NotificationComponent mounted with userId:', userId);
    }, [userId]);

    const fetchNotifications = async () => {
        console.log('fetchNotifications called with userId:', userId);

        if (!userId) {
            console.log('No userId provided, cannot fetch notifications');
            setError('No user ID provided');
            return;
        }

        setLoading(true);
        setError(null);

        const url = `http://localhost:2005/api/notifications/${userId}`;
        console.log('Fetching from URL:', url);

        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Error response text:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Fetched notifications data:', data);
            console.log('Number of notifications:', data?.length || 0);

            setNotifications(data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError(`Failed to fetch notifications: ${err.message}`);
            setDebugInfo(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Test backend connection
    const testConnection = async () => {
        try {
            const response = await fetch('http://localhost:2005/api/notifications/test-user-id', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Test connection response:', response.status);
        } catch (err) {
            console.log('Test connection failed:', err);
        }
    };

    // Fetch notifications when component opens
    useEffect(() => {
        if (isOpen && userId) {
            console.log('Component opened, fetching notifications...');
            fetchNotifications();
        }
    }, [isOpen, userId]);

    // Test connection on mount
    useEffect(() => {
        testConnection();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Get icon for notification type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'project_update':
                return <FaBriefcase style={{ color: '#3b82f6' }} />;
            case 'message':
                return <FaComment style={{ color: '#10b981' }} />;
            case 'payment':
                return <FaCreditCard style={{ color: '#8b5cf6' }} />;
            case 'system':
                return <FaCog style={{ color: '#6b7280' }} />;
            case 'review':
                return <FaStar style={{ color: '#f59e0b' }} />;
            default:
                return <FaBell style={{ color: '#9ca3af' }} />;
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    // Mark notification as read - Updated to call backend
    const markAsRead = async (notificationId) => {
        try {
            console.log('Marking notification as read:', notificationId);

            const response = await fetch(`http://localhost:2005/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Notification marked as read:', result);

            // Update local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, is_read: true, read_at: new Date() }
                        : notif
                )
            );
        } catch (err) {
            console.error('Error marking notification as read:', err);
            // Still update local state for better UX
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, is_read: true, read_at: new Date() }
                        : notif
                )
            );
        }
    };

    // Mark all notifications as read - New function
    const markAllAsRead = async () => {
        if (markingAsRead) return;

        setMarkingAsRead(true);
        try {
            console.log('Marking all notifications as read for user:', userId);

            const response = await fetch(`http://localhost:2005/api/notifications/user/${userId}/read-all`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('All notifications marked as read:', result);

            // Update local state
            setNotifications(prev =>
                prev.map(notif => ({
                    ...notif,
                    is_read: true,
                    read_at: new Date()
                }))
            );
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            // Still update local state for better UX
            setNotifications(prev =>
                prev.map(notif => ({
                    ...notif,
                    is_read: true,
                    read_at: new Date()
                }))
            );
        } finally {
            setMarkingAsRead(false);
        }
    };

    // Create test notification (for debugging)
    const createTestNotification = async () => {
        try {
            const testNotification = {
                user: userId,
                title: "Test Notification",
                message: "This is a test notification to check if the system works",
                type: "system"
            };

            const response = await fetch('http://localhost:2005/api/notifications', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testNotification)
            });

            if (response.ok) {
                console.log('Test notification created successfully');
                fetchNotifications(); // Refresh notifications
            } else {
                console.log('Failed to create test notification:', response.status);
            }
        } catch (err) {
            console.error('Error creating test notification:', err);
        }
    };

    // Get unread count
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="notification-container" style={{ position: 'relative', display: 'inline-block' }}>
            <button
                className="icon-button notification-container"
                title="Notifications"
                onClick={() => setIsOpen(!isOpen)}
                style={{ position: 'relative' }}
            >
                <FaBell className="navicon" />
                {unreadCount > 0 && (
                    <span
                        className="notification-dot"
                        style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid white'
                        }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute',
                        right: '0',
                        top: '100%',
                        marginTop: '10px',
                        width: '320px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #e5e7eb',
                        zIndex: 1000,
                        maxHeight: '400px',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                            Notifications
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {unreadCount > 0 && (
                                <>
                                    <button
                                        onClick={markAllAsRead}
                                        disabled={markingAsRead}
                                        title="Mark all as read"
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '10px',
                                            color: '#3b82f6',
                                            background: 'none',
                                            border: '1px solid #3b82f6',
                                            borderRadius: '4px',
                                            cursor: markingAsRead ? 'not-allowed' : 'pointer',
                                            opacity: markingAsRead ? 0.6 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <FaCheckDouble style={{ fontSize: '10px' }} />
                                        {markingAsRead ? 'Reading...' : 'Mark all'}
                                    </button>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {unreadCount} unread
                                    </span>
                                </>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    padding: '4px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <FaTimes style={{ color: '#6b7280', fontSize: '14px' }} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    border: '2px solid #e5e7eb',
                                    borderTop: '2px solid #3b82f6',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                <span style={{ marginLeft: '8px' }}>Loading...</span>
                            </div>
                        ) : error ? (
                            <div style={{ padding: '16px', textAlign: 'center', color: '#ef4444' }}>
                                <p style={{ marginBottom: '8px' }}>{error}</p>
                                <button
                                    onClick={fetchNotifications}
                                    style={{
                                        marginRight: '8px',
                                        fontSize: '12px',
                                        color: '#3b82f6',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Try again
                                </button>
                                <button
                                    onClick={createTestNotification}
                                    style={{
                                        fontSize: '12px',
                                        color: '#10b981',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Create Test
                                </button>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                                <FaBell style={{ fontSize: '32px', color: '#d1d5db', marginBottom: '8px' }} />
                                <p style={{ marginBottom: '16px' }}>No notifications yet</p>
                                <button
                                    onClick={createTestNotification}
                                    style={{
                                        fontSize: '12px',
                                        color: '#3b82f6',
                                        background: 'none',
                                        border: '1px solid #3b82f6',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Create Test Notification
                                </button>
                            </div>
                        ) : (
                            <div>
                                {notifications.map((notification, index) => (
                                    <div
                                        key={notification._id}
                                        style={{
                                            padding: '16px',
                                            borderBottom: index < notifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                                            backgroundColor: !notification.is_read ? '#eff6ff' : 'white',
                                            borderLeft: !notification.is_read ? '4px solid #3b82f6' : '4px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onClick={() => !notification.is_read && markAsRead(notification._id)}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = !notification.is_read ? '#eff6ff' : 'white'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ flexShrink: 0, marginTop: '4px', fontSize: '16px' }}>
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{
                                                            margin: 0,
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            color: !notification.is_read ? '#111827' : '#374151',
                                                            marginBottom: '4px'
                                                        }}>
                                                            {notification.title}
                                                        </h4>
                                                        <p style={{
                                                            margin: 0,
                                                            fontSize: '12px',
                                                            color: '#6b7280',
                                                            lineHeight: '1.4'
                                                        }}>
                                                            {notification.message}
                                                        </p>
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                                                        <span style={{ fontSize: '10px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                                                            {formatTimeAgo(notification.createdAt)}
                                                        </span>
                                                        {notification.is_read ? (
                                                            <FaCheckDouble style={{ fontSize: '12px', color: '#10b981' }} />
                                                        ) : (
                                                            <div style={{
                                                                width: '8px',
                                                                height: '8px',
                                                                backgroundColor: '#3b82f6',
                                                                borderRadius: '50%'
                                                            }}></div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div style={{
                            padding: '12px',
                            borderTop: '1px solid #e5e7eb',
                            backgroundColor: '#f9fafb'
                        }}>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    width: '100%',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    color: '#3b82f6',
                                    fontWeight: '500',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default NotificationComponent;