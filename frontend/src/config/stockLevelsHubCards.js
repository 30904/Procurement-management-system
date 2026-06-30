/** Stock Levels hub — shown even when menu DB is not reseeded yet. */
export const STOCK_LEVELS_HUB_CARDS = [
  {
    code: "masters_planning_stock_levels_item_inl",
    label: "Material INL",
    description: "Purchase material inventory levels and reorder points",
    segment: "masters/planning/stock-levels/item-inl",
    iconKey: "purchase",
    sequence: 10,
  },
  {
    code: "masters_planning_stock_levels_production_item_inl",
    label: "Production Material INL",
    description: "Production material inventory levels and reorder setup",
    segment: "masters/production",
    iconKey: "production",
    sequence: 20,
  },
  {
    code: "masters_planning_stock_levels_sku_inl",
    label: "SKU INL",
    description: "Finished SKU stock levels for planning",
    segment: "masters/planning/stock-levels/sku-inl",
    iconKey: "sales",
    sequence: 30,
  },
];
