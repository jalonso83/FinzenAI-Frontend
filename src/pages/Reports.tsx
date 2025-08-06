import React, { useState } from 'react';
import { useAuthStore } from '../stores/auth';
import Navigation from '../components/Navigation';
import CategoryReport from '../components/reports/CategoryReport';
import DateReport from '../components/reports/DateReport';
import './Screens.css';

const Reports = () => {
  const { user } = useAuthStore();
  const [selectedReport, setSelectedReport] = useState('categories');

  const reports = [
    {
      id: 'categories',
      name: 'Reporte por Categorías',
      description: 'Análisis de gastos e ingresos por categorías',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    {
      id: 'dates',
      name: 'Reporte por Fechas',
      description: 'Análisis temporal de transacciones',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-6">
      <Navigation />
      
      <div className="screen-container">
        <div className="screen-header">
          <h2 className="section-title text-text mb-6 font-bold">Reportes</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar con tipos de reportes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Reportes</h2>
              <div className="space-y-2">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedReport === report.id
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${selectedReport === report.id ? 'text-white' : 'text-gray-500'}`}>
                        {report.icon}
                      </div>
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className={`text-sm ${selectedReport === report.id ? 'text-white/80' : 'text-gray-500'}`}>
                          {report.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contenido principal del reporte */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {reports.find(r => r.id === selectedReport)?.name}
                </h2>
                <p className="text-gray-600 mt-1">
                  {reports.find(r => r.id === selectedReport)?.description}
                </p>
              </div>

              {/* Contenido del reporte seleccionado */}
              <div className="space-y-6">
                {selectedReport === 'categories' && <CategoryReport />}
                {selectedReport === 'dates' && <DateReport />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 