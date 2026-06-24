export interface ShippingCost {
  method:    string;
  label:     string;
  cost:      number;
  is_active: boolean;
}

// Costos de referencia del mercado argentino 2025/2026 (pesos, paquete ~1kg promedio)
export const DEFAULT_SHIPPING_COSTS: ShippingCost[] = [
  { method: "andreani",         label: "Andreani",         cost: 9500, is_active: true  },
  { method: "oca",              label: "OCA",              cost: 7200, is_active: true  },
  { method: "correo_argentino", label: "Correo Argentino", cost: 4500, is_active: true  },
  { method: "mercado_envios",   label: "Mercado Envíos",   cost: 5800, is_active: true  },
  { method: "retiro_local",     label: "Retiro en local",  cost: 0,    is_active: true  },
  { method: "a_convenir",       label: "A convenir",       cost: 0,    is_active: false },
];
