# ADR 0015: Resolución del error PSYNC_S2105 — Validación de JWT en PowerSync

**Fecha:** 29 de Abril, 2026  
**Autor:** Diagnóstico colaborativo - DavierAL + Claude  
**Estado:** ✅ RESUELTO (autenticación), ⏳ PENDIENTE (sincronización de datos)  
**Versión:** 1.0

---

## 1. Contexto y Problema Inicial

### Síntoma Reportado

La aplicación móvil POS (Expo/React Native) mostraba un ciclo de reinicio infinito. Los logs indicaban:

- ✅ Autenticación exitosa con JWT válido
- ✅ AppProvider extrayendo `tenant_id` correctamente
- ❌ PowerSync rechazando conexiones repetidamente
- ❌ Base de datos local SQLite permanecía vacía (`hasSynced: false`)

### Error Específico en PowerSync Logs

```
[PSYNC_S2105] Unexpected "aud" claim value: "authenticated"

AuthorizationError: [PSYNC_S2105] Unexpected "aud" claim value: "authenticated"
    at KeyStore.verifyJwt (file:///app/node_modules/.pnpm/@powersync+service-core@1.20.5/node_modules/@powersync/service-core/dist/auth/KeyStore.js:82:19)
    at async generateContext (file:///app/node_modules/.pnpm/@powersync+service-core@1.20.5/node_modules/@powersync/service-core/dist/routes/auth.js:41:29)
```

### Cadena de Eventos

```
Mobile App → fetchCredentials() → JWT válido ✅
         ↓
         WebSocket al endpoint PowerSync
         ↓
         PowerSync recibe JWT y llama KeyStore.verifyJwt()
         ↓
         Valida el claim "aud": "authenticated"
         ↓
         ❌ PowerSync rechaza: "aud value not in allowed list"
         ↓
         WebSocket se cierra → "Trying to close for the second time"
         ↓
         SDK reintenta → Loop infinito
```

---

## 2. Análisis de la Causa Raíz

### 2.1 Estructura del JWT de Supabase

Supabase emite JWTs con esta estructura invariable:

```json
{
  "aal": "aal1",
  "aud": "authenticated", // ← AQUÍ está el problema
  "email": "user@example.com",
  "exp": 1777515817,
  "iat": 1777512217,
  "iss": "https://lhdqhvrkchbcbfawsgze.supabase.co/auth/v1",
  "role": "authenticated",
  "sub": "2183738d-3d70-49c7-aaa3-b6ac765cafc2",
  "tenant_id": "d86874dd-0418-4cf6-929c-0afe3cee82f9", // ← Root level ✅
  "app_metadata": {
    "tenant_id": "d86874dd-0418-4cf6-929c-0afe3cee82f9" // ← Duplicado (OK)
  }
}
```

**Nota importante:** El `aud` claim **NO se puede cambiar** en Supabase. Es un estándar inmutable usado internamente por RLS policies de Postgres.

### 2.2 Configuración Predeterminada de PowerSync

PowerSync tiene dos modos de validación de JWT:

| Modo                       | Comportamiento                                     | Problema                                                      |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| **JWKS URI (recomendado)** | Valida el JWT contra las claves públicas en la URL | Requiere que el `aud` esté en la lista de "allowed audiences" |
| **Shared Secret (legacy)** | Valida contra un secreto compartido HS256          | Mismo problema                                                |

En ambos casos, PowerSync **rechaza por defecto cualquier `aud` que no esté explícitamente permitido**.

### 2.3 Por qué falló inicialmente

En el dashboard de PowerSync, el campo **"JWT Audience (optional)"** estaba **vacío**.

Esto significa:

- PowerSync NO tenía ningún `aud` en su lista de valores aceptados
- Cuando llegaba un JWT con `aud: "authenticated"`, PowerSync lo rechazaba
- **No hay fallback a "confiar en cualquier audience"** — el rechazo es explícito

---

## 3. Journey de Diagnóstico

### Iteración 1: Hipótesis inicial — Problema en YAML (❌ Incorrecto)

**Síntoma visto:** `hasSynced: false`, "Trying to close for the second time"

**Hipótesis:** El `powersync.yaml` usa sintaxis obsoleta (`auth.parameter()` en lugar de `token_parameters`).

**Acción:** Refactorizar YAML a estructura `bucket_definitions`.

**Resultado:** ❌ El error persiste. Los logs móviles siguen mostrando cierre de WebSocket.

**Conclusión:** El problema estaba más abajo en la cadena.

---

### Iteración 2: Hipótesis — JWT estructura (⚠️ Parcialmente correcto)

**Síntoma visto:** El `tenant_id` estaba en root level ✅, pero `hasSynced` seguía en `false`.

**Hipótesis:** PowerSync no puede leer parámetros de bucket porque el JWT no tiene la estructura correcta.

