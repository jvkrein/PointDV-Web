// constants/categories.js

/**
 * Define as categorias de eventos pré-definidas para o aplicativo.
 * Isso garante que os lojistas usem as mesmas categorias que
 * os consumidores usam para filtrar.
 */

export const CATEGORIAS_EVENTOS = [
  { id: 'comida', nome: 'Comida', icon: 'silverware-fork-knife' },
  { id: 'musica', nome: 'Música ao Vivo', icon: 'music-note' },
  { id: 'promocao', nome: 'Promoções', icon: 'tag-outline' },
  { id: 'festa', nome: 'Festas e Baladas', icon: 'party-popper' },
  { id: 'cultura', nome: 'Cultura e Arte', icon: 'palette' },
  { id: 'esporte', nome: 'Esportes', icon: 'basketball' },
  { id: 'compras', nome: 'Compras', icon: 'shopping-outline' },
  { id: 'cursos', nome: 'Cursos e Workshops', icon: 'school-outline' },
];

// Cores associadas a cada categoria (para o feed)
export const CORES_CATEGORIAS = {
  comida: '#E67E22',
  musica: '#8E44AD',
  promocao: '#2ECC71',
  festa: '#E91E63',
  cultura: '#3498DB',
  esporte: '#F1C40F',
  compras: '#1ABC9C',
  cursos: '#9B59B6',
  default: '#7F8C8D',
};