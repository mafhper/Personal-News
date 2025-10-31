/**
 * Script para limpar o localStorage para testes
 * 
 * Execute no console do navegador: copy(clearStorageScript); eval(clearStorageScript);
 * Ou abra o console e cole este código diretamente
 */

const clearStorageScript = `
// Limpar dados relacionados aos feeds
localStorage.removeItem('rss-feeds');
localStorage.removeItem('feeds-version');
localStorage.removeItem('feed-categories');

// Limpar cache de validação
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('validation:') || key.startsWith('smart-feed-cache')) {
    localStorage.removeItem(key);
  }
});

console.log('✅ localStorage limpo! Recarregue a página para ver os novos feeds padrão.');
`;

console.log('Para limpar o localStorage e testar os novos feeds padrão:');
console.log('1. Abra o console do navegador (F12)');
console.log('2. Cole e execute o seguinte código:');
console.log('');
console.log(clearStorageScript);
console.log('');
console.log('3. Recarregue a página');

// Para uso direto no Node.js/Bun
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { clearStorageScript };
}