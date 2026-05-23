# 🏢 NOVA ANALYTICS — WARROOM

Carpeta central del proyecto. Todo lo que Claude Code necesita saber está acá.
**Leer antes de escribir una sola línea de código.**

---

## 📁 Estructura

```
nova-analytics-warroom/
│
├── instrucciones/
│   ├── MASTER_PROMPT.md     ← Leer PRIMERO. Objetivo, stack, diseño, seguridad, funcionalidades.
│   └── agents.md            ← Configuración de agentes paralelos y orden de ejecución.
│
├── referencias/
│   ├── REF_01_tienda_dashboard_metricas.png     ← Cards de métricas, layout general dark
│   ├── REF_02_tienda_analisis_graficos.png      ← Gráficos de análisis histórico
│   ├── REF_03_tienda_ordenes_tabla.png          ← Tabla de órdenes con estados
│   ├── REF_04_fromnorth_dashboard_principal.png ← Dashboard base más cercano al objetivo
│   ├── REF_05_fromnorth_ordenes_grafico.png     ← Tabla órdenes + gráfico ventas vs Meta
│   ├── REF_06_escalafy_kpis_tienda.png          ← Sección KPIs y Top KPIs
│   ├── REF_07_escalafy_analisis_productos.png   ← Análisis de productos con tabla profit
│   ├── REF_08_escalafy_sidebar.png              ← Sidebar con secciones y plataformas
│   ├── REF_09_escalafy_meta_pixel_campanas.png  ← Vista de campañas Meta con métricas
│   ├── REF_10_escalafy_comisiones_config.png    ← Config financiera: comisiones, impuestos
│   ├── REF_11_escalafy_integraciones.png        ← Página de integraciones por plataforma
│   ├── REF_12_escalafy_pricing.png              ← Estructura de planes / pricing
│   └── REF_13_escalafy_faq.png                 ← Página de ayuda / FAQ
│
└── config/
    └── .env.template        ← Variables de entorno necesarias (completar antes del setup)
```

---

## 🎨 Qué tomar de cada referencia

| Referencia | Qué implementar |
|---|---|
| REF_01 a REF_03 | Cards de métricas en grid, colores de estado (naranja/verde), tabla de órdenes |
| REF_04 a REF_05 | **Base principal** — layout del dashboard FromNorth ya construido por Nova Agency |
| REF_06 a REF_07 | Sección KPIs con True ROAS, Profit Margin, análisis de productos con tabla |
| REF_08 | Estructura de sidebar con secciones agrupadas (Reportes, Pixel, Ajustes) |
| REF_09 | Vista de campañas Meta: tabla con Status, Budget, Spend, ROAS, CPA, True ROAS |
| REF_10 | Config financiera: comisiones de pago, impuestos, pagos personalizados |
| REF_11 | Página de integraciones: cards por plataforma con botón Conectar/estado |
| REF_12 | Sistema de planes (para Nova HQ — gestión de billing de clientes) |
| REF_13 | Página de ayuda con búsqueda y acordeones FAQ |

---

## 🚨 Reglas críticas

1. **SIEMPRE** leer `instrucciones/MASTER_PROMPT.md` al iniciar cualquier sesión
2. **SIEMPRE** leer `/mnt/skills/public/frontend-design/SKILL.md` antes de cualquier UI
3. Paleta Nova Analytics: naranja `#e1691e` / navy `#1e3c69` / violeta `#a855f7`
4. Tipografía: **Syne** (títulos) + **Barlow Condensed** (body/datos)
5. RLS en el 100% de las tablas de Supabase — sin excepciones
6. Modelo IA: `claude-haiku-4-5-20251001`
