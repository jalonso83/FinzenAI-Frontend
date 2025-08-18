// useGamificationToasts - Hook para manejar notificaciones de gamificación
// Toast notifications elegantes con feedback de puntos y logros

import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { EventType } from '../types/gamification';

// ===== CONFIGURACIÓN DE TOASTS =====

const TOAST_CONFIG = {
  duration: 10000, // 10 segundos
  position: 'top-right' as const,
  style: {
    borderRadius: '12px',
    background: '#fff',
    color: '#374151',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    border: '1px solid #E5E7EB',
    padding: '12px', // Padding uniforme
    fontSize: '14px',
    fontWeight: '500',
    minWidth: '300px',
    maxWidth: '400px'
  }
};

const EVENT_MESSAGES: Record<string, { icon: string; message: string; color: string }> = {
  [EventType.ADD_TRANSACTION]: {
    icon: '⭐',
    message: '+5 FinScore por agregar transacción',
    color: '#3B82F6'
  },
  [EventType.CREATE_BUDGET]: {
    icon: '🎯',
    message: '+20 FinScore por crear presupuesto',
    color: '#8B5CF6'
  },
  [EventType.CREATE_GOAL]: {
    icon: '🏆',
    message: '+15 FinScore por crear meta',
    color: '#F59E0B'
  },
  [EventType.COMPLETE_GOAL]: {
    icon: '🎉',
    message: '¡Meta completada! +50 FinScore',
    color: '#10B981'
  },
  [EventType.CONSECUTIVE_DAYS]: {
    icon: '🔥',
    message: '¡Racha activa! Sigue así',
    color: '#EF4444'
  },
  [EventType.WEEKLY_STREAK]: {
    icon: '⚡',
    message: '¡7 días consecutivos! +25 FinScore',
    color: '#F59E0B'
  },
  [EventType.BUDGET_OVERSPEND]: {
    icon: '⚠️',
    message: 'Presupuesto excedido',
    color: '#EF4444'
  },
  [EventType.CATEGORY_MILESTONE]: {
    icon: '🎯',
    message: '¡Hito alcanzado!',
    color: '#10B981'
  }
};

// ===== COMPONENTE PERSONALIZADO PARA TOAST =====

interface CustomToastProps {
  icon: string;
  message: string;
  color: string;
  onDismiss: () => void;
  background?: string;
  textColor?: string;
}

