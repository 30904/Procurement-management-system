import {
  LayoutDashboard,
  Megaphone,
  ClipboardList,
  BarChart3,
  ShoppingCart,
  Warehouse,
  Factory,
  Wrench,
  Gem,
  Truck,
  FileText,
  Users,
  Landmark,
  CircleDollarSign,
  LayoutGrid,
  FolderOpen,
  Key,
  Settings,
  Headphones,
  Circle,
  Building2,
  PanelsTopLeft,
  ShieldCheck,
  Database,
  Mail,
  Activity,
  MapPin,
  Network,
  Menu,
  Layers,
  Image,
  Hash,
  Upload,
  FolderKanban,
} from "lucide-react";

/** Lucide icons for ERP sidebar, footer, and applications flyout */
export const LUCIDE_ICON_MAP = {
  dashboard: LayoutDashboard,
  leads_npd: Megaphone,
  planning: ClipboardList,
  sales: BarChart3,
  purchase: ShoppingCart,
  stores: Warehouse,
  production: Factory,
  maintenance: Wrench,
  quality: Gem,
  dispatch: Truck,
  reports: FileText,
  hrm: Users,
  accounts: Landmark,
  account: Landmark,
  finance: CircleDollarSign,
  applications: LayoutGrid,
  menu: LayoutGrid,
  masters: Key,
  settings: Settings,
  support: Headphones,
  company_setup: Building2,
  app_setup: PanelsTopLeft,
  roles_access: ShieldCheck,
  data_management: Database,
  communication: Mail,
  system: Activity,
  location_master: MapPin,
  sub_locations: Network,
  menu_setup: Menu,
  modules_setup: Layers,
  groups_setup: FolderKanban,
  icons_setup: Image,
  auto_increment: Hash,
  item_document: FileText,
  bulk_import: Upload,
  file_manager: FolderOpen,
};

/**
 * Renders a menu icon from Lucide with theme primary color (via currentColor).
 */
export default function MenuLucideIcon({
  iconKey,
  active = false,
  className = "",
  size,
  strokeWidth,
  ...rest
}) {
  const key = String(iconKey || "menu").trim();
  const Icon = LUCIDE_ICON_MAP[key] || Circle;

  return (
    <Icon
      className={`erp-lucide-icon${className ? ` ${className}` : ""}`}
      size={size}
      strokeWidth={strokeWidth ?? (active ? 2.25 : 2)}
      aria-hidden={rest["aria-hidden"] ?? true}
      {...rest}
    />
  );
}

/** Legacy: component factory for code that expects resolveMenuIcon() */
export function createMenuIconComponent(iconKey, active = false) {
  return function ResolvedMenuIcon({ className, ...props }) {
    return (
      <MenuLucideIcon
        iconKey={iconKey}
        active={active}
        className={className}
        {...props}
      />
    );
  };
}
