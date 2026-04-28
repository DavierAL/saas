# ADR 0003: Multi-tenant Real Support (Web)

## Context
The web application previously used a hardcoded `FIXED_TENANT_ID` for all data requests. This prevented real multi-tenancy and caused RLS (Row Level Security) issues once real users were introduced.

## Decision
We decided to implement a dynamic tenant identification system on the web by:
1.  Using a custom hook `useTenantId` that retrieves the `tenant_id` from the Supabase `user_metadata`.
2.  Redirecting users to `/onboarding` if the `tenant_id` is missing, ensuring every authenticated user has an assigned tenant before accessing business data.
3.  Passing the dynamic `tenantId` to all repository use case calls.

## Rationale
- **Security**: Ensures that users only see data belonging to their assigned tenant.
- **Flexibility**: Allows the same frontend build to serve multiple organizations.
- **Consistency**: Matches the multi-tenant approach used in the mobile app (via JWT claims).

## Status
Accepted.

## Implementation Details
- **Hook**: `apps/web/src/hooks/useTenantId.ts`
- **Affected Pages**: 
    - `AnalyticsPage.tsx`
    - `OrdersPage.tsx`
    - `CatalogPage.tsx`
    - `InventoryPage.tsx`
- **Flow**: `AuthGuard` -> `Page` -> `useTenantId` -> `Data Fetch`