const CustomToast: React.FC<CustomToastProps> = ({ 
  icon, 
  message, 
  color, 
  onDismiss, 
  background = '#fff',
  textColor = '#374151'
}) => {
  // Procesar mensajes multilínea
  const messageLines = message.split('\n');
  
  return (
    <div 
      className="flex items-start justify-between gap-3 min-w-0"
      style={{ 
        background,
        color: textColor,
        padding: '0',
        borderLeft: `4px solid ${color}`
      }}
    >
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          {messageLines.map((line, index) => (
            <div 
              key={index}
              className={`text-sm font-medium leading-tight break-words ${
                index === 0 ? '' : 'text-xs opacity-80 mt-1'
              }`}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 transition-all duration-150 opacity-40 hover:opacity-80 ml-2"
        style={{ 
          fontSize: '12px', 
          lineHeight: '1',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
        aria-label="Cerrar notificación"
        title="Cerrar"
      >
        ×
      </button>
    </div>
  );
};

// ===== HOOK PRINCIPAL =====

export const useGamificationToasts = () => {
  
  // Función para mostrar toast de evento
  const showEventToast = (eventType: EventType, customPoints?: number) => {
    const config = EVENT_MESSAGES[eventType];
    if (!config) return;

    const message = customPoints 
      ? `+${customPoints} FinScore`
      : config.message;

    toast.custom((t) => (
      <CustomToast
        icon={config.icon}
        message={message}
        color={config.color}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), {
      ...TOAST_CONFIG,
      style: TOAST_CONFIG.style
    });
  };

  // Función para mostrar toast de nuevo badge
  const showBadgeToast = (badgeName: string, points: number) => {
    toast.custom((t) => (
      <CustomToast
        icon="🏅"
        message={`¡Nuevo badge desbloqueado!\n${badgeName} (+${points} pts)`}
        color="#F59E0B"
        background="linear-gradient(135deg, #FEF3C7 0%, #FDE047 100%)"
        textColor="#92400E"
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), {
      ...TOAST_CONFIG,
      duration: 4000
    });
  };

  // Función para mostrar toast de subida de nivel
  const showLevelUpToast = (newLevel: number) => {
    toast.custom((t) => (
      <CustomToast
        icon="🎊"
        message={`¡Subiste al Nivel ${newLevel}!\n¡Sigue construyendo tu futuro financiero!`}
        color="#10B981"
        background="linear-gradient(135deg, #D1FAE5 0%, #10B981 100%)"
        textColor="#065F46"
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), {
      ...TOAST_CONFIG,
      duration: 5000
    });
  };

  // Función para mostrar toast de racha
  const showStreakToast = (days: number, isNew: boolean = false) => {
    const message = isNew 
      ? `¡Nueva racha iniciada!\nDía ${days} consecutivo`
      : `¡Racha de ${days} días!\nSigue manteniendo el ritmo`;

    toast.custom((t) => (
      <CustomToast
        icon="🔥"
        message={message}
        color="#EF4444"
        background="linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)"
        textColor="#991B1B"
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), {
      ...TOAST_CONFIG,
      duration: 3500
    });
  };

  // Función para toast de error
  const showErrorToast = (message: string) => {
    toast.custom((t) => (
      <CustomToast
        icon="❌"
        message={message}
        color="#EF4444"
        background="#FEF2F2"
        textColor="#991B1B"
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), TOAST_CONFIG);
  };

  // Función para toast de éxito genérico
  const showSuccessToast = (message: string) => {
    toast.custom((t) => (
      <CustomToast
        icon="✅"
        message={message}
        color="#10B981"
        onDismiss={() => toast.dismiss(t.id)}
      />
    ), TOAST_CONFIG);
  };

  return {
    showEventToast,
    showBadgeToast,
    showLevelUpToast,
    showStreakToast,
    showErrorToast,
    showSuccessToast
  };
};

// ===== HOOK PARA AUTO-ESCUCHAR EVENTOS =====

export const useGamificationEventListener = () => {
  const { showEventToast, showBadgeToast, showLevelUpToast, showStreakToast } = useGamificationToasts();

  useEffect(() => {
    // Event listeners para eventos de gamificación
    const handleGamificationEvent = (event: CustomEvent) => {
      const { eventType, points, data } = event.detail;
      showEventToast(eventType, points);
    };

    const handleNewBadge = (event: CustomEvent) => {
      const { badge } = event.detail;
      showBadgeToast(badge.name, badge.points);
    };

    const handleLevelUp = (event: CustomEvent) => {
      const { newLevel } = event.detail;
      showLevelUpToast(newLevel);
    };

    const handleStreakUpdate = (event: CustomEvent) => {
      const { days, isNew } = event.detail;
      showStreakToast(days, isNew);
    };

    // Registrar event listeners
    window.addEventListener('gamification-event', handleGamificationEvent as EventListener);
    window.addEventListener('gamification-badge', handleNewBadge as EventListener);
    window.addEventListener('gamification-level-up', handleLevelUp as EventListener);
    window.addEventListener('gamification-streak', handleStreakUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('gamification-event', handleGamificationEvent as EventListener);
      window.removeEventListener('gamification-badge', handleNewBadge as EventListener);
      window.removeEventListener('gamification-level-up', handleLevelUp as EventListener);
      window.removeEventListener('gamification-streak', handleStreakUpdate as EventListener);
    };
  }, [showEventToast, showBadgeToast, showLevelUpToast, showStreakToast]);
};

// ===== UTILIDADES PARA EVENTOS MANUALES =====

export const triggerGamificationEvent = (eventType: EventType, points?: number, data?: any) => {
  window.dispatchEvent(new CustomEvent('gamification-event', {
    detail: { eventType, points, data }
  }));
};

export const triggerNewBadge = (badge: { name: string; points: number }) => {
  window.dispatchEvent(new CustomEvent('gamification-badge', {
    detail: { badge }
  }));
};

export const triggerLevelUp = (newLevel: number) => {
  window.dispatchEvent(new CustomEvent('gamification-level-up', {
    detail: { newLevel }
  }));
};

export const triggerStreakUpdate = (days: number, isNew: boolean = false) => {
  window.dispatchEvent(new CustomEvent('gamification-streak', {
    detail: { days, isNew }
  }));
};

export default useGamificationToasts;