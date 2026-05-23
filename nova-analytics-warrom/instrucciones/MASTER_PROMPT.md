# NOVA ANALYTICS — MASTER PROMPT
> Documento central de referencia para Claude Code. Leer completo antes de escribir cualquier línea de código.

---

## 🎯 OBJETIVO DEL PROYECTO

Nova Analytics es una plataforma SaaS multi-tenant que centraliza TiendaNube, Meta Ads y Gmail en un solo dashboard. Construida por Nova Agency (Facundo + Mauricio) para sus clientes de e-commerce, principalmente en Argentina. Reemplaza la necesidad de tener múltiples tabs abiertas con un único panel inteligente, con IA integrada, métricas en tiempo real y gestión de emails.

URL de producción: `analytics.novaagency.info`
Rutas de app: `/app/dashboard`, `/app/tienda`, `/app/analisis`, etc.
Repositorio: Nova Agency / GitHub

---

## 🏗️ STACK TECNOLÓGICO

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15+ / React 19 |
| Estilos | TailwindCSS + Shadcn/ui |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email+pass + Google OAuth) |
| Deploy | Vercel |
| IA | Anthropic Claude API (claude-haiku-4-5-20251001) |
| Emails | Resend (notificaciones transaccionales) |

---

## 🎨 DISEÑO — REGLAS CRÍTICAS

> **SIEMPRE usar la skill de frontend-design antes de crear cualquier componente visual.**
> La skill está en: `/mnt/skills/public/frontend-design/SKILL.md`
> Leerla es OBLIGATORIO antes de cualquier tarea de UI.

### Paleta de colores
```css
--color-primary: #e1691e;      /* Naranja Nova */
--color-secondary: #1e3c69;    /* Azul navy */
--color-accent: #a855f7;       /* Violeta */
--color-bg: #0a0f1e;           /* Fondo dark principal */
--color-bg-card: #111827;      /* Cards */
--color-bg-sidebar: #0d1424;   /* Sidebar */
--color-border: #1e293b;       /* Bordes */
--color-text: #f1f5f9;         /* Texto principal */
--color-text-muted: #64748b;   /* Texto secundario */
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-danger: #ef4444;
```

### Tipografía
- Display / títulos: **Syne** (Google Fonts)
- Body / datos: **Barlow Condensed** (Google Fonts)

### Navegación
- **Top navbar** (logo, perfil, notificaciones, toggle dark/light)
- **Sidebar colapsable** a la izquierda con secciones agrupadas

### Estructura sidebar del cliente
```
GENERAL
  ├── Dashboard (home con resumen)
  ├── IA Assistant
  └── Alertas

TIENDA (TiendaNube)
  ├── Tienda Web
  ├── Análisis
  ├── Órdenes
  ├── Productos / Stock
  ├── Clientes
  └── Rentabilidad

MARKETING
  ├── Meta Ads
  └── Campañas

COMUNICACIÓN
  └── Mails (Gmail integrado)

CONFIGURACIÓN
  ├── Integraciones
  ├── Configuración financiera (comisiones, dólar)
  └── Mi cuenta
```

### Tema
- Dark mode por defecto
- Toggle para light mode disponible
- Usar CSS variables para ambos temas

---

## 👥 ROLES Y AUTENTICACIÓN

### Roles del sistema
| Rol | Descripción |
|---|---|
| `super_admin` | Facundo y Mauricio — acceso total, Nova HQ |
| `client` | Cliente de Nova Agency — ve solo su workspace |

### Auth
- Email + contraseña
- Google OAuth
- Supabase Auth con RLS habilitado en TODAS las tablas

### Multi-tenant
- Cada cliente tiene un `workspace_id`
- RLS garantiza que cada cliente solo accede a sus propios datos
- Un solo deploy, múltiples workspaces aislados

---

## 🔒 SEGURIDAD — REGLAS CRÍTICAS

> Implementar desde el día 0, sin excepciones.

