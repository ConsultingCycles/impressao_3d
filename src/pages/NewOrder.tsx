import { useState, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { ShoppingCart, Plus, Trash2, Save, Hash, ArrowLeft, Tag } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';

export const NewOrder = () => {
  const { products, marketplaces, expenses, createOrder, updateOrder, fetchData, orders } = useDataStore();
  const navigate = useNavigate();
  const { id } = useParams();

  const [customer, setCustomer] = useState('');
  const [marketplaceId, setMarketplaceId] = useState('');
  const [externalOrderId, setExternalOrderId] = useState('');
  
  const [cart, setCart] = useState<{ productId: string; qty: number; price: number }[]>([]);
  const [extraExpenses, setExtraExpenses] = useState<{ expenseId: string; qty: number }[]>([]);

  const [selectedProdId, setSelectedProdId] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const [selectedExpenseId, setSelectedExpenseId] = useState('');
  const [expenseQty, setExpenseQty] = useState(1);

  // Carrega dados iniciais
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Carrega dados se for Edição
  useEffect(() => {
    if (id && orders.length > 0) {
      const orderToEdit = orders.find(o => o.id === id);
      if (orderToEdit) {
        setCustomer(orderToEdit.customer_name);
        setMarketplaceId(orderToEdit.marketplace_id || '');
        setExternalOrderId(orderToEdit.marketplace_order_id || '');
        
        // CORREÇÃO: Carrega os produtos
        if (orderToEdit.items && orderToEdit.items.length > 0) {
          const items = orderToEdit.items.map(item => ({
            productId: item.product_id,
            qty: item.quantity,
            price: item.unit_price
          }));
          setCart(items);
        }

        // CORREÇÃO: Carrega as despesas extras (Se existirem no JSON)
        // O campo 'expenses_used' é um JSONB, então vem como array direto
        if (orderToEdit.expenses_used && Array.isArray(orderToEdit.expenses_used)) {
          setExtraExpenses(orderToEdit.expenses_used);
        }
      }
    }
  }, [id, orders]);

  useEffect(() => {
    const p = products.find(prod => prod.id === selectedProdId);
    if (p) setPrice(p.suggested_price || 0);
  }, [selectedProdId, products]);

  const addToCart = () => {
    if (!selectedProdId || qty <= 0) return;
    const exists = cart.findIndex(i => i.productId === selectedProdId);
    if (exists >= 0) {
      const newCart = [...cart];
      newCart[exists].qty += qty;
      setCart(newCart);
    } else {
      setCart([...cart, { productId: selectedProdId, qty, price }]);
    }
    setSelectedProdId('');
    setQty(1);
    setPrice(0);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const addExpense = () => {
    if (!selectedExpenseId || expenseQty <= 0) return;
    setExtraExpenses([...extraExpenses, { expenseId: selectedExpenseId, qty: expenseQty }]);
    setSelectedExpenseId('');
    setExpenseQty(1);
  };

  const removeExpense = (index: number) => {
    setExtraExpenses(extraExpenses.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totalRevenue = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const mkt = marketplaces.find(m => m.id === marketplaceId);
    const fee = mkt ? (totalRevenue * (mkt.fee_percent / 100)) + mkt.fee_fixed : 0;
    
    let totalProdCost = 0;
    cart.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) totalProdCost += (p.average_cost * item.qty);
    });

    let totalExtraCost = 0;
    extraExpenses.forEach(item => {
      const e = expenses.find(exp => exp.id === item.expenseId);
      if (e) totalExtraCost += (e.cost * item.qty);
    });

    const profit = totalRevenue - fee - totalProdCost - totalExtraCost;
    return { totalRevenue, fee, totalProdCost, totalExtraCost, profit };
  };

  const handleSubmit = async () => {
    if (!customer || cart.length === 0) return alert('Preencha o cliente e adicione itens.');
    
    const totals = calculateTotals();
    
    const orderItems = cart.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      return {
        product_id: item.productId,
        quantity: item.qty,
        unit_price: item.price,
        unit_cost_at_sale: p?.average_cost || 0
      };
    });

    const payload = {
      customer_name: customer,
      marketplace_id: marketplaceId || '', // String vazia se não selecionado
      marketplace_order_id: externalOrderId,
      total_price: totals.totalRevenue,
      marketplace_fee: totals.fee,
      cost_additional: totals.totalExtraCost,
      expenses_used: extraExpenses, // <--- SALVANDO O ARRAY DE DESPESAS NO JSON
      net_profit: totals.profit,
      order_date: id ? undefined : new Date().toISOString(), 
      status: 'draft' as const
    };

    try {
      if (id) {
        // @ts-ignore
        await updateOrder(id, payload, orderItems);
        alert('Pedido atualizado!');
      } else {
        // @ts-ignore
        await createOrder(payload, orderItems);
        alert('Pedido criado!');
      }
      navigate('/orders');
    } catch (e: any) {
      console.error(e);
      alert('Erro ao salvar: ' + e.message);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/orders" className="bg-gray-800 p-2 rounded-lg text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-white">
          {id ? 'Editar Pedido' : 'Novo Pedido'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* === COLUNA ESQUERDA (DADOS + PRODUTOS) === */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Dados da Venda */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Dados da Venda</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome do Cliente</label>
                <input 
                  value={customer} 
                  onChange={e => setCustomer(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white" 
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Canal de Venda</label>
                  <select 
                    value={marketplaceId} 
                    onChange={e => setMarketplaceId(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Venda Direta</option>
                    {marketplaces.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nº Pedido (Opcional)</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input 
                      value={externalOrderId} 
                      onChange={e => setExternalOrderId(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-white" 
                      placeholder="Ex: #123"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Adicionar Produtos */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="text-cyan-400" size={20} /> Adicionar Produtos
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <select 
                  value={selectedProdId} 
                  onChange={e => setSelectedProdId(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">Selecione um produto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Estoque: {p.stock_quantity})
                    </option>
                  ))}
                </select>
                <input 
                  type="number" 
                  value={qty} 
                  onChange={e => setQty(Number(e.target.value))}
                  className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm text-center" 
                  placeholder="Qtd"
                />
                <button onClick={addToCart} className="bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-lg">
                  <Plus size={20} />
                </button>
              </div>

              {/* Lista de Itens */}
              <div className="mt-4 space-y-2">
                {cart.map((item, index) => {
                  const p = products.find(prod => prod.id === item.productId);
                  return (
                    <div key={index} className="flex justify-between items-center bg-gray-700/30 p-3 rounded-lg border border-gray-700">
                      <div>
                        <p className="text-white font-medium">{p?.name}</p>
                        <p className="text-xs text-gray-400">{item.qty} x R$ {item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-bold">R$ {(item.price * item.qty).toFixed(2)}</span>
                        <button onClick={() => removeFromCart(index)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {cart.length === 0 && <p className="text-gray-500 text-sm text-center py-2">Nenhum produto adicionado.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* === COLUNA DIREITA (DESPESAS + TOTAIS) === */}
        <div className="space-y-6">
          
          {/* 3. Quadro de Despesas Extras */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Tag className="text-orange-400" size={20} /> Despesas / Embalagem
            </h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <select 
                  value={selectedExpenseId} 
                  onChange={e => setSelectedExpenseId(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">Adicionar item...</option>
                  {expenses.map(e => (
                    <option key={e.id} value={e.id}>{e.name} (R$ {e.cost.toFixed(2)})</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  value={expenseQty} 
                  onChange={e => setExpenseQty(Number(e.target.value))}
                  className="w-16 bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white text-sm text-center" 
                  placeholder="Qtd"
                />
                <button onClick={addExpense} className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg">
                  <Plus size={20} />
                </button>
              </div>

              {/* Lista de Despesas */}
              <div className="space-y-2">
                {extraExpenses.map((item, index) => {
                  const e = expenses.find(exp => exp.id === item.expenseId);
                  return (
                    <div key={index} className="flex justify-between items-center bg-gray-700/30 p-2 rounded border border-gray-700 text-sm">
                      <span className="text-gray-300">{item.qty}x {e?.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-orange-400 font-medium">R$ {(e ? e.cost * item.qty : 0).toFixed(2)}</span>
                        <button onClick={() => removeExpense(index)} className="text-gray-500 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {extraExpenses.length === 0 && <p className="text-gray-500 text-xs text-center">Nenhuma despesa extra.</p>}
              </div>
            </div>
          </div>

          {/* 4. Resumo Financeiro */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 space-y-3 sticky top-6">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal (Venda)</span>
              <span>R$ {totals.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-red-400">
              <span>(-) Taxas Marketplace</span>
              <span>- R$ {totals.fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>(-) Custo Prod. (Peça)</span>
              <span>- R$ {totals.totalProdCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-orange-400">
              <span>(-) Custos Extras</span>
              <span>- R$ {totals.totalExtraCost.toFixed(2)}</span>
            </div>
            
            <div className="border-t border-gray-600 pt-3 flex justify-between font-bold text-lg text-white">
              <span>Lucro Líquido</span>
              <span className={totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                R$ {totals.profit.toFixed(2)}
              </span>
            </div>
            
            <button onClick={handleSubmit} className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-[0.98]">
              <Save size={20} /> {id ? 'Atualizar Pedido' : 'Criar Pedido'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};