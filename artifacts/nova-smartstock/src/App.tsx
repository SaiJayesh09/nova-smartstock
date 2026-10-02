import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  AlertTriangle,
  Boxes,
  Clock3,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBasket,
  Store as StoreIcon,
} from 'lucide-react';

type StockStatus = 'Available' | 'Low Stock' | 'Out of Stock';
type Store = { id: string; name: string; locality: string; city: string };
type Product = {
  id: string;
  storeId: string;
  name: string;
  category: string;
  priceInr: number;
  stockStatus: StockStatus;
  updatedAt: string;
};

const STORAGE_KEY = 'nova-smartstock-inventory-v1';
const stores: Store[] = [
  { id: 'blr-indiranagar', name: 'NOVA CART Indiranagar', locality: 'Indiranagar', city: 'Bengaluru' },
  { id: 'mum-bandra', name: 'NOVA CART Bandra West', locality: 'Bandra West', city: 'Mumbai' },
  { id: 'del-saket', name: 'NOVA CART Saket', locality: 'Saket', city: 'New Delhi' },
];
const sixHoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const seedProducts: Product[] = [
  { id: 'p-001', storeId: 'blr-indiranagar', name: 'Amul Taaza Toned Milk', category: 'Dairy & Eggs', priceInr: 29, stockStatus: 'Available', updatedAt: sixHoursAgo(1) },
  { id: 'p-002', storeId: 'blr-indiranagar', name: 'Aashirvaad Atta, 5 kg', category: 'Atta, Rice & Dal', priceInr: 279, stockStatus: 'Low Stock', updatedAt: sixHoursAgo(2) },
  { id: 'p-003', storeId: 'blr-indiranagar', name: 'Robusta Banana, 6 pcs', category: 'Fruits & Vegetables', priceInr: 48, stockStatus: 'Available', updatedAt: sixHoursAgo(1.5) },
  { id: 'p-004', storeId: 'blr-indiranagar', name: 'Tata Salt, 1 kg', category: 'Masala & Seasoning', priceInr: 28, stockStatus: 'Out of Stock', updatedAt: sixHoursAgo(8) },
  { id: 'p-005', storeId: 'blr-indiranagar', name: 'Nandini Curd, 500 g', category: 'Dairy & Eggs', priceInr: 32, stockStatus: 'Available', updatedAt: sixHoursAgo(2.5) },
  { id: 'p-006', storeId: 'blr-indiranagar', name: 'Parle-G Gold, 1 pack', category: 'Biscuits & Snacks', priceInr: 20, stockStatus: 'Low Stock', updatedAt: sixHoursAgo(1) },
  { id: 'p-007', storeId: 'mum-bandra', name: 'Amul Taaza Toned Milk', category: 'Dairy & Eggs', priceInr: 29, stockStatus: 'Low Stock', updatedAt: sixHoursAgo(1) },
  { id: 'p-008', storeId: 'mum-bandra', name: 'Alphonso Mango, 2 pcs', category: 'Fruits & Vegetables', priceInr: 149, stockStatus: 'Available', updatedAt: sixHoursAgo(1) },
  { id: 'p-009', storeId: 'mum-bandra', name: 'Toor Dal, 1 kg', category: 'Atta, Rice & Dal', priceInr: 162, stockStatus: 'Out of Stock', updatedAt: sixHoursAgo(7) },
  { id: 'p-010', storeId: 'mum-bandra', name: 'Britannia Brown Bread', category: 'Bakery', priceInr: 45, stockStatus: 'Available', updatedAt: sixHoursAgo(2) },
  { id: 'p-011', storeId: 'mum-bandra', name: 'Cavins Buttermilk, 200 ml', category: 'Dairy & Eggs', priceInr: 15, stockStatus: 'Available', updatedAt: sixHoursAgo(4) },
  { id: 'p-012', storeId: 'mum-bandra', name: 'Classic Masala Chai, 250 g', category: 'Tea, Coffee & Drinks', priceInr: 138, stockStatus: 'Low Stock', updatedAt: sixHoursAgo(1) },
  { id: 'p-013', storeId: 'del-saket', name: 'Mother Dairy Full Cream Milk', category: 'Dairy & Eggs', priceInr: 35, stockStatus: 'Available', updatedAt: sixHoursAgo(2) },
  { id: 'p-014', storeId: 'del-saket', name: 'India Gate Basmati Rice, 1 kg', category: 'Atta, Rice & Dal', priceInr: 149, stockStatus: 'Low Stock', updatedAt: sixHoursAgo(3) },
  { id: 'p-015', storeId: 'del-saket', name: 'Shimla Apples, 4 pcs', category: 'Fruits & Vegetables', priceInr: 119, stockStatus: 'Available', updatedAt: sixHoursAgo(1) },
  { id: 'p-016', storeId: 'del-saket', name: 'Fortune Sunflower Oil, 1 L', category: 'Oil & Ghee', priceInr: 142, stockStatus: 'Out of Stock', updatedAt: sixHoursAgo(9) },
  { id: 'p-017', storeId: 'del-saket', name: 'Haldiram Aloo Bhujia, 200 g', category: 'Biscuits & Snacks', priceInr: 52, stockStatus: 'Available', updatedAt: sixHoursAgo(2) },
  { id: 'p-018', storeId: 'del-saket', name: 'Fresh Paneer, 200 g', category: 'Dairy & Eggs', priceInr: 89, stockStatus: 'Low Stock', updatedAt: sixHoursAgo(1.2) },
];

