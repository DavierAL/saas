import {
  exportDailySalesToCsv,
  exportTopItemsToCsv,
  exportRevenueByCategoryToCsv,
  arrayToCsv,
  escapeCsvValue,
} from '../utils/csv-export';
import type { OrderAnalytics } from '@saas-pos/domain';

// Mock document/createElement para testear en Node
let mockCreateElement: jest.MockedFunction<any>;
let mockBody: { appendChild: jest.Mock; removeChild: jest.Mock };

beforeEach(() => {
  mockBody = {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  };
  mockCreateElement = jest.fn(() => ({
    setAttribute: jest.fn(),
    style: {},
    click: jest.fn(),
  }));

  // @ts-ignore — global document mock
  global.document = {
    createElement: mockCreateElement,
    body: mockBody,
    appendChild: mockBody.appendChild,
  } as any;

  // @ts-ignore — URL.createObjectURL mock
  global.URL = {
    createObjectURL: jest.fn(() => 'blob:test'),
    revokeObjectURL: jest.fn(),
  } as any;
});

// Tests para escapeCsvValue
describe('escapeCsvValue', () => {
  test('returns string unchanged when no special chars', () => {
    expect(escapeCsvValue('hello')).toBe('hello');
    expect(escapeCsvValue(123)).toBe('123');
  });

  test('wraps value with commas in quotes', () => {
    expect(escapeCsvValue('a,b')).toBe('"a,b"');
  });

  test('wraps value with quotes in quotes and escapes inner quotes', () => {
    expect(escapeCsvValue('a"b')).toBe('"a""b"');
  });

  test('wraps value with newlines in quotes', () => {
    expect(escapeCsvValue('a\nb')).toBe('"a\nb"');
  });

  test('handles combination of special chars', () => {
    expect(escapeCsvValue('a,b"c')).toBe('"a,b""c"');
  });
});

// Tests para arrayToCsv
describe('arrayToCsv', () => {
  test('returns empty string for empty array', () => {
    expect(arrayToCsv([])).toBe('');
  });

  test('generates header row from keys', () => {
    const result = arrayToCsv([{ a: 1, b: 2 }]);
    expect(result).toContain('a,b');
  });

  test('generates data rows with values', () => {
    const result = arrayToCsv([
      { name: 'Item 1', qty: 5 },
      { name: 'Item 2', qty: 10 },
    ]);
    expect(result.split('\n')).toHaveLength(3); // header + 2 data rows
  });

  test('handles missing values with empty string', () => {
    const result = arrayToCsv([{ a: 1, b: undefined as any }]);
    expect(result).toContain(',,'); // missing value
  });

  test('escapes values with commas', () => {
    const result = arrayToCsv([{ name: 'a,b', qty: 1 }]);
    expect(result).toContain('"a,b"');
  });

  test('converts numbers to strings', () => {
    const result = arrayToCsv([{ val: 100 }]);
    expect(result).toContain('val');
    expect(result).toContain('100');
  });
});

// Tests para exportDailySalesToCsv
describe('exportDailySalesToCsv', () => {
  test('creates CSV with daily sales data', () => {
    const mockData: OrderAnalytics = {
      daily_sales: [
        { date: '2026-05-01', sales: 5000 },
        { date: '2026-05-02', sales: 7500 },
      ],
      top_items: [],
      revenue_by_category: [],
    };

    exportDailySalesToCsv(mockData, 'tenant-123');

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockBody.appendChild).toHaveBeenCalled();
  });

  test('handles empty daily_sales', () => {
    const mockData: OrderAnalytics = {
      daily_sales: [],
      top_items: [],
      revenue_by_category: [],
    };

    exportDailySalesToCsv(mockData, 'tenant-123');

    expect(mockCreateElement).toHaveBeenCalled();
  });
});

// Tests para exportTopItemsToCsv
describe('exportTopItemsToCsv', () => {
  test('creates CSV with top items data', () => {
    const mockData: OrderAnalytics = {
      daily_sales: [],
      top_items: [
        { name: 'Ceviche', sales: 50 },
        { name: 'Lomo', sales: 30 },
      ],
      revenue_by_category: [],
    };

    exportTopItemsToCsv(mockData, 'tenant-123');

    expect(mockCreateElement).toHaveBeenCalled();
  });
});

// Tests para exportRevenueByCategoryToCsv
describe('exportRevenueByCategoryToCsv', () => {
  test('creates CSV with revenue by category', () => {
    const mockData: OrderAnalytics = {
      daily_sales: [],
      top_items: [],
      revenue_by_category: [
        { name: 'product', value: 10000 },
        { name: 'service', value: 5000 },
      ],
    };

    exportRevenueByCategoryToCsv(mockData, 'tenant-123');

    expect(mockCreateElement).toHaveBeenCalled();
  });

  test('maps category names to Spanish labels', () => {
    const mockData: OrderAnalytics = {
      daily_sales: [],
      top_items: [],
      revenue_by_category: [
        { name: 'product', value: 10000 },
      ],
    };

    // Should contain "Producto" not "product"
    exportRevenueByCategoryToCsv(mockData, 'tenant-123');
  });
});

// Tests de edge cases
describe('edge cases', () => {
  test('handles very large numbers', () => {
    const result = arrayToCsv([{ amount: 999999999 }]);
    expect(result).toContain('amount');
    expect(result).toContain('999999999');
  });

  test('handles Unicode characters', () => {
    const result = arrayToCsv([{ name: 'Cerveza' }]);
    expect(result).toContain('Cerveza');
  });

  test('handles empty strings', () => {
    const result = arrayToCsv([{ empty: '' }]);
    expect(result).toContain('empty');
  });
});