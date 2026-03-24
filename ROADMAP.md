# Roadmap — LinguaStudy

## Visão Geral

LinguaStudy é um sistema de estudos de idiomas offline, focado em progressão estruturada e aprendizado ativo. O desenvolvimento segue milestones que constroem o sistema de forma incremental, priorizando funcionalidade antes de conteúdo.

---

## Milestones

### Milestone 1 — Fundação do Sistema
**Status:** `✅ Concluída`

Estabelece a infraestrutura técnica da SPA: navegação, roteamento, armazenamento e carregamento de dados.

- [x] Criar `index.html` com header, seletor de idioma e estrutura SPA
- [x] Implementar `js/core/router.js` — hash-based routing
- [x] Implementar `js/core/progress.js` — SM-2 + localStorage com namespace por idioma
- [x] Criar `js/core/utils.js` + `js/data-loader.js`
- [x] Atualizar `style.css` com novos componentes visuais

---

### Milestone 2 — Módulos Core (Gramática + Vocabulário)
**Status:** `✅ Concluída`

Implementa os dois módulos mais importantes, reutilizando os padrões existentes e migrando o conteúdo inglês.

- [x] Migrar `english/content/grammar.json` → `data/english/grammar.json`
- [x] Migrar `english/content/vocabulary.json` → `data/english/vocabulary.json`
- [x] Implementar `js/modules/grammar.js`
- [x] Implementar `js/modules/vocabulary.js`
- [x] Validar navegação completa Grammar + Vocabulary

---

### Milestone 3 — Módulos Novos
**Status:** `✅ Concluída`

Adiciona os 4 módulos exclusivos desta reformulação: Textos, Conversação, Escrita e Pronúncia.

- [x] Implementar `js/modules/texts.js` — textos com vocab hotspots
- [x] Implementar `js/modules/conversation.js` — diálogos com TTS
- [x] Implementar `js/modules/writing.js` — escrita livre com gabarito
- [x] Implementar `js/modules/pronunciation.js` — guia fonético

---

### Milestone 4 — Conteúdo Alemão A1
**Status:** `✅ Concluída`

Cria todo o conteúdo para Alemão A1, cobrindo as 22 lições distribuídas em A1.1, A1.2 e A1.3.

- [x] `data/german/grammar.json` — 22 tópicos gramaticais (7 A1.1 + 7 A1.2 + 8 A1.3)
- [x] `data/german/vocabulary.json` — 6 categorias temáticas
- [x] `data/german/texts.json` — 3 textos de leitura
- [x] `data/german/conversation.json` — 3 diálogos situacionais
- [x] `data/german/writing.json` — 3 exercícios de escrita
- [x] `data/german/pronunciation.json` — Umlauts e sons especiais
- [x] Validar navegação completa Alemão A1

---

### Milestone 5 — Conteúdo Inglês A2 Expandido
**Status:** `✅ Concluída`

Expande o conteúdo inglês com os 4 novos módulos e reorganiza em A2.1 e A2.2.

- [x] `data/english/texts.json` — 2 textos
- [x] `data/english/conversation.json` — 2 diálogos
- [x] `data/english/writing.json` — 2 exercícios de escrita
- [x] `data/english/pronunciation.json` — sons difíceis (/θ/ /ð/ /ŋ/)
- [x] Validar navegação completa Inglês A2

---

### Milestone 6 — Progress Dashboard
**Status:** `✅ Concluída`

Dashboard com visão geral de progresso cross-language, breakdown por sub-nível e estatísticas detalhadas.

- [x] Implementar `js/modules/progress-view.js`
- [x] Barra de progresso geral com percentagem
- [x] Breakdown por sub-nível (A1.1/A1.2/A1.3 e A2.1/A2.2)
- [x] Breakdown por módulo com ícones e barras coloridas
- [x] Botão de reset por idioma (com confirmação)

---

### Milestone 7 — Polimento Final
**Status:** `✅ Concluída`

Refinamentos de UX, áudio, segurança, responsividade mobile e publicação.

- [x] TTS via Web Speech API (`speechSynthesis`) — alemão e inglês, sem API key
- [x] Tooltips de vocabulário em Textos (click/touch em mobile)
- [x] Responsividade mobile (breakpoints 768px, 640px, 380px)
- [x] Login com senha (SHA-256, sem backend) — área privada antes de acessar o app
- [x] Publicação no GitHub Pages — `https://babiccon.github.io/Revis-o-ingles/`
- [x] Melhorias de legibilidade: parágrafos nas explicações, sub-headers nas regras, código inline
- [x] Atualizar `english/start.py` (menu atualizado para LinguaStudy)

---

### Milestone 8 — Bug Fix + Gramática Completa + Módulo Exercícios
**Status:** `✅ Concluída`

Corrige bugs críticos, completa o conteúdo alemão e adiciona o módulo de exercícios interativos.

