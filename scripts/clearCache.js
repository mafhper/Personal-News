// Script para limpar cache de artigos com HTML não sanitizado
console.log('Limpando cache de artigos...');

// Limpa localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key.includes('smart-cache') || 
    key.includes('articles') || 
    key.includes('rss-') ||
    key.includes('feed-')
  )) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`Removido: ${key}`);
});

console.log(`Cache limpo! ${keysToRemove.length} entradas removidas.`);
console.log('Recarregue a página para buscar dados frescos.');