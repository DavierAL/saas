-- ============================================================
-- SQL Function: get_sales_analytics
-- Aggregates sales data for the Analytics Dashboard.
-- Returns a JSONB object with daily trends, top items, and revenue breakdown.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_sales_analytics(
  p_tenant_id UUID, 
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB 
LANGUAGE SQL
STABLE
AS $body$
  SELECT jsonb_build_object(
    'daily_sales', COALESCE(
      (SELECT jsonb_agg(d) FROM (
        SELECT 
          to_char(date_trunc('day', created_at), 'Mon DD') as date,
          sum(total_amount) as sales
        FROM public.orders
        WHERE tenant_id = p_tenant_id 
          AND created_at >= (now() - (p_days || ' days')::interval)
          AND status = 'paid'
          AND deleted_at IS NULL
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at) ASC
      ) d),
      '[]'::jsonb
    ),
    'top_items', COALESCE(
      (SELECT jsonb_agg(t) FROM (
        SELECT 
          i.name,
          sum(ol.quantity)::integer as sales
        FROM public.order_lines ol
        JOIN public.items i ON ol.item_id = i.id
        JOIN public.orders o ON ol.order_id = o.id
        WHERE ol.tenant_id = p_tenant_id
          AND o.created_at >= (now() - (p_days || ' days')::interval)
          AND o.status = 'paid'
          AND o.deleted_at IS NULL
          AND i.deleted_at IS NULL
        GROUP BY i.name
        ORDER BY 2 DESC
        LIMIT 5
      ) t),
      '[]'::jsonb
    ),
    'revenue_by_category', COALESCE(
      (SELECT jsonb_agg(c) FROM (
        SELECT 
          i.type as name,
          sum(ol.subtotal) as value
        FROM public.order_lines ol
        JOIN public.items i ON ol.item_id = i.id
        JOIN public.orders o ON ol.order_id = o.id
        WHERE ol.tenant_id = p_tenant_id
          AND o.created_at >= (now() - (p_days || ' days')::interval)
          AND o.status = 'paid'
          AND o.deleted_at IS NULL
          AND i.deleted_at IS NULL
        GROUP BY i.type
        ORDER BY 2 DESC
      ) c),
      '[]'::jsonb
    )
  );
$body$;
