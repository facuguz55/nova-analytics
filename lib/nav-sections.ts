import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Bell, BarChart2, ShoppingCart, Package, Users,
  TrendingUp, Target, Megaphone, Mail, Globe, Brain, Store,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavSection = {
  label: string;
  items: NavItem[];
  accentColor?: string;
  requiresPlan?: boolean;
  adminOnly?: boolean;
};

export const ALL_NAV_SECTIONS: NavSection[] = [
  {
    label: "INICIO",
    items: [
      { href: "/app/dashboard", label: "Dashboard",    icon: LayoutDashboard },
      { href: "/app/ia",        label: "IA Assistant", icon: Brain },
      { href: "/app/alertas",   label: "Alertas",      icon: Bell },
    ],
  },
  {
    label: "MI TIENDA",
    items: [
      { href: "/app/analisis",     label: "Análisis",     icon: BarChart2 },
      { href: "/app/ordenes",      label: "Órdenes",      icon: ShoppingCart },
      { href: "/app/clientes",     label: "Clientes",     icon: Users },
      { href: "/app/productos",    label: "Productos",    icon: Package },
      { href: "/app/rentabilidad", label: "Rentabilidad", icon: TrendingUp },
      { href: "/app/tienda",       label: "Tienda Web",   icon: Globe },
    ],
  },
  {
    label: "MARKETING",
    items: [
      { href: "/app/meta-ads", label: "Meta Ads", icon: Target },
      { href: "/app/campanas", label: "Campañas", icon: Megaphone },
      { href: "/app/mails",    label: "Mails",    icon: Mail },
    ],
  },
  {
    label: "LOCAL FÍSICO",
    accentColor: "#e1691e",
    requiresPlan: true,
    items: [
      { href: "/app/local", label: "Nova Local", icon: Store },
    ],
  },
];
