import type { RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<{ children: ReactElement }>;
}

export interface MockFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T>;
  mock: ReturnType<typeof vi.fn>;
  mockResolvedValue: (value: ReturnType<T>) => MockFunction<T>;
  mockRejectedValue: (error: Error) => MockFunction<T>;
  mockImplementation: (fn: T) => MockFunction<T>;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};