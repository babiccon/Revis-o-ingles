# LinguaStudy — Sistema de Estudos de Idiomas

Sistema web offline para estudo de idiomas com progressão estruturada, exercícios interativos e rastreamento de progresso via localStorage.

## Idiomas

| Idioma | Nível | Sub-níveis | Lições |
|--------|-------|------------|--------|
| Alemão | A1 | A1.1 · A1.2 · A1.3 | 21 |
| Inglês | A2 | A2.1 · A2.2 | 15 |

## Módulos por Idioma

| Módulo | Descrição |
|--------|-----------|
| **Gramática** | Lições estruturadas com teoria, exemplos e exercícios (múltipla escolha, lacunas, tradução) |
| **Vocabulário** | Temas organizados com flashcards interativos e exercícios de associação |
| **Textos** | Textos curtos com vocabulário destacado (hover/clique para tradução) e questões de compreensão |
| **Conversação** | Diálogos situacionais com áudio TTS e tradução linha por linha |
| **Escrita** | Prompts de escrita livre com dicas, contador de palavras e gabarito |
| **Pronúncia** | Guia fonético com exemplos e links para Forvo/YouTube |
| **Progresso** | Dashboard com progresso por sub-nível, estatísticas e revisão espaçada (SM-2) |

## Tecnologias

- **Frontend:** HTML5, CSS3 (Custom Properties, Flexbox, Grid), JavaScript (ES6+ Vanilla)
- **Armazenamento:** localStorage (progresso, flashcards SM-2, textos escritos)
- **Algoritmo:** SuperMemo 2 (SM-2) para revisão espaçada
- **Deploy:** GitHub Pages (arquivos estáticos na raiz)
- **Backend CLI:** Python 3 (opcional, para interface terminal)

## Como Usar

### Modo Web (recomendado)
```bash
# Opção 1: Abrir diretamente no navegador
# Arraste o arquivo index.html para o navegador

# Opção 2: Servidor local via Python
python english/start.py web
# Abre em http://localhost:8080
```

### Modo CLI (terminal)
```bash
python english/start.py cli
```

## Estrutura de Pastas

```
Idiomas/
├── index.html              # Entrada da SPA (GitHub Pages)
├── app.js                  # Orquestrador principal
├── style.css               # Design system completo
├── README.md
├── ROADMAP.md
│
├── js/
│   ├── core/
│   │   ├── router.js       # Hash-based routing (#lang/módulo/sub-nível/id)
│   │   ├── progress.js     # SM-2 + localStorage com namespace por idioma
│   │   └── utils.js        # Utilitários (shuffle, formatação, etc.)
│   ├── data-loader.js      # Fetch assíncrono + cache de JSONs
│   └── modules/
│       ├── grammar.js
│       ├── vocabulary.js
│       ├── texts.js
│       ├── conversation.js
│       ├── writing.js
│       ├── pronunciation.js
│       └── progress-view.js
│
├── data/
│   ├── german/             # Conteúdo Alemão A1
│   │   ├── grammar.json
│   │   ├── vocabulary.json
│   │   ├── texts.json
│   │   ├── conversation.json
│   │   ├── writing.json
│   │   └── pronunciation.json
│   └── english/            # Conteúdo Inglês A2
│       └── (mesma estrutura)
│
├── docs/
│   ├── ARCHITECTURE.md     # Arquitetura técnica detalhada
│   └── DATA_STRUCTURE.md   # Schema dos JSONs de conteúdo
│
└── english/
    ├── cli/                # Interface de linha de comando (Python)
    ├── content/            # JSONs originais (mantidos para compatibilidade CLI)
    └── start.py            # Launcher CLI/Web
```

## Documentação Técnica

- [Arquitetura do Sistema](docs/ARCHITECTURE.md)
- [Estrutura dos Dados (JSON Schema)](docs/DATA_STRUCTURE.md)
- [Roadmap e Milestones](ROADMAP.md)

## Roadmap

Veja o [ROADMAP.md](ROADMAP.md) para o planejamento completo de features e milestones.

## Contribuição

Este é um projeto pessoal de estudos. Não há processo formal de contribuição.
