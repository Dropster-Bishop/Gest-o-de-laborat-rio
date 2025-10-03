import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- Dependências ---
import { initializeApp } from 'firebase/app';
import jsPDF from 'jspdf'; // Importação corrigida
import html2canvas from 'html2canvas'; // Importação corrigida
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    onSnapshot,
    updateDoc,
    deleteDoc,
    query,
    serverTimestamp,
    setDoc,
    getDoc,
    writeBatch,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import {
    LucideClipboardEdit, LucideUsers, LucideHammer, LucideListOrdered,
    LucideBarChart3, LucidePlusCircle, LucideTrash2, LucideEdit, LucideSearch,
    LucidePrinter, LucideFileDown, LucideX, LucideCheckCircle, LucideClock,
    LucideDollarSign, LucideLogOut, LucideUserCheck, LucideBoxes, LucideAlertTriangle,
    LucideChevronDown, LucideSettings, LucideFileText, LucideTruck
} from 'lucide-react';

// --- Configuração do Firebase ---
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = firebaseConfig.appId || 'default-app-id';

// --- Componentes Auxiliares (Helpers) ---

const Modal = ({ children, onClose, title, size = '2xl' }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className={`bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-${size} max-h-[90vh] flex flex-col`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <header className="flex items-center justify-between p-4 border-b border-neutral-700">
                <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
                <button onClick={onClose} className="p-2 rounded-full text-neutral-400 hover:bg-neutral-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200">
                    <LucideX size={24} />
                </button>
            </header>
            <main className="p-6 overflow-y-auto">
                {children}
            </main>
        </div>
    </div>
);

const Input = React.forwardRef(({ label, id, className = '', ...props }, ref) => (
    <div className={className}>
        {label && <label htmlFor={id} className="block text-sm font-medium text-neutral-300 mb-1">{label}</label>}
        <input id={id} ref={ref} {...props} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors duration-200" />
    </div>
));

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
    const baseClasses = "px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    const variants = {
        primary: 'bg-yellow-500 text-black hover:bg-yellow-400 focus:ring-yellow-500 disabled:bg-yellow-600',
        secondary: 'bg-neutral-700 text-white hover:bg-neutral-600 focus:ring-neutral-500 disabled:bg-neutral-800',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400',
    };
    return <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</button>;
};


const Spinner = () => (
    <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-yellow-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-neutral-400">A carregar...</p>
        </div>
    </div>
);

const StatCard = ({ icon, label, value, color }) => (
    <div className={`bg-neutral-900 p-6 rounded-2xl shadow-md flex items-center gap-4 border-l-4 ${color}`}>
        {icon}
        <div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-neutral-400">{label}</p>
        </div>
    </div>
);

// --- Componentes das Páginas ---

