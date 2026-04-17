import { useState } from 'react';
import type { Item } from '@saas-pos/domain';
import { formatMoney, createMoney } from '@saas-pos/domain';

type SortField = 'name' | 'price' | 'stock' | 'type';
type SortDir = 'asc' | 'desc';

// Sample data — Phase 3 will wire Supabase queries
const DEMO_ITEMS: Item[] = [
  { id: '1', tenant_id: 't1', type: 'product', name: 'Coca Cola 500ml',   price: 250,  stock: 50,  created_at: '', updated_at: '', deleted_at: null },
  { id: '2', tenant_id: 't1', type: 'product', name: 'Leche Gloria 1L',   price: 380,  stock: 30,  created_at: '', updated_at: '', deleted_at: null },
  { id: '3', tenant_id: 't1', type: 'product', name: 'Pan de molde',      price: 350,  stock: 20,  created_at: '', updated_at: '', deleted_at: null },
  { id: '4', tenant_id: 't1', type: 'product', name: 'Arroz Costeño 1kg', price: 450,  stock: 100, created_at: '', updated_at: '', deleted_at: null },
  { id: '5', tenant_id: 't1', type: 'product', name: 'Aceite Primor 1L',  price: 700,  stock: 25,  created_at: '', updated_at: '', deleted_at: null },
  { id: '6', tenant_id: 't1', type: 'service', name: 'Corte de cabello',  price: 1500, stock: null, created_at: '', updated_at: '', deleted_at: null },
];

function TypeBadge({ type }: { type: Item['type'] }) {
  const isProduct = type === 'product';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      backgroundColor: isProduct ? '#0d2b1e' : '#14143b',
      color: isProduct ? '#3ECF8E' : '#818CF8',
      letterSpacing: '0.5px',
    }}>
      {isProduct ? 'PRODUCTO' : 'SERVICIO'}
    </span>
  );
}

function StockIndicator({ stock }: { stock: number | null }) {
  if (stock === null) return <span style={{ color: '#555', fontSize: 13 }}>—</span>;
  const color = stock === 0 ? '#EF4444' : stock <= 5 ? '#F59E0B' : '#9b9b9b';
  return <span style={{ color, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{stock}</span>;
}

export function CatalogPage() {
  const [items] = useState<Item[]>(DEMO_ITEMS);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'name', dir: 'asc' });
  const [showForm, setShowForm] = useState(false);

  const filtered = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sort.field === 'name')  cmp = a.name.localeCompare(b.name);
      if (sort.field === 'price') cmp = a.price - b.price;
      if (sort.field === 'stock') cmp = (a.stock ?? -1) - (b.stock ?? -1);
      if (sort.field === 'type')  cmp = a.type.localeCompare(b.type);
      return sort.dir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (field: SortField) =>
    setSort((prev) => prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });

  const SortIcon = ({ field }: { field: SortField }) => (
    <span style={{ marginLeft: 4, color: sort.field === field ? '#3ECF8E' : '#555', fontSize: 10 }}>
      {sort.field === field ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Catálogo</h1>
          <p style={s.pageSubtitle}>{items.length} items · {items.filter(i => i.type === 'product').length} productos · {items.filter(i => i.type === 'service').length} servicios</p>
        </div>
        <button style={s.primaryBtn} onClick={() => setShowForm(true)}>
          + Nuevo item
        </button>
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <div style={s.searchBox}>
          <span style={s.searchIcon}>⌕</span>
          <input
            style={s.searchInput}
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span style={s.resultCount}>{filtered.length} resultados</span>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 300, cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                Nombre <SortIcon field="name" />
              </th>
              <th style={{ ...s.th, cursor: 'pointer' }} onClick={() => toggleSort('type')}>
                Tipo <SortIcon field="type" />
              </th>
              <th style={{ ...s.th, textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('price')}>
                Precio <SortIcon field="price" />
              </th>
              <th style={{ ...s.th, textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleSort('stock')}>
                Stock <SortIcon field="stock" />
              </th>
              <th style={{ ...s.th, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} style={s.tr} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#161616')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td style={s.td}>
                  <span style={{ color: '#ededed', fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                </td>
                <td style={s.td}><TypeBadge type={item.type} /></td>
                <td style={{ ...s.td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#3ECF8E', fontWeight: 700, fontSize: 14 }}>
                  {formatMoney(createMoney(item.price))}
                </td>
                <td style={{ ...s.td, textAlign: 'right' }}>
                  <StockIndicator stock={item.stock} />
                </td>
                <td style={{ ...s.td, textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    <button style={s.ghostBtn}>Editar</button>
                    <button style={{ ...s.ghostBtn, color: '#EF4444' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div style={s.emptyState}>
          <p style={{ color: '#555', fontSize: 14 }}>No se encontraron items para "{search}"</p>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:        { padding: '32px 40px', maxWidth: 1100 },
  pageHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  pageTitle:   { fontSize: 22, fontWeight: 700, color: '#ededed', letterSpacing: '-0.5px', margin: 0 },
  pageSubtitle:{ fontSize: 13, color: '#555', marginTop: 4, margin: 0 },
  primaryBtn:  { backgroundColor: '#3ECF8E', color: '#0f0f0f', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  toolbar:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  searchBox:   { display: 'flex', alignItems: 'center', flex: 1, maxWidth: 360, backgroundColor: '#1c1c1c', border: '1px solid #272727', borderRadius: 6, padding: '0 12px' },
  searchIcon:  { color: '#555', fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, height: 36, background: 'none', border: 'none', outline: 'none', color: '#ededed', fontSize: 13 },
  resultCount: { fontSize: 12, color: '#555' },
  tableWrap:   { backgroundColor: '#1c1c1c', border: '1px solid #272727', borderRadius: 8, overflow: 'hidden' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#555', textAlign: 'left', borderBottom: '1px solid #272727', letterSpacing: '0.4px', textTransform: 'uppercase', userSelect: 'none' },
  tr:          { transition: 'background 0.1s', cursor: 'default' },
  td:          { padding: '12px 16px', fontSize: 13, color: '#9b9b9b', borderBottom: '1px solid #1e1e1e' },
  ghostBtn:    { background: 'none', border: '1px solid #272727', borderRadius: 4, padding: '4px 10px', fontSize: 11, color: '#9b9b9b', cursor: 'pointer' },
  emptyState:  { textAlign: 'center', padding: '48px 0' },
};
