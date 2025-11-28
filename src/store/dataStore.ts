import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { Filament, Marketplace, Print, Printer, Product, Order, UserConfig, Expense } from '../types';
import { useAuthStore } from './authStore';

interface DataState {
  filaments: Filament[];
  printers: Printer[];
  products: Product[];
  marketplaces: Marketplace[];
  orders: Order[];
  prints: Print[];
  expenses: Expense[];
  loading: boolean;
  
  fetchData: () => Promise<void>;
  
  addPrinter: (data: Omit<Printer, 'id' | 'user_id' | 'total_hours_printed'>) => Promise<void>;
  updatePrinter: (id: string, data: Partial<Printer>) => Promise<void>;
  deletePrinter: (id: string) => Promise<void>;

  addProduct: (data: Omit<Product, 'id' | 'user_id'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addFilament: (data: Omit<Filament, 'id' | 'user_id'>) => Promise<void>;
  updateFilament: (id: string, data: Partial<Filament>) => Promise<void>;
  deleteFilament: (id: string) => Promise<void>;
  addFilamentPurchase: (id: string, rolls: number) => Promise<void>;

  addMarketplace: (data: Omit<Marketplace, 'id' | 'user_id'>) => Promise<void>;
  updateMarketplace: (id: string, data: Partial<Marketplace>) => Promise<void>;
  deleteMarketplace: (id: string) => Promise<void>;

  addExpense: (data: Omit<Expense, 'id' | 'user_id'>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  updateConfig: (config: Partial<UserConfig>) => Promise<void>;

  registerProduction: (printData: Omit<Print, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deletePrint: (id: string) => Promise<void>;
  
  createOrder: (order: Omit<Order, 'id' | 'user_id'>, items: any[]) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>, items: any[]) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  finalizeOrder: (orderId: string) => Promise<void>;

  importOrdersBatch: (orders: any[], marketplaceId: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  filaments: [],
  printers: [],
  products: [],
  marketplaces: [],
  orders: [],
  prints: [],
  expenses: [],
  loading: false,

  fetchData: async () => {
    set({ loading: true });
    try {
      const [fil, print, prod, mkt, ord, exp, prt] = await Promise.all([
        supabase.from('filaments').select('*').order('name'),
        supabase.from('printers').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
        supabase.from('marketplaces').select('*').order('name'),
        supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('name'),
        supabase.from('prints').select('*').order('created_at', { ascending: false }),
      ]);

      const formattedOrders = (ord.data || []).map((o: any) => ({
        ...o,
        items: o.order_items || [] 
      }));

      set({
        filaments: fil.data || [],
        printers: print.data || [],
        products: prod.data || [],
        marketplaces: mkt.data || [],
        orders: formattedOrders,
        expenses: exp.data || [],
        prints: prt.data || [],
      });
    } finally {
      set({ loading: false });
    }
  },

  // ... CRUDs ...
  addPrinter: async (data) => { const user = useAuthStore.getState().user; if (!user) return; await supabase.from('printers').insert([{ ...data, user_id: user.id }]); get().fetchData(); },
  updatePrinter: async (id, data) => { await supabase.from('printers').update(data).eq('id', id); get().fetchData(); },
  deletePrinter: async (id) => { await supabase.from('printers').delete().eq('id', id); get().fetchData(); },
  
  addProduct: async (data) => { const user = useAuthStore.getState().user; if (!user) return; await supabase.from('products').insert([{ ...data, user_id: user.id }]); get().fetchData(); },
  updateProduct: async (id, data) => { await supabase.from('products').update(data).eq('id', id); get().fetchData(); },
  deleteProduct: async (id) => { 
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') alert('Não é possível excluir: Produto usado em vendas ou produção.');
      else console.error(error);
    }
    get().fetchData(); 
  },
  
  addFilament: async (data) => { const user = useAuthStore.getState().user; if (!user) return; await supabase.from('filaments').insert([{ ...data, user_id: user.id }]); get().fetchData(); },
  updateFilament: async (id, data) => { await supabase.from('filaments').update(data).eq('id', id); get().fetchData(); },
  deleteFilament: async (id) => { await supabase.from('filaments').delete().eq('id', id); get().fetchData(); },
  addFilamentPurchase: async (id, rolls) => { const filament = get().filaments.find(f => f.id === id); if (!filament) return; const newWeight = (filament.current_weight_g || 0) + (rolls * filament.grams_per_roll); const newRolls = (filament.rolls || 0) + rolls; await get().updateFilament(id, { rolls: newRolls, current_weight_g: newWeight }); },
  
  addMarketplace: async (data) => { const user = useAuthStore.getState().user; if (!user) return; await supabase.from('marketplaces').insert([{ ...data, user_id: user.id }]); get().fetchData(); },
  updateMarketplace: async (id, data) => { await supabase.from('marketplaces').update(data).eq('id', id); get().fetchData(); },
  deleteMarketplace: async (id) => { await supabase.from('marketplaces').delete().eq('id', id); get().fetchData(); },
  
  addExpense: async (data) => { const user = useAuthStore.getState().user; if (!user) return; await supabase.from('expenses').insert([{ ...data, user_id: user.id }]); get().fetchData(); },
  updateExpense: async (id, data) => { await supabase.from('expenses').update(data).eq('id', id); get().fetchData(); },
  deleteExpense: async (id) => { await supabase.from('expenses').delete().eq('id', id); get().fetchData(); },
  
  // --- CORREÇÃO BLINDADA AQUI ---
  updateConfig: async (config) => { 
    const user = useAuthStore.getState().user; 
    if (!user) return; 
    
    // Usamos UPSERT: Se existir atualiza, se não existir cria.
    const { error } = await supabase.from('user_configs').upsert({ 
      user_id: user.id,
      ...config 
    }); 
    
    if (error) throw error;

    // Atualiza memória
    useAuthStore.setState((state) => ({
      config: { ...state.config, ...config }
    }));
  },

  registerProduction: async (printData) => {
    const user = useAuthStore.getState().user; if (!user) return;
    const { error: printError } = await supabase.from('prints').insert([{ ...printData, user_id: user.id }]);
    if (printError) throw printError;

    const product = get().products.find(p => p.id === printData.product_id);
    if (product) {
      const currentQty = product.stock_quantity || 0;
      const currentAvgCost = product.average_cost || 0;
      const producedQty = printData.quantity_produced;
      const unitCost = printData.unit_cost_final;
      const newTotalValue = (currentQty * currentAvgCost) + (producedQty * unitCost);
      const newTotalQty = currentQty + producedQty;
      const newAvgCost = newTotalQty > 0 ? newTotalValue / newTotalQty : unitCost;

      await supabase.from('products').update({
        stock_quantity: newTotalQty,
        average_cost: newAvgCost,
        suggested_price: printData.suggested_price_generated
      }).eq('id', product.id);
    }

    if (printData.filaments_used) {
      for (const usage of printData.filaments_used) {
        const filament = get().filaments.find(f => f.id === usage.filament_id);
        if (filament) {
          const newWeight = Math.max(0, (filament.current_weight_g || 0) - usage.material_weight_g);
          const newRolls = Math.floor(newWeight / filament.grams_per_roll);
          await supabase.from('filaments').update({ current_weight_g: newWeight, rolls: newRolls }).eq('id', filament.id);
        }
      }
    }

    const printer = get().printers.find(p => p.id === printData.printer_id);
    if (printer) {
      const addedHours = printData.print_time_minutes / 60;
      await supabase.from('printers').update({ total_hours_printed: (printer.total_hours_printed || 0) + addedHours }).eq('id', printer.id);
    }
    get().fetchData();
  },

  deletePrint: async (id) => {
    const { error } = await supabase.from('prints').delete().eq('id', id);
    if (error) throw error;
    get().fetchData();
  },

  createOrder: async (orderData, items) => {
    const user = useAuthStore.getState().user; if (!user) return;
    const { data: orderRes, error: orderError } = await supabase.from('orders').insert([{ ...orderData, user_id: user.id }]).select().single();
    if (orderError) throw orderError;
    const itemsToInsert = items.map(item => ({
      order_id: orderRes.id, product_id: item.product_id, quantity: item.quantity, unit_price: item.unit_price, unit_cost_at_sale: item.unit_cost_at_sale
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
    get().fetchData();
  },

  updateOrder: async (id, orderData, items) => {
    const { error: orderError } = await supabase.from('orders').update(orderData).eq('id', id);
    if (orderError) throw orderError;
    await supabase.from('order_items').delete().eq('order_id', id);
    const itemsToInsert = items.map(item => ({
      order_id: id, product_id: item.product_id, quantity: item.quantity, unit_price: item.unit_price, unit_cost_at_sale: item.unit_cost_at_sale
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
    get().fetchData();
  },

  deleteOrder: async (id) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    get().fetchData();
  },

  finalizeOrder: async (orderId) => {
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    if (items) {
      for (const item of items) {
        const product = get().products.find(p => p.id === item.product_id);
        if (product) {
          const newQty = Math.max(0, (product.stock_quantity || 0) - item.quantity);
          await supabase.from('products').update({ stock_quantity: newQty }).eq('id', product.id);
        }
      }
    }
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);
    get().fetchData();
  },

  importOrdersBatch: async (ordersData, marketplaceId) => {
    const user = useAuthStore.getState().user; if (!user) return;
    const mkt = get().marketplaces.find(m => m.id === marketplaceId);
    const feePercent = mkt ? mkt.fee_percent : 0;
    const feeFixed = mkt ? mkt.fee_fixed : 0;

    for (const order of ordersData) {
      const { data: existing } = await supabase.from('orders').select('id').eq('marketplace_order_id', order.externalId).maybeSingle();
      if (existing) continue;

      const totalRevenue = order.total;
      const fee = (totalRevenue * (feePercent / 100)) + feeFixed;
      let totalProdCost = 0;
      const orderItems = [];

      for (const item of order.items) {
        const skuPlanilha = String(item.sku).trim().toUpperCase();
        const product = get().products.find(p => p.sku && String(p.sku).trim().toUpperCase() === skuPlanilha);
        
        if (product) {
          totalProdCost += (product.average_cost * item.quantity);
          orderItems.push({
            product_id: product.id,
            quantity: item.quantity,
            unit_price: item.price,
            unit_cost_at_sale: product.average_cost
          });
        }
      }

      if (orderItems.length > 0) {
        const profit = totalRevenue - fee - totalProdCost;
        const { data: orderRes, error } = await supabase.from('orders').insert([{
          user_id: user.id,
          customer_name: order.customer || 'Cliente Importado',
          marketplace_id: marketplaceId,
          marketplace_order_id: order.externalId,
          order_date: order.date,
          status: 'confirmed',
          total_price: totalRevenue,
          marketplace_fee: fee,
          net_profit: profit,
          cost_additional: 0
        }]).select().single();

        if (!error && orderRes) {
          const itemsToInsert = orderItems.map(i => ({ ...i, order_id: orderRes.id }));
          await supabase.from('order_items').insert(itemsToInsert);
        }
      }
    }
    get().fetchData();
  }
}));