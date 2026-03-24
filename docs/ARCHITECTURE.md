# Arquitetura do Sistema — LinguaStudy

## Visão Geral

LinguaStudy é uma **Single-Page Application (SPA)** client-side com hash-based routing, hospedada via GitHub Pages. Não há backend — todo o estado é gerenciado localmente via localStorage e todos os dados são arquivos JSON estáticos.

```
┌─────────────────────────────────────────────────────┐
│                    index.html                        │
│  ┌─────────────┐  ┌────────────────────────────┐   │
│  │   Header    │  │         #app-root           │   │
│  │  lang-nav   │  │  (conteúdo renderizado      │   │
│  │  stats-bar  │  │   dinamicamente pelo JS)    │   │
│  └─────────────┘  └────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐    │
│  │              Module Tabs                     │    │
│  │  Gramática | Vocabulário | Textos | ...      │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Hash-Based Routing

### Padrão de URL
```
#:lang/:module/:subLevel?/:lessonId?
```

### Exemplos
| Hash | Significado |
|------|-------------|
| `#german/grammar` | Alemão → Gramática (visão geral por sub-níveis) |
| `#german/grammar/A1.1` | Alemão → Gramática → Lista lições A1.1 |
| `#german/grammar/A1.1/3` | Alemão → Gramática → Lição 3 (A1.1) |
| `#english/vocabulary` | Inglês → Vocabulário |
| `#english/progress` | Inglês → Progress Dashboard |

### Roteamento (`js/core/router.js`)
```
window.hashchange
      │
      ▼
 parseHash(location.hash)
      │
      ▼
 [lang, module, subLevel, lessonId]
      │
      ├─── update lang-btn active state
      ├─── update module tabs active state
      │
      ▼
 DataLoader.load(lang, module)
      │
      ▼
 ROUTES[module](lang, { subLevel, lessonId, data })
      │
      ▼
 Render HTML into #app-root
```

---

## Fluxo de Dados

```
data/{lang}/{module}.json
         │
         ▼
   DataLoader.load()      ← fetch() + in-memory cache
         │
         ▼
  Module Renderer          ← grammar.js, vocabulary.js, etc.
         │
         ├── Read: ProgressStore.loadProgress(lang)
         ├── Write: ProgressStore.updateCard(lang, key, quality)
         ▼
    DOM (#app-root)
```

### Cache de Dados
`DataLoader` mantém um cache em memória (`DataLoader.cache`). Uma vez carregado, o JSON não é refetchado durante a sessão. No `hashchange` entre idiomas, os dados do idioma anterior permanecem em cache.

---

## Estrutura de Módulos JS

```
js/
├── core/
│   ├── router.js       # Parsing de hash, despacho para módulos
│   ├── progress.js     # SM-2, localStorage, stats
│   └── utils.js        # shuffleArray, getToday, formatDate, etc.
│
├── data-loader.js      # fetch() + cache
│
└── modules/
    ├── grammar.js       # renderLesson, renderQuiz, renderFlashcards
    ├── vocabulary.js    # renderFlashcards, renderAssociation
    ├── texts.js         # renderText, vocabTooltips, comprehensionQuiz
    ├── conversation.js  # renderDialogue, toggleTranslation, playTTS
    ├── writing.js       # renderPrompt, saveText, wordCount
    ├── pronunciation.js # renderPhonemes, externalLinks
    └── progress-view.js # statsCards, progressBars, resetButton
```

---

## Armazenamento (localStorage)

### Chaves

| Chave | Tipo | Conteúdo |
|-------|------|----------|
| `lang_study_v2_{lang}` | Object | Estado SM-2 de todos os cards + stats globais |
| `lang_lessons_{lang}` | Object | Mapa de lições concluídas `{"grammar_A1.1_3": true}` |
| `lang_writing_{lang}` | Object | Textos escritos `{"writing_1": "texto salvo..."}` |

### Schema do Progress Object (`lang_study_v2_{lang}`)
```json
{
  "cards": {
    "grammar_5_2": {
      "repetitions": 3,
      "easiness": 2.5,
      "interval": 6,
      "nextReview": "2026-03-30",
      "lastQuality": 4
    }
  },
  "stats": {
    "totalReviews": 42,
    "streak": 3,
    "lastStudyDate": "2026-03-24",
    "masteredCount": 12
  }
}
```

### Chave de Card (SM-2)
Formato: `{module}_{topicId}_{cardIndex}`
- Ex: `grammar_5_2` = módulo grammar, tópico id 5, flashcard índice 2
- Ex: `vocabulary_3_7` = módulo vocabulary, categoria id 3, flashcard índice 7

---

## Algoritmo SM-2 (SuperMemo 2)

Implementado em `js/core/progress.js`. Parâmetros:

| Quality | Significado | Efeito |
|---------|-------------|--------|
| 1 | Errei | Reset (interval=1, rep=0) |
| 2 | Errei mas lembro | Reset suave |
| 3 | Difícil | interval × 1.2 |
| 4 | Médio | interval × EF |
| 5 | Fácil | interval × EF, EF++ |

`EF` (Easiness Factor) inicia em 2.5. Mínimo: 1.3.

---

## Decisões Arquiteturais

### SPA vs Multi-Page
**Escolhido: SPA com hash-routing**

- GitHub Pages serve arquivos estáticos; não há roteamento server-side
- Multi-page exigiria duplicação de CSS/JS em cada página
- Hash-routing permite deep-linking sem recarregar a página
- Facilita transições de estado (ex: seletor de idioma muda apenas o conteúdo, não recarrega o header)

### Módulos JS separados vs monólito
**Escolhido: módulos separados**

O app antigo (`app.js`) era um único arquivo de 1061 linhas. A nova versão separa cada módulo em arquivo próprio para:
- Facilitar navegação no código
- Permitir carregamento seletivo futuro
- Isolar bugs por módulo

### Sem build tools (sem Webpack/Vite)
**Escolhido: arquivos JS nativos com `type="module"`**

- Sem dependências de desenvolvimento
- GitHub Pages serve arquivos estáticos diretamente
- ES6 modules são suportados em todos os navegadores modernos
- Simplicidade > otimização para um projeto pessoal offline

### TTS de Áudio
**Escolhido: Google Translate TTS (sem API key)**

URL: `https://translate.google.com/translate_tts?ie=UTF-8&q={texto}&tl={lang}&client=tw-ob`

- Gratuito, sem autenticação
- Funciona para `de` (alemão) e `en` (inglês)
- Fallback: links Forvo para palavras específicas
