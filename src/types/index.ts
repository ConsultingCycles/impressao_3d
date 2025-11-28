export interface UserConfig {
  user_id: string;
  tarifa_energia: number;
  margem_padrao: number;
  moeda: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
}

export interface Printer {
  id: string;
  name: string;
  model: string;
  purchase_price: number;
  lifespan_hours: number;
  power_watts: number;
  total_hours_printed: number;
}

export interface Filament {
  id: string;
  name: string;
  brand: string;
  type: string;
  color: string;
  roll_weight_g: number;
  roll_price: number;
  grams_per_roll: number;
  rolls: number;
  current_weight_g: number;
  min_stock_alert_g: number;
}

export interface Expense {
  id: string;
  name: string;
  cost: number;
  unit: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  stock_quantity: number;
  average_cost: number;
  suggested_price: number;
  image_url?: string;
}

export interface FilamentUsage {
  filament_id: string;
  material_weight_g: number;
  cost: number;
}

export interface Print {
  id: string;
  print_date: string;
  product_id: string;
  printer_id: string;
  print_time_minutes: number;
  quantity_produced: number;
  filaments_used: FilamentUsage[];
  expenses_used?: { expense_id: string; quantity: number; cost: number }[];
  cost_filament_total: number;
  cost_energy: number;
  cost_depreciation: number;
  cost_additional: number;
  applied_margin: number;
  suggested_price_generated: number;
  unit_cost_final: number;
  energy_rate: number;
  printer_power_w: number;
  status: 'completed' | 'failed';
}

export interface Marketplace {
  id: string;
  name: string;
  fee_percent: number;
  fee_fixed: number;
  notes?: string;
}

export interface OrderItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_cost_at_sale: number;
}

export interface Order {
  id: string;
  marketplace_order_id?: string;
  marketplace_id: string;
  customer_name: string;
  order_date: string;
  status: 'draft' | 'confirmed' | 'shipped';
  total_price: number;
  marketplace_fee: number;
  cost_additional: number;
  expenses_used?: { expenseId: string; qty: number }[]; // <--- NOVO CAMPO
  net_profit: number;
  items?: OrderItem[];
}