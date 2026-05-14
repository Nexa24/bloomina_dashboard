import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Users, ShoppingBag, Settings, LogOut, Package, Menu, X, Bell, 
    BarChart2, MessageSquare, Headphones, Search, Mail, ChevronDown, CheckCircle2, 
    ChevronUp, Sun, Moon, Archive, Ticket, DollarSign, TrendingUp, Megaphone, 
    Palette, Code, Boxes, Gift, Heart, Image as ImageIcon, Scale, CreditCard, AlertTriangle 
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { supabase } from '../../lib/supabase';
import NotificationStack from './OrderNotificationToast';

const AdminLayout = () => {
    const { adminUser, loading, adminLogout } = useAdminAuth();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('admin_theme') || 'light');
    const [storeStatus, setStoreStatus] = useState({ online: true, loading: true });

    const notificationRef = useRef(null);
    const profileRef = useRef(null);
    const { notifications, toasts, unreadCount, pushPermission, enablePushNotifications, markAllRead, markRead, markTypeAsRead, removeToast } = useNotifications();

    useEffect(() => {
        // Delay the read update slightly to prevent collision with page transition
        const timer = setTimeout(() => {
            if (location.pathname === '/admin/orders') {
                markTypeAsRead('order');
            } else if (location.pathname === '/admin/inquiries') {
                markTypeAsRead('lead');
            } else if (location.pathname === '/admin/inventory') {
                markTypeAsRead('inventory');
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [location.pathname, markTypeAsRead]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('admin_theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        fetchStatus();
        
        // Subscribe to status changes
        const statusSubscription = supabase
            .channel('status_sync')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'system_config',
                filter: 'key=eq.storefront_status'
            }, (payload) => {
                if (payload.new?.value) {
                    setStoreStatus({ online: payload.new.value.online, loading: false });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(statusSubscription);
        };
    }, []);

    const fetchStatus = async () => {
        try {
            const { data } = await supabase
                .from('system_config')
                .select('value')
                .eq('key', 'storefront_status')
                .maybeSingle();
            
            if (data?.value) {
                setStoreStatus({ online: !!data.value.online, loading: false });
            }
        } catch (err) {
            setStoreStatus(prev => ({ ...prev, loading: false }));
        }
    };



    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    
    const handleLogout = async () => {
        await adminLogout();
    };

    const handleEnablePush = async () => {
        await enablePushNotifications();
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                performGlobalSearch();
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const performGlobalSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const query = searchQuery.trim().toLowerCase();
            const [productsRes, customersRes, ordersRes] = await Promise.all([
                supabase.from('products').select('id, name, sku').or(`name.ilike.%${query}%,sku.ilike.%${query}%`).limit(3),
                supabase.from('profiles').select('id, full_name, email').or(`full_name.ilike.%${query}%,email.ilike.%${query}%`).neq('role', 'admin').limit(3),
                supabase.from('orders').select('id, total, status').ilike('id', `%${query}%`).limit(3)
            ]);

            const products = productsRes.data || [];
            const profiles = customersRes.data || [];
            const orders = ordersRes.data || [];

            const combined = [
                ...products.map(p => ({ type: 'Product', name: p.name, preview: `SKU: ${p.sku}`, icon: Package, link: `/admin/products?search=${p.id}` })),
                ...profiles.map(c => ({ type: 'Customer', name: c.full_name || 'Anonymous', preview: c.email, icon: Users, link: `/admin/customers?search=${c.id}` })),
                ...orders.map(o => ({ type: 'Order', name: `#${o.id.slice(0, 8)}`, preview: `₹${o.total} • ${o.status}`, icon: ShoppingBag, link: `/admin/orders?search=${o.id}` }))
            ];
            setSearchResults(combined);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#0f111a]">
                <div className="flex flex-col items-center gap-6">
                    <img src="/logo/BLO_TRNSP_LOVE_ICON.png" alt="Loading..." className="w-24 h-24 object-contain animate-pulse" />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#944555] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-[#944555] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-[#944555] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!adminUser) {
        return <Navigate to="/admin/login" replace />;
    }

    const sidebarSections = [
        {
            title: "Core Operations",
            links: [
                { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/admin/orders', label: 'Orders', icon: ShoppingBag, badge: (notifications || []).filter(n => n.type === 'order' && !n.read).length },
                { path: '/admin/customers', label: 'Customers', icon: Users },
                { path: '/admin/inquiries', label: 'Contact Inquiries', icon: Mail, badge: (notifications || []).filter(n => n.type === 'lead' && !n.read).length },
            ]
        },
        {
            title: "Catalog & Stock",
            links: [
                { path: '/admin/products', label: 'Products', icon: Package },
                { path: '/admin/categories', label: 'Categories', icon: Archive },
                { path: '/admin/inventory', label: 'Inventory', icon: Boxes },
                { path: '/admin/materials', label: 'Material Templates', icon: Palette },
            ]
        },
        {
            title: "Finance & Growth",
            links: [
                { path: '/admin/finance', label: 'Financial Overview', icon: DollarSign },
                { path: '/admin/analytics', label: 'Performance', icon: BarChart2 },
                { path: '/admin/marketing', label: 'Campaigns', icon: Megaphone },
                { path: '/admin/coupons', label: 'Coupons & Deals', icon: Ticket },
            ]
        },
        {
            title: "Storefront Control",
            links: [
                { path: '/admin/hero', label: 'Hero Slideshow', icon: ImageIcon },
                { path: '/admin/brand-reviews', label: 'Brand Reviews', icon: MessageSquare },
                { path: '/admin/system', label: 'System Health', icon: Headphones },
                { path: '/admin/settings', label: 'Global Settings', icon: Settings },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f111a] flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#1a1c23] p-4 flex items-center justify-between z-50 shadow-sm border-b border-slate-200 dark:border-slate-800">
                <img src="/logo/BLO_TRNSP_PINK_LRG.png" alt="Bloomina" className="h-8 w-auto object-contain" />
                <div className="flex items-center gap-3">
                    <button onClick={toggleTheme} className="p-2 text-slate-500 rounded-lg">
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-400" />}
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-500 rounded-lg">
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-[#15171e] w-64 md:w-72 border-r border-slate-200 dark:border-slate-800 shadow-sm z-40 transform transition-all duration-300 flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="hidden md:flex items-center justify-center p-6 pb-2">
                    <img src="/logo/BLO_TRNSP_PINK_LRG.png" alt="Bloomina" className="h-10 w-auto object-contain" />
                </div>

                {/* Profile Widget */}
                <div className="px-6 mb-6 mt-2">
                    <button className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#1a1c23]">
                        <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[#944555] uppercase shrink-0">
                                {(adminUser?.email?.charAt(0) || 'A').toUpperCase()}
                            </div>
                            <div className="text-left overflow-hidden flex-1">
                                <p className="text-sm font-bold truncate">Workspace</p>
                                <p className="text-xs text-slate-400 truncate">{adminUser?.email || 'admin@bloomina.in'}</p>
                            </div>
                        </div>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-6 mt-2 hide-scrollbar">
                    {sidebarSections.map((section, idx) => (
                        <div key={idx}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pl-2">{section.title}</p>
                            <div className="space-y-1">
                                {section.links.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = location.pathname === link.path || (link.path !== '/admin' && location.pathname.startsWith(link.path));
                                    return (
                                        <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-bold text-sm ${isActive ? 'bg-[#fff5f6] dark:bg-[#944555]/10 text-[#944555] dark:text-[#f191a1]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            <div className="flex items-center gap-3">
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-[#944555] dark:text-[#f191a1]' : 'text-slate-400'}`} />
                                                {link.label}
                                            </div>
                                            {link.badge > 0 && (
                                                <span className="bg-[#944555] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg shadow-[#944555]/20 animate-pulse">
                                                    {link.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 pb-6 mt-auto">
                    <div className="bg-slate-900 dark:bg-[#1a1c23] rounded-2xl p-4 relative overflow-hidden border border-slate-800">
                        <h4 className="font-bold text-white text-xs mb-0.5">System Status</h4>
                        <p className="text-[10px] text-slate-400 mb-3">{storeStatus.online ? 'Online' : 'Maintenance'}</p>
                        <button onClick={handleLogout} className="w-full bg-white/10 text-white text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                            <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

            <main className="flex-1 w-full min-h-screen md:ml-72 flex flex-col bg-[#f8fafc] dark:bg-[#0f111a] pt-16 md:pt-0 overflow-x-hidden">
                <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
                
                <div className="px-6 py-4 flex justify-between items-center bg-[#f8fafc]/80 dark:bg-[#0f111a]/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="hidden md:block">
                        <p className="text-slate-500 font-medium text-sm">Welcome back,</p>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Administrator</h1>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <button onClick={toggleTheme} className="hidden md:flex w-10 h-10 rounded-full bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 items-center justify-center">
                            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-400" />}
                        </button>
                        <button onClick={() => setIsSearchOpen(true)} className="w-10 h-10 rounded-full bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                            <Search className="w-5 h-5 text-slate-400" />
                        </button>

                        <div className="relative" ref={notificationRef}>
                            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="w-10 h-10 rounded-full bg-white dark:bg-[#15171e] border border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
                                <Bell className="w-5 h-5 text-slate-400" />
                                {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-black">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                            </button>
                            {isNotificationsOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1a1c23] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="font-bold">Notifications</h3>
                                        <button className="text-xs text-[#944555] font-bold" onClick={markAllRead}>Mark all read</button>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="text-center py-10 text-slate-400"><p className="text-sm">No notifications</p></div>
                                        ) : (
                                            notifications.map(notif => {
                                                const Icon = notif.type === 'order' ? ShoppingBag : notif.type === 'lead' ? Mail : notif.type === 'inventory' ? AlertTriangle : Bell;
                                                return (
                                                    <div 
                                                        key={notif.id} 
                                                        onClick={() => markRead(notif.id)}
                                                        className={`p-4 border-b border-slate-50 dark:border-slate-800/50 flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!notif.read ? 'bg-[#fff5f6]/40 dark:bg-[#944555]/5' : ''}`}
                                                    >
                                                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${!notif.read ? 'bg-[#944555] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`text-sm leading-tight ${!notif.read ? 'font-black' : 'font-bold'} truncate`}>{notif.title}</h4>
                                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.body}</p>
                                                            <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-wider">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                        {!notif.read && <div className="w-2 h-2 rounded-full bg-[#944555] shrink-0 mt-1"></div>}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={profileRef}>
                            <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                <div className="w-9 h-9 rounded-full bg-[#fff5f6] text-[#944555] font-bold flex items-center justify-center">{(adminUser?.email?.charAt(0) || 'A').toUpperCase()}</div>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                            {isProfileOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#1a1c23] border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-50">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800"><p className="text-sm font-bold truncate">{adminUser?.email}</p></div>
                                    <div className="p-2">
                                        <Link to="/admin/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"><Settings className="w-4 h-4" /> Settings</Link>
                                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 text-left"><LogOut className="w-4 h-4" /> Logout</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 h-full w-full">
                    <Outlet key={location.pathname} />
                </div>
                <NotificationStack notifications={toasts} onClose={removeToast} />

                {isSearchOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}></div>
                        <div className="relative w-full max-w-2xl bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                                <Search className="w-5 h-5 text-slate-400" />
                                <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products, customers, orders... (Ctrl+K)" className="flex-1 bg-transparent px-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none" />
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto p-2">
                                {isSearching ? (
                                    <div className="p-4 text-center text-slate-500">Searching...</div>
                                ) : searchResults.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400">{searchQuery ? 'No results found' : 'Start typing to search...'}</div>
                                ) : (
                                    searchResults.map((item, i) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link key={i} to={item.link} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><Icon className="w-4 h-4 text-slate-500" /></div>
                                                    <div>
                                                        <h5 className="font-bold text-sm">{item.name}</h5>
                                                        <p className="text-xs text-slate-500">{item.preview}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">{item.type}</span>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminLayout;
