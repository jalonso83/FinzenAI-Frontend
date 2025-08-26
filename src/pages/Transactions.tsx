import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import TransactionFormWeb from '../components/TransactionFormWeb.tsx';
import { transactionsAPI, categoriesAPI } from '../utils/api';
import api from '../utils/api';
import './Screens.css';
import './Transactions.css';
import { toast, Toaster } from 'react-hot-toast';
import type { Transaction, Category } from '../utils/api';
import { triggerGamificationEvent, useGamificationEventListener } from '../hooks/useGamificationToasts';
import { EventType } from '../types/gamification';

const Transactions = () => {
  const [showForm, setShowForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  
  const currency = 'RD$';

  // Estados locales para transacciones y categorías
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const itemsPerPage = 50; // Mostrar 50 transacciones por página

  // Hook para escuchar eventos de gamificación y mostrar toasts
  useGamificationEventListener();

  const fetchData = async (page: number = currentPage, resetPage: boolean = false) => {
    setLoading(true);
    try {
      // Construir filtros para la API
      const params: any = {
        page: resetPage ? 1 : page,
        limit: itemsPerPage
      };

      // Aplicar filtros si están seleccionados
      if (typeFilter !== 'all') {
        params.type = typeFilter.toUpperCase();
      }
      if (categoryFilter !== 'all') {
        params.category_id = categoryFilter;
      }

      // Aplicar filtro de período
      if (periodFilter !== 'all') {
        const now = new Date();
        let startDate, endDate;

        switch (periodFilter) {
          case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'lastMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
          case 'last3Months':
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            endDate = new Date();
            break;
          case 'thisYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date();
            break;
        }

        if (startDate && endDate) {
          params.startDate = startDate.toISOString();
          params.endDate = endDate.toISOString();
        }
      }

      const [txRes, catRes] = await Promise.all([
        transactionsAPI.getAll(params),
        categoriesAPI.getAll()
      ]);

      setTransactions(txRes.transactions || []);
      setTotalTransactions(txRes.pagination?.total || 0);
      setTotalPages(txRes.pagination?.pages || 1);
      setCurrentPage(resetPage ? 1 : page);
      setCategories(catRes);
      
      console.log('Fetch ejecutado - Página:', resetPage ? 1 : page, 'Total:', txRes.pagination?.total);
    } catch (err) {
      setError('Error al cargar datos');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // useEffect para cargar datos inicialmente
  useEffect(() => {
    fetchData(1, true);
  }, []);

  // useEffect para recargar cuando cambian los filtros
  useEffect(() => {
    if (categories.length > 0) { // Solo ejecutar después de que las categorías estén cargadas
      fetchData(1, true); // Resetear a página 1 cuando cambian filtros
    }
  }, [typeFilter, categoryFilter, periodFilter]);

  // Listener para refrescado desde Zenio
  useEffect(() => {
    // Handler para refrescar desde Zenio
    const handleZenioTransactionCreated = () => {
      fetchData(1, true); // Ir a la primera página para ver la nueva transacción
    };
    
    const handleZenioTransactionUpdated = () => {
      fetchData(currentPage); // Mantener página actual
    };
    
    const handleZenioTransactionDeleted = () => {
      fetchData(currentPage); // Mantener página actual
    };
    
    // Handler para refrescar cuando se actualizan presupuestos (por si las transacciones los afectan)
    const handleBudgetsUpdated = () => {
      fetchData(currentPage); // Mantener página actual
    };
    
    window.addEventListener('zenio-transaction-created', handleZenioTransactionCreated);
    window.addEventListener('zenio-transaction-updated', handleZenioTransactionUpdated);
    window.addEventListener('zenio-transaction-deleted', handleZenioTransactionDeleted);
    window.addEventListener('budgets-updated', handleBudgetsUpdated);
    
    return () => {
      window.removeEventListener('zenio-transaction-created', handleZenioTransactionCreated);
      window.removeEventListener('zenio-transaction-updated', handleZenioTransactionUpdated);
      window.removeEventListener('zenio-transaction-deleted', handleZenioTransactionDeleted);
      window.removeEventListener('budgets-updated', handleBudgetsUpdated);
    };
  }, []); // Dependencia de fetchData
  
  // Agrupar transacciones por fecha
  const groupTransactionsByDate = (transactions: Transaction[]): { date: string, transactions: Transaction[] }[] => {
    const groups: { [date: string]: Transaction[] } = {};
    
    transactions.forEach((transaction: Transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    // Ordenar las fechas de más reciente a más antigua
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map(date => ({
        date,
        transactions: groups[date].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }));
  };
  
  // Función para parsear fecha sin conversión de zona horaria
  const parseDate = (dateStr: string): Date => {
    const dateParts = dateStr.split('-');
    return new Date(
      parseInt(dateParts[0]), 
      parseInt(dateParts[1]) - 1, // Mes es 0-based en JavaScript
      parseInt(dateParts[2])
    );
  };

  // Los filtros ahora se aplican en el backend con paginación
  
  // CRUD locales
  const handleCreateTransaction = async (data: any) => {
    setLoading(true);
    try {
      const response = await transactionsAPI.create(data);
      await fetchData(1, true); // Ir a primera página para ver nueva transacción
      toast.success('¡Transacción creada!');
      
      // Esperar a que el backend procese la gamificación y obtener puntos REALES
      setTimeout(async () => {
        try {
          const eventsRes = await api.get(`/gamification/events/recent?since=${new Date(Date.now() - 30000).toISOString()}`);
          
          if (eventsRes.data.success && eventsRes.data.data.length > 0) {
            // Sumar TODOS los puntos otorgados por esta transacción
            const totalPoints = eventsRes.data.data.reduce((sum: number, event: any) => sum + (event.pointsAwarded || 0), 0);
            if (totalPoints > 0) {
              triggerGamificationEvent(EventType.ADD_TRANSACTION, totalPoints);
            }
          }
        } catch (error) {
          console.error('Error obteniendo puntos reales del backend:', error);
        }
      }, 1500); // Dar tiempo al backend para procesar
      
      window.dispatchEvent(new Event('budgets-updated'));
      
      // Disparar evento para que otras páginas se actualicen
      window.dispatchEvent(new CustomEvent('transaction-created', { 
        detail: { transaction: response.transaction } 
      }));
      
    } catch {
      toast.error('Error al crear transacción');
    } finally {
      setLoading(false);
    }
  };
  const handleEditTransaction = async (id: string, data: any) => {
    setLoading(true);
    try {
      await transactionsAPI.update(id, data);
      await fetchData(currentPage); // Mantener página actual después de editar
      toast.success('¡Transacción actualizada!');
      window.dispatchEvent(new Event('budgets-updated'));
    } catch {
      toast.error('Error al actualizar transacción');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      setLoading(true);
      try {
        await transactionsAPI.delete(id);
        await fetchData(currentPage); // Recargar página actual después de eliminar
        toast.success('¡Transacción eliminada!');
        window.dispatchEvent(new Event('budgets-updated'));
      } catch {
        toast.error('Error al eliminar transacción');
      } finally {
        setLoading(false);
      }
    }
  };

  // Funciones para obtener nombre e icono de categoría (ya no necesarias, category es objeto completo)
  const getCategoryNameById = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Otra';
  };
  const getCategoryIconById = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : '📊';
  };

  // Obtener las categorías para el filtro
  const getCategories = (): Category[] => {
    return categories;
  };
  
  // Formatear la fecha para mostrar
  const getFormattedDateHeader = (dateStr: string): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const transactionDate = parseDate(dateStr);
    
    if (transactionDate.getTime() === today.getTime()) {
      return 'Hoy';
    } else if (transactionDate.getTime() === yesterday.getTime()) {
      return 'Ayer';
    } else {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Formatear moneda
  const formatCurrency = (amount: number, currency: string): string => {
    return `${currency}${amount.toLocaleString('es-DO')}`;
  };
  
  // Iniciar la edición de una transacción
  const handleEditTransactionClick = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setShowForm(true);
  };

  // Funciones de paginación
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchData(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };
  
  // Ya no necesitamos filtrar localmente, el backend lo hace con paginación
  const groupedTransactions = groupTransactionsByDate(transactions);
  
  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-6">
      <Navigation />
      
      <div className="screen-container">
        <div className="screen-header">
          <h2 className="section-title text-text mb-6 font-bold">Transacciones</h2>
          <button 
            className="primary-button" 
            onClick={() => {
              if (categories.length === 0) {
                alert('Debes esperar a que las categorías se carguen antes de crear una transacción.');
                return;
              }
              setEditTransaction(null);
              setShowForm(true);
            }}
            disabled={categories.length === 0}
          >
            + Nueva
          </button>
        </div>
        
        <div className="filter-section">
          <div className="filter-group">
            <label>Tipo:</label>
            <select 
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="INCOME">Ingresos</option>
              <option value="EXPENSE">Gastos</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Categoría:</label>
            {/* Combo de categorías del filtro: */}
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              {categories
                .filter(cat => typeFilter === 'all' || cat.type === typeFilter)
                .map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Periodo:</label>
            <select 
              className="filter-select"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="thisMonth">Este mes</option>
              <option value="lastMonth">Mes pasado</option>
              <option value="last3Months">Últimos 3 meses</option>
              <option value="thisYear">Este año</option>
            </select>
          </div>
        </div>
        
        <div className="transactions-list-container">
          {loading && <div className="text-center py-4">Cargando datos...</div>}
          {groupedTransactions.length > 0 ? (
            groupedTransactions.map(group => (
              <div className="transaction-group" key={group.date}>
                <h3 className="transaction-date-header">{getFormattedDateHeader(group.date)}</h3>
                
                {group.transactions.map(transaction => {
                  const icon = typeof transaction.category === 'object' && transaction.category !== null ? transaction.category.icon : '📊';
                  const name = typeof transaction.category === 'object' && transaction.category !== null ? transaction.category.name : '';
                  return (
                    <div 
                      className={`transaction-item ${transaction.type}`} 
                      key={transaction.id}
                      onClick={() => handleEditTransactionClick(transaction)}
                    >
                      <div className="transaction-icon">
                        {icon}
                      </div>
                      <div className="transaction-info">
                        <p className="transaction-title">
                          {transaction.description || name || 'Sin descripción'}
                        </p>
                      </div>
                      <p className={`transaction-amount ${transaction.type === 'INCOME' ? 'income' : 'expense'}`}> 
                        <span className={`transaction-sign ${transaction.type === 'INCOME' ? 'income' : 'expense'}`}>{transaction.type === 'INCOME' ? '+' : '−'}</span>
                        {formatCurrency(transaction.amount, currency)}
                      </p>
                      <button 
                        className="delete-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTransaction(transaction.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No hay transacciones</h3>
              <p>No hay transacciones que coincidan con los filtros seleccionados.</p>
              <button 
                className="primary-button" 
                onClick={() => {
                  setEditTransaction(null);
                  setShowForm(true);
                }}
              >
                + Nueva Transacción
              </button>
            </div>
          )}
        </div>

        {/* Información de paginación y controles */}
        {!loading && transactions.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <p>
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalTransactions)} de {totalTransactions} transacciones
              </p>
            </div>
            
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button 
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="pagination-button"
                >
                  ← Anterior
                </button>
                
                <div className="pagination-numbers">
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        disabled={loading}
                        className={`pagination-number ${pageNumber === currentPage ? 'active' : ''}`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages || loading}
                  className="pagination-button"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}
        
        {showForm && (
          <TransactionFormWeb
            key={categories.length}
            onClose={() => setShowForm(false)}
            editTransaction={editTransaction}
            categories={categories}
            onSave={handleCreateTransaction}
            onEdit={handleEditTransaction}
          />
        )}
      </div>
      
      {/* Toast Notifications Container */}
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
      />
    </div>
  );
};

export default Transactions; 