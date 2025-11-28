import React, { useState } from 'react'; // Removi useEffect
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, UserPlus } from 'lucide-react';
import logo from '../assets/logo.png'; 

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isRegistering) {
        await signUp(email, password, fullName);
        alert('Conta criada com sucesso!');
        setIsRegistering(false);
      } else {
        // AWAIT é o segredo: O código trava aqui até o Supabase responder E o Zustand atualizar
        await signIn(email, password);
        
        // Só chega nesta linha se não der erro no signIn
        // Forçamos um pequeno delay para o Zustand propagar o estado para o ProtectedRoute
        setTimeout(() => {
            navigate('/', { replace: true });
        }, 100); 
      }
    } catch (error: any) {
      console.error(error);
      if (error.message) alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
        <div className="mb-8 flex flex-col items-center">
          <img src={logo} alt="Custo3D" className="h-20 mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-white">
            {isRegistering ? 'Criar Conta' : 'Bem-vindo'}
          </h1>
          <p className="text-gray-400 mt-2">
            {isRegistering ? 'Preencha os dados abaixo' : 'Faça login para continuar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required={isRegistering}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="******"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Entrando...' : (isRegistering ? 'Cadastrar' : 'Entrar')}
            {!loading && (isRegistering ? <UserPlus size={20} /> : <ArrowRight size={20} />)}
          </button>
        </form>
        
        <div className="mt-6 text-center pt-6 border-t border-gray-700">
          <p className="text-gray-400 text-sm mb-2">
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
          </p>
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-colors"
          >
            {isRegistering ? 'Fazer Login' : 'Criar nova conta'}
          </button>
        </div>
      </div>
    </div>
  );
};