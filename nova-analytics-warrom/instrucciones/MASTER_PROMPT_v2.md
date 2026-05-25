# NOVA ANALYTICS — MASTER PROMPT v2
> Leer COMPLETO antes de escribir una sola línea de código.
> Esta es una aplicación SaaS PÚBLICA. Cualquier persona puede registrarse, pagar y usarla.

---

## 🎯 OBJETIVO

Nova Analytics centraliza TiendaNube + Meta Ads + Gmail en un solo dashboard con IA.
Construido por Nova Agency. URL: `analytics.novaagency.info`
Rutas: `analytics.novaagency.info/app/dashboard`, `/app/tienda`, etc.

---

## 🏗️ STACK

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15+ / React 19 |
| Estilos | TailwindCSS + Shadcn/ui |
| Auth + DB | Supabase (`https://xfientejntectnwbqmdr.supabase.co`) |
| Deploy | Vercel |
| IA | Claude Haiku (`claude-haiku-4-5-20251001`) |
| Pagos | Stripe + MercadoPago |

---

## 🚨 ARQUITECTURA CRÍTICA — LEER CON ATENCIÓN

### ❌ LO QUE NO VA EN SUPABASE
**NUNCA guardar en Supabase:**
- Órdenes de TiendaNube
- Productos de TiendaNube
- Clientes de TiendaNube
- Emails de Gmail
- Campañas de Meta Ads

**Por qué:** Esta es una app pública con potencialmente miles de usuarios. Si cada usuario tiene 200 productos, 20 usuarios = 4000 filas. Con 1000 usuarios = 200.000 filas solo de productos. La DB colapsa y los costos explotan.

### ✅ LO QUE SÍ VA EN SUPABASE
Solo el backend de la plataforma:
- `workspaces` — datos del cliente (nombre, plan, estado)
- `users` — autenticación y rol
- `integrations` — tokens OAuth encriptados de TiendaNube/Gmail/Meta
- `financial_config` — configuración financiera del cliente
- `audit_logs` — acciones sensibles
- `alerts` — alertas generadas por la app
- `billing` — estado de suscripción y pagos
- `ai_usage` — consumo de tokens IA por workspace por día

### ✅ LO QUE CARGA DIRECTO DESDE LAS APIs
- **TiendaNube:** órdenes, productos, clientes → llamada directa a la API en cada request
- **Gmail:** emails → paginación de 20 en 20, carga bajo demanda
- **Meta Ads:** campañas y métricas → llamada directa a la API

---

## 📊 CARGA DE DATOS

### TiendaNube
- Historial: rango de fechas elegido por el cliente (30/60/90 días o fecha custom)
- Tiempo real: sin cache, cada request llama directo a la API de TiendaNube
- Paginación en órdenes y productos para no traer todo de una

### Gmail
- Bandeja: paginación de 20 emails por página
- Hilo: carga completo solo cuando el cliente hace click en el email
- No guardar emails en Supabase bajo ningún concepto

### Meta Ads
- Campañas y métricas: directo desde Meta Graph API
- Sin cache, sin guardar en Supabase

---

## 💳 PAGOS Y SUSCRIPCIÓN

- **Stripe** (USD, internacional) + **MercadoPago** (ARS, Argentina)
- Un solo plan por ahora
- Trial con tarjeta requerida
- Si no paga → acceso al dashboard bloqueado completamente
- Webhook de Stripe/MP actualiza `billing.status` en Supabase

---

## 🔒 SEGURIDAD — REGLAS ABSOLUTAS

1. **RLS en el 100% de las tablas** — sin excepciones
2. **Rate limiting por IP Y por workspace** en todas las API routes
3. **Tokens OAuth encriptados** (AES-256-GCM) antes de guardar en `integrations`
4. **Nunca** exponer tokens al cliente
5. **Zod** para validar todos los inputs
6. **SQL injection prevention** — queries parametrizadas siempre
7. **Audit logs** para login, cambio de integración, acceso a datos
8. **Headers de seguridad** — CSP, HSTS, X-Frame-Options en next.config.ts
9. **CORS** configurado estrictamente