const Dashboard = ({ setActivePage, serviceOrders, inventory }) => {
    const upcomingOrders = serviceOrders
        .filter(o => o.status !== 'Concluído' && o.deliveryDate)
        .sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate))
        .slice(0, 5);

    const pendingOrders = serviceOrders.filter(o => o.status === 'Pendente');
    const inProgressOrders = serviceOrders.filter(o => o.status === 'Em Andamento');
    const lowStockItems = inventory.filter(item => item.quantity <= item.lowStockThreshold);

    return (
        <div className="animate-fade-in space-y-8">
            <h1 className="text-3xl font-bold text-white">Painel de Controle</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<LucideClock size={40} className="text-yellow-500" />} label="Ordens Pendentes" value={pendingOrders.length} color="border-yellow-500" />
                <StatCard icon={<LucideHammer size={40} className="text-blue-500" />} label="Em Andamento" value={inProgressOrders.length} color="border-blue-500" />
                <StatCard icon={<LucideCheckCircle size={40} className="text-green-500" />} label="Ordens Concluídas" value={serviceOrders.filter(o => o.status === 'Concluído').length} color="border-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-neutral-900 p-6 rounded-2xl shadow-md">
                    <h2 className="text-xl font-bold text-neutral-200 mb-4">Próximas Entregas</h2>
                    {upcomingOrders.length > 0 ? (
                        <ul className="space-y-3">
                            {upcomingOrders.map(order => (
                                <li key={order.id} className="flex justify-between items-center p-3 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors">
                                    <div>
                                        <p className="font-semibold text-white">OS #{order.number} - {order.clientName}</p>
                                        <p className="text-sm text-neutral-400">Entrega em: {new Date(order.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                        }`}>{order.status}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-neutral-500 py-4">Nenhuma entrega próxima.</p>
                    )}
                </div>

                <div className="bg-neutral-900 p-6 rounded-2xl shadow-md">
                    <h2 className="text-xl font-bold text-neutral-200 mb-4 flex items-center gap-2">
                        <LucideAlertTriangle className="text-red-500" /> Alertas de Estoque Baixo
                    </h2>
                    {lowStockItems.length > 0 ? (
                        <ul className="space-y-3">
                            {lowStockItems.map(item => (
                                <li key={item.id} className="flex justify-between items-center p-3 bg-red-900 bg-opacity-30 rounded-lg">
                                    <p className="font-semibold text-red-300">{item.itemName}</p>
                                    <p className="text-sm text-red-400">Restam: {item.quantity} {item.unit}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-neutral-500 py-4">Nenhum item com estoque baixo.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ManageGeneric = ({ collectionName, title, fields, renderItem, customProps = {} }) => {
    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const formRef = useRef({});
    const userId = auth.currentUser?.uid;

    useEffect(() => {
        if (!userId) return;
        const q = query(collection(db, `artifacts/${appId}/users/${userId}/${collectionName}`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItems(data);
        });
        return () => unsubscribe();
    }, [userId, collectionName]);

    const handleOpenModal = (item = null) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) return;

        const formData = {};
        fields.forEach(field => {
            const inputElement = formRef.current[field.name];
            if (inputElement) {
                if (inputElement.type === 'textarea') {
                    formData[field.name] = inputElement.value;
                } else {
                    formData[field.name] = inputElement.value;
                    if (field.type === 'number') {
                        formData[field.name] = parseFloat(formData[field.name]) || 0;
                    }
                }
            }
        });

        try {
            const collectionRef = collection(db, `artifacts/${appId}/users/${userId}/${collectionName}`);
            if (currentItem) {
                const docRef = doc(db, collectionRef.path, currentItem.id);
                await updateDoc(docRef, formData);
            } else {
                await addDoc(collectionRef, formData);
            }
            handleCloseModal();
        } catch (error) {
            console.error(`Error saving ${collectionName}:`, error);
        }
    };

    const handleDelete = async (id) => {
        if (!userId) return;
        if (window.confirm('Tem certeza que deseja excluir este item?')) {
            try {
                const docRef = doc(db, `artifacts/${appId}/users/${userId}/${collectionName}`, id);
                await deleteDoc(docRef);
            } catch (error) {
                console.error(`Error deleting ${collectionName}:`, error);
            }
        }
    };

    const filteredItems = items.filter(item =>
        Object.values(item).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-white">{title}</h1>
                <div className="w-full md:w-auto flex gap-2">
                    <div className="relative w-full md:w-64">
                        <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                        <Input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <LucidePlusCircle size={20} />
                        Adicionar
                    </Button>
                </div>
            </header>

            <div className="bg-neutral-900 rounded-2xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    {filteredItems.length > 0 ? renderItem(filteredItems, handleOpenModal, handleDelete) : <p className="text-center p-8 text-neutral-500">Nenhum item encontrado.</p>}
                </div>
            </div>

            {isModalOpen && (
                <Modal onClose={handleCloseModal} title={currentItem ? `Editar ${title.slice(0, -1)}` : `Adicionar ${title.slice(0, -1)}`}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map(field => {
                            if (field.type === 'textarea') {
                                return (
                                    <div key={field.name}>
                                        <label htmlFor={field.name} className="block text-sm font-medium text-neutral-300 mb-1">{field.label}</label>
                                        <textarea
                                            id={field.name}
                                            name={field.name}
                                            defaultValue={currentItem ? currentItem[field.name] : ''}
                                            ref={el => formRef.current[field.name] = el}
                                            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white"
                                            rows="3"
                                        />
                                    </div>
                                )
                            }
                            if (field.type === 'select') {
                                return (
                                    <div key={field.name}>
                                        <label htmlFor={field.name} className="block text-sm font-medium text-neutral-300 mb-1">{field.label}</label>
                                        <select
                                            id={field.name}
                                            ref={el => formRef.current[field.name] = el}
                                            defaultValue={currentItem ? currentItem[field.name] : ''}
                                            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500 text-white"
                                        >
                                            <option value="">{field.placeholder}</option>
                                            {customProps[field.optionsKey]?.map(option => (
                                                <option key={option.id} value={option.id}>{option.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            }
                            return (
                                <Input
                                    key={field.name}
                                    id={field.name}
                                    label={field.label}
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    defaultValue={currentItem ? currentItem[field.name] : ''}
                                    ref={el => formRef.current[field.name] = el}
                                    required={field.required}
                                    step={field.type === 'number' ? '0.01' : undefined}
                                />
                            );
                        })}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" onClick={handleCloseModal} variant="secondary">Cancelar</Button>
                            <Button type="submit" variant="primary">Salvar</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

const OrderFormModal = ({ onClose, order, userId, services, clients, employees, orders, priceTables }) => {
    const [selectedClientId, setSelectedClientId] = useState(order?.clientId || '');
    const [availableServices, setAvailableServices] = useState({});

    const getInitialServices = () => {
        if (!order || !order.services) return [];
        return order.services.map(s => ({
            ...s,
            toothNumber: s.toothNumber || '',
            color: s.color || '',
            quantity: s.quantity || 1,
        }));
    };

    const [selectedServices, setSelectedServices] = useState(getInitialServices);
    const [editingService, setEditingService] = useState(null);
    const [totalValue, setTotalValue] = useState(0);
    const [commissionValue, setCommissionValue] = useState(0);
    const [assignedEmployees, setAssignedEmployees] = useState(order?.assignedEmployees || []);
    const [employeeToAdd, setEmployeeToAdd] = useState('');
    const [commissionPercentageToAdd, setCommissionPercentageToAdd] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const formRef = useRef({});

    useEffect(() => {
        const client = clients.find(c => c.id === selectedClientId);
        const priceTableId = client?.priceTableId;
        setSelectedMaterial('');

        let servicesForClient;
        if (priceTableId) {
            const table = priceTables.find(pt => pt.id === priceTableId);
            if (table && table.services) {
                servicesForClient = table.services.map(tableService => {
                    const globalService = services.find(s => s.id === tableService.serviceId);
                    return { ...globalService, id: tableService.serviceId, name: tableService.serviceName, displayPrice: tableService.customPrice, };
                }).filter(s => s.id);
            } else { servicesForClient = services.map(s => ({ ...s, displayPrice: s.price })); }
        } else { servicesForClient = services.map(s => ({ ...s, displayPrice: s.price })); }

        const grouped = servicesForClient.reduce((acc, service) => {
            const material = service.material || 'Outros';
            if (!acc[material]) acc[material] = [];
            acc[material].push(service);
            return acc;
        }, {});

        setAvailableServices(grouped);

        if (!order) { setSelectedServices([]); }
    }, [selectedClientId, clients, priceTables, services, order]);

    useEffect(() => {
        const newTotal = selectedServices.reduce((sum, s) => sum + ((s.price || 0) * (Number(s.quantity) || 1)), 0);
        setTotalValue(newTotal);

        const totalCommission = assignedEmployees.reduce((sum, emp) => {
            const commission = newTotal * ((emp.commissionPercentage || 0) / 100);
            return sum + commission;
        }, 0);
        setCommissionValue(totalCommission);

    }, [selectedServices, assignedEmployees]);

    const handleAddEmployee = () => {
        if (!employeeToAdd || !commissionPercentageToAdd) {
            alert("Selecione um funcionário e defina a comissão.");
            return;
        }

        const employee = employees.find(e => e.id === employeeToAdd);
        if (!employee) return;

        if (assignedEmployees.some(e => e.id === employee.id)) {
            alert("Este funcionário já foi adicionado.");
            return;
        }

        setAssignedEmployees(prev => [
            ...prev,
            {
                id: employee.id,
                name: employee.name,
                commissionPercentage: parseFloat(commissionPercentageToAdd)
            }
        ]);

        setEmployeeToAdd('');
        setCommissionPercentageToAdd('');
    };

    const handleRemoveEmployee = (employeeId) => {
        setAssignedEmployees(prev => prev.filter(e => e.id !== employeeId));
    };

    const handleServiceToggle = (service) => {
        const serviceWithDetails = {
            id: service.id, name: service.name, price: service.displayPrice,
            toothNumber: '', color: '', quantity: 1
        };

        setSelectedServices(prev =>
            prev.some(s => s.id === service.id)
                ? prev.filter(s => s.id !== service.id)
                : [...prev, serviceWithDetails]
        );
    };

    const handleEditChange = (field, value) => {
        setEditingService(current => ({ ...current, data: { ...current.data, [field]: value } }));
    };

    const handleUpdateService = () => {
        if (!editingService) return;
        setSelectedServices(currentServices =>
            currentServices.map((item, idx) =>
                idx === editingService.index ? editingService.data : item
            )
        );
        setEditingService(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) return;

        const client = clients.find(c => c.id === selectedClientId);

        if (!client || assignedEmployees.length === 0) {
            alert('Cliente e ao menos um Funcionário são obrigatórios.');
            return;
        }

        const lastOrderNumber = orders.reduce((max, o) => Math.max(max, o.number || 0), 0);

        const finalServices = selectedServices.map(s => ({ ...s, quantity: Number(s.quantity) || 1, }));
        const finalTotalValue = finalServices.reduce((sum, s) => sum + ((s.price || 0) * (s.quantity || 1)), 0);

        const finalAssignedEmployees = assignedEmployees.map(emp => {
            const commission = finalTotalValue * (emp.commissionPercentage / 100);
            return { ...emp, commissionValue: commission };
        });

        const totalCommissionValue = finalAssignedEmployees.reduce((sum, emp) => sum + emp.commissionValue, 0);
        
        const status = formRef.current.status.value;
        let completionDateValue = formRef.current.completionDate.value || null;

        if (status === 'Concluído' && !completionDateValue) {
            completionDateValue = new Date().toISOString().split('T')[0];
        }

        const orderData = {
            clientId: client.id, clientName: client.name, client: client,
            patientName: formRef.current.patientName.value,
            employeeName: finalAssignedEmployees.map(e => e.name).join(', '),
            assignedEmployees: finalAssignedEmployees,
            openDate: formRef.current.openDate.value, deliveryDate: formRef.current.deliveryDate.value,
            completionDate: completionDateValue,
            status: status,
            services: finalServices,
            totalValue: finalTotalValue,
            commissionValue: totalCommissionValue,
            observations: formRef.current.observations.value,
            isPaid: order ? order.isPaid : false,
            updatedAt: serverTimestamp()
        };

        try {
            const collectionRef = collection(db, `artifacts/${appId}/users/${userId}/serviceOrders`);
            if (order) {
                const docRef = doc(db, collectionRef.path, order.id);
                await updateDoc(docRef, orderData);
            } else {
                orderData.number = lastOrderNumber + 1;
                orderData.createdAt = serverTimestamp();
                await addDoc(collectionRef, orderData);
            }
            onClose();
        } catch (error) { console.error("Error saving service order: ", error); }
    };

    return (
        <Modal onClose={onClose} title={order ? `Editar O.S. #${order.number}` : 'Nova Ordem de Serviço'} size="5xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* --- DADOS GERAIS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label htmlFor="clientId" className="block text-sm font-medium text-neutral-300 mb-1">Cliente (Dentista/Clínica)</label>
                        <select id="clientId" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500" required>
                            <option value="">Selecione um cliente</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <Input label="Nome do Paciente" id="patientName" type="text" ref={el => formRef.current.patientName = el} defaultValue={order?.patientName} required />
                    <Input label="Data de Abertura" id="openDate" type="date" ref={el => formRef.current.openDate = el} defaultValue={order?.openDate} required />
                    <Input label="Data Prev. Entrega" id="deliveryDate" type="date" ref={el => formRef.current.deliveryDate = el} defaultValue={order?.deliveryDate} required />
                </div>
                {/* --- FUNCIONÁRIOS --- */}
                <div className="p-4 border border-neutral-700 rounded-lg bg-neutral-800">
                    <h3 className="text-lg font-medium text-white mb-3">Funcionários Responsáveis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end mb-3">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-neutral-300 mb-1">Funcionário</label>
                            <select value={employeeToAdd} onChange={e => setEmployeeToAdd(e.target.value)} className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500">
                                <option value="">Selecione...</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <Input label="Comissão (%)" type="number" value={commissionPercentageToAdd} onChange={e => setCommissionPercentageToAdd(e.target.value)} placeholder="Ex: 20" />
                        <Button onClick={handleAddEmployee} variant="secondary" className="h-11">Adicionar Funcionário</Button>
                    </div>

                    <div className="space-y-2">
                        {assignedEmployees.map(emp => (
                            <div key={emp.id} className="flex justify-between items-center bg-neutral-900 p-2 rounded-md border border-neutral-700">
                                <span>{emp.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-yellow-500">{emp.commissionPercentage}%</span>
                                    <button type="button" onClick={() => handleRemoveEmployee(emp.id)} className="p-1 text-red-500 hover:text-red-400" title="Remover funcionário">
                                        <LucideTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {assignedEmployees.length === 0 && <p className="text-xs text-center text-neutral-500 py-2">Nenhum funcionário adicionado.</p>}
                    </div>
                </div>


                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-medium text-white mb-2">Serviços Disponíveis</h3>
                        {clients.find(c => c.id === selectedClientId)?.priceTableId && <p className="text-sm text-yellow-500 mb-2">A aplicar preços da tabela: <strong>{priceTables.find(pt => pt.id === clients.find(c => c.id === selectedClientId)?.priceTableId)?.name}</strong></p>}

                        <div className="space-y-3">
                            <select value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500">
                                <option value="">Selecione um material...</option>
                                {Object.keys(availableServices).sort().map(material => (<option key={material} value={material}>{material}</option>))}
                            </select>

                            {selectedMaterial && (
                                <div className="max-h-48 overflow-y-auto p-2 bg-neutral-800 border border-neutral-700 rounded-lg space-y-1">
                                    {availableServices[selectedMaterial]?.map(service => (
                                        <label key={service.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-neutral-700 cursor-pointer transition-colors">
                                            <input type="checkbox" checked={selectedServices.some(s => s.id === service.id)} onChange={() => handleServiceToggle(service)} className="h-4 w-4 rounded border-neutral-500 bg-neutral-700 text-yellow-500 focus:ring-yellow-500" />
                                            <span className="flex-1 text-sm text-neutral-300">{service.name}</span>
                                            <span className={`text-sm font-semibold ${service.displayPrice !== service.price ? 'text-yellow-500' : 'text-neutral-400'}`}>R$ {service.displayPrice?.toFixed(2)}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-white mb-2">Serviços Selecionados</h3>
                        <div className="max-h-60 overflow-y-auto p-1 bg-neutral-900 border border-neutral-700 rounded-lg">
                            {selectedServices.length > 0 ? (
                                selectedServices.map((service, index) => (
                                    <div key={service.id} className="p-2 rounded-md hover:bg-neutral-800 border-b border-neutral-800 last:border-b-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-sm text-white truncate pr-2">{service.name}</span>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button type="button" onClick={() => setEditingService({ index, data: service })} className="p-1 text-blue-400 hover:text-blue-300" title="Editar serviço">
                                                    <LucideEdit size={16} />
                                                </button>
                                                <button type="button" onClick={() => handleServiceToggle(service)} className="p-1 text-red-500 hover:text-red-400" title="Remover serviço">
                                                    <LucideTrash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-neutral-400">
                                            <span className="flex items-center gap-1 min-w-0">
                                                <strong>D:</strong>
                                                <span className="truncate">{service.toothNumber || '-'}</span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <strong>C:</strong>
                                                <span>{service.color || '-'}</span>
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <strong>Q:</strong>
                                                <span>{service.quantity || '1'}</span>
                                            </span>
                                            <span className="font-semibold text-white ml-auto">
                                                R$ {((service.price || 0) * (Number(service.quantity) || 1)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-center text-neutral-500 py-4">Nenhum serviço selecionado.</p>
                            )}
                        </div>

                        {editingService && (
                            <div className="mt-2 p-4 bg-neutral-800 border-t-2 border-yellow-500 rounded-lg">
                                <h4 className="text-md font-bold text-yellow-500 mb-3">Editando: {editingService.data.name}</h4>
                                <div className="grid grid-cols-3 gap-3 items-end">
                                    <Input label="Nº Dente" value={editingService.data.toothNumber} onChange={e => handleEditChange('toothNumber', e.target.value)} />
                                    <Input label="Cor" value={editingService.data.color} onChange={e => handleEditChange('color', e.target.value)} />
                                    <Input label="Qtd" type="number" min="1" value={editingService.data.quantity} onChange={e => handleEditChange('quantity', e.target.value)} />
                                </div>
                                <div className="flex justify-end gap-2 mt-3">
                                    <Button onClick={() => setEditingService(null)} variant="secondary" className="py-1 px-2 text-xs">Cancelar</Button>
                                    <Button onClick={handleUpdateService} variant="primary" className="py-1 px-2 text-xs">Atualizar Serviço</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                        <select id="status" ref={el => formRef.current.status = el} defaultValue={order?.status || 'Pendente'} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500" required>
                            <option>Pendente</option>
                            <option>Em Andamento</option>
                            <option>Concluído</option>
                            <option>Cancelado</option>
                        </select>
                    </div>
                    <Input label="Data de Conclusão" id="completionDate" type="date" ref={el => formRef.current.completionDate = el} defaultValue={order?.completionDate} />
                </div>
                <div>
                    <label htmlFor="observations" className="block text-sm font-medium text-neutral-300 mb-1">Observações</label>
                    <textarea id="observations" ref={el => formRef.current.observations = el} defaultValue={order?.observations} rows="3" className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500"></textarea>
                </div>
                <div className="bg-neutral-800 p-4 rounded-lg text-right">
                    <p className="text-sm text-neutral-400">Comissão Total: <span className="font-semibold">R$ {commissionValue.toFixed(2)}</span></p>
                    <p className="text-xl font-bold text-yellow-500">Total O.S.: R$ {totalValue.toFixed(2)}</p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" onClick={onClose} variant="secondary">Cancelar</Button>
                    <Button type="submit" variant="primary">Salvar Ordem de Serviço</Button>
                </div>
            </form>
        </Modal>
    );
};

const ServiceOrders = ({ userId, services, clients, employees, orders, priceTables }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [filter, setFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const printRef = useRef();

    const handleOpenModal = (order = null) => {
        setCurrentOrder(order);
        setIsModalOpen(true);
    };

    const handleOpenViewModal = (order) => {
        setCurrentOrder(order);
        setIsViewModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsViewModalOpen(false);
        setCurrentOrder(null);
    };

    const handleDelete = async (id) => {
        if (!userId) return;
        if (window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
            try {
                const docRef = doc(db, `artifacts/${appId}/users/${userId}/serviceOrders`, id);
                await deleteDoc(docRef);
            } catch (error) {
                console.error("Error deleting service order: ", error);
            }
        }
    };

    const generatePdf = (action = 'print') => {
        const input = printRef.current;
        if (!input) {
            alert('Não foi possível encontrar o conteúdo para gerar o PDF.');
            return;
        }
        
        const elementsToHide = input.querySelectorAll('.hide-on-print');
        elementsToHide.forEach(el => el.style.visibility = 'hidden');

        html2canvas(input, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            elementsToHide.forEach(el => el.style.visibility = 'visible');

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const MARGIN = 15;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const usableWidth = pdfWidth - (MARGIN * 2);
            const usableHeight = pdfHeight - (MARGIN * 2);

            const aspectRatio = canvas.height / canvas.width;
            const scaledImgHeight = usableWidth * aspectRatio;

            let heightLeft = scaledImgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, usableWidth, scaledImgHeight);
            heightLeft -= usableHeight;

            while (heightLeft > 0) {
                position -= usableHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', MARGIN, position + MARGIN, usableWidth, scaledImgHeight);
                heightLeft -= usableHeight;
            }

            if (action === 'print') {
                pdf.autoPrint();
                window.open(pdf.output('bloburl'), '_blank');
            } else {
                pdf.save(`OS_${currentOrder.number}.pdf`);
            }
        }).catch(err => {
            elementsToHide.forEach(el => el.style.visibility = 'visible');
            console.error("Error generating PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF.");
        });
    };

    const handlePrint = () => generatePdf('print');
    const handleSaveAsPdf = () => generatePdf('save');

    const handleStatusChange = async (orderId, newStatus) => {
        if (!userId) return;
        const orderRef = doc(db, `artifacts/${appId}/users/${userId}/serviceOrders`, orderId);
        try {
            const updateData = { status: newStatus };
            const transactionRef = collection(db, `artifacts/${appId}/users/${userId}/clientTransactions`);
    
            if (newStatus === 'Concluído') {
                const completionDate = new Date().toISOString().split('T')[0];
                updateData.completionDate = completionDate;
                
                const order = orders.find(o => o.id === orderId);
                if (order && order.totalValue > 0) {
                    const q = query(transactionRef, where("orderId", "==", orderId), where("type", "==", "debit"));
                    const existingDebitSnapshot = await getDocs(q);
    
                    if (existingDebitSnapshot.empty) {
                        await addDoc(transactionRef, {
                            clientId: order.clientId,
                            clientName: order.clientName,
                            type: 'debit',
                            amount: order.totalValue,
                            date: completionDate,
                            description: `Referente à O.S. #${order.number} - Paciente: ${order.patientName}`,
                            orderId: order.id,
                            createdAt: serverTimestamp()
                        });
                    }
                }
            } else {
                updateData.completionDate = null;
                const q = query(transactionRef, where("orderId", "==", orderId), where("type", "==", "debit"));
                const existingDebitSnapshot = await getDocs(q);

                if (!existingDebitSnapshot.empty) {
                    const debitDoc = existingDebitSnapshot.docs[0];
                    await deleteDoc(debitDoc.ref);
                }
            }
    
            await updateDoc(orderRef, updateData);
        } catch (error) {
            console.error("Error updating status: ", error);
            alert("Ocorreu um erro ao atualizar o status da O.S.");
        }
    };

    const getStatusClasses = (status) => {
        switch (status) {
            case 'Concluído': return 'bg-green-100 text-green-800';
            case 'Pendente': return 'bg-yellow-100 text-yellow-800';
            case 'Em Andamento': return 'bg-blue-100 text-blue-800';
            case 'Cancelado': return 'bg-red-100 text-red-800';
            default: return 'bg-neutral-100 text-neutral-800';
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'Todos' || order.status === filter;
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        
        const matchesSearch = searchTerm === '' ||
            String(order.number) === searchTerm.trim() ||
            order.clientName.toLowerCase().includes(lowerCaseSearchTerm) ||
            order.patientName.toLowerCase().includes(lowerCaseSearchTerm) ||
            (order.employeeName && order.employeeName.toLowerCase().includes(lowerCaseSearchTerm));
            
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-white">Ordens de Serviço</h1>
                <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                        <Input
                            type="text"
                            placeholder="Buscar por Nº O.S., Cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full md:w-auto bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500 text-white"
                    >
                        <option>Todos</option>
                        <option>Pendente</option>
                        <option>Em Andamento</option>
                        <option>Concluído</option>
                        <option>Cancelado</option>
                    </select>
                    <Button onClick={() => handleOpenModal()} className="w-full md:w-auto">
                        <LucidePlusCircle size={20} />
                        Nova O.S.
                    </Button>
                </div>
            </header>

            <div className="bg-neutral-900 rounded-2xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-neutral-400">
                        <thead className="text-xs text-neutral-300 uppercase bg-neutral-800">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nº O.S.</th>
                                <th scope="col" className="px-6 py-3">Cliente</th>
                                <th scope="col" className="px-6 py-3">Paciente</th>
                                <th scope="col" className="px-6 py-3">Responsável(eis)</th>
                                <th scope="col" className="px-6 py-3">Data Entrega</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="bg-neutral-900 border-b border-neutral-800 hover:bg-neutral-800">
                                    <td className="px-6 py-4 font-medium text-white">#{order.number}</td>
                                    <td className="px-6 py-4">{order.clientName}</td>
                                    <td className="px-6 py-4">{order.patientName}</td>
                                    <td className="px-6 py-4">{order.employeeName}</td>
                                    <td className="px-6 py-4">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs border-none appearance-none focus:ring-0 cursor-pointer ${getStatusClasses(order.status)}`}
                                            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                                        >
                                            <option value="Pendente">Pendente</option>
                                            <option value="Em Andamento">Em Andamento</option>
                                            <option value="Concluído">Concluído</option>
                                            <option value="Cancelado">Cancelado</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => handleOpenViewModal(order)} title="Visualizar" className="text-yellow-500 hover:text-yellow-400 p-1"><LucideSearch size={18} /></button>
                                            <button onClick={() => handleOpenModal(order)} title="Editar" className="text-blue-400 hover:text-blue-300 p-1"><LucideEdit size={18} /></button>
                                            <button onClick={() => handleDelete(order.id)} title="Excluir" className="text-red-500 hover:text-red-400 p-1"><LucideTrash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredOrders.length === 0 && <p className="text-center p-8 text-neutral-500">Nenhuma ordem de serviço encontrada para este filtro.</p>}
                </div>
            </div>

            {isModalOpen && <OrderFormModal onClose={handleCloseModal} order={currentOrder} userId={userId} services={services} clients={clients} employees={employees} orders={orders} priceTables={priceTables} />}
            {isViewModalOpen && (
                <Modal onClose={handleCloseModal} title={`Detalhes da O.S. #${currentOrder?.number}`}>
                    <div ref={printRef} className="p-4 bg-white text-neutral-800">
                        <div className="border-b-2 pb-4 mb-4 border-neutral-200">
                            <h2 className="text-2xl font-bold text-yellow-500">Ordem de Serviço #{currentOrder.number}</h2>
                            <p className="text-sm text-neutral-500">Data de Abertura: {new Date(currentOrder.openDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="font-bold mb-2 border-b">Cliente</h3>
                                <p><strong>Nome:</strong> {currentOrder.client.name}</p>
                                <p><strong>Paciente:</strong> {currentOrder.patientName}</p>
                                <p><strong>Telefone:</strong> {currentOrder.client.phone}</p>
                                <p><strong>Endereço:</strong> {currentOrder.client.address}</p>
                            </div>
                            <div>
                                <h3 className="font-bold mb-2 border-b">Datas</h3>
                                <p><strong>Prev. Entrega:</strong> {new Date(currentOrder.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                                <p><strong>Conclusão:</strong> {currentOrder.completionDate ? new Date(currentOrder.completionDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '---'}</p>
                            </div>
                        </div>
                        <div className="mb-6 hide-on-print">
                            <h3 className="font-bold mb-2 border-b">Responsáveis e Comissões</h3>
                            <div className="space-y-1 text-sm">
                                {currentOrder.assignedEmployees?.map(emp => (
                                    <div key={emp.id} className="flex justify-between items-center">
                                        <span>{emp.name}</span>
                                        <span>
                                            {emp.commissionPercentage}% - <strong>R$ {(emp.commissionValue || 0).toFixed(2)}</strong>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <h3 className="font-bold mb-2 border-b">Serviços Solicitados</h3>
                        <table className="w-full text-left mb-6">
                            <thead className="bg-neutral-100">
                                <tr>
                                    <th className="p-2">Serviço</th>
                                    <th className="p-2">Dente</th>
                                    <th className="p-2">Cor</th>
                                    <th className="p-2 text-center">Qtd</th>
                                    <th className="p-2 text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentOrder.services.map((service, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-2">{service.name}</td>
                                        <td className="p-2">{service.toothNumber || '-'}</td>
                                        <td className="p-2">{service.color || '-'}</td>
                                        <td className="p-2 text-center">{service.quantity || 1}</td>
                                        <td className="p-2 text-right">R$ {(service.price * (service.quantity || 1)).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="font-bold mb-2 border-b">Observações</h3>
                                <p className="text-sm italic">{currentOrder.observations || 'Nenhuma observação.'}</p>
                            </div>
                            <div className="text-right">
                                <p className="hide-on-print"><strong>Comissão Total:</strong> R$ {(currentOrder.commissionValue || 0).toFixed(2)}</p>
                                <p className="text-lg font-bold"><strong>Valor Total:</strong> R$ {currentOrder.totalValue.toFixed(2)}</p>
                                <p className="font-bold mt-2"><strong>Status:</strong> {currentOrder.status}</p>
                            </div>
                        </div>
                    </div>
                    <footer className="flex justify-end gap-3 pt-4 border-t border-neutral-700 mt-4 p-4">
                        <Button onClick={handleSaveAsPdf} variant="secondary"><LucideFileDown size={18} /> Salvar PDF</Button>
                        <Button onClick={handlePrint} variant="primary"><LucidePrinter size={18} /> Imprimir</Button>
                    </footer>
                </Modal>
            )}
        </div>
    );
};

const Reports = ({ orders, employees, clients }) => {
    const [reportType, setReportType] = useState('completedByPeriod');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedClient, setSelectedClient] = useState('');
    const [results, setResults] = useState([]);
    const reportPrintRef = useRef();

    const reportTitles = {
        completedByPeriod: 'Relatório de Serviços Concluídos',
        commissionsByEmployee: 'Relatório de Comissões por Funcionário',
        ordersByClient: 'Relatório de Ordens por Cliente'
    };
    
    const handleGenerateReport = () => {
        const parseLocalDate = (dateString) => {
            if (!dateString) return null;
            const parts = dateString.split('-');
            return new Date(parts[0], parts[1] - 1, parts[2]);
        };

        const start = parseLocalDate(startDate);
        const end = parseLocalDate(endDate);
        
        if (end) {
            end.setHours(23, 59, 59, 999);
        }

        let data = [];
        if (reportType === 'completedByPeriod') {
            data = orders.filter(o => {
                const completed = o.status === 'Concluído' && o.completionDate;
                if (!completed) return false;
                
                const completionDate = parseLocalDate(o.completionDate);
                if (!completionDate) return false;

                if (start && completionDate < start) return false;
                if (end && completionDate > end) return false;
                return true;
            });
        } else if (reportType === 'commissionsByEmployee') {
            if (!selectedEmployee) {
                setResults([]);
                return;
            }
            data = orders.filter(o => {
                const completed = o.status === 'Concluído' && o.completionDate;
                if (!completed) return false;

                if (!o.assignedEmployees?.some(emp => emp.id === selectedEmployee)) return false;

                const completionDate = parseLocalDate(o.completionDate);
                if (!completionDate) return false;
                
                if (start && completionDate < start) return false;
                if (end && completionDate > end) return false;
                return true;
            });
        } else if (reportType === 'ordersByClient') {
            const filteredOrders = orders.filter(o => {
                if (selectedClient === '' || o.clientId !== selectedClient) return false;
                if (o.status !== 'Concluído' || !o.completionDate) return false;

                const completionDate = parseLocalDate(o.completionDate);
                if (!completionDate) return false;

                if (start && completionDate < start) return false;
                if (end && completionDate > end) return false;
                return true;
            });
            
            data = filteredOrders.flatMap(order => 
                order.services.map(service => ({
                    ...service,
                    orderId: order.id,
                    orderNumber: order.number,
                    patientName: order.patientName,
                    completionDate: order.completionDate,
                    subtotal: (service.price || 0) * (service.quantity || 1)
                }))
            );
        }
        setResults(data);
    };

    const generateReportPdf = (action = 'print') => {
        const input = reportPrintRef.current;
        if (!input) {
            alert('Não foi possível encontrar o conteúdo para gerar o PDF.');
            return;
        }

        html2canvas(input, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const MARGIN = 15;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const usableWidth = pdfWidth - (MARGIN * 2);
            const usableHeight = pdfHeight - (MARGIN * 2);

            const aspectRatio = canvas.height / canvas.width;
            const scaledImgHeight = usableWidth * aspectRatio;

            let heightLeft = scaledImgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, usableWidth, scaledImgHeight);
            heightLeft -= usableHeight;

            while (heightLeft > 0) {
                position -= usableHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', MARGIN, position + MARGIN, usableWidth, scaledImgHeight);
                heightLeft -= usableHeight;
            }
            if (action === 'print') {
                pdf.autoPrint();
                window.open(pdf.output('bloburl'), '_blank');
            } else {
                pdf.save(`relatorio_${reportType}.pdf`);
            }
        }).catch(err => {
            console.error("Erro ao gerar PDF do relatório:", err);
            alert("Ocorreu um erro ao gerar o PDF.");
        });
    };

    const handlePrintReport = () => generateReportPdf('print');
    const handleSaveReportAsPdf = () => generateReportPdf('save');
    
    const totalCommission = reportType === 'commissionsByEmployee'
        ? results.reduce((sum, order) => {
            const employeeCommission = order.assignedEmployees?.find(emp => emp.id === selectedEmployee)?.commissionValue || 0;
            return sum + employeeCommission;
        }, 0)
        : 0;

    const totalValue = reportType === 'ordersByClient'
        ? results.reduce((sum, service) => sum + (service.subtotal || 0), 0)
        : results.reduce((sum, order) => sum + (order.totalValue || 0), 0);
    
    const getReportSubTitle = () => {
        let period = '';
        if (startDate && endDate) {
            period = `Período de Conclusão: ${new Date(startDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} a ${new Date(endDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
        }
        if (reportType === 'commissionsByEmployee' && selectedEmployee) {
            const employeeName = employees.find(e => e.id === selectedEmployee)?.name || '';
            return `Funcionário: ${employeeName} | ${period}`;
        }
        if (reportType === 'ordersByClient' && selectedClient) {
            const clientName = clients.find(c => c.id === selectedClient)?.name || '';
            return `Cliente: ${clientName} | ${period}`;
        }
        return period;
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-6">Relatórios</h1>
            <div className="bg-neutral-900 p-6 rounded-2xl shadow-md mb-6">
                <h2 className="text-xl font-bold text-neutral-200 mb-4">Gerar Relatório</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="reportType" className="block text-sm font-medium text-neutral-300 mb-1">Tipo de Relatório</label>
                        <select id="reportType" value={reportType} onChange={e => { setReportType(e.target.value); setResults([]); }} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500">
                            <option value="completedByPeriod">Serviços Concluídos (Geral)</option>
                            <option value="commissionsByEmployee">Comissões por Funcionário</option>
                            <option value="ordersByClient">Ordens por Cliente</option>
                        </select>
                    </div>
                    {reportType === 'commissionsByEmployee' && (
                        <div>
                            <label htmlFor="employee" className="block text-sm font-medium text-neutral-300 mb-1">Funcionário</label>
                            <select id="employee" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500">
                                <option value="">Selecione...</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                    )}
                    {reportType === 'ordersByClient' && (
                        <div>
                            <label htmlFor="client" className="block text-sm font-medium text-neutral-300 mb-1">Cliente</label>
                            <select id="client" value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-yellow-500">
                                <option value="">Selecione...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <Input label="Data Inicial" id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <Input label="Data Final" id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    <Button onClick={handleGenerateReport} variant="primary" className="h-11">Gerar</Button>
                </div>
            </div>

            <div className="bg-neutral-900 p-6 rounded-2xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-neutral-200">Resultados</h2>
                    {results.length > 0 && (
                        <div className="flex gap-2">
                            <Button onClick={handleSaveReportAsPdf} variant="secondary">
                                <LucideFileDown size={18} /> PDF
                            </Button>
                            <Button onClick={handlePrintReport}>
                                <LucidePrinter size={18} /> Imprimir
                            </Button>
                        </div>
                    )}
                </div>
                <div className="overflow-hidden">
                    <div ref={reportPrintRef} className="p-4 rounded-lg bg-white text-black">
                        {results.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-neutral-800">{reportTitles[reportType]}</h3>
                                <p className="text-sm text-neutral-500">{getReportSubTitle()}</p>
                            </div>
                        )}
                        {results.length > 0 ? (
                            reportType === 'ordersByClient' ? (
                                <table className="w-full text-sm text-left text-neutral-500">
                                    <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Nº O.S.</th>
                                            <th scope="col" className="px-6 py-3">Paciente</th>
                                            <th scope="col" className="px-6 py-3">Serviço Realizado</th>
                                            <th scope="col" className="px-6 py-3">Data Conclusão</th>
                                            <th scope="col" className="px-6 py-3 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((item, index) => (
                                            <tr key={`${item.orderId}-${index}`} className="bg-white border-b hover:bg-neutral-50">
                                                <td className="px-6 py-4 font-medium">#{item.orderNumber}</td>
                                                <td className="px-6 py-4">{item.patientName}</td>
                                                <td className="px-6 py-4">{item.name}</td>
                                                <td className="px-6 py-4">{new Date(item.completionDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                                <td className="px-6 py-4 text-right">R$ {item.subtotal.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="font-bold bg-neutral-100">
                                        <tr>
                                            <td colSpan="4" className="px-6 py-3 text-right uppercase">Total:</td>
                                            <td className="px-6 py-3 text-right">R$ {totalValue.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <table className="w-full text-sm text-left text-neutral-500">
                                    <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                                        <tr>
                                            <th scope="col" className="px-6 py-3">Nº O.S.</th>
                                            <th scope="col" className="px-6 py-3">Cliente</th>
                                            <th scope="col" className="px-6 py-3">Paciente</th>
                                            <th scope="col" className="px-6 py-3">Data</th>
                                            <th scope="col" className="px-6 py-3 text-right">Valor Total</th>
                                            {reportType === 'commissionsByEmployee' && <th scope="col" className="px-6 py-3 text-right">Comissão</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map(order => {
                                            const employeeCommission = reportType === 'commissionsByEmployee'
                                                ? order.assignedEmployees?.find(emp => emp.id === selectedEmployee)?.commissionValue || 0
                                                : 0;

                                            return (
                                                <tr key={order.id} className="bg-white border-b hover:bg-neutral-50">
                                                    <td className="px-6 py-4 font-medium">#{order.number}</td>
                                                    <td className="px-6 py-4">{order.clientName}</td>
                                                    <td className="px-6 py-4">{order.patientName}</td>
                                                    <td className="px-6 py-4">{new Date(reportType === 'completedByPeriod' || reportType === 'commissionsByEmployee' ? order.completionDate : order.openDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                                    <td className="px-6 py-4 text-right font-bold">R$ {order.totalValue.toFixed(2)}</td>
                                                    {reportType === 'commissionsByEmployee' && (
                                                        <td className="px-6 py-4 text-right">R$ {employeeCommission.toFixed(2)}</td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="font-bold bg-neutral-100">
                                        <tr>
                                            <td colSpan={reportType === 'commissionsByEmployee' ? 4 : 4} className="px-6 py-3 text-right uppercase">Total:</td>
                                            <td className="px-6 py-3 text-right">R$ {totalValue.toFixed(2)}</td>
                                            {reportType === 'commissionsByEmployee' && <td className="px-6 py-3 text-right">R$ {totalCommission.toFixed(2)}</td>}
                                        </tr>
                                    </tfoot>
                                </table>
                            )
                        ) : (
                            <p className="text-center text-neutral-500 py-4">Nenhum resultado para os filtros selecionados.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const PriceTableForm = ({ table, services, onSubmit, onCancel }) => {
    const [name, setName] = useState(table?.name || '');
    const [tableServices, setTableServices] = useState(table?.services || []);

    const handleServicePriceChange = (serviceId, serviceName, customPrice) => {
        const price = parseFloat(customPrice);
        const existingService = tableServices.find(s => s.serviceId === serviceId);

        if (isNaN(price) || price <= 0) {
            setTableServices(prev => prev.filter(s => s.serviceId !== serviceId));
        } else if (existingService) {
            setTableServices(prev => prev.map(s => s.serviceId === serviceId ? { ...s, customPrice: price } : s));
        } else {
            setTableServices(prev => [...prev, { serviceId, serviceName, customPrice: price }]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) {
            alert('O nome da tabela é obrigatório.');
            return;
        }
        onSubmit({ name, services: tableServices });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Nome da Tabela" value={name} onChange={e => setName(e.target.value)} required />
            <div>
                <h3 className="text-lg font-medium text-white mb-2">Preços dos Serviços</h3>
                <p className="text-sm text-neutral-400 mb-3">Preencha apenas os serviços que terão um preço diferente do padrão. Deixe em branco para usar o preço padrão.</p>
                <div className="max-h-80 overflow-y-auto space-y-2 p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
                    {services.map(service => {
                        const tableService = tableServices.find(s => s.serviceId === service.id);
                        return (
                            <div key={service.id} className="grid grid-cols-3 gap-4 items-center">
                                <label htmlFor={service.id} className="text-sm text-neutral-300 col-span-2">{service.name} (Padrão: R$ {service.price.toFixed(2)})</label>
                                <Input
                                    id={service.id}
                                    type="number"
                                    placeholder="Preço Customizado"
                                    step="0.01"
                                    defaultValue={tableService?.customPrice || ''}
                                    onChange={e => handleServicePriceChange(service.id, service.name, e.target.value)}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" onClick={onCancel} variant="secondary">Cancelar</Button>
                <Button type="submit" variant="primary">Salvar Tabela</Button>
            </div>
        </form>
    );
};

const PriceTableViewModal = ({ table, allServices, companyProfile, onClose }) => {
    const printRef = useRef();

    const combinedServices = allServices.map(service => {
        const customService = table.services?.find(s => s.serviceId === service.id);
        return {
            ...service,
            customPrice: customService?.customPrice,
        };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const groupedServices = combinedServices.reduce((acc, service) => {
        const material = service.material || 'Outros';
        if (!acc[material]) {
            acc[material] = [];
        }
        acc[material].push(service);
        return acc;
    }, {});
    
    const generatePdf = (action = 'print') => {
        const input = printRef.current;
        if (!input) {
            alert('Não foi possível encontrar o conteúdo para gerar o PDF.');
            return;
        }

        html2canvas(input, {
            scale: 2,
            useCORS: true
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const MARGIN = 15;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const usableWidth = pdfWidth - (MARGIN * 2);
            const usableHeight = pdfHeight - (MARGIN * 2);

            const aspectRatio = canvas.height / canvas.width;
            const scaledImgHeight = usableWidth * aspectRatio;

            let heightLeft = scaledImgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, usableWidth, scaledImgHeight);
            heightLeft -= usableHeight;

            while (heightLeft > 0) {
                position -= usableHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', MARGIN, position + MARGIN, usableWidth, scaledImgHeight);
                heightLeft -= usableHeight;
            }

            if (action === 'print') {
                pdf.autoPrint();
                window.open(pdf.output('bloburl'), '_blank');
            } else {
                pdf.save(`Tabela_${table.name.replace(/ /g, '_')}.pdf`);
            }
        }).catch(err => {
            console.error("Error generating PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF.");
        });
    };

    return (
        <Modal onClose={onClose} title={`Visualizar Tabela de Preços`} size="4xl">
            <div ref={printRef} className="p-4 bg-white text-neutral-800">
                <header className="flex justify-between items-start pb-4 mb-6 border-b">
                    <div>
                        <h1 className="text-xl font-bold text-neutral-800">{companyProfile?.companyName || 'Nome da Empresa'}</h1>
                        <p className="text-sm text-neutral-600">CNPJ: {companyProfile?.companyCnpj || '00.000.000/0000-00'}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold text-yellow-500">{table.name}</h2>
                        <p className="text-sm text-neutral-500">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                </header>

                <table className="w-full text-sm text-left text-neutral-600">
                    <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                        <tr>
                            <th scope="col" className="px-6 py-3">Serviço</th>
                            <th scope="col" className="px-6 py-3 text-right">Preço Padrão</th>
                            <th scope="col" className="px-6 py-3 text-right">Preço Customizado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(groupedServices).sort().map(material => (
                            <React.Fragment key={material}>
                                <tr className="bg-neutral-200">
                                    <th colSpan="3" className="px-6 py-2 text-left text-sm font-bold text-neutral-700">
                                        {material}
                                    </th>
                                </tr>
                                {groupedServices[material].map(service => (
                                    <tr key={service.id} className={`border-b ${service.customPrice ? 'bg-yellow-50' : 'bg-white'}`}>
                                        <td className="px-6 py-4 font-medium text-neutral-900">{service.name}</td>
                                        <td className="px-6 py-4 text-right">R$ {service.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-yellow-700">
                                            {service.customPrice ? `R$ ${service.customPrice.toFixed(2)}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                <footer className="mt-8 text-center text-xs text-neutral-500">
                    <p>Este documento é uma representação da tabela de preços "{table.name}". Os preços padrão são a base, e os preços customizados se aplicam especificamente a esta tabela.</p>
                </footer>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-700 mt-4 p-4">
                <Button onClick={() => generatePdf('save')} variant="secondary"><LucideFileDown size={18} /> Salvar PDF</Button>
                <Button onClick={() => generatePdf('print')} variant="primary"><LucidePrinter size={18} /> Imprimir</Button>
            </div>
        </Modal>
    );
};

const PriceTables = ({ userId, services, companyProfile }) => {
    const [tables, setTables] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentTable, setCurrentTable] = useState(null);
    const collectionRef = collection(db, `artifacts/${appId}/users/${userId}/priceTables`);

    useEffect(() => {
        if (!userId) return;
        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTables(data);
        });
        return () => unsubscribe();
    }, [userId, collectionRef]);

    const handleOpenModal = (table = null) => {
        setCurrentTable(table);
        setIsModalOpen(true);
    };

    const handleOpenViewModal = (table) => {
        setCurrentTable(table);
        setIsViewModalOpen(true);
    };

    const handleCloseModal = () => {
        setCurrentTable(null);
        setIsModalOpen(false);
        setIsViewModalOpen(false);
    };

    const handleSaveTable = async (tableData) => {
        try {
            if (currentTable) {
                const docRef = doc(db, collectionRef.path, currentTable.id);
                await updateDoc(docRef, tableData);
            } else {
                await addDoc(collectionRef, tableData);
            }
            handleCloseModal();
        } catch (error) {
            console.error("Erro ao salvar tabela de preços: ", error);
        }
    };

    const handleDeleteTable = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta tabela de preços?')) {
            try {
                await deleteDoc(doc(db, collectionRef.path, id));
            } catch (error) {
                console.error("Erro ao excluir tabela de preços: ", error);
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Tabelas de Preços</h1>
                <Button onClick={() => handleOpenModal()}>
                    <LucidePlusCircle size={20} />
                    Nova Tabela
                </Button>
            </header>
            <div className="bg-neutral-900 rounded-2xl shadow-md overflow-hidden">
                <table className="w-full text-sm text-left text-neutral-400">
                    <thead className="text-xs text-neutral-300 uppercase bg-neutral-800">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nome da Tabela</th>
                            <th scope="col" className="px-6 py-3">Serviços com Preço Customizado</th>
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tables.map(table => (
                            <tr key={table.id} className="bg-neutral-900 border-b border-neutral-800 hover:bg-neutral-800">
                                <td className="px-6 py-4 font-medium text-white">{table.name}</td>
                                <td className="px-6 py-4">{table.services?.length || 0}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => handleOpenViewModal(table)} title="Visualizar/Imprimir" className="text-yellow-500 hover:text-yellow-400 p-1"><LucideFileText size={18} /></button>
                                        <button onClick={() => handleOpenModal(table)} title="Editar" className="text-blue-400 hover:text-blue-300 p-1"><LucideEdit size={18} /></button>
                                        <button onClick={() => handleDeleteTable(table.id)} title="Excluir" className="text-red-500 hover:text-red-400 p-1"><LucideTrash2 size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {tables.length === 0 && (
                            <tr>
                                <td colSpan="3" className="text-center p-8 text-neutral-500">Nenhuma tabela de preços encontrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal onClose={handleCloseModal} title={currentTable ? "Editar Tabela" : "Nova Tabela de Preços"} size="3xl">
                    <PriceTableForm table={currentTable} services={services} onSubmit={handleSaveTable} onCancel={handleCloseModal} />
                </Modal>
            )}

            {isViewModalOpen && (
                <PriceTableViewModal
                    table={currentTable}
                    allServices={services}
                    companyProfile={companyProfile}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

const UserManagement = ({ userId }) => {
    const [users, setUsers] = useState([]);
    const usersCollectionRef = collection(db, "users");

    useEffect(() => {
        const unsubscribe = onSnapshot(usersCollectionRef, (snapshot) => {
            const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
        });
        return () => unsubscribe();
    }, []);

    const handleStatusChange = async (targetUserId, newStatus) => {
        const userDocRef = doc(db, "users", targetUserId);
        try {
            await updateDoc(userDocRef, { status: newStatus });
            alert(`Status do usuário atualizado para ${newStatus}`);
        } catch (error) {
            console.error("Erro ao atualizar status do usuário: ", error);
            alert("Falha ao atualizar o status.");
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-white mb-6">Gestão de Utilizadores</h1>
            <div className="bg-neutral-900 rounded-2xl shadow-md overflow-hidden">
                <table className="w-full text-sm text-left text-neutral-400">
                    <thead className="text-xs text-neutral-300 uppercase bg-neutral-800">
                        <tr>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Data de Registo</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-neutral-900 border-b border-neutral-800 hover:bg-neutral-800">
                                <td className="px-6 py-4 font-medium text-white">{user.email}</td>
                                <td className="px-6 py-4">{user.createdAt?.toDate().toLocaleDateString('pt-BR') || 'N/A'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${user.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                        }`}>{user.status === 'approved' ? 'Aprovado' : 'Pendente'}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {user.status === 'pending' && (
                                        <Button onClick={() => handleStatusChange(user.id, 'approved')}>
                                            Aprovar
                                        </Button>
                                    )}
                                    {user.status === 'approved' && user.role !== 'admin' && (
                                        <Button onClick={() => handleStatusChange(user.id, 'pending')} variant="secondary">
                                            Revogar Acesso
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ClientAccounts = ({ userId, clients, orders, setActivePage }) => {
    const [accounts, setAccounts] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isCreditModalOpen, setCreditModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('extrato');
    const printRef = useRef();

    useEffect(() => {
        if (!userId || clients.length === 0) {
            setLoading(false);
            return;
        };

        const transactionsRef = collection(db, `artifacts/${appId}/users/${userId}/clientTransactions`);
        const unsubscribe = onSnapshot(transactionsRef, (snapshot) => {
            const allTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const accountsData = clients.map(client => {
                const clientTransactions = allTransactions.filter(t => t.clientId === client.id);
                const totalCredit = clientTransactions
                    .filter(t => t.type === 'credit')
                    .reduce((sum, t) => sum + t.amount, 0);
                const totalDebit = clientTransactions
                    .filter(t => t.type === 'debit')
                    .reduce((sum, t) => sum + t.amount, 0);
                
                return {
                    ...client,
                    balance: totalCredit - totalDebit
                };
            }).sort((a, b) => a.name.localeCompare(b.name));

            setAccounts(accountsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, clients]);

    useEffect(() => {
        if (!selectedClient || !userId) {
            setTransactions([]);
            return;
        }

        const transactionsRef = collection(db, `artifacts/${appId}/users/${userId}/clientTransactions`);
        const q = query(transactionsRef, where("clientId", "==", selectedClient.id), orderBy("date", "desc"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const clientTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(clientTransactions);
        });

        return () => unsubscribe();
    }, [selectedClient, userId]);
    
    const clientOrders = useMemo(() => {
        if (!selectedClient) return [];
        return orders.filter(o => o.clientId === selectedClient.id).sort((a, b) => b.number - a.number);
    }, [selectedClient, orders]);
    
    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setActiveTab('extrato');
    };

    const handleSaveCredit = async ({ amount, date, description }) => {
        if (!userId || !selectedClient || !amount || !date) return;
        
        try {
            const transactionRef = collection(db, `artifacts/${appId}/users/${userId}/clientTransactions`);
            await addDoc(transactionRef, {
                clientId: selectedClient.id,
                clientName: selectedClient.name,
                type: 'credit',
                amount: parseFloat(amount),
                date,
                description: description || 'Adiantamento / Pagamento',
                orderId: null,
                createdAt: serverTimestamp()
            });
            setCreditModalOpen(false);
        } catch (error) {
            console.error("Erro ao adicionar crédito:", error);
            alert("Não foi possível registrar o pagamento.");
        }
    };

    const handleDeleteTransaction = async (transactionId) => {
        if (!userId) return;
        if (window.confirm('Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.')) {
            try {
                const transactionDocRef = doc(db, `artifacts/${appId}/users/${userId}/clientTransactions`, transactionId);
                await deleteDoc(transactionDocRef);
            } catch (error) {
                console.error("Erro ao excluir transação:", error);
                alert("Não foi possível excluir o lançamento.");
            }
        }
    };

    const handleCancelOrder = async (order) => {
        if (!userId) return;
        if (window.confirm(`Tem certeza que deseja cancelar a O.S. #${order.number}? Esta ação também removerá o débito correspondente da conta do cliente.`)) {
            try {
                const batch = writeBatch(db);

                const orderRef = doc(db, `artifacts/${appId}/users/${userId}/serviceOrders`, order.id);
                batch.update(orderRef, { status: 'Cancelado' });

                const transactionRef = collection(db, `artifacts/${appId}/users/${userId}/clientTransactions`);
                const q = query(transactionRef, where("orderId", "==", order.id), where("type", "==", "debit"));
                const debitSnapshot = await getDocs(q);
                
                if (!debitSnapshot.empty) {
                    const debitDoc = debitSnapshot.docs[0];
                    batch.delete(debitDoc.ref);
                }
                
                await batch.commit();
                alert(`O.S. #${order.number} cancelada e débito estornado.`);

            } catch (error) {
                console.error("Erro ao cancelar O.S.: ", error);
                alert("Ocorreu um erro ao tentar cancelar a O.S.");
            }
        }
    };

    const generateClientPdf = (action = 'print') => {
        const input = printRef.current;
        if (!input) {
            alert('Não foi possível encontrar o conteúdo para gerar o PDF.');
            return;
        }

        html2canvas(input, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const MARGIN = 15;
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const usableWidth = pdfWidth - (MARGIN * 2);
            const usableHeight = pdfHeight - (MARGIN * 2);

            const aspectRatio = canvas.height / canvas.width;
            const scaledImgHeight = usableWidth * aspectRatio;

            let heightLeft = scaledImgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, usableWidth, scaledImgHeight);
            heightLeft -= usableHeight;

            while (heightLeft > 0) {
                position -= usableHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', MARGIN, position + MARGIN, usableWidth, scaledImgHeight);
                heightLeft -= usableHeight;
            }
            
            if (action === 'print') {
                pdf.autoPrint();
                window.open(pdf.output('bloburl'), '_blank');
            } else {
                pdf.save(`Extrato_${selectedClient.name.replace(/ /g, '_')}.pdf`);
            }
        }).catch(err => {
            console.error("Error generating PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF.");
        });
    };
    
    if (loading) return <Spinner />;

    return (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-neutral-900 p-6 rounded-2xl shadow-md self-start">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Contas de Clientes</h2>
                    <Button onClick={() => setActivePage('financials')} variant="secondary" className="py-1 px-2 text-xs">
                        Voltar
                    </Button>
                </div>
                <div className="space-y-2 max-h-[75vh] overflow-y-auto">
                    {accounts.map(acc => (
                        <div key={acc.id} onClick={() => handleSelectClient(acc)}
                             className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedClient?.id === acc.id ? 'bg-yellow-900 border-yellow-600' : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-white">{acc.name}</span>
                                <span className={`font-bold text-lg ${acc.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    R$ {acc.balance.toFixed(2)}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-400">{acc.balance >= 0 ? 'Saldo Positivo' : 'Saldo Devedor'}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                {selectedClient ? (
                    <div className="bg-neutral-900 p-6 rounded-2xl shadow-md">
                        <header className="flex flex-col md:flex-row justify-between items-start mb-4 pb-4 border-b border-neutral-700 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-yellow-500">{selectedClient.name}</h2>
                                <p className="text-neutral-300">Detalhes da Conta</p>
                            </div>
                            <div className="flex gap-2">
                                 <Button onClick={() => generateClientPdf('save')} variant="secondary"><LucideFileDown size={18} /> Salvar PDF</Button>
                                 <Button onClick={() => generateClientPdf('print')}><LucidePrinter size={18} /> Imprimir</Button>
                            </div>
                        </header>
                        
                        <div className="flex border-b border-neutral-700 mb-4">
                            <button onClick={() => setActiveTab('extrato')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'extrato' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-neutral-400 hover:text-white'}`}>
                                Extrato da Conta
                            </button>
                            <button onClick={() => setActiveTab('os')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'os' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-neutral-400 hover:text-white'}`}>
                                Ordens de Serviço ({clientOrders.length})
                            </button>
                        </div>

                        {activeTab === 'extrato' && (
                           <div>
                                <div className="flex justify-end mb-4">
                                     <Button onClick={() => setCreditModalOpen(true)}>
                                         <LucidePlusCircle size={20} />
                                         Lançar Pagamento (Crédito)
                                     </Button>
                                </div>
                                <div className="max-h-[60vh] overflow-y-auto">
                                    <div ref={printRef} className="p-4 bg-white text-neutral-800 rounded">
                                        <h3 className="text-xl font-bold mb-1">{selectedClient.name}</h3>
                                        <p className="text-sm text-neutral-600 mb-4">Extrato de Conta Corrente - Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
                                        <table className="w-full text-sm text-left text-neutral-600">
                                            <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3">Data</th>
                                                    <th scope="col" className="px-6 py-3">Descrição</th>
                                                    <th scope="col" className="px-6 py-3 text-right">A Receber</th>
                                                    <th scope="col" className="px-6 py-3 text-right">Pago</th>
                                                    <th scope="col" className="px-6 py-3 text-center">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-neutral-800">
                                                {transactions.map(t => (
                                                    <tr key={t.id} className="border-b">
                                                        <td className="px-6 py-4">{new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                                        <td className="px-6 py-4">{t.description}</td>
                                                        <td className="px-6 py-4 text-right font-mono text-red-600">
                                                            {t.type === 'debit' ? `R$ ${t.amount.toFixed(2)}` : ''}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono text-green-600">
                                                            {t.type === 'credit' ? `R$ ${t.amount.toFixed(2)}` : ''}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {t.type === 'credit' && (
                                                                <button 
                                                                    onClick={() => handleDeleteTransaction(t.id)} 
                                                                    className="p-1 text-red-600 hover:text-red-800"
                                                                    title="Excluir Lançamento de Crédito">
                                                                    <LucideTrash2 size={16} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {transactions.length === 0 && (
                                                    <tr><td colSpan="5" className="text-center p-8 text-neutral-500">Nenhuma transação encontrada.</td></tr>
                                                )}
                                            </tbody>
                                            <tfoot className="font-bold bg-neutral-100">
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-3 text-right uppercase">Saldo Final:</td>
                                                    <td className="px-6 py-3 text-right text-lg">
                                                        R$ {(accounts.find(a => a.id === selectedClient.id)?.balance || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'os' && (
                             <div className="max-h-[60vh] overflow-y-auto">
                                <table className="w-full text-sm text-left text-neutral-400">
                                    <thead className="text-xs text-neutral-300 uppercase bg-neutral-800 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3">Nº O.S.</th>
                                            <th className="px-4 py-3">Paciente</th>
                                            <th className="px-4 py-3">Data Conclusão</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Valor</th>
                                            <th className="px-4 py-3 text-center">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientOrders.map(order => (
                                            <tr key={order.id} className="bg-neutral-900 border-b border-neutral-800 hover:bg-neutral-800">
                                                <td className="px-4 py-3 font-medium">#{order.number}</td>
                                                <td className="px-4 py-3">{order.patientName}</td>
                                                <td className="px-4 py-3">{order.completionDate ? new Date(order.completionDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</td>
                                                <td className="px-4 py-3">{order.status}</td>
                                                <td className="px-4 py-3 text-right">R$ {order.totalValue.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {order.status === 'Concluído' && (
                                                        <Button onClick={() => handleCancelOrder(order)} variant="danger" className="py-1 px-2 text-xs">
                                                            Cancelar
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                         {clientOrders.length === 0 && (
                                            <tr><td colSpan="6" className="text-center p-8 text-neutral-500">Nenhuma O.S. encontrada para este cliente.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-neutral-900 p-12 rounded-2xl shadow-md text-center">
                        <LucideSearch size={48} className="mx-auto text-neutral-600 mb-4" />
                        <h3 className="text-xl font-bold text-neutral-300">Selecione um cliente</h3>
                        <p className="text-neutral-500">Clique em um cliente na lista à esquerda para ver seu extrato detalhado.</p>
                    </div>
                )}
            </div>

            {isCreditModalOpen && selectedClient && (
                <Modal onClose={() => setCreditModalOpen(false)} title={`Lançar Pagamento para ${selectedClient.name}`}>
                    <CreditForm onSubmit={handleSaveCredit} onCancel={() => setCreditModalOpen(false)} />
                </Modal>
            )}
        </div>
    );
};

const CreditForm = ({ onSubmit, onCancel }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ amount, date, description });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Valor do Pagamento (R$)" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required autoFocus />
            <Input label="Data do Pagamento" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <Input label="Descrição (Opcional)" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Pagamento semanal" />
            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" onClick={onCancel} variant="secondary">Cancelar</Button>
                <Button type="submit" variant="primary">Salvar Pagamento</Button>
            </div>
        </form>
    );
};

const Settings = ({ userId, initialProfile }) => {
    const [profile, setProfile] = useState(initialProfile || {});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setProfile(initialProfile || {});
    }, [initialProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const profileDocRef = doc(db, `artifacts/${appId}/users/${userId}/companyProfile/main`);
            await setDoc(profileDocRef, profile, { merge: true });
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            alert('Falha ao salvar as configurações.');
        }
        setLoading(false);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-white">Configurações da Empresa</h1>
            <div className="bg-neutral-900 p-6 rounded-2xl shadow-md">
                <p className="text-sm text-neutral-400 mb-4">
                    As informações preenchidas aqui serão usadas no cabeçalho dos seus recibos.
                </p>
                <div className="space-y-4 max-w-lg">
                    <Input label="Nome da Empresa / Laboratório" name="companyName" value={profile.companyName || ''} onChange={handleChange} />
                    <Input label="CNPJ ou CPF" name="companyCnpj" value={profile.companyCnpj || ''} onChange={handleChange} />
                    <Input label="Endereço Completo" name="companyAddress" value={profile.companyAddress || ''} onChange={handleChange} />
                    <Input label="Telefone de Contato" name="companyPhone" value={profile.companyPhone || ''} onChange={handleChange} />
                    <Input label="Email de Contato" name="companyEmail" value={profile.companyEmail || ''} onChange={handleChange} />
                </div>
                <div className="mt-6">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const FinancialDashboard = ({ orders, setActivePage }) => {
    const [period, setPeriod] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#D4AF37', '#B8860B', '#8B6914', '#FFD700', '#F0E68C'];

    const handleFilter = () => {
        setLoading(true);

        let startDate, endDate;
        const now = new Date();

        if (period === 'custom') {
            if (!customStartDate || !customEndDate) {
                alert("Por favor, selecione as datas de início e fim para o período customizado.");
                setLoading(false);
                return;
            }
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
        } else {
            switch (period) {
                case 'last30days':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
                    endDate = new Date();
                    break;
                case 'thisYear':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31);
                    break;
                case 'thisMonth':
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            }
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        const completedOrdersInPeriod = orders.filter(o => {
            const completionDate = new Date(o.completionDate);
            return o.status === 'Concluído' && completionDate >= startDate && completionDate <= endDate;
        });
        
        const grossRevenue = completedOrdersInPeriod.reduce((sum, o) => sum + o.totalValue, 0);

        const revenueByClient = completedOrdersInPeriod.reduce((acc, order) => {
            acc[order.clientName] = (acc[order.clientName] || 0) + order.totalValue;
            return acc;
        }, {});
        
        const topClients = Object.entries(revenueByClient)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
        
        setData({
            grossRevenue,
            topClients,
        });
        
        setLoading(false);
    }
    
    useEffect(() => {
        handleFilter();
    }, [orders]);
    
    useEffect(() => {
        if (period !== 'custom') {
            setCustomStartDate('');
            setCustomEndDate('');
        }
    }, [period]);

    if (loading || !data) {
        return <Spinner />;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Dashboard Financeiro</h1>
                <Button onClick={() => setActivePage('financials-ledger')} variant="secondary">Ver Contas Correntes</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="bg-neutral-900 p-4 rounded-2xl shadow-md flex flex-col md:flex-row flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <label htmlFor="period-select" className="block text-sm font-medium text-neutral-300 mb-1">Período Rápido</label>
                        <select id="period-select" value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500">
                            <option value="thisMonth">Este Mês</option>
                            <option value="last30days">Últimos 30 Dias</option>
                            <option value="thisYear">Este Ano</option>
                            <option value="custom">Customizado</option>
                        </select>
                    </div>
                    {period === 'custom' && (
                        <>
                           <Input className="flex-1 min-w-[150px]" label="Data de Início" type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
                           <Input className="flex-1 min-w-[150px]" label="Data de Fim" type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
                        </>
                    )}
                    <div className="self-end">
                       <Button onClick={handleFilter} className="h-11">Filtrar</Button>
                    </div>
                </div>

                <StatCard 
                    icon={<LucideClipboardEdit size={40} className="text-purple-400" />} 
                    label="Faturamento Bruto (O.S. Concluídas no período)" 
                    value={`R$ ${data.grossRevenue.toFixed(2)}`} 
                    color="border-purple-400" 
                />
            </div>

            <div className="bg-neutral-900 p-6 rounded-2xl shadow-md">
                <h2 className="text-xl font-bold text-neutral-200 mb-4">Top 5 Clientes (por Faturamento no período)</h2>
                 <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={data.topClients} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={{ fill: '#F5F5F5' }}>
                            {data.topClients.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #4A5568' }} formatter={(value) => `R$ ${value.toFixed(2)}`} />
                        <Legend wrapperStyle={{ color: '#F5F5F5' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isPasswordReset, setIsPasswordReset] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (isLogin) {
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists() || userDoc.data().status !== 'approved') {
                    await signOut(auth);
                    setError("A sua conta está pendente de aprovação ou não foi encontrada.");
                }
            } catch (err) {
                setError("E-mail ou senha incorretos.");
            }
        } else {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                const userDocRef = doc(db, "users", user.uid);
                await setDoc(userDocRef, {
                    email: user.email,
                    uid: user.uid,
                    status: 'pending',
                    role: 'user',
                    createdAt: serverTimestamp()
                });
                
                await signOut(auth);
                setMessage('Registo concluído! A sua conta está agora pendente de aprovação pelo administrador.');

            } catch (err) {
                setError(`Ocorreu um erro: ${err.message}`);
            }
        }
        setLoading(false);
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada e a pasta de spam.');
            setIsPasswordReset(false);
        } catch (err) {
            if (err.code === 'auth/user-not-found') {
                setError('Nenhum utilizador encontrado com este e-mail.');
            } else {
                setError('Ocorreu um erro ao enviar o e-mail. Tente novamente.');
            }
        }
        setLoading(false);
    };

    const toggleView = (view) => {
        setError('');
        setMessage('');
        if (view === 'login') {
            setIsLogin(true);
            setIsPasswordReset(false);
        } else if (view === 'register') {
            setIsLogin(false);
            setIsPasswordReset(false);
        } else if (view === 'reset') {
            setIsPasswordReset(true);
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-black">
            <div className="w-full max-w-md p-8 space-y-6 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-lg">
                <div className="text-center">
                    <LucideClipboardEdit className="h-12 w-12 text-yellow-500 mx-auto" />
                    <h1 className="text-3xl font-bold text-white mt-2">
                        {isPasswordReset ? 'Recuperar Senha' : 'Gestor Próteses'}
                    </h1>
                    <p className="text-neutral-400">
                        {isPasswordReset ? 'Insira seu e-mail para continuar' : (isLogin ? 'Faça login para continuar' : 'Crie a sua conta')}
                    </p>
                </div>

                {message && <p className="text-green-300 bg-green-900 bg-opacity-40 p-4 rounded-lg text-center">{message}</p>}
                
                <form onSubmit={isPasswordReset ? handlePasswordReset : handleAuth} className="space-y-6">
                    <Input label="Email" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    
                    {!isPasswordReset && (
                        <Input label="Senha" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    )}

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    {!isPasswordReset && isLogin && (
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => toggleView('reset')}
                                className="text-sm font-medium text-yellow-500 hover:text-yellow-400"
                            >
                                Esqueceu a senha?
                            </button>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Aguarde...' : (isPasswordReset ? 'Enviar E-mail de Recuperação' : (isLogin ? 'Entrar' : 'Cadastrar'))}
                    </Button>
                </form>

                <div className="text-center text-sm text-neutral-400">
                    {isPasswordReset ? (
                        <span>Lembrou da senha? </span>
                    ) : (
                        <span>{isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'} </span>
                    )}
                    <button 
                        onClick={() => toggleView(isLogin || isPasswordReset ? 'register' : 'login')} 
                        className="font-medium text-yellow-500 hover:text-yellow-400"
                    >
                        {isLogin || isPasswordReset ? 'Cadastre-se' : 'Faça login'}
                    </button>
                    {isPasswordReset && (
                        <>
                         <span className='mx-1'>|</span>
                         <button 
                             onClick={() => toggleView('login')} 
                             className="font-medium text-yellow-500 hover:text-yellow-400"
                         >
                             Voltar para o Login
                         </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const AppLayout = ({ user, userProfile }) => {
    const [activePage, setActivePage] = useState('dashboard');
    const [clients, setClients] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [services, setServices] = useState([]);
    const [serviceOrders, setServiceOrders] = useState([]);
    const [priceTables, setPriceTables] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [companyProfile, setCompanyProfile] = useState(null);

    useEffect(() => {
        if (!user) return;
        const collections = {
            clients: setClients,
            employees: setEmployees,
            services: setServices,
            serviceOrders: setServiceOrders,
            priceTables: setPriceTables,
            inventory: setInventory,
            suppliers: setSuppliers,
        };
        const unsubscribers = Object.entries(collections).map(([name, setter]) => {
            const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/${name}`));
            return onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (name === 'serviceOrders') {
                    data.sort((a, b) => (b.number || 0) - (a.number || 0));
                }
                setter(data);
            });
        });

        const companyProfileDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/companyProfile/main`);
        const companyUnsub = onSnapshot(companyProfileDocRef, (doc) => {
            setCompanyProfile(doc.data());
        });
        unsubscribers.push(companyUnsub);

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard':
                return <Dashboard setActivePage={setActivePage} serviceOrders={serviceOrders} inventory={inventory} />;
            case 'clients':
                return <ManageGeneric
                    collectionName="clients"
                    title="Clientes"
                    fields={[
                        { name: 'name', label: 'Nome Completo', type: 'text', required: true },
                        { name: 'document', label: 'CPF/CNPJ', type: 'text' },
                        { name: 'address', label: 'Endereço', type: 'text' },
                        { name: 'phone', label: 'Telefone / WhatsApp', type: 'tel' },
                        { name: 'email', label: 'Email', type: 'email' },
                        { name: 'priceTableId', label: 'Tabela de Preço', type: 'select', optionsKey: 'priceTables', placeholder: 'Padrão' },
                        { name: 'notes', label: 'Observações', type: 'textarea' },
                    ]}
                    customProps={{ priceTables }}
                    renderItem={(items, onEdit, onDelete) => (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                            {items.map(item => (
                                <div key={item.id} className="bg-neutral-800 rounded-lg p-4 shadow-sm border border-neutral-700 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{item.name}</h3>
                                        <p className="text-sm text-neutral-400">{item.phone}</p>
                                        <p className="text-sm text-neutral-400 truncate">{priceTables.find(pt => pt.id === item.priceTableId)?.name || 'Preço Padrão'}</p>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button onClick={() => onEdit(item)} className="p-2 text-blue-400 hover:bg-blue-900 rounded-full"><LucideEdit size={18} /></button>
                                        <button onClick={() => onDelete(item.id)} className="p-2 text-red-500 hover:bg-red-900 rounded-full"><LucideTrash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                />;
            case 'employees':
                return <ManageGeneric
                    collectionName="employees"
                    title="Funcionários"
                    fields={[
                        { name: 'name', label: 'Nome Completo', type: 'text', required: true },
                        { name: 'role', label: 'Função / Cargo', type: 'text' },
                        { name: 'phone', label: 'Telefone', type: 'tel' },
                        { name: 'email', label: 'Email', type: 'email' },
                        { name: 'commission', label: 'Comissão Padrão (%)', type: 'number', required: true },
                    ]}
                    renderItem={(items, onEdit, onDelete) => (
                        <table className="w-full text-sm text-left text-neutral-400">
                            <thead className="text-xs text-neutral-300 uppercase bg-neutral-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Nome</th>
                                    <th scope="col" className="px-6 py-3">Cargo</th>
                                    <th scope="col" className="px-6 py-3">Comissão Padrão</th>
                                    <th scope="col" className="px-6 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} className="bg-neutral-900 border-b border-neutral-800 hover:bg-neutral-800">
                                        <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                                        <td className="px-6 py-4">{item.role}</td>
                                        <td className="px-6 py-4">{item.commission}%</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-blue-300 p-1"><LucideEdit size={18} /></button>
                                                <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-400 p-1"><LucideTrash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                />;
            case 'suppliers':
                return <ManageGeneric
                    collectionName="suppliers"
                    title="Fornecedores"
                    fields={[
                        { name: 'name', label: 'Nome do Fornecedor', type: 'text', required: true },
                        { name: 'phone', label: 'Telefone / WhatsApp', type: 'tel' },
                        { name: 'email', label: 'Email', type: 'email' },
                        { name: 'notes', label: 'Observações / Produtos', type: 'textarea' }
                    ]}
                    renderItem={(items, onEdit, onDelete) => (
                        <table className="w-full text-sm text-left text-neutral-400">
                            <thead className="text-xs text-neutral-300 uppercase bg-neutral-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Nome</th>
                                    <th scope="col" className="px-6 py-3">Telefone</th>
                                    <th scope="col" className="px-6 py-3">Email</th>
                                    <th scope="col" className="px-6 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} className="bg-neutral-900 border-b border-neutral-800 hover:bg-neutral-800">
                                        <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                                        <td className="px-6 py-4">{item.phone}</td>
                                        <td className="px-6 py-4">{item.email}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-blue-300 p-1"><LucideEdit size={18} /></button>
                                                <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-400 p-1"><LucideTrash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                />;
            case 'services':
                const groupedServices = services.reduce((acc, service) => {
                    const material = service.material || 'Sem Material';
                    if (!acc[material]) {
                        acc[material] = [];
                    }
                    acc[material].push(service);
                    return acc;
                }, {});

                return <ManageGeneric
                    collectionName="services"
                    title="Serviços (Preços Padrão)"
                    fields={[
                        { name: 'name', label: 'Nome do Serviço', type: 'text', required: true },
                        { name: 'material', label: 'Material (Ex: Zircônia, E-max)', type: 'text', required: true },
                        { name: 'price', label: 'Valor Padrão (R$)', type: 'number', required: true },
                        { name: 'description', label: 'Descrição', type: 'textarea' },
                    ]}
                    renderItem={(items, onEdit, onDelete) => (
                        <div className="space-y-4 p-4">
                            {Object.keys(groupedServices).sort().map(material => (
                                <div key={material} className="bg-neutral-900 rounded-lg shadow-md border border-neutral-800">
                                    <h3 className="px-6 py-3 text-lg font-bold text-neutral-200 bg-neutral-800 rounded-t-lg">{material}</h3>
                                    <table className="w-full text-sm text-left text-neutral-400">
                                        <tbody>
                                            {groupedServices[material].map(item => (
                                                <tr key={item.id} className="border-b border-neutral-800 last:border-b-0 hover:bg-neutral-800">
                                                    <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                                                    <td className="px-6 py-4 text-right font-semibold">R$ {item.price?.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-center w-32">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-blue-300 p-1"><LucideEdit size={18} /></button>
                                                            <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-400 p-1"><LucideTrash2 size={18} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    )}
                />;
            case 'inventory':
                return <ManageGeneric
                    collectionName="inventory"
                    title="Controle de Estoque"
                    fields={[
                        { name: 'itemName', label: 'Nome do Item', type: 'text', required: true },
                        { name: 'supplier', label: 'Fornecedor (Opcional)', type: 'text' },
                        { name: 'quantity', label: 'Quantidade Atual', type: 'number', required: true },
                        { name: 'unit', label: 'Unidade (un, g, ml, etc.)', type: 'text', required: true },
                        { name: 'lowStockThreshold', label: 'Alerta de Estoque Baixo', type: 'number', required: true }
                    ]}
                    renderItem={(items, onEdit, onDelete) => (
                        <table className="w-full text-sm text-left text-neutral-400">
                            <thead className="text-xs text-neutral-300 uppercase bg-neutral-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Item</th>
                                    <th scope="col" className="px-6 py-3">Fornecedor</th>
                                    <th scope="col" className="px-6 py-3">Quantidade</th>
                                    <th scope="col" className="px-6 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} className="bg-neutral-900 border-b border-neutral-800 hover:bg-neutral-800">
                                        <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                            {item.itemName}
                                            {item.quantity <= item.lowStockThreshold &&
                                                <LucideAlertTriangle size={16} className="text-red-500" title="Estoque baixo!" />
                                            }
                                        </td>
                                        <td className="px-6 py-4">{item.supplier}</td>
                                        <td className="px-6 py-4">{item.quantity} {item.unit}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-blue-300 p-1"><LucideEdit size={18} /></button>
                                                <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-400 p-1"><LucideTrash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                />;
            case 'price-tables':
                return <PriceTables userId={user.uid} services={services} companyProfile={companyProfile} />;
            case 'service-orders':
                return <ServiceOrders userId={user.uid} services={services} clients={clients} employees={employees} orders={serviceOrders} priceTables={priceTables} />;
            
            case 'financials':
                return <FinancialDashboard orders={serviceOrders} setActivePage={setActivePage} />;
            case 'financials-ledger':
                 return <ClientAccounts userId={user.uid} clients={clients} orders={serviceOrders} setActivePage={setActivePage} />;
            
            case 'reports':
                return <Reports orders={serviceOrders} employees={employees} clients={clients} />;
            case 'user-management':
                return <UserManagement userId={user.uid} />;
            case 'settings':
                return <Settings userId={user.uid} initialProfile={companyProfile} />;
            default:
                return <div>Página não encontrada</div>;
        }
    };

    const NavItem = ({ icon, label, page, activePage, setActivePage }) => {
        const isFinancialPage = page === 'financials' && (activePage === 'financials' || activePage === 'financials-ledger');
        const isActive = activePage === page || isFinancialPage;

        return (
            <li>
                <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setActivePage(page); }}
                    className={`flex items-center p-3 text-base font-normal rounded-lg transition-all duration-200 ${isActive
                            ? 'bg-yellow-500 text-black shadow-lg'
                            : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                        }`}
                >
                    {icon}
                    <span className="ml-3 flex-1 whitespace-nowrap">{label}</span>
                </a>
            </li>
        )
    };

    return (
        <div className="flex h-full text-white">
            <aside className="w-64 bg-neutral-900 shadow-lg flex-shrink-0 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-center h-20 border-b border-neutral-800">
                        <LucideClipboardEdit className="h-8 w-8 text-yellow-500" />
                        <h1 className="text-xl font-bold text-white ml-2">{companyProfile?.companyName || 'Gestor Próteses'}</h1>
                    </div>
                    <div className="p-4">
                        <ul className="space-y-2">
                            <NavItem icon={<LucideBarChart3 />} label="Painel" page="dashboard" activePage={activePage} setActivePage={setActivePage} />
                            <NavItem icon={<LucideListOrdered />} label="Ordens de Serviço" page="service-orders" activePage={activePage} setActivePage={setActivePage} />
                            <NavItem icon={<LucideDollarSign />} label="Financeiro" page="financials" activePage={activePage} setActivePage={setActivePage} />
                            <NavItem icon={<LucideUsers />} label="Clientes" page="clients" activePage={activePage} setActivePage={setActivePage} />
                            <NavItem icon={<LucideUsers />} label="Funcionários" page="employees" activePage={activePage} setActivePage={setActivePage} />
                            <NavItem icon={<LucideHammer />} label="Serviços" page="services" activePage={activePage} setActivePage={setActivePage} />
                            <NavItem icon={<LucideDollarSign />} label="Tabelas de Preços" page="price-tables" activePage={activePage} setActivePage={setActivePage} />
                            <NavItem icon={<LucideBoxes />} label="Estoque" page="inventory" activePage={activePage} setActivePage={setActivePage} />
                            <NavItem icon={<LucideTruck />} label="Fornecedores" page="suppliers" activePage={activePage} setActivePage={setActivePage} />
                            <NavItem icon={<LucideBarChart3 />} label="Relatórios" page="reports" activePage={activePage} setActivePage={setActivePage} />
                            <NavItem icon={<LucideSettings />} label="Configurações" page="settings" activePage={activePage} setActivePage={setActivePage} />
                            {userProfile?.role === 'admin' && (
                                <NavItem icon={<LucideUserCheck />} label="Gerir Utilizadores" page="user-management" activePage={activePage} setActivePage={setActivePage} />
                            )}
                        </ul>
                    </div>
                </div>
                <div className="p-4 border-t border-neutral-800">
                    <button onClick={handleLogout} className="w-full flex items-center p-3 text-base font-normal rounded-lg text-neutral-300 hover:bg-red-800 hover:text-red-200 transition-all duration-200">
                        <LucideLogOut size={20} />
                        <span className="ml-3">Sair</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-black">
                {renderPage()}
            </main>
        </div>
    );
};


export default function App() {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists() && userDoc.data().status === 'approved') {
                        setUser(user);
                        setUserProfile(userDoc.data());
                    } else {
                        await signOut(auth);
                        setUser(null);
                        setUserProfile(null);
                    }
                } catch (error) {
                    console.error("Erro ao verificar o perfil do utilizador:", error);
                    await signOut(auth);
                    setUser(null);
                    setUserProfile(null);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    if (!isAuthReady) {
        return <Spinner />;
    }
    
    const GlobalStyles = () => (
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        
        html, body, #root {
          height: 100%;
          margin: 0;
          padding: 0;
        }

        body { 
          font-family: 'Copperplate Gothic', 'Cinzel', serif !important; 
          background-color: #000;
        }
      `}</style>
    );

    return (
        <>
            <GlobalStyles />
            {user ? <AppLayout user={user} userProfile={userProfile} /> : <LoginScreen />}
        </>
    );
}