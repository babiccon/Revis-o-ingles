# Roadmap — LinguaStudy

## Visão Geral

LinguaStudy é um sistema de estudos de idiomas offline, focado em progressão estruturada e aprendizado ativo. O desenvolvimento segue milestones que constroem o sistema de forma incremental, priorizando funcionalidade antes de conteúdo.

---

## Milestones

### Milestone 1 — Fundação do Sistema
**Status:** `Planejada`

Estabelece a infraestrutura técnica da SPA: navegação, roteamento, armazenamento e carregamento de dados.

- [ ] Criar `index.html` com header, seletor de idioma e estrutura SPA
- [ ] Implementar `js/core/router.js` — hash-based routing
- [ ] Implementar `js/core/progress.js` — SM-2 + localStorage com namespace por idioma
- [ ] Criar `js/core/utils.js` + `js/data-loader.js`
- [ ] Atualizar `style.css` com novos componentes visuais

---

### Milestone 2 — Módulos Core (Gramática + Vocabulário)
**Status:** `Planejada`

Implementa os dois módulos mais importantes, reutilizando os padrões existentes e migrando o conteúdo inglês.

- [ ] Migrar `english/content/grammar.json` → `data/english/grammar.json`
- [ ] Migrar `english/content/vocabulary.json` → `data/english/vocabulary.json`
- [ ] Implementar `js/modules/grammar.js`
- [ ] Implementar `js/modules/vocabulary.js`
- [ ] Validar navegação completa Grammar + Vocabulary

---

### Milestone 3 — Módulos Novos
**Status:** `Planejada`

Adiciona os 4 módulos exclusivos desta reformulação: Textos, Conversação, Escrita e Pronúncia.

- [ ] Implementar `js/modules/texts.js` — textos com vocab hotspots
- [ ] Implementar `js/modules/conversation.js` — diálogos com TTS
- [ ] Implementar `js/modules/writing.js` — escrita livre com gabarito
- [ ] Implementar `js/modules/pronunciation.js` — guia fonético

---

### Milestone 4 — Conteúdo Alemão A1
**Status:** `Planejada`

Cria todo o conteúdo para Alemão A1, cobrindo as 21 lições distribuídas em A1.1, A1.2 e A1.3.

- [ ] `data/german/grammar.json` — 21 tópicos gramaticais
- [ ] `data/german/vocabulary.json` — 6+ categorias temáticas
- [ ] `data/german/texts.json` — 3 textos de leitura
- [ ] `data/german/conversation.json` — 3 diálogos situacionais
- [ ] `data/german/writing.json` — 3 exercícios de escrita
- [ ] `data/german/pronunciation.json` — Umlauts e sons especiais
- [ ] Validar navegação completa Alemão A1

---

### Milestone 5 — Conteúdo Inglês A2 Expandido
**Status:** `Planejada`

Expande o conteúdo inglês com os 4 novos módulos e reorganiza em A2.1 e A2.2.

- [ ] `data/english/texts.json` — 2 textos
- [ ] `data/english/conversation.json` — 2 diálogos
- [ ] `data/english/writing.json` — 2 exercícios de escrita
- [ ] `data/english/pronunciation.json` — sons difíceis (/θ/ /ð/ /ŋ/)
- [ ] Validar navegação completa Inglês A2

---

### Milestone 6 — Progress Dashboard
**Status:** `Planejada`

Dashboard com visão geral de progresso cross-language, breakdown por sub-nível e estatísticas detalhadas.

- [ ] Implementar `js/modules/progress-view.js`
- [ ] Breakdown por sub-nível (A1.1/A1.2/A1.3 e A2.1/A2.2)
- [ ] Botão de reset por idioma

---

### Milestone 7 — Polimento Final
**Status:** `Planejada`

Refinamentos de UX, integração de áudio e testes de responsividade.

- [ ] Integração TTS Google Translate (alemão + inglês)
- [ ] Tooltips de vocabulário em Textos (hover/click)
- [ ] Testes responsividade (320px, 768px, 1024px)
- [ ] Atualizar `english/start.py` + remover `english/web/`

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
