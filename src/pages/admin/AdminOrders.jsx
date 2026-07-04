import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
    Search, Filter, Calendar, ShoppingBag, Truck, CheckCircle2, XCircle, Clock, Eye, ArrowLeft, Download, 
    Phone, Mail, MapPin, ExternalLink, MoreVertical, Loader2, Package, LayoutGrid, List, ChevronRight, 
    Clipboard, Trash2, Maximize2, Send, MessageSquare, FileText, Check, CheckCircle, RefreshCw, Wallet, 
    ChevronDown, Printer, Camera, Plus
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
    const [selectedUpiId, setSelectedUpiId] = useState(import.meta.env.VITE_UPI_ID || 'bloomina@okaxis');
    const [customUpiId, setCustomUpiId] = useState('');
    const [isAdminAlertOpen, setIsAdminAlertOpen] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);

    // Create Manual Order Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [newOrderCustomer, setNewOrderCustomer] = useState({ name: '', email: '', phone: '' });
    const [newOrderShipping, setNewOrderShipping] = useState({ street: '', city: '', state: '', zip: '', country: 'India' });
    const [newOrderItems, setNewOrderItems] = useState([]);
    const [newOrderPayment, setNewOrderPayment] = useState({ method: 'COD', status: 'Processing' });
    const [newOrderDiscount, setNewOrderDiscount] = useState(0);
    const [newOrderShippingCost, setNewOrderShippingCost] = useState(0);
    
    // Product searching inside modal
    const [prodSearchQuery, setProdSearchQuery] = useState('');
    const [foundProducts, setFoundProducts] = useState([]);
    const [isSearchingProducts, setIsSearchingProducts] = useState(false);
    const [selectedProductForAdd, setSelectedProductForAdd] = useState(null);
    const [selectedVariantSize, setSelectedVariantSize] = useState('');
    const [selectedVariantColor, setSelectedVariantColor] = useState('');
    const [selectedItemQuantity, setSelectedItemQuantity] = useState(1);

    const searchProducts = async (query) => {
        setIsSearchingProducts(true);
        try {
            let q = supabase
                .from('products')
                .select('id, name, price, images, variants, colorConfigs')
                .eq('status', 'Active')
                .limit(10);
            
            if (query.trim()) {
                q = q.or(`name.ilike.%${query}%,sku.ilike.%${query}%`);
            } else {
                q = q.order('name', { ascending: true });
            }

            const { data, error } = await q;
            if (error) throw error;
            setFoundProducts(data || []);
        } catch (e) {
            console.error("Error searching products:", e);
        } finally {
            setIsSearchingProducts(false);
        }
    };

    useEffect(() => {
        if (!isCreateModalOpen) {
            setFoundProducts([]);
            setProdSearchQuery('');
            return;
        }

        const timer = setTimeout(() => {
            searchProducts(prodSearchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [isCreateModalOpen, prodSearchQuery]);

    const handleAddProductToOrder = () => {
        if (!selectedProductForAdd) return;
        
        // If product has size variants and none selected
        const sizeVar = selectedProductForAdd.variants?.find(v => v.name === 'Size');
        if (sizeVar?.values?.length > 0 && !selectedVariantSize) {
            showAlert({ title: 'Select Size', message: 'Please select a size for this product.', type: 'warning' });
            return;
        }

        // If product has color configs and none selected
        if (selectedProductForAdd.colorConfigs?.length > 0 && !selectedVariantColor) {
            showAlert({ title: 'Select Color', message: 'Please select a color for this product.', type: 'warning' });
            return;
        }

        // Find the color config to retrieve its image
        const chosenColorConfig = selectedProductForAdd.colorConfigs?.find(c => c.name === selectedVariantColor);
        const itemImage = chosenColorConfig?.images?.[0] || selectedProductForAdd.images?.[0] || '';
        
        const newItem = {
            productId: selectedProductForAdd.id,
            id: selectedProductForAdd.id,
            title: selectedProductForAdd.name,
            price: Number(selectedProductForAdd.price),
            quantity: Number(selectedItemQuantity),
            image: itemImage,
            size: selectedVariantSize || null,
            color: selectedVariantColor || null
        };
        
        const existingIndex = newOrderItems.findIndex(item => 
            item.id === newItem.id && 
            item.size === newItem.size && 
            item.color === newItem.color
        );
        
        if (existingIndex >= 0) {
            const updated = [...newOrderItems];
            updated[existingIndex].quantity += newItem.quantity;
            setNewOrderItems(updated);
        } else {
            setNewOrderItems([...newOrderItems, newItem]);
        }
        
        // Reset
        setSelectedProductForAdd(null);
        setSelectedVariantSize('');
        setSelectedVariantColor('');
        setSelectedItemQuantity(1);
        setProdSearchQuery('');
        setFoundProducts([]);
    };

    const handleCreateManualOrder = async (e) => {
        e.preventDefault();
        
        if (!newOrderCustomer.name.trim()) {
            showAlert({ title: 'Error', message: 'Customer name is required.', type: 'danger' });
            return;
        }
        if (newOrderItems.length === 0) {
            showAlert({ title: 'Error', message: 'Please add at least one item to the order.', type: 'danger' });
            return;
        }
        
        setCreateLoading(true);
        try {
            const orderSubtotal = newOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const orderTotal = Math.max(0, orderSubtotal + Number(newOrderShippingCost) - Number(newOrderDiscount));

            const orderRow = {
                status: newOrderPayment.status,
                customer_name: newOrderCustomer.name.trim(),
                email: newOrderCustomer.email.trim() || null,
                phone: newOrderCustomer.phone.trim() || null,
                subtotal: orderSubtotal,
                discount_amount: Number(newOrderDiscount),
                shipping_cost: Number(newOrderShippingCost),
                total: orderTotal,
                items: newOrderItems,
                shipping_address: {
                    street: newOrderShipping.street.trim() || null,
                    city: newOrderShipping.city.trim() || null,
                    state: newOrderShipping.state.trim() || null,
                    zip: newOrderShipping.zip.trim() || null,
                    country: newOrderShipping.country.trim() || 'India'
                },
                payment_method: newOrderPayment.method,
                razorpay_payment_id: newOrderPayment.method === 'Razorpay' ? `manual_${Math.random().toString(36).substr(2, 9)}` : null,
                created_at: new Date().toISOString()
            };
            console.log("[AdminOrders] Attempting to create manual order with payload:", orderRow);

            // Timeout after 15 seconds to prevent permanent UI spinner hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Supabase insert request timed out after 15 seconds")), 15000)
            );

            const supabasePromise = (async () => {
                return await supabase
                    .from('orders')
                    .insert([orderRow])
                    .select();
            })();

            const response = await Promise.race([supabasePromise, timeoutPromise]);
            console.log("[AdminOrders] Supabase response received:", response);

            const { data, error } = response;
                
            if (error) throw error;
            
            const createdOrder = data && data[0];
            if (!createdOrder) {
                throw new Error("No data returned from database insert.");
            }
            
            showAlert({
                title: 'Order Created',
                message: `Manual order #${(createdOrder.id || '').toUpperCase()} created successfully.`,
                type: 'success',
                showCancel: false,
                confirmText: 'Awesome'
            });
            
            setIsCreateModalOpen(false);
            setNewOrderCustomer({ name: '', email: '', phone: '' });
            setNewOrderShipping({ street: '', city: '', state: '', zip: '', country: 'India' });
            setNewOrderItems([]);
            setNewOrderPayment({ method: 'COD', status: 'Processing' });
            setNewOrderDiscount(0);
            setNewOrderShippingCost(0);
            
            fetchOrders();
            
        } catch (error) {
            console.error("Failed to create order:", error);
            showAlert({
                title: 'Creation Failed',
                message: 'Could not create manual order: ' + error.message,
                type: 'danger'
            });
        } finally {
            setCreateLoading(false);
        }
    };

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
                        html, body { height: 100%; overflow: hidden; }
                    }
                ` }} />
                
                {selectedOrder && (
                    <div id="print-sticker-container" className="w-full h-full flex flex-col items-center justify-center bg-white p-0 box-border overflow-hidden">
                        {/* 📦 THE STICKER BOX */}
                        <div className="w-[19cm] h-[26.7cm] border-[12px] border-black p-8 flex flex-col justify-between font-mono text-black bg-white shadow-none box-border overflow-hidden">
                            
                            {/* Top Section */}
                            <div className="space-y-4">
                                {/* 🏢 Brand Header */}
                                <div className="flex justify-center border-b-[6px] border-black pb-4">
                                    <img src="/logo/BLO_TRNSP_PINK_LRG.png" alt="Bloomina Logo" className="h-28 object-contain animate-none" style={{ filter: 'brightness(0)' }} />
                                </div>

                                {/* 🏢 Return Address (Sender) */}
                                <div className="border-b-[4px] border-black pb-3 text-xs leading-relaxed">
                                    <p className="text-xs font-black uppercase underline mb-0.5">Sender / Return Address:</p>
                                    <p className="font-bold uppercase">Live Wear Apparels Private Limited</p>
                                    <p>150/8438 MOUNTPARK INDUSTRIAL ESTATES</p>
                                    <p>Pushpagiri, Koodaranji Panchayat</p>
                                    <p>Kozhikode, Kerala - 673604</p>
                                    <p className="font-bold">Phone: 9567797776</p>
                                    <p className="font-bold">Email: support@bloomina.in</p>
                                    <p className="font-bold">Website: www.bloomina.in</p>
                                </div>

                                {/* Deliver To */}
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase underline">Deliver To:</p>
                                    <h3 className="text-4xl font-black uppercase leading-tight tracking-tight">{selectedOrder.customer_name}</h3>
                                    <div className="text-xl leading-snug uppercase font-bold space-y-0.5">
                                        <p>{selectedOrder.shipping_address?.street}</p>
                                        <p>{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state}</p>
                                        <div className="flex items-baseline gap-3 mt-1">
                                            <p className="text-5xl font-black">{selectedOrder.shipping_address?.zip}</p>
                                            <p className="text-sm tracking-[0.5em] text-black font-black">INDIA</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4 border-t-[6px] border-dashed border-black pt-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-black">CONTACT:</p>
                                        <p className="text-2xl font-black mt-0.5 leading-none">{selectedOrder.phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-black">BATCH REFERENCE:</p>
                                        <p className="text-lg font-black mt-0.5 leading-none font-sans tracking-tighter">#{(selectedOrder.id || '').toUpperCase()}</p>
                                    </div>
                                </div>
                                
                                {/* Contents */}
                                <div className="border-t-[6px] border-dashed border-black pt-4">
                                    <p className="text-xs font-black uppercase underline mb-1">CONSIGNMENT CONTENTS:</p>
                                    <div className="space-y-1">
                                        {(selectedOrder.items || []).map((it, idx) => (
                                            <div key={idx} className="flex justify-between items-start text-xl">
                                                <span className="font-black">[{it.quantity}X] {it.title}</span>
                                                <span className="text-black font-bold text-[10px] uppercase flex-shrink-0 ml-4 font-sans">SKU: BLO-{(it.id || '99').slice(0,6)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="p-4 border-[6px] border-black text-center bg-transparent">
                                    <p className="text-xs font-black uppercase mb-0.5">PAYMENT METHOD:</p>
                                    <h4 className="text-4xl font-black uppercase tracking-tighter">
                                        {selectedOrder.payment_method?.toUpperCase()?.includes('COD') || selectedOrder.metadata?.payment_method?.toUpperCase()?.includes('COD') ? 'CASH ON DELIVERY' : 'PREPAID'}
                                    </h4>
                                </div>
                            </div>

                            {/* Footer / Thank you */}
                            <div className="pt-4 text-center border-t-[4px] border-black">
                                <p className="text-xl font-black italic">Thank you for shopping at Bloomina!</p>
                                <p className="text-[10px] mt-1 text-black font-black uppercase tracking-widest leading-none">OFFICIAL LOGISTICS - HANDLE WITH CARE</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard Content (Visible on Screen) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div data-tour="orders-header">
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
                        data-tour="create-order-btn"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Order</span>
                    </button>
                    <button 
                        data-tour="refresh-orders-btn"
                        onClick={fetchOrders} 
                        disabled={isLoading}
                        className="bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-[#944555] text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-50 active:scale-95 group"
                    >
                        <RefreshCw className={`w-4 h-4 text-[#944555] ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        <span>Refresh Board</span>
                    </button>
                    <button data-tour="export-sales-btn" onClick={handleExportSales} className="bg-[#944555] hover:bg-[#7d3a47] text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg shadow-[#944555]/20 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export Data
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1a1c23] rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div data-tour="orders-search-input" className="relative flex-1 max-w-md w-full">
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

                <div data-tour="orders-table" className="overflow-x-auto">
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
                <div data-tour="orders-pagination" className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1a1c23]">
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
                                                { id: import.meta.env.VITE_UPI_ID || 'bloomina@okaxis', label: import.meta.env.VITE_UPI_NAME || 'Bloomina UPI' },
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

                            {/* 🚀 Shiprocket Logistics */}
                            <div className="bg-white dark:bg-[#15171e] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-[#944555]" /> Shiprocket Logistics
                                </h3>
                                
                                {selectedOrder.shiprocket_order_id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="block text-[9px] uppercase font-black text-slate-400">Order ID</span>
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedOrder.shiprocket_order_id}</span>
                                            </div>
                                            <div>
                                                <span className="block text-[9px] uppercase font-black text-slate-400">Shipment ID</span>
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedOrder.shiprocket_shipment_id || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] uppercase font-black text-slate-400">Shipping Status</span>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 mt-1">
                                                {selectedOrder.shipping_status || 'Ready to Ship'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-xs text-slate-500 font-medium">This order has not been synced to Shiprocket yet.</p>
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    setIsUpdatingTracking(true);
                                                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                                                    const storefrontUrl = isLocal ? 'http://localhost:3000' : 'https://www.bloomina.in';
                                                    const res = await fetch(`${storefrontUrl}/api/shiprocket/create-order`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ orderId: selectedOrder.id })
                                                    });
                                                    const data = await res.json();
                                                    if (!res.ok) throw new Error(data.error || 'Sync failed');
                                                    
                                                    setSelectedOrder(prev => ({
                                                        ...prev,
                                                        shiprocket_order_id: data.shiprocket_order_id,
                                                        shiprocket_shipment_id: data.shiprocket_shipment_id,
                                                        shipping_status: 'Ready to Ship'
                                                    }));
                                                    
                                                    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? {
                                                        ...o,
                                                        shiprocket_order_id: data.shiprocket_order_id,
                                                        shiprocket_shipment_id: data.shipment_id,
                                                        shipping_status: 'Ready to Ship'
                                                    } : o));
                                                    
                                                    showAlert({ title: 'Success', message: 'Order successfully synced to Shiprocket!', type: 'success' });
                                                } catch (err) {
                                                    showAlert({ title: 'Sync Failed', message: err.message, type: 'danger' });
                                                } finally {
                                                    setIsUpdatingTracking(false);
                                                }
                                            }}
                                            className="w-full py-4 bg-[#944555] hover:bg-[#7d3a47] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#944555]/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Push to Shiprocket
                                        </button>
                                    </div>
                                )}
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
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" 
                        onClick={() => {
                            if (!createLoading) setIsCreateModalOpen(false);
                        }}
                    ></div>
                    <div data-tour="order-modal" className="relative bg-white dark:bg-[#1a1c23] rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 dark:border-slate-800/80 animate-scale-in flex flex-col my-8 max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 sticky top-0 z-10 backdrop-blur-md rounded-t-3xl">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Create Manual Order</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-0.5">Input order details and configure customer cart</p>
                            </div>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                disabled={createLoading}
                                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-350">
                            <form onSubmit={handleCreateManualOrder} className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column: Customer & Shipping Details */}
                                    <div className="space-y-6">
                                        {/* Customer Form */}
                                        <div data-tour="order-customer-card" className="bg-slate-50/50 dark:bg-[#15171e]/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <Phone className="w-3.5 h-3.5 text-[#944555]" /> Customer Information
                                            </h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Customer Name *</label>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        value={newOrderCustomer.name} 
                                                        onChange={(e) => setNewOrderCustomer({ ...newOrderCustomer, name: e.target.value })} 
                                                        placeholder="Full Name" 
                                                        className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                                        <input 
                                                            type="email" 
                                                            value={newOrderCustomer.email} 
                                                            onChange={(e) => setNewOrderCustomer({ ...newOrderCustomer, email: e.target.value })} 
                                                            placeholder="customer@email.com" 
                                                            className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                                                        <input 
                                                            type="tel" 
                                                            value={newOrderCustomer.phone} 
                                                            onChange={(e) => setNewOrderCustomer({ ...newOrderCustomer, phone: e.target.value })} 
                                                            placeholder="e.g. +919876543210" 
                                                            className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shipping Address Form */}
                                        <div data-tour="order-shipping-card" className="bg-slate-50/50 dark:bg-[#15171e]/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <MapPin className="w-3.5 h-3.5 text-[#944555]" /> Shipping Address
                                            </h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Street Address</label>
                                                    <input 
                                                        type="text" 
                                                        value={newOrderShipping.street} 
                                                        onChange={(e) => setNewOrderShipping({ ...newOrderShipping, street: e.target.value })} 
                                                        placeholder="Flat/House no., Apartment, Street name" 
                                                        className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">City</label>
                                                        <input 
                                                            type="text" 
                                                            value={newOrderShipping.city} 
                                                            onChange={(e) => setNewOrderShipping({ ...newOrderShipping, city: e.target.value })} 
                                                            placeholder="City" 
                                                            className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">State</label>
                                                        <input 
                                                            type="text" 
                                                            value={newOrderShipping.state} 
                                                            onChange={(e) => setNewOrderShipping({ ...newOrderShipping, state: e.target.value })} 
                                                            placeholder="State" 
                                                            className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">ZIP / Postal Code</label>
                                                        <input 
                                                            type="text" 
                                                            value={newOrderShipping.zip} 
                                                            onChange={(e) => setNewOrderShipping({ ...newOrderShipping, zip: e.target.value })} 
                                                            placeholder="ZIP Code" 
                                                            className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Country</label>
                                                        <input 
                                                            type="text" 
                                                            value={newOrderShipping.country} 
                                                            onChange={(e) => setNewOrderShipping({ ...newOrderShipping, country: e.target.value })} 
                                                            placeholder="India" 
                                                            className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-805 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment and Status Options */}
                                        <div data-tour="order-logistics-card" className="bg-slate-50/50 dark:bg-[#15171e]/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <Wallet className="w-3.5 h-3.5 text-[#944555]" /> Logistics & Status
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Payment Method</label>
                                                    <select 
                                                        value={newOrderPayment.method} 
                                                        onChange={(e) => setNewOrderPayment({ ...newOrderPayment, method: e.target.value })} 
                                                        className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                    >
                                                        <option value="COD">Cash on Delivery (COD)</option>
                                                        <option value="UPI">UPI / GPay / PhonePe</option>
                                                        <option value="Razorpay">Razorpay Online</option>
                                                        <option value="WhatsApp">WhatsApp Purchase</option>
                                                        <option value="Bank Transfer">Bank Transfer</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Initial Order Status</label>
                                                    <select 
                                                        value={newOrderPayment.status} 
                                                        onChange={(e) => setNewOrderPayment({ ...newOrderPayment, status: e.target.value })} 
                                                        className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                    >
                                                        <option value="Processing">Processing</option>
                                                        <option value="Payment Pending">Payment Pending</option>
                                                        <option value="Payment Done">Payment Done</option>
                                                        <option value="Shipped">Shipped</option>
                                                        <option value="Delivered">Delivered</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Products Selection & Pricing */}
                                    <div className="space-y-6">
                                        {/* Products Add Section */}
                                        <div data-tour="order-add-items-card" className="bg-slate-50/50 dark:bg-[#15171e]/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <ShoppingBag className="w-3.5 h-3.5 text-[#944555]" /> Add Items to Order
                                            </h4>

                                            {/* Product Search */}
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input 
                                                    type="text"
                                                    value={prodSearchQuery}
                                                    onChange={(e) => {
                                                        setProdSearchQuery(e.target.value);
                                                    }}
                                                    placeholder="Search product by name..."
                                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                />
                                                {isSearchingProducts && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#944555] animate-spin" />
                                                )}
                                            </div>

                                            {/* Found Products List */}
                                            {foundProducts.length > 0 && (
                                                <div className="border border-slate-150 dark:border-slate-800/80 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#16171e]">
                                                    {foundProducts.map((prod) => (
                                                        <div 
                                                            key={prod.id} 
                                                            onClick={() => {
                                                                setSelectedProductForAdd(prod);
                                                                // Set default variant size & color if available
                                                                const sizeVar = prod.variants?.find(v => v.name === 'Size');
                                                                setSelectedVariantSize(sizeVar?.values?.[0] || '');
                                                                setSelectedVariantColor(prod.colorConfigs?.[0]?.name || '');
                                                                setSelectedItemQuantity(1);
                                                            }}
                                                            className={`p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all ${selectedProductForAdd?.id === prod.id ? 'bg-[#944555]/5 dark:bg-[#944555]/10' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-700/50 text-xs">
                                                                    {prod.images?.[0] ? <img src={prod.images[0]} alt="" className="w-full h-full object-cover" /> : '📦'}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-black text-slate-800 dark:text-white truncate">{prod.name}</p>
                                                                    <p className="text-[10px] font-bold text-[#944555]">₹{prod.price}</p>
                                                                </div>
                                                            </div>
                                                            <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Configurer for Selected Product */}
                                            {selectedProductForAdd && (
                                                <div className="bg-white dark:bg-[#1a1c23] p-4 rounded-xl border border-slate-150 dark:border-slate-800 space-y-4 animate-slide-down">
                                                    <div className="flex justify-between items-start">
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Item</p>
                                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{selectedProductForAdd.name}</p>
                                                            <p className="text-xs font-black text-[#944555] mt-0.5">₹{selectedProductForAdd.price}</p>
                                                        </div>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setSelectedProductForAdd(null)}
                                                            className="text-xs font-bold text-slate-405 hover:text-red-500 uppercase tracking-wider"
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        {/* Color Configurations */}
                                                        {selectedProductForAdd.colorConfigs?.length > 0 && (
                                                            <div>
                                                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Color</label>
                                                                <select 
                                                                    value={selectedVariantColor}
                                                                    onChange={(e) => setSelectedVariantColor(e.target.value)}
                                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555]"
                                                                >
                                                                    <option value="">Select Color</option>
                                                                    {selectedProductForAdd.colorConfigs.map((col, idx) => (
                                                                        <option key={idx} value={col.name}>{col.name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}

                                                        {/* Size Configuration */}
                                                        {selectedProductForAdd.variants?.find(v => v.name === 'Size')?.values?.length > 0 && (
                                                            <div>
                                                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Size</label>
                                                                <select 
                                                                    value={selectedVariantSize}
                                                                    onChange={(e) => setSelectedVariantSize(e.target.value)}
                                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555]"
                                                                >
                                                                    <option value="">Select Size</option>
                                                                    {selectedProductForAdd.variants.find(v => v.name === 'Size').values.map((sz, idx) => (
                                                                        <option key={idx} value={sz}>{sz}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 pt-1">
                                                        <div className="w-1/3">
                                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Quantity</label>
                                                            <input 
                                                                type="number"
                                                                min="1"
                                                                value={selectedItemQuantity}
                                                                onChange={(e) => setSelectedItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555]"
                                                            />
                                                        </div>
                                                        <button 
                                                            type="button"
                                                            onClick={handleAddProductToOrder}
                                                            className="flex-1 mt-4 py-2 bg-[#944555] hover:bg-[#7d3a47] text-white rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 h-[34px] self-end"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" /> Add to List
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Added Items Cart */}
                                        <div data-tour="order-cart-card" className="bg-slate-50/50 dark:bg-[#15171e]/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <span>Items Selected ({newOrderItems.reduce((acc, it) => acc + it.quantity, 0)})</span>
                                                <span className="text-[10px] font-black text-[#944555] uppercase">Subtotal: ₹{newOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                                            </h4>

                                            {newOrderItems.length === 0 ? (
                                                <div className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                                                    No products added to order yet.
                                                </div>
                                            ) : (
                                                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                                    {newOrderItems.map((item, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 bg-white dark:bg-[#16171e] p-3 rounded-xl border border-slate-150 dark:border-slate-800/80 group/cart-item relative">
                                                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-700/50 text-lg">
                                                                {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : '👗'}
                                                            </div>
                                                            <div className="flex-1 min-w-0 pr-6">
                                                                <p className="text-xs font-black text-slate-800 dark:text-white truncate">{item.title}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                                                    {item.color && `Color: ${item.color}`} {item.size && ` • Size: ${item.size}`}
                                                                </p>
                                                                <p className="text-[10px] text-[#944555] font-black mt-0.5">
                                                                    {item.quantity} × ₹{item.price}
                                                                </p>
                                                            </div>
                                                            <div className="text-right flex items-center gap-2">
                                                                <span className="text-xs font-black text-slate-800 dark:text-white">₹{item.price * item.quantity}</span>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setNewOrderItems(newOrderItems.filter((_, i) => i !== idx))}
                                                                    className="p-1 text-slate-405 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ml-1"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Pricing Breakdown Calculations */}
                                        <div data-tour="order-pricing-card" className="bg-slate-50/50 dark:bg-[#15171e]/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <RefreshCw className="w-3.5 h-3.5 text-[#944555]" /> Pricing & Calculations
                                            </h4>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Discount Amount (₹)</label>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={newOrderDiscount} 
                                                        onChange={(e) => setNewOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))} 
                                                        placeholder="0" 
                                                        className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Shipping Fee (₹)</label>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={newOrderShippingCost} 
                                                        onChange={(e) => setNewOrderShippingCost(Math.max(0, parseFloat(e.target.value) || 0))} 
                                                        placeholder="0" 
                                                        className="w-full bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:border-[#944555] transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-bold">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-405">Cart Subtotal</span>
                                                    <span className="text-slate-700 dark:text-slate-300">₹{newOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                                                </div>
                                                {newOrderDiscount > 0 && (
                                                    <div className="flex justify-between text-red-500">
                                                        <span>Discount Applied</span>
                                                        <span>- ₹{newOrderDiscount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {newOrderShippingCost > 0 && (
                                                    <div className="flex justify-between text-slate-700 dark:text-slate-300">
                                                        <span>Shipping Cost</span>
                                                        <span>+ ₹{newOrderShippingCost.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 text-sm">
                                                    <span className="text-slate-900 dark:text-white font-black uppercase tracking-tight">Computed Total</span>
                                                    <span className="text-xl font-black text-[#944555]">
                                                        ₹{Math.max(0, newOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + Number(newOrderShippingCost) - Number(newOrderDiscount)).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Actions */}
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#1a1c23] z-10 py-4">
                                    <button 
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        disabled={createLoading}
                                        className="px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        data-tour="order-submit-btn"
                                        type="submit"
                                        disabled={createLoading}
                                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-75 flex items-center gap-2"
                                    >
                                        {createLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Creating...</span>
                                            </>
                                        ) : (
                                            <span>Create Order</span>
                                        )}
                                    </button>
                                </div>
                            </form>
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

