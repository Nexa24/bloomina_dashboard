import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Search, Filter, Calendar, ShoppingBag, Truck, CheckCircle2, XCircle, Clock, Eye, ArrowLeft, Download, 
    Phone, Mail, MapPin, ExternalLink, MoreVertical, Loader2, Package, LayoutGrid, List, ChevronRight, 
    Clipboard, Trash2, Maximize2, Send, MessageSquare, FileText, Check, CheckCircle, RefreshCw, Wallet, 
    ChevronDown, Printer, Camera
} from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';
import CustomSelect from '../../components/CustomSelect';

const AdminOrders = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showAlert } = useAlert();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Modal & tracking state
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deliveryMethod, setDeliveryMethod] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
    const [selectedUpiId, setSelectedUpiId] = useState('alanovejennybazil@oksbi');
    const [customUpiId, setCustomUpiId] = useState('');
    const [isAdminAlertOpen, setIsAdminAlertOpen] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);

    const toggleSelectOrder = (orderId, e) => {
        if (e) e.stopPropagation();
        setSelectedOrderIds(prev => 
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedOrderIds.length === paginatedOrders.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(paginatedOrders.map(o => o.id));
        }
    };

    const [lastUpdated, setLastUpdated] = useState(new Date());

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);

            if (error) {
                console.error("Error fetching orders:", error);
                setOrders([]);
            } else {
                setOrders(data || []);
                setLastUpdated(new Date());
            }
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const updateOrderStatus = async (orderId, newStatus) => {
        // 🛡️ Added: Confirmation for Delivered status
        if (newStatus === 'Delivered') {
            showAlert({
                title: 'Mark as Delivered?',
                message: 'This will mark the order as complete and notify the customer. Are you sure?',
                type: 'warning',
                confirmText: 'Yes, Delivered',
                onConfirm: async () => {
                    executeStatusUpdate(orderId, newStatus);
                }
            });
            return;
        }

        executeStatusUpdate(orderId, newStatus);
    };

    const executeStatusUpdate = async (orderId, newStatus) => {

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            
            // Optimistically update UI
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            showAlert({
                title: 'Update Failed',
                message: 'Could not update order status: ' + error.message,
                type: 'danger'
            });
        }
    };

    const handleUpdateTracking = async () => {
        if (!selectedOrder) return;
        setIsUpdatingTracking(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    delivery_method: deliveryMethod,
                    tracking_number: trackingNumber
                })
                .eq('id', selectedOrder.id);

            if (error) throw error;

            setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, delivery_method: deliveryMethod, tracking_number: trackingNumber } : o));
            setSelectedOrder(prev => ({ ...prev, delivery_method: deliveryMethod, tracking_number: trackingNumber }));
            showAlert({
                title: 'Tracking Updated',
                message: 'Tracking info has been saved successfully.',
                type: 'success',
                showCancel: false,
                confirmText: 'Excellent'
            });
        } catch (error) {
            console.error("Failed to update tracking:", error);
            showAlert({
                title: 'Sync Failed',
                message: 'There was a problem updating the tracking details: ' + error.message,
                type: 'danger'
            });
        }
        setIsUpdatingTracking(false);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Payment Pending': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200/50';
            case 'Payment Done': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50';
            case 'Processing': return 'bg-[#fff5f6] text-[#944555] dark:bg-[#944555]/10 dark:text-[#f191a1] border border-[#944555]/20';
            case 'Shipped': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50';
            case 'Delivered': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200/50';
            case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200/50';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50';
        }
    };

    const filteredOrders = orders.filter(o =>
        (o.id?.toString().toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (o.customer_name?.toString().toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (o.email?.toString().toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    const handleExportSales = () => {
        if (orders.length === 0) {
            showAlert({
                title: 'Nothing to Export',
                message: 'The current order list is empty. Try refining your search or refreshing.',
                type: 'info',
                showCancel: false
            });
            return;
        }
        const headers = ["Order ID", "Date", "Customer", "Email", "Phone", "Total", "Status", "Payment Method", "Items"];
        const csvRows = [headers.join(",")];
        orders.forEach(order => {
            const itemsSummary = (order.items || []).map(i => `${i.title} (x${i.quantity})`).join("; ");
            const row = [
                order.id,
                new Date(order.created_at).toLocaleDateString(),
                `"${order.customer_name || 'Guest'}"`,
                order.email,
                order.phone || '',
                order.total,
                order.status,
                order.payment_method || (order.metadata?.payment_method || 'Internal'),
                `"${itemsSummary}"`
            ];
            csvRows.push(row.join(","));
        });
        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Bloomina_sales_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintLabel = () => {
        window.print();
    };

    const handleForwardEmail = (order) => {
        // Feature disabled
    };

    return (
        <div className="space-y-6 animate-fade-in relative pb-12">
            {/* 🖨️ Printable Wrapper: Ensures purely one block and no duplicates */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] overflow-hidden">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        @page { margin: 0; size: A4 portrait; }
                        body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact; }
                        #print-sticker-container { transform: scale(1); transform-origin: top center; }
                    }
                ` }} />
                
                {selectedOrder && (
                    <div id="print-sticker-container" className="flex flex-col items-center py-2 px-2">
                        {/* 📦 THE STICKER BOX */}
                        <div className="w-full max-w-[15cm] border-[8px] border-black p-4 flex flex-col font-mono text-black bg-white shadow-none">
                            {/* 🏢 Brand Header (Moved Inside) */}
                            <div className="flex items-center justify-center gap-4 mb-4 border-b-[6px] border-black pb-4">
                                <img src="/logo/BLO_TRNSP_LOVE_ICON.png" alt="Bloomina Logo" className="h-12 object-contain" />
                                <div className="text-left">
                                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">Bloomina</h1>
                                    <p className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase mt-0.5">OFFICIAL FULFILLMENT DESK</p>
                                </div>
                            </div>

                            {/* Inner Motto Header */}
                            <div className="border-b-[4px] border-black pb-2 mb-4 text-center">
                                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 font-sans">PREMIUM LINGERIE & CLOTHING</p>
                            </div>
                            
                            <div className="flex-1 space-y-3">
                                <div>
                                    <p className="text-base font-black uppercase underline mb-2">Deliver To:</p>
                                    <h3 className="text-4xl font-black uppercase leading-tight tracking-tight">{selectedOrder.customer_name}</h3>
                                    <div className="text-2xl mt-2 leading-relaxed uppercase font-bold space-y-1">
                                        <p>{selectedOrder.shipping_address?.street}</p>
                                        <p>{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state}</p>
                                        <div className="flex items-baseline gap-4 mt-1">
                                            <p className="text-5xl font-black">{selectedOrder.shipping_address?.zip}</p>
                                            <p className="text-lg tracking-[0.5em] text-slate-400 font-black">INDIA</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6 border-t-6 border-dashed border-black pt-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400">CONTACT:</p>
                                        <p className="text-2xl font-black mt-1 leading-none">{selectedOrder.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-slate-400">BATCH REFERENCE:</p>
                                        <p className="text-xl font-black mt-1 leading-none font-sans tracking-tighter">#{(selectedOrder.id || '').toUpperCase()}</p>
                                    </div>
                                </div>
                                
                                <div className="border-t-6 border-dashed border-black pt-4">
                                    <p className="text-base font-black uppercase underline mb-2">CONSIGNMENT CONTENTS:</p>
                                    <div className="space-y-1">
                                        {(selectedOrder.items || []).map((it, idx) => (
                                            <div key={idx} className="flex justify-between items-start text-xl">
                                                <span className="font-black">[{it.quantity}X] {it.title}</span>
                                                <span className="text-slate-400 font-bold text-[10px] uppercase flex-shrink-0 ml-4">SKU: BLO-{(it.id || '99').slice(0,6)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-4 p-4 border-[6px] border-black text-center bg-transparent">
                                    <p className="text-base font-black uppercase mb-1">PAYMENT METHOD:</p>
                                    <h4 className="text-4xl font-black uppercase tracking-tighter">
                                        {selectedOrder.payment_method?.toUpperCase()?.includes('COD') || selectedOrder.metadata?.payment_method?.toUpperCase()?.includes('COD') ? 'CASH ON DELIVERY' : 'PREPAID'}
                                    </h4>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 text-center border-t-[4px] border-black">
                                <p className="text-xl font-black italic">Thank you for shopping at Bloomina!</p>
                                <p className="text-[10px] mt-1 text-slate-400 font-black uppercase tracking-widest leading-none">OFFICIAL LOGISTICS - HANDLE WITH CARE</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard Content (Visible on Screen) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Order Management</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Fulfill orders and monitor real-time sales</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={fetchOrders} 
                        disabled={isLoading}
                        className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-[#944555] text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 active:scale-95 group"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#944555] ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        <span>Refresh Board</span>
                    </button>
                    <button onClick={handleExportSales} className="bg-[#944555] hover:bg-[#7d3a47] text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg shadow-[#944555]/20 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Data
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search order ID or customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-[#944555] text-slate-900 dark:text-white shadow-inner"
                        />
                    </div>
                </div>

                {/* ⚡ Bulk Actions Bar */}
                {selectedOrderIds.length > 0 && (
                    <div className="p-4 bg-[#944555]/5 border-b border-[#944555]/10 animate-slide-down flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-[#944555] uppercase tracking-widest bg-white dark:bg-[#944555]/10 px-3 py-1.5 rounded-lg border border-[#944555]/20">
                                {selectedOrderIds.length} Orders Selected
                            </span>
                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Status:</span>
                                <div className="flex gap-1">
                                    {['Processing', 'Shipped', 'Delivered'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                showAlert({
                                                    title: `Bulk Update to ${status}?`,
                                                    message: `Are you sure you want to update ${selectedOrderIds.length} orders to ${status}?`,
                                                    type: 'warning',
                                                    onConfirm: async () => {
                                                        for (const id of selectedOrderIds) {
                                                            await executeStatusUpdate(id, status);
                                                        }
                                                        setSelectedOrderIds([]);
                                                        showAlert({ title: 'Success', message: 'Orders updated successfully.', type: 'success' });
                                                    }
                                                });
                                            }}
                                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 rounded-lg hover:border-[#944555] hover:text-[#944555] transition-all"
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setSelectedOrderIds([])}
                                className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-[#0f111a]/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 w-10">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-slate-300 text-[#944555] focus:ring-[#944555]"
                                    />
                                </th>
                                <th className="p-4">Reference</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Payment</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/50">
                            {paginatedOrders.map((order) => (
                                <tr key={order.id} className={`group hover:bg-slate-50 dark:hover:bg-[#0f111a]/50 transition-all cursor-pointer ${selectedOrderIds.includes(order.id) ? 'bg-slate-50 dark:bg-[#0f111a]/50' : ''}`} onClick={() => { setSelectedOrder(order); setDeliveryMethod(order.delivery_method || ''); setTrackingNumber(order.tracking_number || ''); }}>
                                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedOrderIds.includes(order.id)}
                                            onChange={(e) => toggleSelectOrder(order.id, e)}
                                            className="w-4 h-4 rounded border-slate-300 text-[#944555] focus:ring-[#944555]"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-black text-slate-900 dark:text-white uppercase leading-none mb-1">#{(order.id || '').toUpperCase()}</div>
                                        <p className="text-[10px] text-slate-400 font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900 dark:text-white leading-none mb-1">{order.customer_name || 'Guest'}</div>
                                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{order.email}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-900 dark:text-white text-base">₹{parseFloat(order.total).toLocaleString()}</span>
                                        </div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                                            (order.payment_method?.toLowerCase()?.includes('cod') || order.metadata?.payment_method?.toLowerCase()?.includes('cod')) 
                                            ? 'text-amber-500' 
                                            : order.status === 'Payment Pending' ? 'text-[#944555]' : 'text-emerald-500'
                                        }`}>
                                            {(order.payment_method?.toLowerCase()?.includes('cod') || order.metadata?.payment_method?.toLowerCase()?.includes('cod')) 
                                                ? (order.status === 'Payment Done' ? 'Paid (COD)' : 'Unpaid (COD)') 
                                                : (order.status === 'Payment Pending' ? 'Pending' : 'Paid')}
                                        </p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg ${getStatusStyle(order.status)}`}>
                                            {order.status || 'Processing'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="p-2 text-slate-400 group-hover:text-[#944555] group-hover:bg-[#944555]/10 rounded-xl transition-all">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1a1c23]">
                    <div className="font-bold">Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length}</div>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                        >
                            Prev
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i);
                            if (pageNum < 1) pageNum = i + 1;
                            if (pageNum > totalPages) return null;
                            
                            return (
                                <button 
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1 rounded-xl border transition-all ${currentPage === pageNum ? 'border-[#944555] bg-[#fff5f6] dark:bg-[#944555]/20 text-[#944555] dark:text-[#f191a1] font-black' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${(currentPage === totalPages || totalPages === 0) ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedOrder(null)}></div>
                    <div className="relative w-full max-w-xl bg-white dark:bg-[#1a1c23] h-full shadow-2xl flex flex-col border-l border-white/20 dark:border-slate-800 animate-slide-left overflow-y-auto">
                        <div className="p-8 pb-4 relative">
                            <div className="absolute top-6 right-6 flex gap-2">
                                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-4 uppercase">Order #{(selectedOrder.id || '').toUpperCase()}</h2>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
                            <button 
                                onClick={handlePrintLabel}
                                className="mt-4 flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                <Printer className="w-4 h-4" /> Print Delivery Label (Parcel Sticker)
                            </button>
                        </div>

                        <div className="p-8 space-y-8 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Status</p>
                                    <CustomSelect
                                        value={selectedOrder.status || 'Processing'}
                                        onChange={(val) => updateOrderStatus(selectedOrder.id, val)}
                                        options={[
                                            { value: 'Payment Pending', label: 'Payment Pending' },
                                            { value: 'Payment Done', label: 'Payment Done' },
                                            { value: 'Processing', label: 'Processing' },
                                            { value: 'Shipped', label: 'Shipped' },
                                            { value: 'Delivered', label: 'Delivered' },
                                            { value: 'Cancelled', label: 'Cancelled' }
                                        ].filter(opt => {
                                            const isCod = selectedOrder.payment_method?.toLowerCase()?.includes('cod') || selectedOrder.metadata?.payment_method?.toLowerCase()?.includes('cod');
                                            if (opt.value === 'Payment Pending' && !isCod) return false;
                                            return true;
                                        })}
                                    />
                                </div>
                                <div className="bg-[#944555]/5 p-6 rounded-3xl border border-[#944555]/20">
                                    <p className="text-[10px] font-black text-[#944555] uppercase tracking-widest mb-2">Payment Details</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">₹{selectedOrder.total}</span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                            (selectedOrder.payment_method?.toLowerCase()?.includes('cod') || selectedOrder.metadata?.payment_method?.toLowerCase()?.includes('cod')) 
                                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10' 
                                            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10'
                                        }`}>
                                            {(selectedOrder.payment_method?.toLowerCase()?.includes('cod') || selectedOrder.metadata?.payment_method?.toLowerCase()?.includes('cod')) ? 'Unpaid' : 'Paid'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 💳 Manual Payment Collection (Added for UPI) */}
                            {((selectedOrder.payment_method?.toLowerCase()?.includes('cod') || selectedOrder.metadata?.payment_method?.toLowerCase()?.includes('cod')) || selectedOrder.status === 'Payment Pending') && (
                                <div className="bg-orange-50/50 dark:bg-orange-500/5 p-6 rounded-3xl border border-orange-100 dark:border-orange-500/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-orange-900 dark:text-orange-400 uppercase flex items-center gap-2">
                                            <Wallet className="w-4 h-4" /> Manual Collection
                                        </h3>
                                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">UPI LINK BUILDER</span>
                                    </div>
                                    
                                    {/* 🛠️ UPI ID Selector */}
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest ml-1">Select Receiving ID</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'alanovejennybazil@oksbi', label: 'Alanove SBI' },
                                                { id: 'nandhalalps2006@okicici', label: 'Nandhalal ICICI' },
                                                { id: 'custom', label: 'Custom ID' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setSelectedUpiId(opt.id)}
                                                    className={`px-3 py-2 text-[10px] font-black uppercase rounded-lg border transition-all ${
                                                        selectedUpiId === opt.id 
                                                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' 
                                                        : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-orange-200'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedUpiId === 'custom' && (
                                        <div className="space-y-1.5 animate-fade-in">
                                            <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest ml-1">Enter Custom UPI ID</label>
                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">@</div>
                                                <input 
                                                    type="text" 
                                                    value={customUpiId} 
                                                    onChange={(e) => setCustomUpiId(e.target.value)}
                                                    placeholder="name@okaxis"
                                                    className="w-full bg-white dark:bg-slate-900 border border-orange-100 dark:border-orange-500/20 rounded-xl pl-8 pr-4 py-2.5 text-xs font-black text-slate-700 dark:text-white outline-none focus:border-orange-300 dark:focus:border-orange-500/50 transition-all placeholder:text-orange-200"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-2 pt-2">
                                        <button 
                                            onClick={() => {
                                                const upiId = selectedUpiId === 'custom' ? customUpiId : selectedUpiId;
                                                const upiName = 'Bloomina';
                                                const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${selectedOrder.total}&tn=Order%20${(selectedOrder.id || '').toUpperCase()}&cu=INR`;
                                                navigator.clipboard.writeText(upiLink);
                                                setIsAdminAlertOpen(true);
                                            }}
                                            className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-100/50 dark:hover:bg-orange-500/10 transition-all"
                                        >
                                            <Clipboard className="w-4 h-4" /> Copy Custom UPI Link
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const upiId = selectedUpiId === 'custom' ? customUpiId : selectedUpiId;
                                                const upiName = 'Bloomina';
                                                const orderIdStr = (selectedOrder.id || 'N/A').toString().toUpperCase();
                                                const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${selectedOrder.total || 0}&tn=Order%20${orderIdStr}&cu=INR`;
                                                const message = `Hi ${selectedOrder.customer_name || 'there'},\n\nPlease complete your order #${orderIdStr} payment of ₹${selectedOrder.total || 0} using this UPI link:\n\n${upiLink}\n\nOnce done, please share a screenshot of the payment here. We'd love to process your lovely order even faster! ✨`;
                                                const phone = selectedOrder.phone?.replace(/\D/g, '');
                                                window.open(`https://wa.me/${phone || ''}?text=${encodeURIComponent(message)}`, '_blank');
                                            }}
                                            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all"
                                        >
                                            <Send className="w-4 h-4" /> Share Request to WhatsApp
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-orange-400 font-bold text-center italic opacity-75">Select an ID above before copying or sharing.</p>
                                </div>
                            )}

                            <div className="bg-white dark:bg-[#15171e] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-[#944555]" /> Delivery Tracking
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Courier</label>
                                        <input type="text" value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} placeholder="FedEx..." className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555]" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Tracking ID</label>
                                        <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="TRK123..." className="w-full bg-slate-50 dark:bg-[#1a1c23] border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555]" />
                                    </div>
                                </div>
                                <button onClick={handleUpdateTracking} className="w-full py-4 bg-[#944555] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#944555]/20 transition-all hover:bg-[#7d3a47] active:scale-95 disabled:opacity-75 disabled:scale-100" disabled={isUpdatingTracking}>
                                    {isUpdatingTracking ? 'Saving...' : 'Update Logistics Info'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Shipping Address
                                    </h3>
                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 relative group">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                                            {selectedOrder.customer_name || 'Guest User'}<br/>
                                            {selectedOrder.shipping_address?.street || selectedOrder.shipping_address?.address || 'No street provided'}<br/>
                                            {selectedOrder.shipping_address?.city || ''}, {selectedOrder.shipping_address?.state || ''}<br/>
                                            {selectedOrder.shipping_address?.zip || selectedOrder.shipping_address?.postalCode || ''} • {selectedOrder.shipping_address?.country || 'India'}
                                        </p>
                                        <button onClick={() => {
                                            const addr = `${selectedOrder.customer_name || 'Guest'}\n${selectedOrder.shipping_address?.street || ''}\n${selectedOrder.shipping_address?.city}, ${selectedOrder.shipping_address?.state} ${selectedOrder.shipping_address?.zip}`;
                                            navigator.clipboard.writeText(addr);
                                            showAlert({ title: 'Copied!', message: "Address copied to clipboard with premium formatting.", type: 'success' });
                                        }} className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-800 rounded-lg text-slate-400 hover:text-[#944555] opacity-0 group-hover:opacity-100 transition-all border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <Clipboard className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Phone className="w-3 h-3" /> Contact Details
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedOrder.phone || 'No phone provided'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selectedOrder.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="py-6 border-y border-slate-100 dark:border-slate-800 space-y-3">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-400">Subtotal</span>
                                    <span className="text-slate-700 dark:text-slate-300">₹{(selectedOrder.subtotal || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-400">Shipping Fee</span>
                                    <span className="text-slate-700 dark:text-slate-300">₹{(selectedOrder.shipping_cost || 0).toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Total Amount Paid</span>
                                    <span className="text-xl font-black text-[#944555]">₹{(selectedOrder.total || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-slate-400" /> Purchased Items
                                </h3>
                                <div className="space-y-3">
                                    {(selectedOrder.items || []).map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-50 dark:border-slate-800">
                                            <div className="w-16 h-16 bg-white dark:bg-[#0f111a] rounded-xl flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0 text-2xl">
                                                {item.image ? <img src={item.image} alt="" className="w-full h-full object-contain" /> : '📦'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-800 dark:text-white truncate">{item.title || item.name || 'Lovely Product'}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Qty: {item.quantity || 1} × ₹{item.price || 0}</p>
                                            </div>
                                            <p className="font-black text-slate-900 dark:text-white">₹{(item.price || 0) * (item.quantity || 1)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Custom Admin Alert Modal for Screenshot Reminder */}
            {isAdminAlertOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAdminAlertOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#1a1c23] rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-2xl animate-scale-in text-center border border-orange-500/10 dark:border-orange-500/20">
                        <div className="w-20 h-20 bg-orange-500/10 rounded-[2rem] flex items-center justify-center text-orange-500 mb-6 mx-auto">
                            <Camera className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">VPA Link Copied!</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest opacity-75">
                            Don't forget to ask the customer for a payment screenshot. It's the "lovely" way to verify their lovely order! ✨
                        </p>
                        <button
                            onClick={() => setIsAdminAlertOpen(false)}
                            className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-orange-500/20 transform active:scale-95 text-[10px] uppercase tracking-[0.2em]"
                        >
                            Got it, Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;

