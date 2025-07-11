// --- Dependências (assumindo que você as tenha no seu projeto) ---

import { initializeApp } from 'firebase/app';

import {

    getAuth,

    onAuthStateChanged,

    createUserWithEmailAndPassword,

    signInWithEmailAndPassword,

    signOut

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

    getDoc

} from 'firebase/firestore';

import {

    LucideClipboardEdit, LucideUsers, LucideHammer, LucideListOrdered,

    LucideBarChart3, LucidePlusCircle, LucideTrash2, LucideEdit, LucideSearch,

    LucidePrinter, LucideFileDown, LucideX, LucideCheckCircle, LucideClock,

    LucideDollarSign, LucideLogOut, LucideUserCheck, LucideBoxes, LucideAlertTriangle

} from 'lucide-react';



// --- Configuração do Firebase ---

// Lembre-se de criar um arquivo .env na raiz do seu projeto com suas chaves

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

    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">

        <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-${size} max-h-[90vh] flex flex-col`} role="dialog" aria-modal="true" aria-labelledby="modal-title">

            <header className="flex items-center justify-between p-4 border-b border-gray-200">

                <h2 id="modal-title" className="text-xl font-bold text-gray-800">{title}</h2>

                <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">

                    <LucideX size={24} />

                </button>

            </header>

            <main className="p-6 overflow-y-auto">

                {children}

            </main>

        </div>

    </div>

);



const Input = React.forwardRef(({ label, id, ...props }, ref) => (

    <div>

        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

        <input id={id} ref={ref} {...props} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200" />

    </div>

));



const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {

    const baseClasses = "px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {

        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-indigo-400',

        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 disabled:bg-gray-200',

        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400',

    };

    return <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</button>;

};



const Spinner = () => (

    <div className="flex justify-center items-center h-screen bg-gray-100">

        <div className="text-center">

            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">

                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>

            </svg>

            <p className="mt-4 text-gray-500">A carregar...</p>

        </div>

    </div>

);



const StatCard = ({ icon, label, value, color }) => (

    <div className={`bg-white p-6 rounded-2xl shadow-md flex items-center gap-4 border-l-4 ${color}`}>

        {icon}

        <div>

            <p className="text-3xl font-bold text-gray-800">{value}</p>

            <p className="text-gray-500">{label}</p>

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

            <h1 className="text-3xl font-bold text-gray-800">Painel de Controle</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <StatCard icon={<LucideClock size={40} className="text-yellow-500" />} label="Ordens Pendentes" value={pendingOrders.length} color="border-yellow-500" />

                <StatCard icon={<LucideHammer size={40} className="text-blue-500" />} label="Em Andamento" value={inProgressOrders.length} color="border-blue-500" />

                <StatCard icon={<LucideCheckCircle size={40} className="text-green-500" />} label="Ordens Concluídas" value={serviceOrders.filter(o => o.status === 'Concluído').length} color="border-green-500" />

            </div>



            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <h2 className="text-xl font-bold text-gray-700 mb-4">Próximas Entregas</h2>

                    {upcomingOrders.length > 0 ? (

                        <ul className="space-y-3">

                            {upcomingOrders.map(order => (

                                <li key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">

                                    <div>

                                        <p className="font-semibold text-gray-800">OS #{order.number} - {order.clientName}</p>

                                        <p className="text-sm text-gray-500">Entrega em: {new Date(order.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>

                                    </div>

                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :

                                            order.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :

                                                'bg-green-100 text-green-800'

                                        }`}>{order.status}</span>

                                </li>

                            ))}

                        </ul>

                    ) : (

                        <p className="text-center text-gray-500 py-4">Nenhuma entrega próxima.</p>

                    )}

                </div>



                <div className="bg-white p-6 rounded-2xl shadow-md">

                    <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">

                        <LucideAlertTriangle className="text-red-500" /> Alertas de Estoque Baixo

                    </h2>

                    {lowStockItems.length > 0 ? (

                        <ul className="space-y-3">

                            {lowStockItems.map(item => (

                                <li key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">

                                    <p className="font-semibold text-red-800">{item.itemName}</p>

                                    <p className="text-sm text-red-600">Restam: {item.quantity} {item.unit}</p>

                                </li>

                            ))}

                        </ul>

                    ) : (

                        <p className="text-center text-gray-500 py-4">Nenhum item com estoque baixo.</p>

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

                formData[field.name] = inputElement.value;

                if (field.type === 'number') {

                    formData[field.name] = parseFloat(formData[field.name]) || 0;

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

                <h1 className="text-3xl font-bold text-gray-800">{title}</h1>

                <div className="w-full md:w-auto flex gap-2">

                    <div className="relative w-full md:w-64">

                        <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />

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



            <div className="bg-white rounded-2xl shadow-md overflow-hidden">

                <div className="overflow-x-auto">

                    {filteredItems.length > 0 ? renderItem(filteredItems, handleOpenModal, handleDelete) : <p className="text-center p-8 text-gray-500">Nenhum item encontrado.</p>}

                </div>

            </div>



            {isModalOpen && (

                <Modal onClose={handleCloseModal} title={currentItem ? `Editar ${title.slice(0, -1)}` : `Adicionar ${title.slice(0, -1)}`}>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {fields.map(field => {

                            if (field.type === 'select') {

                                return (

                                    <div key={field.name}>

                                        <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>

                                        <select

                                            id={field.name}

                                            ref={el => formRef.current[field.name] = el}

                                            defaultValue={currentItem ? currentItem[field.name] : ''}

                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"

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

    const [availableServices, setAvailableServices] = useState([]);

    const [selectedServices, setSelectedServices] = useState(order ? order.services : []);

    const [totalValue, setTotalValue] = useState(order ? order.totalValue : 0);

    const [commissionValue, setCommissionValue] = useState(order ? order.commissionValue : 0);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState(order ? order.employeeId : '');

    const formRef = useRef({});



    useEffect(() => {

        const client = clients.find(c => c.id === selectedClientId);

        const priceTableId = client?.priceTableId;



        if (priceTableId) {

            const table = priceTables.find(pt => pt.id === priceTableId);

            if (table && table.services) {

                const servicesForTable = table.services.map(tableService => {

                    const globalService = services.find(s => s.id === tableService.serviceId);

                    return {

                        ...globalService,

                        id: tableService.serviceId,

                        name: tableService.serviceName,

                        displayPrice: tableService.customPrice,

                    };

                }).filter(s => s.id);

                setAvailableServices(servicesForTable);

            } else {

                setAvailableServices(services.map(s => ({ ...s, displayPrice: s.price })));

            }

        } else {

            setAvailableServices(services.map(s => ({ ...s, displayPrice: s.price })));

        }



        setSelectedServices([]);

    }, [selectedClientId, clients, priceTables, services]);



    useEffect(() => {

        const newTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);

        setTotalValue(newTotal);



        if (selectedEmployeeId) {

            const employee = employees.find(e => e.id === selectedEmployeeId);

            if (employee) {

                const commission = (newTotal * (employee.commission / 100));

                setCommissionValue(commission);

            }

        } else {

            setCommissionValue(0);

        }



    }, [selectedServices, selectedEmployeeId, employees]);



    const handleServiceToggle = (service) => {

        const serviceWithDetails = {

            id: service.id,

            name: service.name,

            price: service.displayPrice,

            toothNumber: '',

            color: ''

        };



        setSelectedServices(prev =>

            prev.some(s => s.id === service.id)

                ? prev.filter(s => s.id !== service.id)

                : [...prev, serviceWithDetails]

        );

    };



    const handleServiceDetailChange = (index, field, value) => {

        const updatedServices = [...selectedServices];

        updatedServices[index][field] = value;

        setSelectedServices(updatedServices);

    };



    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!userId) return;



        const employee = employees.find(emp => emp.id === selectedEmployeeId);

        const client = clients.find(c => c.id === selectedClientId);



        if (!client || !employee) {

            alert('Cliente e Funcionário são obrigatórios.');

            return;

        }



        const lastOrderNumber = orders.reduce((max, o) => Math.max(max, o.number || 0), 0);



        const orderData = {

            clientId: client.id,

            clientName: client.name,

            client: client,

            patientName: formRef.current.patientName.value,

            employeeId: employee.id,

            employeeName: employee.name,

            employee: employee,

            openDate: formRef.current.openDate.value,

            deliveryDate: formRef.current.deliveryDate.value,

            completionDate: formRef.current.completionDate.value || null,

            status: formRef.current.status.value,

            services: selectedServices,

            totalValue,

            commissionPercentage: employee.commission,

            commissionValue,

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

        } catch (error) {

            console.error("Error saving service order: ", error);

        }

    };



    return (

        <Modal onClose={onClose} title={order ? `Editar O.S. #${order.number}` : 'Nova Ordem de Serviço'} size="5xl">

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="space-y-4">

                        <div>

                            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">Cliente (Dentista/Clínica)</label>

                            <select id="clientId" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required>

                                <option value="">Selecione um cliente</option>

                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}

                            </select>

                        </div>

                        <div>

                            <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">Funcionário Responsável</label>

                            <select

                                id="employeeId"

                                value={selectedEmployeeId}

                                onChange={e => setSelectedEmployeeId(e.target.value)}

                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required>

                                <option value="">Selecione um funcionário</option>

                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}

                            </select>

                        </div>

                    </div>

                    <div className="space-y-4">

                        <Input label="Nome do Paciente" id="patientName" type="text" ref={el => formRef.current.patientName = el} defaultValue={order?.patientName} required />

                        <div className="grid grid-cols-2 gap-4">

                            <Input label="Data de Abertura" id="openDate" type="date" ref={el => formRef.current.openDate = el} defaultValue={order?.openDate} required />

                            <Input label="Data Prev. Entrega" id="deliveryDate" type="date" ref={el => formRef.current.deliveryDate = el} defaultValue={order?.deliveryDate} required />

                        </div>

                    </div>

                </div>



                <div className="grid grid-cols-2 gap-6">

                    <div>

                        <h3 className="text-lg font-medium text-gray-800 mb-2">Serviços Disponíveis</h3>

                        {clients.find(c => c.id === selectedClientId)?.priceTableId && <p className="text-sm text-indigo-600 mb-2">A aplicar preços da tabela: <strong>{priceTables.find(pt => pt.id === clients.find(c => c.id === selectedClientId)?.priceTableId)?.name}</strong></p>}

                        <div className="max-h-60 overflow-y-auto p-3 bg-gray-50 border rounded-lg">

                            {availableServices.map(service => (

                                <label key={service.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-200 cursor-pointer transition-colors">

                                    <input

                                        type="checkbox"

                                        checked={selectedServices.some(s => s.id === service.id)}

                                        onChange={() => handleServiceToggle(service)}

                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"

                                    />

                                    <span className="flex-1 text-sm text-gray-700">{service.name}</span>

                                    <span className={`text-sm font-semibold ${service.displayPrice !== service.price ? 'text-indigo-600' : 'text-gray-600'}`}>R$ {service.displayPrice?.toFixed(2)}</span>

                                </label>

                            ))}

                        </div>

                    </div>

                    <div>

                        <h3 className="text-lg font-medium text-gray-800 mb-2">Serviços Selecionados</h3>

                        <div className="max-h-60 overflow-y-auto p-3 bg-white border rounded-lg space-y-2">

                            {selectedServices.map((service, index) => (

                                <div key={service.id} className="grid grid-cols-5 gap-2 items-center">

                                    <span className="col-span-2 text-sm text-gray-800">{service.name}</span>

                                    <Input type="text" placeholder="Dente" value={service.toothNumber} onChange={(e) => handleServiceDetailChange(index, 'toothNumber', e.target.value)} />

                                    <Input type="text" placeholder="Cor" value={service.color} onChange={(e) => handleServiceDetailChange(index, 'color', e.target.value)} />

                                    <button type="button" onClick={() => handleServiceToggle(service)} className="text-red-500 hover:text-red-700 p-1 justify-self-center"><LucideTrash2 size={16} /></button>

                                </div>

                            ))}

                            {selectedServices.length === 0 && <p className="text-xs text-center text-gray-400 py-4">Nenhum serviço selecionado.</p>}

                        </div>

                    </div>

                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>

                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>

                        <select id="status" ref={el => formRef.current.status = el} defaultValue={order?.status || 'Pendente'} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required>

                            <option>Pendente</option>

                            <option>Em Andamento</option>

                            <option>Concluído</option>

                            <option>Cancelado</option>

                        </select>

                    </div>

                    <Input label="Data de Conclusão" id="completionDate" type="date" ref={el => formRef.current.completionDate = el} defaultValue={order?.completionDate} />

                </div>



                <div>

                    <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>

                    <textarea id="observations" ref={el => formRef.current.observations = el} defaultValue={order?.observations} rows="3" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>

                </div>



                <div className="bg-indigo-50 p-4 rounded-lg text-right">

                    <p className="text-sm text-gray-600">Comissão ({employees.find(e => e.id === selectedEmployeeId)?.commission || 0}%): <span className="font-semibold">R$ {commissionValue.toFixed(2)}</span></p>

                    <p className="text-xl font-bold text-indigo-800">Total: R$ {totalValue.toFixed(2)}</p>

                </div>



                <div className="flex justify-end gap-3 pt-4">

                    <Button type="button" onClick={onClose} variant="secondary">Cancelar</Button>

                    <Button type="submit" variant="primary">Salvar Ordem de Serviço</Button>

                </div>

            </form>

        </Modal>

    )

};



const ServiceOrders = ({ userId, services, clients, employees, orders, priceTables }) => {

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [currentOrder, setCurrentOrder] = useState(null);

    const [filter, setFilter] = useState('Todos');

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



    const handleMarkAsPaid = async (orderId, isPaid) => {

        if (!userId) return;

        const docRef = doc(db, `artifacts/${appId}/users/${userId}/serviceOrders`, orderId);

        try {

            await updateDoc(docRef, { isPaid });

            const orderNumber = orders.find(o => o.id === orderId).number;

            alert(`O.S. #${orderNumber} marcada como ${isPaid ? 'Paga' : 'Não Paga'}.`);

        } catch (error) {

            console.error("Erro ao atualizar status de pagamento: ", error);

            alert("Não foi possível atualizar o status de pagamento.");

        }

    };





    const generatePdf = (action = 'print') => {

        // Esta função depende das bibliotecas html2canvas e jspdf carregadas globalmente

        // Ex: <script src=".../html2canvas.min.js"></script> <script src=".../jspdf.umd.min.js"></script> no seu index.html

        const input = printRef.current;

        if (!input || !window.html2canvas || !window.jspdf) {

            alert('Não foi possível gerar o PDF. Bibliotecas necessárias não encontradas.');

            return;

        }



        const commissionEl = input.querySelector('#commission-to-hide');

        const totalEl = input.querySelector('#total-to-hide');



        if (commissionEl) commissionEl.style.visibility = 'hidden';

        if (totalEl) totalEl.style.visibility = 'hidden';



        window.html2canvas(input, { scale: 2 }).then(canvas => {

            if (commissionEl) commissionEl.style.visibility = 'visible';

            if (totalEl) totalEl.style.visibility = 'visible';



            const imgData = canvas.toDataURL('image/png');

            const { jsPDF } = window.jspdf;

            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth();

            const ratio = canvas.width / canvas.height;

            const width = pdfWidth - 20;

            const height = width / ratio;

            pdf.addImage(imgData, 'PNG', 10, 10, width, height);



            if (action === 'print') {

                pdf.autoPrint();

                window.open(pdf.output('bloburl'), '_blank');

            } else {

                pdf.save(`OS_${currentOrder.number}.pdf`);

            }

        }).catch(err => {

            if (commissionEl) commissionEl.style.visibility = 'visible';

            if (totalEl) totalEl.style.visibility = 'visible';

            console.error("Error generating PDF:", err);

            alert("Ocorreu um erro ao gerar o PDF.");

        });

    };



    const handlePrint = () => generatePdf('print');

    const handleSaveAsPdf = () => generatePdf('save');



    const handleStatusChange = async (orderId, newStatus) => {

        if (!userId) return;

        const docRef = doc(db, `artifacts/${appId}/users/${userId}/serviceOrders`, orderId);

        try {

            const updateData = { status: newStatus };

            if (newStatus === 'Concluído') {

                updateData.completionDate = new Date().toISOString().split('T')[0];

            }

            await updateDoc(docRef, updateData);

        } catch (error) {

            console.error("Error updating status: ", error);

        }

    };



    const getStatusClasses = (status) => {

        switch (status) {

            case 'Concluído': return 'bg-green-100 text-green-800';

            case 'Pendente': return 'bg-yellow-100 text-yellow-800';

            case 'Em Andamento': return 'bg-blue-100 text-blue-800';

            case 'Cancelado': return 'bg-red-100 text-red-800';

            default: return 'bg-gray-100 text-gray-800';

        }

    };



    const filteredOrders = orders.filter(order => filter === 'Todos' || order.status === filter);



    return (

        <div className="animate-fade-in">

            <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">

                <h1 className="text-3xl font-bold text-gray-800">Ordens de Serviço</h1>

                <div className="w-full md:w-auto flex items-center gap-2">

                    <select

                        value={filter}

                        onChange={(e) => setFilter(e.target.value)}

                        className="w-full md:w-auto bg-white border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"

                    >

                        <option>Todos</option>

                        <option>Pendente</option>

                        <option>Em Andamento</option>

                        <option>Concluído</option>

                        <option>Cancelado</option>

                    </select>

                    <Button onClick={() => handleOpenModal()}>

                        <LucidePlusCircle size={20} />

                        Nova O.S.

                    </Button>

                </div>

            </header>



            <div className="bg-white rounded-2xl shadow-md overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full text-sm text-left text-gray-500">

                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">

                            <tr>

                                <th scope="col" className="px-6 py-3">Nº O.S.</th>

                                <th scope="col" className="px-6 py-3">Cliente</th>

                                <th scope="col" className="px-6 py-3">Paciente</th>

                                <th scope="col" className="px-6 py-3">Responsável</th>

                                <th scope="col" className="px-6 py-3">Data Entrega</th>

                                <th scope="col" className="px-6 py-3">Status</th>

                                <th scope="col" className="px-6 py-3 text-center">Ações</th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredOrders.map(order => (

                                <tr key={order.id} className="bg-white border-b hover:bg-gray-50">

                                    <td className="px-6 py-4 font-medium text-gray-900">#{order.number}</td>

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

                                            <button onClick={() => handleOpenViewModal(order)} title="Visualizar" className="text-indigo-600 hover:text-indigo-900 p-1"><LucideSearch size={18} /></button>

                                            <button onClick={() => handleOpenModal(order)} title="Editar" className="text-blue-600 hover:text-blue-900 p-1"><LucideEdit size={18} /></button>

                                            <button onClick={() => handleDelete(order.id)} title="Excluir" className="text-red-600 hover:text-red-900 p-1"><LucideTrash2 size={18} /></button>

                                            {order.status === 'Concluído' && (

                                                <button onClick={() => handleMarkAsPaid(order.id, !order.isPaid)}

                                                    title={order.isPaid ? 'Marcar como Não Pago' : 'Marcar como Pago'}

                                                    className={`p-1 rounded-full ${order.isPaid ? 'text-green-600 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'}`}>

                                                    <LucideDollarSign size={18} />

                                                </button>

                                            )}

                                        </div>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                    {filteredOrders.length === 0 && <p className="text-center p-8 text-gray-500">Nenhuma ordem de serviço encontrada para este filtro.</p>}

                </div>

            </div>



            {isModalOpen && <OrderFormModal onClose={handleCloseModal} order={currentOrder} userId={userId} services={services} clients={clients} employees={employees} orders={orders} priceTables={priceTables} />}

            {isViewModalOpen && (

                <Modal onClose={handleCloseModal} title={`Detalhes da O.S. #${currentOrder?.number}`}>

                    <div ref={printRef} className="p-4 bg-white text-gray-800">

                        <div className="border-b-2 pb-4 mb-4 border-gray-200">

                            <h2 className="text-2xl font-bold text-indigo-600">Ordem de Serviço #{currentOrder.number}</h2>

                            <p className="text-sm text-gray-500">Data de Abertura: {new Date(currentOrder.openDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>

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

                                <h3 className="font-bold mb-2 border-b">Responsável</h3>

                                <p><strong>Nome:</strong> {currentOrder.employee.name}</p>

                                <p><strong>Cargo:</strong> {currentOrder.employee.role}</p>

                                <h3 className="font-bold mb-2 mt-4 border-b">Datas</h3>

                                <p><strong>Prev. Entrega:</strong> {new Date(currentOrder.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>

                                <p><strong>Conclusão:</strong> {currentOrder.completionDate ? new Date(currentOrder.completionDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '---'}</p>

                            </div>

                        </div>

                        <h3 className="font-bold mb-2 border-b">Serviços Solicitados</h3>

                        <table className="w-full text-left mb-6">

                            <thead className="bg-gray-100">

                                <tr>

                                    <th className="p-2">Serviço</th>

                                    <th className="p-2">Dente</th>

                                    <th className="p-2">Cor</th>

                                    <th className="p-2 text-right">Valor</th>

                                </tr>

                            </thead>

                            <tbody>

                                {currentOrder.services.map((service, index) => (

                                    <tr key={index} className="border-b">

                                        <td className="p-2">{service.name}</td>

                                        <td className="p-2">{service.toothNumber || '-'}</td>

                                        <td className="p-2">{service.color || '-'}</td>

                                        <td className="p-2 text-right">R$ {service.price.toFixed(2)}</td>

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

                                <p id="commission-to-hide"><strong>Comissão ({currentOrder.commissionPercentage}%):</strong> R$ {currentOrder.commissionValue.toFixed(2)}</p>

                                <p id="total-to-hide" className="text-lg font-bold"><strong>Valor Total:</strong> R$ {currentOrder.totalValue.toFixed(2)}</p>

                                <p className="font-bold mt-2"><strong>Status:</strong> {currentOrder.status}</p>

                            </div>

                        </div>

                    </div>

                    <footer className="flex justify-end gap-3 pt-4 border-t mt-4 p-4">

                        <Button onClick={handleSaveAsPdf}><LucideFileDown size={18} /> Salvar PDF</Button>

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



    const handleGenerateReport = () => {

        let data = [];

        if (reportType === 'completedByPeriod') {

            data = orders.filter(o => {

                const completed = o.status === 'Concluído' && o.completionDate;

                if (!completed) return false;

                const completionDate = new Date(o.completionDate);

                const start = startDate ? new Date(startDate) : null;

                const end = endDate ? new Date(endDate) : null;

                if (end) end.setDate(end.getDate() + 1);

                if (start && completionDate < start) return false;

                if (end && completionDate > end) return false;

                return true;

            });

        } else if (reportType === 'commissionsByEmployee') {

            data = orders.filter(o => {

                if (selectedEmployee === '') return false;

                if (o.employeeId !== selectedEmployee) return false;

                const completed = o.status === 'Concluído' && o.completionDate;

                if (!completed) return false;

                const completionDate = new Date(o.completionDate);

                const start = startDate ? new Date(startDate) : null;

                const end = endDate ? new Date(endDate) : null;

                if (end) end.setDate(end.getDate() + 1);

                if (start && completionDate < start) return false;

                if (end && completionDate > end) return false;

                return true;

            });

        } else if (reportType === 'ordersByClient') {

            data = orders.filter(o => {

                if (selectedClient === '') return false;

                if (o.clientId !== selectedClient) return false;



                const openDate = new Date(o.openDate);

                const start = startDate ? new Date(startDate) : null;

                const end = endDate ? new Date(endDate) : null;

                if (end) end.setDate(end.getDate() + 1);



                if (start && openDate < start) return false;

                if (end && openDate > end) return false;

                return true;

            });

        }

        setResults(data);

    };



    const totalCommission = reportType === 'commissionsByEmployee'

        ? results.reduce((sum, order) => sum + order.commissionValue, 0)

        : 0;



    const totalValue = results.reduce((sum, order) => sum + order.totalValue, 0);



    return (

        <div className="animate-fade-in">

            <h1 className="text-3xl font-bold text-gray-800 mb-6">Relatórios</h1>

            <div className="bg-white p-6 rounded-2xl shadow-md mb-6">

                <h2 className="text-xl font-bold text-gray-700 mb-4">Gerar Relatório</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

                    <div>

                        <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Relatório</label>

                        <select id="reportType" value={reportType} onChange={e => { setReportType(e.target.value); setResults([]); }} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">

                            <option value="completedByPeriod">Serviços Concluídos</option>

                            <option value="commissionsByEmployee">Comissões por Funcionário</option>

                            <option value="ordersByClient">Ordens por Cliente</option>

                        </select>

                    </div>

                    {reportType === 'commissionsByEmployee' && (

                        <div>

                            <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>

                            <select id="employee" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">

                                <option value="">Selecione...</option>

                                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}

                            </select>

                        </div>

                    )}

                    {reportType === 'ordersByClient' && (

                        <div>

                            <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>

                            <select id="client" value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">

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



            <div className="bg-white p-6 rounded-2xl shadow-md">

                <div className="flex justify-between items-center mb-4">

                    <h2 className="text-xl font-bold text-gray-700">Resultados</h2>

                    {/* Botão de impressão pode ser adicionado aqui */}

                </div>

                <div ref={reportPrintRef}>

                    {results.length > 0 ? (

                        <table className="w-full text-sm text-left text-gray-500">

                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">

                                <tr>

                                    <th scope="col" className="px-6 py-3">Nº O.S.</th>

                                    <th scope="col" className="px-6 py-3">Cliente</th>

                                    <th scope="col" className="px-6 py-3">Data</th>

                                    <th scope="col" className="px-6 py-3">Responsável</th>

                                    <th scope="col" className="px-6 py-3 text-right">Valor Total</th>

                                    {reportType === 'commissionsByEmployee' && <th scope="col" className="px-6 py-3 text-right">Comissão</th>}

                                </tr>

                            </thead>

                            <tbody>

                                {results.map(order => (

                                    <tr key={order.id} className="bg-white border-b hover:bg-gray-50">

                                        <td className="px-6 py-4 font-medium">#{order.number}</td>

                                        <td className="px-6 py-4">{order.clientName}</td>

                                        <td className="px-6 py-4">{new Date(reportType.includes('ByPeriod') || reportType.includes('ByEmployee') ? order.completionDate : order.openDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>

                                        <td className="px-6 py-4">{order.employeeName}</td>

                                        <td className="px-6 py-4 text-right font-bold">R$ {order.totalValue.toFixed(2)}</td>

                                        {reportType === 'commissionsByEmployee' && <td className="px-6 py-4 text-right">R$ {order.commissionValue.toFixed(2)}</td>}

                                    </tr>

                                ))}

                            </tbody>

                            <tfoot className="font-bold bg-gray-100">

                                <tr>

                                    <td colSpan={reportType === 'commissionsByEmployee' ? 4 : 4} className="px-6 py-3 text-right uppercase">Total:</td>

                                    <td className="px-6 py-3 text-right">R$ {totalValue.toFixed(2)}</td>

                                    {reportType === 'commissionsByEmployee' && <td className="px-6 py-3 text-right">R$ {totalCommission.toFixed(2)}</td>}

                                </tr>

                            </tfoot>

                        </table>

                    ) : (

                        <p className="text-center text-gray-500 py-4">Nenhum resultado para os filtros selecionados.</p>

                    )}

                </div>

            </div>

        </div>

    );

};



const PriceTables = ({ userId, services }) => {

    // ... (O código deste componente permanece o mesmo da resposta anterior)

    return <div className="animate-fade-in">Página de Tabelas de Preços (código omitido por brevidade, mas deve ser inserido aqui).</div>;

};



const UserManagement = ({ userId }) => {

    // ... (O código deste componente permanece o mesmo da resposta anterior)

    return <div className="animate-fade-in">Página de Gestão de Utilizadores (código omitido por brevidade, mas deve ser inserido aqui).</div>;

};



// --- NOVO COMPONENTE FINANCEIRO ---



const PaymentForm = ({ onSubmit, payment }) => {

    const [description, setDescription] = useState(payment?.description || '');

    const [amount, setAmount] = useState(payment?.amount || '');

    const [category, setCategory] = useState(payment?.category || 'Materiais');

    const [paymentDate, setPaymentDate] = useState(payment?.paymentDate || new Date().toISOString().split('T')[0]);



    const handleSubmit = (e) => {

        e.preventDefault();

        onSubmit({

            description,

            amount: parseFloat(amount),

            category,

            paymentDate

        });

    };



    return (

        <form onSubmit={handleSubmit} className="space-y-4">

            <Input label="Descrição" value={description} onChange={e => setDescription(e.target.value)} required />

            <Input label="Valor (R$)" type="number" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" />

            <div>

                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>

                <select id="category" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">

                    <option>Materiais</option>

                    <option>Salários</option>

                    <option>Fornecedores (Dentais)</option>

                    <option>Contas (Água, Luz, etc.)</option>

                    <option>Impostos</option>

                    <option>Outros</option>

                </select>

            </div>

            <Input label="Data do Pagamento" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />

            <div className="flex justify-end gap-3 pt-4">

                <Button type="submit" variant="primary">Salvar</Button>

            </div>

        </form>

    );

}



const Financials = ({ userId, orders, employees, clients }) => {

    const [activeTab, setActiveTab] = useState('summary');

    const [payments, setPayments] = useState([]);

    const [receivables, setReceivables] = useState([]);

    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

    const [currentPayment, setCurrentPayment] = useState(null);



    useEffect(() => {

        if (!userId) return;



        const paymentsQuery = query(collection(db, `artifacts/${appId}/users/${userId}/payments`));

        const paymentsUnsubscribe = onSnapshot(paymentsQuery, (snapshot) => {

            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setPayments(data);

        });



        const paidOrders = orders.filter(o => o.status === 'Concluído' && o.isPaid);

        setReceivables(paidOrders);



        return () => paymentsUnsubscribe();

    }, [userId, orders]);



    const handleOpenPaymentModal = (payment = null) => {

        setCurrentPayment(payment);

        setPaymentModalOpen(true);

    };



    const handleClosePaymentModal = () => {

        setCurrentPayment(null);

        setPaymentModalOpen(false);

    };



    const handleSavePayment = async (paymentData) => {

        try {

            const collectionRef = collection(db, `artifacts/${appId}/users/${userId}/payments`);

            if (currentPayment) {

                const docRef = doc(db, collectionRef.path, currentPayment.id);

                await updateDoc(docRef, paymentData);

            } else {

                await addDoc(collectionRef, { ...paymentData, createdAt: serverTimestamp() });

            }

            handleClosePaymentModal();

        } catch (error) {

            console.error("Erro ao salvar pagamento:", error);

            alert("Falha ao salvar pagamento.");

        }

    };



    const handleDeletePayment = async (paymentId) => {

        if (window.confirm('Tem certeza que deseja excluir este pagamento?')) {

            try {

                const docRef = doc(db, `artifacts/${appId}/users/${userId}/payments`, paymentId);

                await deleteDoc(docRef);

            } catch (error) {

                console.error("Erro ao excluir pagamento:", error);

            }

        }

    };



    const markOrderAsPaid = async (order, isPaid) => {

        if (!userId) return;

        const docRef = doc(db, `artifacts/${appId}/users/${userId}/serviceOrders`, order.id);

        try {

            await updateDoc(docRef, { isPaid: isPaid });

        } catch (error) {

            console.error("Erro ao atualizar status de pagamento da O.S.:", error);

        }

    };



    const totalReceived = receivables.reduce((sum, r) => sum + r.totalValue, 0);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const balance = totalReceived - totalPaid;



    const renderContent = () => {

        switch (activeTab) {

            case 'receivables':

                const unpaidOrders = orders.filter(o => o.status === 'Concluído' && !o.isPaid);

                const paidOrders = receivables;

                return (

                    <div className="space-y-6">

                        <div>

                            <h3 className="text-xl font-bold text-gray-700 mb-4">Contas a Receber (O.S. Concluídas)</h3>

                            <div className="bg-white rounded-2xl shadow-md p-4">

                                {unpaidOrders.length > 0 ? unpaidOrders.map(order => (

                                    <div key={order.id} className="flex justify-between items-center p-3 border-b last:border-b-0 hover:bg-gray-50">

                                        <span>O.S. #{order.number} - {order.clientName} (<span className="font-semibold">R$ {order.totalValue.toFixed(2)}</span>)</span>

                                        <Button onClick={() => markOrderAsPaid(order, true)}>Marcar como Recebido</Button>

                                    </div>

                                )) : <p className="text-gray-500 text-center py-4">Nenhuma conta pendente.</p>}

                            </div>

                        </div>



                        <div>

                            <h3 className="text-xl font-bold text-gray-700 mb-4">Recebimentos Efetuados</h3>

                            <div className="bg-white rounded-2xl shadow-md p-4">

                                {paidOrders.map(order => (

                                    <div key={order.id} className="flex justify-between items-center p-3 border-b last:border-b-0 hover:bg-gray-50">

                                        <div>

                                            <p>O.S. #{order.number} - {order.clientName}</p>

                                            <p className="text-sm text-gray-500">Concluído em: {new Date(order.completionDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>

                                        </div>

                                        <div className="flex items-center gap-4">

                                            <span className="font-bold text-green-600">R$ {order.totalValue.toFixed(2)}</span>

                                            <Button onClick={() => markOrderAsPaid(order, false)} variant="secondary">Desfazer</Button>

                                        </div>

                                    </div>

                                ))}

                                {paidOrders.length === 0 && <p className="text-gray-500 text-center py-4">Nenhum recebimento registrado.</p>}

                            </div>

                        </div>

                    </div>

                );

            case 'payments':

                return (

                    <div>

                        <div className="flex justify-between items-center mb-4">

                            <h3 className="text-xl font-bold text-gray-700">Pagamentos Efetuados</h3>

                            <Button onClick={() => handleOpenPaymentModal()}><LucidePlusCircle size={18} /> Novo Pagamento</Button>

                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-4">

                            {payments.map(p => (

                                <div key={p.id} className="grid grid-cols-5 gap-4 items-center p-3 border-b last:border-b-0 hover:bg-gray-50">

                                    <span className="col-span-2">{p.description}</span>

                                    <span className="text-sm text-gray-500">{p.category}</span>

                                    <span className="font-bold text-red-600 text-right">- R$ {p.amount.toFixed(2)}</span>

                                    <div className="flex justify-end gap-2">

                                        <button onClick={() => handleOpenPaymentModal(p)} title="Editar" className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><LucideEdit size={18} /></button>

                                        <button onClick={() => handleDeletePayment(p.id)} title="Excluir" className="p-2 text-red-600 hover:bg-red-100 rounded-full"><LucideTrash2 size={18} /></button>

                                    </div>

                                </div>

                            ))}

                            {payments.length === 0 && <p className="text-gray-500 text-center py-4">Nenhum pagamento registrado.</p>}

                        </div>

                    </div>

                );

            default: // summary

                return (

                    <div className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                            <StatCard icon={<LucideDollarSign size={40} className="text-green-500" />} label="Total Recebido" value={`R$ ${totalReceived.toFixed(2)}`} color="border-green-500" />

                            <StatCard icon={<LucideDollarSign size={40} className="text-red-500" />} label="Total Pago" value={`R$ ${totalPaid.toFixed(2)}`} color="border-red-500" />

                            <StatCard icon={<LucideDollarSign size={40} className={balance >= 0 ? "text-blue-500" : "text-gray-500"} />} label="Saldo" value={`R$ ${balance.toFixed(2)}`} color={balance >= 0 ? "border-blue-500" : "border-gray-500"} />

                        </div>

                    </div>

                );

        }

    };



    return (

        <div className="animate-fade-in">

            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão Financeira</h1>

            <div className="mb-6">

                <div className="border-b border-gray-200">

                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">

                        <button onClick={() => setActiveTab('summary')} className={`${activeTab === 'summary' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>

                            Resumo

                        </button>

                        <button onClick={() => setActiveTab('receivables')} className={`${activeTab === 'receivables' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>

                            Recebimentos

                        </button>

                        <button onClick={() => setActiveTab('payments')} className={`${activeTab === 'payments' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>

                            Pagamentos

                        </button>

                    </nav>

                </div>

            </div>



            {renderContent()}



            {isPaymentModalOpen && (

                <Modal onClose={handleClosePaymentModal} title={currentPayment ? "Editar Pagamento" : "Novo Pagamento"}>

                    <PaymentForm onSubmit={handleSavePayment} payment={currentPayment} />

                </Modal>

            )}

        </div>

    );

};





// --- Tela de Autenticação ---

const LoginScreen = () => {

    const [isLogin, setIsLogin] = useState(true);

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

                await setDoc(doc(db, "users", user.uid), {

                    email: user.email,

                    uid: user.uid,

                    status: 'pending',

                    role: 'user',

                    createdAt: serverTimestamp()

                });

                await signOut(auth);

                setMessage('Registo concluído! A sua conta está agora pendente de aprovação pelo administrador.');

            } catch (err) {

                switch (err.code) {

                    case 'auth/invalid-email':

                        setError('Formato de e-mail inválido.');

                        break;

                    case 'auth/email-already-in-use':

                        setError('Este e-mail já está a ser utilizado.');

                        break;

                    case 'auth/weak-password':

                        setError('A senha deve ter pelo menos 6 caracteres.');

                        break;

                    default:

                        setError('Ocorreu um erro. Tente novamente.');

                }

            }

        }

        setLoading(false);

    };



    return (

        <div className="flex items-center justify-center min-h-screen bg-gray-100">

            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">

                <div className="text-center">

                    <LucideClipboardEdit className="h-12 w-12 text-indigo-600 mx-auto" />

                    <h1 className="text-3xl font-bold text-gray-800 mt-2">Gestor Próteses</h1>

                    <p className="text-gray-500">{isLogin ? 'Faça login para continuar' : 'Crie a sua conta'}</p>

                </div>

                {message ? (

                    <p className="text-green-600 bg-green-50 p-4 rounded-lg text-center">{message}</p>

                ) : (

                    <form onSubmit={handleAuth} className="space-y-6">

                        <Input label="Email" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />

                        <Input label="Senha" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <Button type="submit" className="w-full" disabled={loading}>

                            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}

                        </Button>

                    </form>

                )}

                <p className="text-center text-sm text-gray-600">

                    {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}

                    <button onClick={() => { setIsLogin(!isLogin); setError(''); setMessage('') }} className="font-medium text-indigo-600 hover:text-indigo-500 ml-1">

                        {isLogin ? 'Cadastre-se' : 'Faça login'}

                    </button>

                </p>

            </div>

        </div>

    );

};





// --- Layout Principal da Aplicação ---

const AppLayout = ({ user, userProfile }) => {

    const [activePage, setActivePage] = useState('dashboard');

    const [clients, setClients] = useState([]);

    const [employees, setEmployees] = useState([]);

    const [services, setServices] = useState([]);

    const [serviceOrders, setServiceOrders] = useState([]);

    const [priceTables, setPriceTables] = useState([]);

    const [inventory, setInventory] = useState([]);



    useEffect(() => {

        if (!user) return;

        const collections = {

            clients: setClients,

            employees: setEmployees,

            services: setServices,

            serviceOrders: setServiceOrders,

            priceTables: setPriceTables,

            inventory: setInventory

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

                                <div key={item.id} className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col justify-between">

                                    <div>

                                        <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>

                                        <p className="text-sm text-gray-500">{item.phone}</p>

                                        <p className="text-sm text-gray-500 truncate">{priceTables.find(pt => pt.id === item.priceTableId)?.name || 'Preço Padrão'}</p>

                                    </div>

                                    <div className="flex justify-end gap-2 mt-4">

                                        <button onClick={() => onEdit(item)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><LucideEdit size={18} /></button>

                                        <button onClick={() => onDelete(item.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><LucideTrash2 size={18} /></button>

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

                        { name: 'commission', label: 'Comissão (%)', type: 'number', required: true },

                    ]}

                    renderItem={(items, onEdit, onDelete) => (

                        <table className="w-full text-sm text-left text-gray-500">

                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">

                                <tr>

                                    <th scope="col" className="px-6 py-3">Nome</th>

                                    <th scope="col" className="px-6 py-3">Cargo</th>

                                    <th scope="col" className="px-6 py-3">Comissão</th>

                                    <th scope="col" className="px-6 py-3 text-center">Ações</th>

                                </tr>

                            </thead>

                            <tbody>

                                {items.map(item => (

                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">

                                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>

                                        <td className="px-6 py-4">{item.role}</td>

                                        <td className="px-6 py-4">{item.commission}%</td>

                                        <td className="px-6 py-4 text-center">

                                            <div className="flex justify-center items-center gap-2">

                                                <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 p-1"><LucideEdit size={18} /></button>

                                                <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900 p-1"><LucideTrash2 size={18} /></button>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    )}

                />;

            case 'services':

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

                        <table className="w-full text-sm text-left text-gray-500">

                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">

                                <tr>

                                    <th scope="col" className="px-6 py-3">Serviço</th>

                                    <th scope="col" className="px-6 py-3">Material</th>

                                    <th scope="col" className="px-6 py-3 text-right">Preço Padrão</th>

                                    <th scope="col" className="px-6 py-3 text-center">Ações</th>

                                </tr>

                            </thead>

                            <tbody>

                                {items.map(item => (

                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">

                                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>

                                        <td className="px-6 py-4">{item.material}</td>

                                        <td className="px-6 py-4 text-right font-semibold">R$ {item.price?.toFixed(2)}</td>

                                        <td className="px-6 py-4 text-center">

                                            <div className="flex justify-center items-center gap-2">

                                                <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 p-1"><LucideEdit size={18} /></button>

                                                <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900 p-1"><LucideTrash2 size={18} /></button>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

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

                        <table className="w-full text-sm text-left text-gray-500">

                            <thead className="text-xs text-gray-700 uppercase bg-gray-100">

                                <tr>

                                    <th scope="col" className="px-6 py-3">Item</th>

                                    <th scope="col" className="px-6 py-3">Fornecedor</th>

                                    <th scope="col" className="px-6 py-3">Quantidade</th>

                                    <th scope="col" className="px-6 py-3 text-center">Ações</th>

                                </tr>

                            </thead>

                            <tbody>

                                {items.map(item => (

                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">

                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">

                                            {item.itemName}

                                            {item.quantity <= item.lowStockThreshold &&

                                                <LucideAlertTriangle size={16} className="text-red-500" title="Estoque baixo!" />

                                            }

                                        </td>

                                        <td className="px-6 py-4">{item.supplier}</td>

                                        <td className="px-6 py-4">{item.quantity} {item.unit}</td>

                                        <td className="px-6 py-4 text-center">

                                            <div className="flex justify-center items-center gap-2">

                                                <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 p-1"><LucideEdit size={18} /></button>

                                                <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900 p-1"><LucideTrash2 size={18} /></button>

                                            </div>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    )}

                />;

            case 'price-tables':

                return <PriceTables userId={user.uid} services={services} />;

            case 'service-orders':

                return <ServiceOrders userId={user.uid} services={services} clients={clients} employees={employees} orders={serviceOrders} priceTables={priceTables} />;

            case 'financials': // NOVO

                return <Financials userId={user.uid} orders={serviceOrders} employees={employees} clients={clients} />;

            case 'reports':

                return <Reports orders={serviceOrders} employees={employees} clients={clients} />;

            case 'user-management':

                return <UserManagement userId={user.uid} />;

            default:

                return <div>Página não encontrada</div>;

        }

    };



    const NavItem = ({ icon, label, page, activePage, setActivePage }) => (

        <li>

            <a

                href="#"

                onClick={(e) => { e.preventDefault(); setActivePage(page); }}

                className={`flex items-center p-3 text-base font-normal rounded-lg transition-all duration-200 ${activePage === page

                        ? 'bg-indigo-600 text-white shadow-lg'

                        : 'text-gray-600 hover:bg-gray-100'

                    }`}

            >

                {icon}

                <span className="ml-3 flex-1 whitespace-nowrap">{label}</span>

            </a>

        </li>

    );



    return (

        <div className="flex h-screen bg-gray-100 font-sans">

            <aside className="w-64 bg-white shadow-lg flex-shrink-0 flex flex-col">

                <div>

                    <div className="flex items-center justify-center h-20 border-b">

                        <LucideClipboardEdit className="h-8 w-8 text-indigo-600" />

                        <h1 className="text-xl font-bold text-gray-800 ml-2">Gestor Próteses</h1>

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

                            <NavItem icon={<LucideBarChart3 />} label="Relatórios" page="reports" activePage={activePage} setActivePage={setActivePage} />

                            {userProfile?.role === 'admin' && (

                                <NavItem icon={<LucideUserCheck />} label="Gerir Utilizadores" page="user-management" activePage={activePage} setActivePage={setActivePage} />

                            )}

                        </ul>

                    </div>

                </div>

                <div className="mt-auto p-4 border-t">

                    <button onClick={handleLogout} className="w-full flex items-center p-3 text-base font-normal rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200">

                        <LucideLogOut size={20} />

                        <span className="ml-3">Sair</span>

                    </button>

                </div>

            </aside>

            <main className="flex-1 p-6 md:p-10 overflow-y-auto">

                {renderPage()}

            </main>

        </div>

    );

};





// --- Ponto de Entrada da Aplicação ---

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



    return user ? <AppLayout user={user} userProfile={userProfile} /> : <LoginScreen />;

}