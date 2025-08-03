import React, { useState, useEffect } from 'react';
import { Download, Filter, RefreshCw, Calendar, Tag } from 'lucide-react';
import api from '../../utils/api';
import { useCategoriesStore } from '../../stores/categories';

interface CategoryReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalExpenses: number;
    totalIncome: number;
    totalTransactions: number;
    averageTransactionAmount: number;
    maxTransaction: number;
    minTransaction: number;
    activeCategories: number;
  };
  categoryData: Array<{
    id: number;
    name: string;
    type: string;
    icon: string;
    total: number;
    count: number;
    average: number;
    percentage: number;
    maxAmount: number;
    minAmount: number;
  }>;
  top5Categories: Array<any>;
  chartData: Array<any>;
  alerts: Array<{
    type: string;
    category: string;
    message: string;
    level: string;
  }>;
}

const CategoryReport: React.FC = () => {
  const [reportData, setReportData] = useState<CategoryReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('lastMonth');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  const { categories, fetchCategories } = useCategoriesStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadReportData();
  }, [dateRange, selectedCategories]);

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'lastQuarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart - 3, 1);
        endDate = new Date(now.getFullYear(), quarterStart, 0);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = customEndDate ? new Date(customEndDate) : new Date();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    return { startDate, endDate };
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      if (selectedCategories.length > 0) {
        params.append('categories', selectedCategories.join(','));
      }

      const response = await api.get(`/reports/categories?${params.toString()}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error cargando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`;
  };

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const { startDate, endDate } = getDateRange();
      const params = new URLSearchParams({
        format,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      if (selectedCategories.length > 0) {
        params.append('categories', selectedCategories.join(','));
      }

      const response = await api.get(`/reports/categories/export?${params.toString()}`);
      // Aquí se implementaría la descarga del archivo
      console.log('Exportar:', format, response.data);
    } catch (error) {
      console.error('Error exportando:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Cargando reporte...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filtros de Fecha */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="lastMonth">Último Mes</option>
                <option value="lastQuarter">Último Trimestre</option>
                <option value="lastYear">Último Año</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Filtro de Categorías */}
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-500" />
            <div className="relative">
              <select
                multiple
                value={selectedCategories.map(String)}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                  setSelectedCategories(values);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-40"
              >
                <option value="">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-2">
            <button
              onClick={loadReportData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                <Download className="w-4 h-4" />
                Exportar
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  Exportar PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                >
                  Exportar Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Activos */}
        {selectedCategories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Categorías seleccionadas:</span>
            {selectedCategories.map(categoryId => {
              const category = categories.find(c => c.id === categoryId);
              return category ? (
                <span
                  key={categoryId}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                >
                  {category.name}
                  <button
                    onClick={() => handleCategoryToggle(categoryId)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {reportData && (
        <>
          {/* Métricas Principales */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Gastos</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(reportData.metrics.totalExpenses)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">💸</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Promedio</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(reportData.metrics.averageTransactionAmount)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Máximo</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(reportData.metrics.maxTransaction)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-sm">⬆️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mínimo</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(reportData.metrics.minTransaction)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">⬇️</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categorías</p>
                  <p className="text-xl font-bold text-purple-600">
                    {reportData.metrics.activeCategories}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-sm">🏷️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alertas */}
          {reportData.alerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas y Notificaciones</h3>
              <div className="space-y-3">
                {reportData.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.level === 'warning' 
                        ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                        : 'bg-blue-50 border-blue-400 text-blue-800'
                    }`}
                  >
                    <p className="text-sm">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Categorías</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Gráfico de pastel próximamente</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencias Mensuales</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p>Gráfico de líneas próximamente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 y Tabla Detallada */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Categorías */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Categorías</h3>
              <div className="space-y-3">
                {reportData.top5Categories.map((category, index) => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{category.name}</p>
                        <p className="text-sm text-gray-600">{category.count} transacciones</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(category.total)}</p>
                      <p className="text-sm text-gray-600">{formatPercent(category.percentage)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabla Detallada */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis Detallado</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-600">Categoría</th>
                      <th className="text-right py-2 font-medium text-gray-600">Total</th>
                      <th className="text-right py-2 font-medium text-gray-600">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.categoryData.slice(0, 10).map((category) => (
                      <tr key={category.id} className="border-b border-gray-100">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-2 font-medium">
                          {formatCurrency(category.total)}
                        </td>
                        <td className="text-right py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            category.percentage > 20 ? 'bg-red-100 text-red-800' :
                            category.percentage > 10 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {formatPercent(category.percentage)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryReport;