import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Color verde normal fijo para avatares de usuario
export const AVATAR_COLOR = '#4CAF50'; // Verde normal

// Función para generar colores únicos de golf SUAVES para las cards basado en el ID del usuario
// Colores muy suaves y tenues: marrones, verdes, rojos y amarillos pastel
export function generateGolfCardColorFromId(id: string): string {
  // Colores de golf SUAVES/TENUES (muy poco notorios)
  const golfColors = [
    // Marrones suaves (fairway/tee box)
    '#E8D5C4', // Marrón muy claro
    '#F5E6D3', // Marrón pastel claro
    '#EED9C4', // Beige claro
    '#D4C4B0', // Arena suave
    '#E6DCC6', // Cáscara de huevo
    '#F0E6D2', // Crema suave
    
    // Verdes suaves (green)
    '#D4E6D1', // Verde menta muy claro
    '#E0F0DC', // Verde pastel claro
    '#D8E8D5', // Verde agua suave
    '#E6F2E4', // Verde muy claro
    '#DCE8DA', // Verde hoja suave
    '#E8F0E6', // Verde primavera claro
    
    // Rojos suaves (banderas/peligro)
    '#F5D5D5', // Rosa muy claro
    '#FFE5E5', // Rosa pastel
    '#F0D0D0', // Coral suave
    '#FAD5D5', // Melocotón suave
    '#FFE8E8', // Rosa claro
    
    // Amarillos suaves (sol/par)
    '#FFF8E1', // Amarillo crema muy claro
    '#FFF9DC', // Amarillo pastel claro
    '#FEF5E7', // Amarillo suave
    '#FFF5E6', // Melocotón claro
    '#FFF4E1', // Beige amarillento suave
  ];

  // Generar un hash simple del ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32bit integer
  }

  // Usar el valor absoluto del hash para seleccionar un color
  const index = Math.abs(hash) % golfColors.length;
  return golfColors[index];
}

// Función legacy para mantener compatibilidad - ahora devuelve color de golf para cards
export function generateColorFromId(id: string): string {
  return generateGolfCardColorFromId(id);
}
