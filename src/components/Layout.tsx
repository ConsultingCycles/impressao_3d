import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, 
  Printer, 
  Package, 
  ShoppingCart, 
  Settings, 
  LogOut, 
  FileText, 
  Factory,
  Store,
  Tag,
  Upload
} from 'lucide-react';

export const ProtectedRoute = () => {
  // Pegamos também o estado de 'loading' para saber se ainda está verificando o login
  const { user, loading, signOut } = useAuthStore();
  const location = useLocation();

  // 1. Se estiver carregando a sessão, mostra um aviso visual (fundo escuro para ver o texto)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Carregando sistema...</div>
      </div>
    );
  }

  // 2. CORREÇÃO CRUCIAL: Se terminou de carregar e NÃO tem usuário, manda pro Login!
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Se tem usuário, renderiza o menu normal
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/orders', icon: ShoppingCart, label: 'Vendas' },
    { path: '/import', icon: Upload, label: 'Importar Pedidos' },
    { path: '/production', icon: Factory, label: 'Produção' },
    { path: '/products', icon: Package, label: 'Produtos' },
    { path: '/expenses', icon: Tag, label: 'Custos Extras' },
    { path: '/marketplaces', icon: Store, label: 'Canais de Venda' },
    { path: '/printers', icon: Printer, label: 'Impressoras' },
    { path: '/filaments', icon: FileText, label: 'Filamentos' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar Fixa */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 fixed h-full z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Custo3D
          </h1>
          <p className="text-xs text-gray-500 mt-1">Gestão de Impressão</p>
        </div>

        <nav className="px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 font-medium' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon size={20} className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-500 group-hover:text-white'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700 bg-gray-800">
          <button 
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={18} /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="ml-64 flex-1 p-8 bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};