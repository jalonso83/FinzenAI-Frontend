import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartOptions } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryData {
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
}

interface PieChartProps {
  data: CategoryData[];
  title?: string;
  type?: 'INCOME' | 'EXPENSE';
}

const PieChart: React.FC<PieChartProps> = ({ data, title = "Distribución por Categorías", type }) => {
  console.log('PieChart data received:', data);
  
  if (!data || data.length === 0) {
    console.log('PieChart: No data available');
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No hay datos para mostrar</p>
        </div>
      </div>
    );
  }

  // Generar colores únicos para cada categoría
  const generateColors = (count: number) => {
    // Detectar el tipo basado en los datos si no se proporciona
    const detectedType = type || (data.length > 0 && data[0].type === 'INCOME' ? 'INCOME' : 'EXPENSE');
    
    let colors;
    if (detectedType === 'INCOME') {
      // Gama amplia para ingresos - verde → azul-verde → azul → lima
      colors = [
        '#10B981', // Verde principal
        '#14B8A6', // Teal
        '#06B6D4', // Azul cielo  
        '#22C55E', // Verde claro
        '#0EA5E9', // Azul
        '#84CC16', // Lima
        '#3B82F6', // Azul royal
        '#059669', // Verde esmeralda
        '#0284C7', // Azul cobalto
        '#65A30D', // Lima oscuro
        '#6366F1', // Índigo
        '#16A34A', // Verde bosque
        '#0F766E', // Verde azulado oscuro
        '#8B5CF6', // Violeta
        '#047857'  // Verde pino
      ];
    } else {
      // Gama amplia para gastos - rojo → naranja → amarillo → rosa
      colors = [
        '#EF4444', // Rojo principal
        '#F97316', // Naranja
        '#F59E0B', // Ámbar
        '#DC2626', // Rojo oscuro
        '#FB923C', // Naranja claro
        '#FDE047', // Amarillo
        '#EC4899', // Rosa
        '#B91C1C', // Rojo granate
        '#FDBA74', // Durazno
        '#FEF08A', // Amarillo claro
        '#F472B6', // Rosa claro
        '#7C2D12', // Marrón rojizo
        '#F97171', // Rojo coral
        '#FBBF24', // Amarillo dorado
        '#BE185D'  // Rosa fucsia
      ];
    }
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  };

  const colors = generateColors(data.length);
  const backgroundColors = colors.map(color => color + '80'); // 50% opacity
  const borderColors = colors;

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.total),
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverBackgroundColor: colors,
        hoverBorderWidth: 3,
        hoverOffset: 10
      }
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12
          },
          generateLabels: function(chart) {
            const datasets = chart.data.datasets;
            if (datasets.length) {
              return chart.data.labels?.map((label, i) => {
                const dataset = datasets[0];
                const value = dataset.data[i] as number;
                const percentage = data[i]?.percentage || 0;
                
                const bgColor = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor;
                const borderColor = Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : dataset.borderColor;
                
                return {
                  text: `${label} (${percentage.toFixed(1)}%)`,
                  fillStyle: bgColor as string,
                  strokeStyle: borderColor as string,
                  lineWidth: dataset.borderWidth as number,
                  index: i
                };
              }) || [];
            }
            return [];
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const categoryData = data[context.dataIndex];
            const value = context.parsed;
            const percentage = categoryData.percentage;
            
            return [
              `${context.label}: ${formatCurrency(value)}`,
              `Porcentaje: ${percentage.toFixed(1)}%`,
              `Transacciones: ${categoryData.count}`,
              `Promedio: ${formatCurrency(categoryData.average)}`
            ];
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  try {
    return (
      <div className="h-64 relative">
        <Pie data={chartData} options={options} />
      </div>
    );
  } catch (error) {
    console.error('Error rendering PieChart:', error);
    return (
      <div className="h-64 flex items-center justify-center text-red-500">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <p>Error al cargar el gráfico</p>
          <p className="text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
        </div>
      </div>
    );
  }
};

export default PieChart;