**Acción:** Implementar Auth Hook de Supabase para mover `tenant_id` al top-level (ya estaba ahí, pero era redundante hacerlo explícito).

**Resultado:** ⚠️ El error de estructura se resolvió, pero `PSYNC_S2105` persiste.

**Conclusión:** El problema NO era la estructura del JWT, sino la **validación de audience**.

---

### Iteración 3: Diagnóstico profundo — PowerSync Logs (✅ Correcto)

**Síntoma visto:** Los logs del dashboard de PowerSync mostraban repetidamente:

```
[PSYNC_S2105] Unexpected "aud" claim value: "authenticated"
```

**Acción:** Revisar el error exacto en los logs de PowerSync.

**Hallazgo crítico:** El código de error `PSYNC_S2105` es específico de validación de JWT. La causa no es sintaxis ni estructura, sino **configuración de audience**.

**Conclusión:** PowerSync rechaza el JWT porque **no tiene `"authenticated"` en su lista de audiences permitidos**.

---

### Iteración 4: Verificación en dashboard PowerSync (✅ Confirmado)

**Acción:** Revisar la configuración en PowerSync → Client Auth.

**Hallazgos:**

1. ✅ "Use Supabase Auth" **estaba marcado** → Bien
2. ✅ "JWKS URI" **estaba lleno** → Bien
3. ❌ "JWT Audience (optional)" **estaba VACÍO** → **PROBLEMA RAÍZ**

**Insight clave:** El checkbox "Use Supabase Auth" NO automáticamente agrega `"authenticated"` al campo de audiences. Es un campo separado que requiere configuración manual.

---

## 4. La Solución

### 4.1 El cambio exacto realizado

**En PowerSync Dashboard → Client Auth:**

1. Campo: **JWT Audience (optional)**
2. Acción: Click en botón **"+ Add"**
3. Valor ingresado: `authenticated`
4. Click: **"Save and Deploy"**
5. Confirmación: "Your deploy has completed" ✅

### 4.2 Por qué funcionó

Con `authenticated` en la lista de audiences permitidos, PowerSync ahora:

```
Recibe JWT con aud: "authenticated"
       ↓
KeyStore.verifyJwt() valida la firma ✅
       ↓
Valida que aud ∈ ["authenticated"] ✅
       ↓
Acepta el JWT y genera RSocket context
       ↓
Permite la conexión WebSocket
       ↓
Comienza sincronización de buckets
```

### 4.3 Resultado inmediato en logs

**ANTES (con Audience vacío):**

```
[SupabaseConnector] ✅ Credentials fetched
[PSYNC_S2105] Unexpected "aud" claim value: "authenticated"  ← Error
Trying to close for the second time                           ← Consecuencia
```

**DESPUÉS (con Audience = "authenticated"):**

```
[SupabaseConnector] ✅ Credentials fetched
[PowerSync] Initialization complete                           ← NO hay error
[SyncController] PowerSync DB initialized and connected       ← Éxito
```

---

## 5. Lecciones Aprendidas

### 5.1 Sobre PowerSync + Supabase

| Concepto                         | Lección                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Audience Validation**          | PowerSync SIEMPRE valida el `aud` claim. Si el campo está vacío, rechaza TODO.                   |
| **"Use Supabase Auth"**          | El checkbox activa JWKS URI, pero NO automáticamente configura audiences. Ambos deben coexistir. |
| **Supabase `aud` es invariable** | No se puede cambiar en Supabase. PowerSync debe adaptarse a `aud: "authenticated"`.              |
| **Error PSYNC_S2105**            | Es específico de validación de audience. Verificar logs de PowerSync, no los de la app móvil.    |

### 5.2 Sobre arquitectura de SaaS multi-tenant

| Aspecto                                 | Hallazgo                                                                                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsabilidad de cada capa**        | Auth (Supabase) emite JWTs; PowerSync lo valida. El error está en la **validación**, no en la emisión.                                       |
| **Debugging distribuido**               | Cuando fallan las conexiones, revisar logs en AMBOS lados (móvil + PowerSync dashboard). El móvil muestra síntomas, PowerSync muestra causa. |
| **Configuración explícita > Automagía** | "Use Supabase Auth" marcado NO significa "confía en todo JWT de Supabase". Audience sigue siendo required.                                   |

---

## 6. Cronograma Completo de la Resolución

| Tiempo | Acción                                               | Resultado                           |
| ------ | ---------------------------------------------------- | ----------------------------------- |
| T+0    | Usuario reporta: app móvil no muestra datos          | Síntoma: `hasSynced: false`         |
| T+1    | ADR 0014: Refactorizar YAML + Auth Hook              | Error persiste: `PSYNC_S2105`       |
| T+2    | Diagnóstico: revisar dashboard PowerSync logs        | Encontrado: "aud" error en KeyStore |
| T+3    | Captura: verificar Client Auth config                | Confirmado: JWT Audience vacío      |
| T+4    | **Solución:** Agregar `authenticated` a JWT Audience | ✅ **Deploy completado**            |
| T+5    | Logout/login en móvil                                | ✅ Error desaparece                 |
| T+6    | Verificar logs nuevos                                | ✅ WebSocket conecta exitosamente   |

