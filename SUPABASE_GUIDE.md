# Guía de Resolución: Errores de Autenticación y Permisos en Supabase

Este documento explica por qué ocurrió el error `401 Unauthorized / 42501 Permission Denied` y cómo asegurar una transición fluida a producción.

## 1. ¿Qué pasó exactamente? (Post-Mortem)

Tuvimos una combinación de tres factores que "bloquearon" la aplicación:

1.  **Mismatch de Formato de Claves**: Tu proyecto de Supabase se actualizó al nuevo sistema de claves (`sb_publishable_...`), pero el archivo `.env.local` seguía usando el formato antiguo (JWT largo). Esto causaba un error de firma.
2.  **Caracteres Ocultos**: Al copiar y pegar claves en archivos `.env`, a veces se cuelan saltos de línea (`\n`) o retornos de carro (`\r`). Esto corrompe la cabecera `Authorization` enviada al servidor.
3.  **Permisos de Ejecución (RPC)**: En Postgres, crear una función no significa que cualquiera pueda usarla. Por defecto, el rol `anon` (usuarios no logueados) no tiene permiso para ejecutar funciones `RPC`, lo que disparaba el error interno `42501`.

---

## 2. Paso a Paso para el Futuro

Cuando crees una nueva funcionalidad con Supabase, sigue este orden:

### Paso A: Variables de Entorno
- Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` coincidan exactamente con lo que ves en **Settings -> API**.
- **Regla de oro**: Siempre usa `.trim()` al leer variables de entorno en el código para evitar espacios invisibles.

### Paso B: Permisos en Base de Datos (RLS)
Si creas una **tabla**, debes habilitar RLS y crear una política:
```sql
ALTER TABLE public.mi_tabla ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso público" ON public.mi_tabla FOR SELECT TO anon USING (true);
```

### Paso C: Permisos de Funciones (RPC)
Si creas una **función**, debes dar permiso de ejecución al rol `anon`:
```sql
GRANT EXECUTE ON FUNCTION public.mi_funcion(argumentos) TO anon;
```

---

## 3. Transición a Producción

Pasar de `localhost` a un dominio real (ej. `mi-app.com`) requiere estos cambios críticos:

### 1. Configuración de CORS
En el Dashboard de Supabase (**Settings -> API**):
- Elimina `http://localhost:3000` de la lista de "Allow Origins".
- Agrega tu dominio de producción: `https://app.tu-saas.com`.
- **Sin esto, el navegador bloqueará todas las peticiones.**

### 2. Endurecimiento de RLS (Seguridad)
En desarrollo usamos `USING (true)` para leer todo. En producción, debes restringir los datos por `tenant_id`:
```sql
-- Ejemplo de política de producción
CREATE POLICY "Solo datos del tenant" 
ON public.orders 
FOR SELECT 
TO anon 
USING (tenant_id = 'id-del-cliente-actual');
```

### 3. Manejo de Secretos
- Nunca subas el archivo `.env.local` a Git.
- Configura las variables en tu plataforma de hosting (Vercel, Netlify, etc.).
- La clave `service_role` **NUNCA** debe estar en el frontend.

---

> [!TIP]
> **Consejo de depuración**: Si recibes un error en el navegador, abre la pestaña **Network**, busca la petición roja, y mira el header `proxy-status`. Si dice `error=42501`, el problema es SQL (permisos); si el status es `401` y no hay más info, el problema es la Key.
