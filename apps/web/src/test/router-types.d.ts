// Workaround for react-router-dom type incompatibility with React 18
// This file is only used during build - not for runtime
import '@testing-library/jest-dom/vitest';

declare module 'react-router-dom' {
  export function Routes(props: any): any;
  export function Route(props: any): any;
  export function NavLink(props: any): any;
  export function Routes(props: any): any;
}