type InventoryContextValue = { products: Product[]; updateStatus: (id: string, status: StockStatus) => void };
const InventoryContext = createContext<InventoryContextValue | null>(null);

function loadProducts(): Product[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) return parsed as Product[];
    }
  } catch {
    // Invalid local data falls back to a fresh, usable demo inventory.
  }
  return seedProducts;
}

function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('Inventory provider is missing');
  return context;
}

function formatUpdated(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' }).format(date);
}

function isStale(product: Product) {
  return Date.now() - new Date(product.updatedAt).getTime() > 6 * 60 * 60 * 1000;
}

function StatusBadge({ status, productId }: { status: StockStatus; productId: string }) {
  const className = status === 'Available' ? 'status-available' : status === 'Low Stock' ? 'status-low' : 'status-out';
  return <span className={`status-pill ${className}`} data-testid={`status-product-${productId}`}>{status}</span>;
}

function Navigation() {
  const [location] = useLocation();
  const links = [
    { href: '/staff', label: 'Store inventory', icon: Boxes },
    { href: '/customer', label: 'Customer view', icon: ShoppingBasket },
  ];
  return <>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">N</div><div><div className="brand-name">NOVA CART</div><div className="brand-sub">SMARTSTOCK</div></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav-links" aria-label="Main navigation">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-${href.slice(1)}`} className={`nav-link ${location === href ? 'active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></Link>)}
      </nav>
      <div className="sidebar-foot"><strong>Local stock. Clear answers.</strong>Accurate shelves build everyday trust.</div>
    </aside>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`mobile-link-${href.slice(1)}`} className={location === href ? 'active' : ''}><Icon size={18} /><span>{label}</span></Link>)}
    </nav>
  </>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="app-shell"><Navigation /><div className="main-area">
    <header className="topbar"><div className="topbar-left"><span className="live-dot" /><span>Inventory sync is on</span></div><div className="topbar-right"><div className="avatar">NC</div><span className="topbar-name">NOVA CART team</span></div></header>
    {children}
  </div></div>;
}

