/**
 * Script para testar os novos feeds padrão
 * 
 * Execute com: bun run scripts/testFeeds.ts
 */

import { feedValidator } from '../services/feedValidator';
import { getAllSuggestedFeeds } from '../utils/suggestedFeeds';

async function testFeeds() {
  console.log('🚀 Testando feeds padrão...\n');
  
  const suggestedFeeds = getAllSuggestedFeeds();
  const results = [];
  
  for (const feed of suggestedFeeds.slice(0, 5)) { // Testar apenas os primeiros 5 para não sobrecarregar
    console.log(`📡 Testando: ${feed.title} (${feed.url})`);
    
    try {
      const result = await feedValidator.validateFeed(feed.url);
      
      if (result.isValid) {
        console.log(`✅ ${feed.title}: OK (${result.responseTime}ms)`);
        if (result.title) {
          console.log(`   Título: ${result.title}`);
        }
      } else {
        console.log(`❌ ${feed.title}: ${result.error}`);
        if (result.suggestions.length > 0) {
          console.log(`   Sugestões: ${result.suggestions[0]}`);
        }
      }
      
      results.push({
        feed: feed.title,
        url: feed.url,
        valid: result.isValid,
        responseTime: result.responseTime,
        error: result.error
      });
      
    } catch (error) {
      console.log(`💥 ${feed.title}: Erro inesperado - ${error}`);
      results.push({
        feed: feed.title,
        url: feed.url,
        valid: false,
        error: `Erro inesperado: ${error}`
      });
    }
    
    console.log(''); // Linha em branco
  }
  
  // Resumo
  const validFeeds = results.filter(r => r.valid).length;
  const totalFeeds = results.length;
  
  console.log('📊 Resumo dos testes:');
  console.log(`   Feeds válidos: ${validFeeds}/${totalFeeds}`);
  console.log(`   Taxa de sucesso: ${Math.round((validFeeds / totalFeeds) * 100)}%`);
  
  if (validFeeds < totalFeeds) {
    console.log('\n⚠️  Feeds com problemas:');
    results.filter(r => !r.valid).forEach(r => {
      console.log(`   - ${r.feed}: ${r.error}`);
    });
  }
}

// Executar apenas se chamado diretamente
if (import.meta.main) {
  testFeeds().catch(console.error);
}

export { testFeeds };