// FinScoreProgressBar - Barra de progreso elegante para FinScore acumulativo
// Sistema de niveles con progreso verde y animaciones suaves

import React from 'react';
import { motion } from 'framer-motion';

interface FinScoreProgressBarProps {
  currentScore: number;
  level: number;
  pointsToNextLevel: number;
  animate?: boolean;
  className?: string;
}

// Función para calcular puntos necesarios para un nivel
const getPointsForLevel = (level: number): number => {
  return Math.pow(level, 2) * 100;
};

const FinScoreProgressBar: React.FC<FinScoreProgressBarProps> = ({
  currentScore,
  level,
  pointsToNextLevel,
  animate = true,
  className
}) => {
  // Calcular progreso del nivel actual
  const currentLevelPoints = getPointsForLevel(level - 1);
  const nextLevelPoints = getPointsForLevel(level);
  const progressInLevel = currentScore - currentLevelPoints;
  const totalNeededInLevel = nextLevelPoints - currentLevelPoints;
  const progressPercentage = (progressInLevel / totalNeededInLevel) * 100;

  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-gray-800 mb-1">
          NIVEL {level}
        </div>
        <div className="text-sm text-gray-600">
          FinScore Acumulativo
        </div>
      </div>

      {/* Barra de progreso principal */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-gray-600">
            {currentScore.toLocaleString()} pts
          </span>
          <span className="text-xs font-medium text-gray-600">
            {nextLevelPoints.toLocaleString()} pts
          </span>
        </div>
        
        {/* Contenedor de la barra */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-lg"
            initial={{ width: animate ? 0 : `${Math.min(progressPercentage, 100)}%` }}
            animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
            transition={{
              duration: animate ? 1.5 : 0,
              ease: [0.4, 0, 0.2, 1],
              delay: animate ? 0.3 : 0
            }}
            style={{
              boxShadow: progressPercentage > 80 ? '0 0 10px rgba(34, 197, 94, 0.5)' : undefined
            }}
          />
        </div>

        {/* Progreso en porcentaje */}
        <div className="text-center mt-2">
          <motion.span
            className="text-lg font-bold text-green-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: animate ? 1 : 0 }}
          >
            {Math.round(progressPercentage)}%
          </motion.span>
        </div>
      </div>

      {/* Información adicional */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Para siguiente nivel:</span>
          <span className="font-medium text-green-600">
            +{pointsToNextLevel.toLocaleString()} pts
          </span>
        </div>
      </div>

    </div>
  );
};

export default FinScoreProgressBar;