function StaffPage() {
  const { products, updateStatus } = useInventory();
  const [storeId, setStoreId] = useState(stores[0].id);
  const store = stores.find((item) => item.id === storeId) ?? stores[0];
  const inventory = products.filter((product) => product.storeId === storeId);
  const staleProducts = inventory.filter(isStale);
  const available = inventory.filter((product) => product.stockStatus === 'Available').length;
  const low = inventory.filter((product) => product.stockStatus === 'Low Stock').length;

  return <main className="content fade-in">
    <div className="page-head">
      <div><div className="eyebrow">Store operations / Inventory</div><h1>Good morning, team.</h1><p>Keep today’s shelf picture up to date for your neighbourhood.</p></div>
      <label className="store-select-wrap" htmlFor="staff-store"><StoreIcon size={16} /><span>Active store</span>
        <select id="staff-store" className="field-select" value={storeId} onChange={(event) => setStoreId(event.target.value)} data-testid="select-staff-store" aria-label="Choose store inventory">
          {stores.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
    </div>
    <div className="overview-grid">
      <Metric icon={<PackageCheck size={16} />} label="Available to shop" value={available} note="Products ready for customers" />
      <Metric icon={<AlertTriangle size={16} />} label="Running low" value={low} note="Worth a quick shelf check" />
      <Metric icon={<Clock3 size={16} />} label="Needs verification" value={staleProducts.length} note="Not checked in the last 6 hours" />
    </div>
    {staleProducts.length > 0 && <div className="alert-banner" role="status" data-testid="alert-stock-verification">
      <AlertTriangle className="alert-icon" size={17} />
      <div><div className="alert-title">Stock verification needed</div>
        <div className="alert-copy">{staleProducts.map((product) => `${product.name} — last updated ${formatUpdated(product.updatedAt)}`).join(' · ')}</div>
      </div>
    </div>}
    <section className="section-card">
      <div className="section-heading"><div><h2>Inventory for {store.locality}</h2><p>{store.city} · Update a status as soon as the shelf changes.</p></div><span className="count-pill">{inventory.length} products</span></div>
      {inventory.length ? <div className="table-wrap"><table className="inventory-table">
        <thead><tr><th scope="col">Product</th><th scope="col">Price</th><th scope="col">Availability</th><th scope="col">Last updated</th><th scope="col">Change status</th></tr></thead>
        <tbody>{inventory.map((product) => <tr key={product.id} data-testid={`row-product-${product.id}`}>
          <td><div className="product-name" data-testid={`text-product-name-${product.id}`}>{product.name}</div><div className="product-category">{product.category}</div></td>
          <td className="price">₹{product.priceInr}</td>
           <td><StatusBadge status={product.stockStatus} productId={product.id} /></td>
          <td><div className="updated" data-testid={`text-updated-${product.id}`}>{formatUpdated(product.updatedAt)}</div>{isStale(product) && <div className="stale-note"><Clock3 size={11} />Stock verification needed</div>}</td>
          <td><label className="sr-only" htmlFor={`status-${product.id}`}>Set {product.name} stock status</label><select id={`status-${product.id}`} aria-label={`Set ${product.name} stock status`} className="status-select" value={product.stockStatus} onChange={(event) => updateStatus(product.id, event.target.value as StockStatus)} data-testid={`select-status-${product.id}`}>
            <option>Available</option><option>Low Stock</option><option>Out of Stock</option>
          </select></td>
        </tr>)}</tbody>
      </table></div> : <EmptyState title="No products in this store" message="There are no inventory items to show yet." />}
    </section>
  </main>;
}

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: number; note: string }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><div className="metric-value" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</div><div className="metric-note">{note}</div></div>;
}