- [x] Bug fix: `"quiz"` → `"quiz_questions"` em todos os 21 tópicos alemães (quizzes estavam falhando silenciosamente)
- [x] Bug fix: JSON malformado em `data/german/grammar.json` (colchete extra na linha 589)
- [x] Completar A1.2: adicionar 7º tópico — Conjunções Coordenativas (und, aber, oder, denn)
- [x] Criar `js/modules/exercises.js` com 4 tipos: ditado, ordem de palavras, lacuna, tradução
- [x] Registrar módulo Exercícios em `router.js` e `app.js`
- [x] `data/german/exercises.json` — 20 exercícios (A1.1/A1.2/A1.3)
- [x] `data/english/exercises.json` — 12 exercícios (A2.1/A2.2)
- [x] Integrar módulo Exercícios no Progress Dashboard (ícone 🏋️)
- [x] CSS completo para exercícios (chips, zonas de drag, feedback visual)

---

### Milestone 9 — Mais Lições nos Níveis Atuais
**Status:** `🔲 Planejada`

Expande o conteúdo existente sem criar novos arquivos — apenas append nos JSONs.

- [ ] `data/german/grammar.json` — +7 tópicos A1 (adjetivos, comparativos, preposições acusativo, conjunções, Präteritum)
- [ ] `data/german/vocabulary.json` — +3 categorias (Natureza/Clima, Viagem, Datas e Estações)
- [ ] `data/english/grammar.json` — +4 tópicos A2 (Passive Voice, Conditionals 0/1, Phrasal Verbs, Reported Speech)
- [ ] `data/english/vocabulary.json` — +2 categorias (Travel & Tourism, Emotions & Feelings)

---

### Milestone 10 — Alemão A2
**Status:** `🔲 Planejada`

Adiciona sub-níveis A2.1 e A2.2 nos arquivos alemães existentes (append — zero mudanças no JS).

- [ ] `data/german/grammar.json` — +14 tópicos (Konjunktiv II, Passiv, Relativsätze, Futur I, Adjektivdeklination, Indirekte Rede, Genitiv…)
- [ ] `data/german/vocabulary.json` — +4 categorias A2 (Trabalho avançado, Mídia, Saúde, Sociedade)
- [ ] `data/german/texts.json` — +2 textos A2
- [ ] `data/german/conversation.json` — +2 diálogos A2 (Entrevista de emprego, Alugando apartamento)
- [ ] `data/german/writing.json` — +2 exercícios A2 (Carta formal, Descrever imagem)
- [ ] `data/german/pronunciation.json` — +1 seção A2 (Entonação e acento tônico)
- [ ] `index.html`: badge Alemão "A1" → "A1→A2"

---

### Milestone 11 — Inglês B1
**Status:** `🔲 Planejada`

Adiciona sub-níveis B1.1 e B1.2 nos arquivos ingleses existentes (append — zero mudanças no JS).

- [ ] `data/english/grammar.json` — +14 tópicos (Past Perfect, Conditionals 2/3, Passive Advanced, Relative Clauses, Reported Speech, Modal Verbs avançado, Wish/If only…)
- [ ] `data/english/vocabulary.json` — +4 categorias B1 (Work & Career, Society & News, Environment, Technology)
- [ ] `data/english/texts.json` — +2 textos B1 (artigo de opinião, narrativa com flashback)
- [ ] `data/english/conversation.json` — +2 diálogos B1 (Job interview, Debating an issue)
- [ ] `data/english/writing.json` — +2 exercícios B1 (Opinion essay, Informal report)
- [ ] `data/english/pronunciation.json` — +1 seção B1 (Stress patterns, connected speech)
- [ ] `index.html`: badge Inglês "A2" → "A2→B1"

---

### Milestone 12 — TTS Completo + STT na Pronúncia
**Status:** `🔲 Planejada`

> TTS parcial já existe em Conversação e Pronúncia. Esta milestone expande e adiciona reconhecimento de fala.

- [ ] TTS em `js/modules/vocabulary.js` — botão 🔊 em cada palavra e exemplo
- [ ] TTS em `js/modules/grammar.js` — botão 🔊 nos exemplos de regras
- [ ] TTS em `js/modules/texts.js` — botão 🔊 nas frases destacadas
- [ ] STT em `js/modules/pronunciation.js` — botão 🎤, feedback verde/amarelo/vermelho
- [ ] Verificação de compatibilidade + fallback para navegadores sem suporte
- [ ] CSS para estados: `.audio-btn--playing`, `.audio-btn--recording`, `.stt-result`

---

## Features Futuras (Pós v1.0)

Ideias para versões futuras, sem data definida:

| Feature | Descrição |
|---------|-----------|
| **Mais idiomas** | Espanhol, Francês, Italiano |
| **PWA (Progressive Web App)** | Service Worker para uso 100% offline após primeiro acesso |
| **Sync via GitHub Gist** | Exportar/importar progresso entre dispositivos sem backend |
| **Modo "Imersão"** | Interface apenas no idioma-alvo (sem português) |
| **Gerador de exercícios** | Criar novos exercícios automaticamente a partir do vocabulário salvo |
| **Modo escuro** | Tema alternativo para estudos noturnos |
| **Estatísticas avançadas** | Gráficos de progresso, heatmap de estudo, tempo total |
| **Export PDF** | Exportar lições como PDF para estudo offline em papel |
| **Modo "Desafio"** | Quiz cronometrado com pontuação |
