import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          limit: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        in: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        gte: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        lte: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        }),
        like: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null })
    }),
    removeChannel: vi.fn().mockResolvedValue(undefined),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockResolvedValue({ data: null, error: null })
      })
    })
  }
}));

vi.mock('../lib/use-cases', () => ({
  useCases: {
    manageCatalog: {
      createItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      findLowStock: vi.fn().mockResolvedValue([]),
      incrementStock: vi.fn()
    },
    checkout: vi.fn(),
    orders: {
      findByTenant: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      getLines: vi.fn().mockResolvedValue([]),
      getAnalytics: vi.fn().mockResolvedValue({
        daily_sales: [],
        top_items: [],
        revenue_by_category: []
      }),
      getDailyClosing: vi.fn().mockResolvedValue([]),
      updateStatus: vi.fn()
    },
    users: {
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      createUser: vi.fn(),
      updateUserRole: vi.fn(),
      deleteUser: vi.fn()
    },
    tenant: {
      findById: vi.fn().mockResolvedValue(null)
    }
  }
}));

vi.mock('../hooks/useTenantId', () => ({
  useTenantId: () => ({
    tenantId: 'test-tenant-id',
    loading: false,
    error: null
  })
}));

global.localStorage = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
} as Storage;

global.sessionStorage = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
} as Storage;

Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();