1. **RLS (Row Level Security)** activado en TODAS las tablas de Supabase
2. **SQL Injection prevention**: usar siempre queries parametrizadas, nunca string concatenation
3. **API Keys encriptadas**: guardar en Supabase vault o variables de entorno encriptadas, nunca en el cliente
4. **Sanitización de inputs**: validar y sanitizar todo dato que entre al sistema (Zod en frontend y backend)
5. **Rate limiting** en todas las API routes de Next.js
6. **Audit logs**: registrar todas las acciones sensibles (login, cambio de integración, acceso a datos)
7. **CORS** configurado estrictamente
8. **Headers de seguridad**: CSP, X-Frame-Options, HSTS vía next.config.js
9. **Variables de entorno**: NUNCA exponer keys al cliente (solo `NEXT_PUBLIC_` para lo estrictamente necesario)
10. **Tokens OAuth de terceros** (TiendaNube, Meta, Gmail): encriptados en DB, nunca en localStorage

---

## ⚡ FUNCIONALIDADES MVP

### Dashboard principal (cliente)
- Resumen de ventas del día / semana / mes (TiendaNube)
- Últimas órdenes en tiempo real
- Métricas Meta Ads (spend, ROAS, CPA)
- Emails recientes sin leer (Gmail)
- Insights IA automáticos ("Tus ventas bajaron 15% vs semana pasada")
- Metas con barra de progreso

### Tienda Web
- Todas las funcionalidades del dashboard FromNorth actual:
  - Ventas por mes (selector de período)
  - Órdenes con estados (pagada, pendiente, cancelada)
  - Top productos
  - Tipos de clientes (nuevos vs recurrentes)
  - Facturación histórica por mes
  - Gráfico Ventas vs Inversión Meta Ads

### Análisis
- Ventas por día (últimos 60 días)
- Facturación diaria
- Ventas por hora del día
- Facturación por mes (12 meses)
- Hora pico, mejor mes

### Órdenes
- Tabla completa con filtros (todas / pagadas / pendientes / canceladas)
- Búsqueda por número, cliente o email
- Detalle de orden expandible

### Productos / Stock
- Listado de productos con stock actual
- Alertas de stock bajo
- Análisis de productos (revenue, unidades, profit margin)

### Clientes
- Listado de clientes
- Nuevos vs recurrentes
- Historial de compras por cliente

### Rentabilidad
- Configuración financiera: costos, comisiones, cotización dólar
- Net Revenue, Profit, Profit Margin
- ROAS real vs ROAS reportado

### Meta Ads
- Campañas activas con métricas: Spend, Revenue, ROAS, CPA, True ROAS
- Filtro por fecha
- Gráfico de inversión vs ventas

### Gmail / Mails
- Bandeja de entrada integrada
- Leer y responder emails desde el dashboard
- Vista de hilo completo
- Composición de email

### IA Assistant
- Chat integrado en el dashboard
- Contexto completo del negocio del cliente (ventas, meta, emails)
- Insights automáticos diarios
- Sistema de logros/metas que el cliente completa

### Alertas
- Notificaciones in-app + email (Resend)
- Tipos: venta nueva, carrito abandonado, stock bajo, anomalía en métricas

### Integraciones
- Página para conectar/desconectar: TiendaNube, Meta Ads, Gmail
- Estado de cada integración (conectado / sin conectar / error)
- Tutorial embebido por integración

---

## 🏢 NOVA HQ — SUPER ADMIN

Panel exclusivo para Facundo y Mauricio:

- **Clientes**: lista de todos los workspaces, estado, plan, fecha de alta
- **MRR**: ingresos mensuales recurrentes
- **Actividad**: últimas sesiones, páginas visitadas, acciones realizadas
- **Session tracking**: qué secciones usa cada cliente, tiempo en app
- **Facturación**: quién paga, quién tiene prueba, vencimientos
- **Gestión**: crear/suspender/eliminar workspaces
- **Logs de seguridad**: intentos de login, cambios de integración

---

## 🗄️ ESQUEMA DE BASE DE DATOS (resumen)