---

## 7. Estado Actual

### ✅ RESUELTO: Autenticación JWT

```
[PowerSync] Initialization complete
[SyncController] PowerSync DB initialized and connected
```

PowerSync ahora:

- ✅ Acepta JWTs de Supabase
- ✅ Valida firma correctamente
- ✅ Establece conexión WebSocket estable
- ✅ No hay spam de "Trying to close"

### ⏳ PENDIENTE: Sincronización de datos

```
[SyncController] Local DB empty, using remote result override
```

Próximas causas a investigar:

1. **RLS en Postgres:** ¿Hay policies que impiden que PowerSync lea datos?
2. **Sync Rules YAML:** ¿Las queries devuelven filas para el tenant?
3. **Bucket parameters:** ¿Se está pasando correctamente `bucket.tenant_id` a las queries?

---

## 8. Configuración Final Documentada

### PowerSync Dashboard → Client Auth

```
✅ Development tokens: OFF
✅ Use Supabase Auth: ON
   ├─ Supabase JWT Secret: [ertaPOB3lEFIWlFdYasC8yQiYYlfo0lK9NZzeK1R2Zlf]
   ├─ JWKS URI: https://lhdqhvrkchbcbfawsgze.supabase.co/auth/v1/.well-known/jwks.json
   └─ JWT Audience: ["authenticated"]  ← KEY FIX
✅ HS256 authentication: OFF
```

### Supabase Dashboard → API → JWT Keys

```
✅ Current Key (ECC P-256): [603D5CB4-3817-4B40-B920-FA63DF1C7293]
✅ Legacy JWT Secret: [ertaPOB3lEFIWlFdYasC8yQiYYlfo0lK9NZzeK1R2Zlf]
   Note: Used only for verification, not signing (Supabase doesn't sign with HS256)
```

---

## 9. Recomendaciones para Futuros Deploys

### Para evitar este problema nuevamente:

1. **Checklist de integración PowerSync + Supabase:**

   ```
   [ ] JWKS URI configurado
   [ ] JWT Audience field populado con "authenticated"
   [ ] Client Auth "Use Supabase Auth" marcado
   [ ] Sync Rules validando sin errores
   [ ] Test: Login en móvil → revisar logs de PowerSync
   [ ] Confirmación: No hay PSYNC_S2105 en logs
   ```

2. **Monitoreo proactivo:**
   - Revisar PowerSync Logs dashboard después de cada deploy
   - Buscar específicamente: `[PSYNC_S2105]`
   - Si aparece, verificar JWT Audience antes de cualquier otra acción

3. **Documentación:**
   - Guardar esta ADR en el repo bajo `/docs/adr/`
   - Referenciarla en la guía de setup de PowerSync

---

## 10. Referencias y Recursos

### Documentación oficial

- [PowerSync JWT Authentication](https://docs.powersync.com/configuring-your-service/authentication)
- [PowerSync JWKS Configuration](https://docs.powersync.com/self-hosting/configuring-authentication)
- [Supabase JWT Configuration](https://supabase.com/docs/learn/auth-deep-dive/jwt)

### Código relevante

- `packages/sync/powersync.yaml` — Sync Rules
- `apps/mobile/src/lib/powersync/connector.ts` — SupabaseConnector
- `apps/mobile/src/lib/powersync/database.ts` — initDatabase
- Supabase Migration: `custom_access_token_hook` — Auth Hook

### Error codes

- **PSYNC_S2105:** JWT validation error, specifically audience claim mismatch
- **PSYNC_S2106:** (Related) JWT signature verification failed

---

## 11. Conclusión

El error `PSYNC_S2105` fue una **configuración faltante** en PowerSync, no un problema de código. La solución fue **agregar un valor único a un campo de configuración**.

Este es un ejemplo clásico de:

- **Síntomas engañosos:** El error parecía relacionado con sincronización de datos (YAML, bucket params)
- **Causa diferente:** Era validación de JWT en la capa de autenticación
- **Debugging distribuido:** La raíz no estaba en los logs móviles, estaba en los de PowerSync

**Lección clave:** Cuando los sistemas distribuidos fallan silenciosamente, revisar los logs en TODOS los lados antes de asumir que el problema está en el código.

---

**Status:** ✅ RESUELTO  
**Fecha de Resolución:** 29 de Abril, 2026, 20:26 UTC  
**Próximo ADR:** ADR 0016 (Sincronización de datos y RLS)