---

## 🤖 IA — LÍMITES DE USO

- Modelo: `claude-haiku-4-5-20251001`
- Límite: tokens por workspace por día (guardar consumo en `ai_usage`)
- Nunca exponer ANTHROPIC_API_KEY al cliente
- Sistema de contexto: el prompt incluye datos reales del negocio del cliente

---

## 🔔 ALERTAS

- Solo in-app en `/app/alertas`
- NO emails automáticos (Resend tiene límite de 100/día en plan free)
- Tipos: venta nueva, stock bajo, anomalía en métricas

---

## 👥 REGISTRO Y ACCESO

- Open registration: cualquiera puede registrarse y pagar
- Al registrarse → crear workspace automáticamente
- Sin pago activo → bloquear acceso al dashboard
- Solo español por ahora

---

## 🎨 DISEÑO — REGLAS CRÍTICAS

> **SIEMPRE leer `/mnt/skills/public/frontend-design/SKILL.md` antes de cualquier componente visual.**

- Misma fuente que Nova Recover (copiar de `https://github.com/facuguz55/nova-recover`)
- Paleta: naranja `#e1691e`, violeta `#a855f7`, navy `#1e3c69`, fondo `#0a0f1e`
- Dark mode por defecto, toggle a light
- Top navbar + sidebar colapsable
- Cero placeholders, cero TODOs, código 100% completo

---

## 🗄️ SCHEMA SUPABASE (solo lo que va en DB)

```sql
workspaces (id, name, slug, plan, status, trial_ends_at, created_at)
users (id, workspace_id, email, role, name, avatar_url)
integrations (id, workspace_id, provider, access_token_encrypted, refresh_token_encrypted, expires_at, status, store_id, metadata)
financial_config (id, workspace_id, usd_rate, tax_rate, platform_fee, agency_fee)
audit_logs (id, workspace_id, user_id, action, metadata, created_at)
alerts (id, workspace_id, type, title, body, read, created_at)
billing (id, workspace_id, stripe_customer_id, mp_customer_id, plan, status, trial_ends_at, current_period_end)
ai_usage (id, workspace_id, date, tokens_used, requests_count)
```

**NUNCA crear tablas para:** órdenes, productos, clientes, emails, campañas.

---

## 📁 ESTRUCTURA DE CARPETAS

```
app/
├── (auth)/login, register, reset-password
├── app/                    ← rutas del dashboard cliente
│   ├── dashboard/
│   ├── tienda/
│   ├── analisis/
│   ├── ordenes/
│   ├── productos/
│   ├── clientes/
│   ├── rentabilidad/
│   ├── meta-ads/
│   ├── mails/
│   ├── ia/
│   ├── alertas/
│   └── configuracion/
├── admin/                  ← Nova HQ, solo super_admin
└── api/
    ├── tiendanube/         ← proxy a TiendaNube API
    ├── meta/               ← proxy a Meta API
    ├── gmail/              ← proxy a Gmail API
    ├── ai/                 ← Claude Haiku
    ├── webhooks/stripe/
    └── webhooks/mercadopago/

lib/
├── tiendanube/client.ts    ← wrapper TiendaNube API (NO guarda en DB)
├── gmail/client.ts         ← wrapper Gmail API (NO guarda en DB)
├── meta/client.ts          ← wrapper Meta API (NO guarda en DB)
├── security/               ← encryption, rate-limit, sanitize
└── supabase/               ← client, server, service
```

---

## 🚨 REGLAS PARA CLAUDE CODE

1. SIEMPRE leer `frontend-design/SKILL.md` antes de cualquier UI
2. NUNCA guardar órdenes, productos, clientes, emails o campañas en Supabase
3. NUNCA hardcodear API keys
4. NUNCA crear endpoints sin rate limiting
5. Toda la data de TiendaNube/Gmail/Meta viene directo de sus APIs, no de Supabase
6. TypeScript estricto en todo (`strict: true`)
7. Cero placeholders — código 100% completo y funcional
8. RLS en cada tabla nueva, inmediatamente