```sql
-- Core
workspaces (id, name, slug, plan, status, created_at)
users (id, workspace_id, email, role, name, avatar_url)
audit_logs (id, workspace_id, user_id, action, metadata, created_at)

-- Integraciones (tokens encriptados)
integrations (id, workspace_id, provider, access_token_encrypted, refresh_token_encrypted, expires_at, status)

-- TiendaNube cache
tn_orders (id, workspace_id, external_id, customer, total, status, created_at)
tn_products (id, workspace_id, external_id, name, stock, price, cost)

-- Config financiera
financial_config (id, workspace_id, usd_rate, tax_rate, platform_fee, agency_fee)

-- IA
ai_conversations (id, workspace_id, user_id, messages, created_at)
ai_insights (id, workspace_id, type, content, read, created_at)

-- Alertas
alerts (id, workspace_id, type, title, body, read, sent_email, created_at)

-- Nova HQ
sessions (id, workspace_id, user_id, page, duration, created_at)
billing (id, workspace_id, plan, amount, status, period_start, period_end)
```

---

## 📁 ESTRUCTURA DE CARPETAS

```
nova-analytics/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + Navbar
│   │   ├── dashboard/
│   │   ├── tienda/
│   │   ├── analisis/
│   │   ├── ordenes/
│   │   ├── productos/
│   │   ├── clientes/
│   │   ├── rentabilidad/
│   │   ├── meta-ads/
│   │   ├── mails/
│   │   ├── ia/
│   │   ├── alertas/
│   │   └── configuracion/
│   ├── (admin)/                # Nova HQ — solo super_admin
│   │   ├── hq/
│   │   └── clientes/
│   └── api/
│       ├── tiendanube/
│       ├── meta/
│       ├── gmail/
│       └── ai/
├── components/
│   ├── ui/                     # Shadcn/ui
│   ├── layout/                 # Sidebar, Navbar, etc.
│   ├── dashboard/
│   ├── charts/
│   └── shared/
├── lib/
│   ├── supabase/
│   ├── tiendanube/
│   ├── meta/
│   ├── gmail/
│   ├── ai/
│   └── security/               # encryption, rate-limit, sanitize
├── hooks/
├── types/
└── middleware.ts               # Auth guard + rate limiting
```

---

## 🔑 VARIABLES DE ENTORNO NECESARIAS

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Anthropic IA
ANTHROPIC_API_KEY=

# Resend (emails)
RESEND_API_KEY=

# Encryption
ENCRYPTION_SECRET=

# TiendaNube OAuth
TIENDANUBE_CLIENT_ID=
TIENDANUBE_CLIENT_SECRET=

# Meta
META_APP_ID=
META_APP_SECRET=

# Gmail OAuth
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

- [ ] RLS activo en 100% de las tablas
- [ ] Ninguna API key expuesta al cliente
- [ ] Todos los inputs validados con Zod
- [ ] Rate limiting en todas las rutas API
- [ ] Dark/light mode funcional
- [ ] Responsive (desktop + tablet mínimo)
- [ ] OAuth TiendaNube, Meta y Gmail funcionando
- [ ] IA con contexto del negocio del cliente
- [ ] Super Admin Nova HQ operativo
- [ ] Audit logs registrando acciones sensibles

---

## 🚨 REGLAS PARA CLAUDE CODE

1. **SIEMPRE leer `/mnt/skills/public/frontend-design/SKILL.md` antes de cualquier tarea de UI**
2. Nunca hardcodear API keys
3. Nunca usar string concatenation en queries SQL
4. Siempre tipar con TypeScript estricto (`strict: true`)
5. Siempre crear migraciones de Supabase para cambios de schema
6. Comentar lógica de seguridad y encriptación
7. Seguir la estructura de carpetas definida arriba
8. Usar los colores y tipografías definidos, nunca improvisarlos
9. Cada componente nuevo → aplicar la paleta y tipografía de Nova Analytics
10. El diseño debe ser **memorable y premium**, nunca genérico
