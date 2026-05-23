# NOVA ANALYTICS — AGENTS ORCHESTRATION
> Configuración de agentes paralelos para Claude Code.
> El Orquestador supervisa y coordina. Los demás ejecutan en paralelo.

---

## 🎯 AGENTE 0 — ORQUESTADOR

**Rol:** Supervisor general. No escribe código directamente. Coordina, revisa calidad y desbloquea dependencias entre agentes.

**Responsabilidades:**
- Leer el MASTER_PROMPT.md al inicio de cada sesión
- Asignar tareas a los agentes correctos
- Revisar que ningún agente rompa las reglas de seguridad
- Resolver conflictos entre agentes (ej: si dos tocan el mismo archivo)
- Verificar criterios de aceptación antes de dar por terminada una tarea
- Hacer code review final de cada PR/bloque de trabajo

**Trigger:** Cualquier tarea que involucre más de un dominio (ej: "construir la página de órdenes con datos reales de TiendaNube")

---

## 🎨 AGENTE 1 — FRONTEND / UI

**Rol:** Diseñador + desarrollador de interfaces.

**Regla crítica:** SIEMPRE leer `/mnt/skills/public/frontend-design/SKILL.md` antes de crear cualquier componente.

**Responsabilidades:**
- Todos los componentes visuales (pages, layouts, components)
- Sidebar, Navbar, cards, tablas, gráficos, modales
- Dark/light mode
- Animaciones y micro-interacciones
- Responsive design (desktop + tablet)
- Aplicar paleta Nova Analytics y tipografía Syne + Barlow Condensed en cada componente
- Shadcn/ui como base, siempre customizado con la paleta Nova

**Stack:** Next.js, TailwindCSS, Shadcn/ui, Recharts (gráficos), Motion (animaciones)

**Nunca:** Usar colores, fuentes o estilos que no estén en el MASTER_PROMPT. Nunca diseño genérico.

---

## ⚙️ AGENTE 2 — BACKEND / API

**Rol:** Arquitecto de API routes y lógica de servidor.

**Responsabilidades:**
- Todas las API routes en `app/api/`
- Integración con TiendaNube API (OAuth, órdenes, productos, clientes)
- Integración con Meta Ads API (campañas, métricas, spend)
- Integración con Gmail API (leer, responder, componer)
- Rate limiting en todas las rutas
- Validación con Zod en todos los inputs
- Manejo de errores consistente

**Reglas de seguridad:**
- Queries parametrizadas siempre, nunca string concatenation
- API keys solo en server-side, nunca expuestas al cliente
- Tokens OAuth de terceros encriptados antes de guardar en DB
- Rate limiting: máximo 100 requests/min por workspace

---

## 🗄️ AGENTE 3 — BASE DE DATOS / SUPABASE

**Rol:** Arquitecto de datos y seguridad a nivel DB.

**Responsabilidades:**
- Schema completo de Supabase (tablas, relaciones, índices)
- RLS (Row Level Security) en el 100% de las tablas — SIN EXCEPCIONES
- Migraciones organizadas y versionadas
- Funciones y triggers de Postgres donde sea necesario
- Encriptación de tokens sensibles (pgcrypto o Supabase Vault)
- Audit logs automáticos via triggers
- Seed data para desarrollo

**Reglas:**
- Nunca desactivar RLS aunque sea "temporalmente"
- Toda tabla nueva → política RLS inmediatamente
- Índices en columnas de búsqueda frecuente (workspace_id, created_at, status)

---

## 🤖 AGENTE 4 — IA / CLAUDE INTEGRATION

**Rol:** Especialista en integración con Claude API (Haiku).

**Modelo:** `claude-haiku-4-5-20251001`

**Responsabilidades:**
- Chat assistant integrado en el dashboard
- Generación de insights automáticos diarios por workspace
- Sistema de logros/metas que el cliente completa
- Contexto: el agente construye el system prompt con datos reales del cliente (ventas, meta, emails)
- Streaming de respuestas en el chat
- Guardar historial de conversaciones en `ai_conversations`
- Guardar insights en `ai_insights`

**Reglas:**
- El system prompt siempre incluye contexto del negocio del cliente
- Nunca exponer la API key al cliente
- Limitar tokens de respuesta para controlar costos (max_tokens: 1000)
- Rate limit: máximo 20 requests de IA por workspace por hora

---

## 🔒 AGENTE 5 — SEGURIDAD

**Rol:** Auditor de seguridad transversal. Trabaja en paralelo con todos los demás.

**Responsabilidades:**
- Revisar cada PR buscando vulnerabilidades
- Implementar y mantener `lib/security/` (encryption, rate-limit, sanitize)
- Configurar headers de seguridad en `next.config.js` (CSP, HSTS, X-Frame-Options)
- Middleware de autenticación en `middleware.ts`
- Audit logs: registrar login, logout, cambio de integración, acceso a datos sensibles
- CORS configuration
- Sanitización de todos los inputs del usuario

**Checklist por cada feature nueva:**
- [ ] ¿Tiene RLS?
- [ ] ¿Los inputs están validados con Zod?
- [ ] ¿Las API keys están en server-side?
- [ ] ¿Los tokens están encriptados?
- [ ] ¿Tiene rate limiting?
- [ ] ¿Se registra en audit_logs?

---

## 🏢 AGENTE 6 — NOVA HQ (SUPER ADMIN)

**Rol:** Desarrollador del panel de administración interno de Nova Agency.

**Responsabilidades:**
- Panel `/admin/hq` — solo accesible para rol `super_admin`
- Lista de todos los workspaces (clientes)
- MRR y facturación
- Session tracking (qué páginas visita cada cliente, tiempo en app)
- Logs de seguridad
- Gestión de workspaces (crear, suspender, eliminar)
- Guard de ruta: redirigir inmediatamente si no es super_admin

---

## 📋 ORDEN DE EJECUCIÓN RECOMENDADO

### Fase 1 — Base (ejecutar en paralelo)
- **Agente 3:** Schema completo de DB + RLS + migraciones
- **Agente 5:** `lib/security/`, middleware, headers de seguridad

### Fase 2 — Auth + Layout (ejecutar en paralelo)
- **Agente 2:** API routes de auth (login, register, OAuth callbacks)
- **Agente 1:** Layout principal (Sidebar + Navbar + dark/light mode)

### Fase 3 — Integraciones (ejecutar en paralelo)
- **Agente 2:** TiendaNube OAuth + sync de órdenes/productos
- **Agente 2:** Meta Ads API connection
- **Agente 2:** Gmail OAuth + inbox

### Fase 4 — Páginas (ejecutar en paralelo)
- **Agente 1:** Dashboard principal + todas las páginas de Tienda
- **Agente 1:** Páginas de Meta Ads + Gmail
- **Agente 4:** IA Assistant + insights automáticos

### Fase 5 — Nova HQ + Pulido
- **Agente 6:** Panel super admin completo
- **Agente 1:** Refinamiento visual, animaciones, responsive
- **Agente 0:** Code review final + criterios de aceptación

---

## 🚨 REGLAS GLOBALES PARA TODOS LOS AGENTES

1. Leer `MASTER_PROMPT.md` al inicio de cada sesión
2. Agente 1 → leer SIEMPRE `frontend-design/SKILL.md` antes de cualquier UI
3. Nunca hardcodear secrets o API keys
4. TypeScript estricto en todo el proyecto (`strict: true`)
5. Nunca mergear código sin que el Agente 5 haya revisado seguridad
6. Seguir la estructura de carpetas del MASTER_PROMPT
7. Ante duda → preguntar al Orquestador antes de proceder