function CustomerPage() {
  const { products } = useInventory();
  const [query, setQuery] = useState('');
  const [storeId, setStoreId] = useState('all');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const storeMatch = storeId === 'all' || product.storeId === storeId;
      const queryMatch = !normalized || product.name.toLocaleLowerCase().includes(normalized) || product.category.toLocaleLowerCase().includes(normalized);
      return storeMatch && queryMatch;
    });
  }, [products, query, storeId]);

  return <main className="content fade-in">
    <section className="customer-intro">
      <div className="eyebrow">NOVA CART · Your neighbourhood shelf</div>
      <h1>Find it nearby.<br />Know before you go.</h1>
      <p>Check what’s in stock at your local NOVA CART store, with availability checked by the people on the shop floor.</p>
    </section>
    <div className="search-panel">
      <label className="search-box"><Search size={17} /><input className="search-input" type="search" placeholder="Search milk, atta, snacks…" aria-label="Search product name or category" value={query} onChange={(event) => setQuery(event.target.value)} data-testid="input-product-search" /></label>
      <label><span className="sr-only">Filter by store</span><select className="field-select" value={storeId} onChange={(event) => setStoreId(event.target.value)} aria-label="Choose a store" data-testid="select-customer-store">
        <option value="all">All nearby stores</option>{stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
      </select></label>
    </div>
    <div className="result-line"><span data-testid="text-result-count">{filtered.length} {filtered.length === 1 ? 'product' : 'products'} found</span><span>Availability can change as shelves move.</span></div>
    <div className="product-grid">
      {filtered.map((product) => {
        const store = stores.find((item) => item.id === product.storeId) ?? stores[0];
        return <article className="customer-product" key={product.id} data-testid={`card-product-${product.id}`}>
          <div className="product-card-top"><div><h3>{product.name}</h3><div className="category-line">{product.category}</div></div><StatusBadge status={product.stockStatus} productId={product.id} /></div>
          <div className="product-card-foot"><span className="customer-updated"><MapPin size={12} />{store.locality}, {store.city}</span><span className="customer-price">₹{product.priceInr}</span></div>
          <div className="product-card-foot" style={{ borderTop: 0, marginTop: 8, paddingTop: 0 }}><span className="customer-updated"><Clock3 size={12} />Updated {formatUpdated(product.updatedAt)}</span>{isStale(product) && <span className="stale-note" style={{ margin: 0 }} data-testid={`stale-product-${product.id}`}>Stock verification needed</span>}</div>
        </article>;
      })}
      {filtered.length === 0 && <div className="customer-empty" data-testid="empty-search-results"><div className="empty-symbol"><Search size={18} /></div><div className="empty-title">{query ? 'No matching products' : 'Nothing to show here yet'}</div><div className="empty-text">{query ? 'Try another product name or category, or choose a different store.' : 'Choose a nearby store to check its shelf.'}</div></div>}
    </div>
  </main>;
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="table-empty"><div className="empty-symbol"><ShoppingBasket size={18} /></div><div className="empty-title">{title}</div><div className="empty-text">{message}</div></div>;
}

function NotFoundPage() {
  return <main className="content"><div className="customer-empty"><div className="empty-symbol"><Boxes size={18} /></div><div className="empty-title">This shelf isn’t here</div><Link href="/staff" className="nav-link" data-testid="link-back-inventory">Back to inventory</Link></div></main>;
}

function App() {
  const [products, setProducts] = useState<Product[]>(loadProducts);

  useEffect(() => {
    const syncFromOtherTab = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (!event.newValue) setProducts(seedProducts);
      else {
        try {
          const next = JSON.parse(event.newValue);
          if (Array.isArray(next)) setProducts(next as Product[]);
        } catch {
          setProducts(seedProducts);
        }
      }
    };
    window.addEventListener('storage', syncFromOtherTab);
    return () => window.removeEventListener('storage', syncFromOtherTab);
  }, []);

  const updateStatus = (id: string, status: StockStatus) => {
    setProducts((current) => {
      const next = current.map((product) => product.id === id ? { ...product, stockStatus: status, updatedAt: new Date().toISOString() } : product);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* In-memory changes remain available if storage is blocked. */ }
      return next;
    });
  };

  const value = useMemo(() => ({ products, updateStatus }), [products]);
  return <InventoryContext.Provider value={value}><Shell>
    <Switch>
      <Route path="/" component={StaffPage} />
      <Route path="/staff" component={StaffPage} />
      <Route path="/customer" component={CustomerPage} />
      <Route component={NotFoundPage} />
    </Switch>
  </Shell></InventoryContext.Provider>;
}

export default App;