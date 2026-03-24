# Estrutura de Dados (JSON Schema) — LinguaStudy

Todos os dados de conteúdo são arquivos JSON estáticos em `data/{lang}/{module}.json`.

## Convenções Gerais

- `id` — inteiro único dentro do arquivo, sequencial a partir de 1
- `sub_level` — string: `"A1.1"`, `"A1.2"`, `"A1.3"` (alemão) ou `"A2.1"`, `"A2.2"` (inglês)
- `title_pt` — nome do tópico em português (para exibição na UI)
- Campos opcionais são marcados com `?`

---

## 1. Grammar (`data/{lang}/grammar.json`)

```json
{
  "language": "german",
  "level": "A1",
  "topics": [
    {
      "id": 1,
      "sub_level": "A1.1",
      "topic": "Substantive und Artikel",
      "title_pt": "Substantivos e Artigos",
      "explanation": "Texto longo explicando a gramática em português...",
      "tips": [
        "Aprenda o artigo junto com o substantivo desde o início."
      ],
      "rules": [
        "Masculino: der Mann, der Tisch",
        "Feminino: die Frau, die Katze",
        "Neutro: das Kind, das Buch"
      ],
      "examples": [
        { "de": "Der Mann ist groß.", "pt": "O homem é alto." },
        { "de": "Die Frau liest ein Buch.", "pt": "A mulher lê um livro." }
      ],
      "common_mistakes": [
        {
          "wrong": "Ich habe ein Hund.",
          "correct": "Ich habe einen Hund.",
          "explanation": "No acusativo, 'der' vira 'einen' (masculino)."
        }
      ],
      "flashcards": [
        { "front": "der / die / das", "back": "the (masc. / fem. / neutro)" }
      ],
      "quiz_questions": [
        {
          "type": "multiple_choice",
          "question": "___ Buch ist interessant.",
          "options": ["Der", "Die", "Das", "Den"],
          "answer": 2,
          "explanation": "'Buch' é neutro: das Buch."
        },
        {
          "type": "fill_blank",
          "question": "___ Frau arbeitet hier. (feminino, nominativo)",
          "answer": "Die",
          "explanation": "Feminino no nominativo: die."
        },
        {
          "type": "translation",
          "question": "Traduza: 'O livro é novo.'",
          "answer": "Das Buch ist neu.",
          "explanation": "Buch é neutro (das), neu = novo."
        }
      ]
    }
  ]
}
```

### Tipos de Quiz Question
| `type` | Campos obrigatórios | Campos opcionais |
|--------|---------------------|-----------------|
| `multiple_choice` | `question`, `options[]`, `answer` (índice int) | `explanation` |
| `fill_blank` | `question`, `answer` (string) | `explanation` |
| `translation` | `question`, `answer` (string) | `explanation` |

---

## 2. Vocabulary (`data/{lang}/vocabulary.json`)

```json
{
  "language": "german",
  "level": "A1",
  "categories": [
    {
      "id": 1,
      "sub_level": "A1.1",
      "category": "Familie",
      "title_pt": "Família",
      "theme": "family",
      "words": [
        {
          "de": "die Mutter",
          "pt": "a mãe",
          "article": "die",
          "plural": "die Mütter",
          "example_de": "Meine Mutter heißt Anna.",
          "example_pt": "Minha mãe se chama Anna."
        }
      ],
      "flashcards": [
        { "front": "die Mutter", "back": "a mãe" },
        { "front": "a mãe (com artigo)", "back": "die Mutter" }
      ],
      "quiz_questions": [
        {
          "type": "multiple_choice",
          "question": "Como se diz 'a mãe' em alemão?",
          "options": ["der Mutter", "die Mutter", "das Mutter", "die Mütter"],
          "answer": 1,
          "explanation": "Mutter é feminino: die Mutter."
        }
      ],
      "association_pairs": [
        { "de": "die Mutter", "pt": "a mãe" },
        { "de": "der Vater", "pt": "o pai" },
        { "de": "das Kind", "pt": "a criança" },
        { "de": "die Schwester", "pt": "a irmã" }
      ]
    }
  ]
}
```

### Campo `words` — campos por palavra
| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `de` | sim | Palavra no idioma-alvo (com artigo se aplicável) |
| `pt` | sim | Tradução em português |
| `article`? | não | Artigo isolado (`"der"`, `"die"`, `"das"`) — para alemão |
| `plural`? | não | Forma plural |
| `example_de` | sim | Frase exemplo no idioma-alvo |
| `example_pt` | sim | Tradução da frase exemplo |

### Campo `association_pairs`
Array de 4–8 pares para o exercício de associação (clique para combinar). Pode ser subconjunto de `words`.

---

## 3. Texts (`data/{lang}/texts.json`)

```json
{
  "language": "german",
  "level": "A1",
  "texts": [
    {
      "id": 1,
      "sub_level": "A1.1",
      "title": "Meine Familie",
      "title_pt": "Minha Família",
      "content": [
        {
          "sentence": "Ich heiße Maria und ich komme aus Brasilien.",
          "translation": "Meu nome é Maria e eu venho do Brasil.",
          "vocabulary": [
            {
              "word": "heiße",
              "translation": "me chamo",
              "note": "verbo heißen, 1ª pessoa"
            },
            {
              "word": "komme",
              "translation": "venho / sou de",
              "note": "verbo kommen"
            }
          ]
        }
      ],
      "comprehension_questions": [
        {
          "type": "multiple_choice",
          "question": "De onde vem Maria?",
          "options": ["Da Alemanha", "Do Brasil", "Da Áustria", "Da Suíça"],
          "answer": 1,
          "explanation": "O texto diz 'ich komme aus Brasilien'."
        },
        {
          "type": "true_false",
          "question": "O pai de Maria se chama Carlos.",
          "answer": true,
          "explanation": "'mein Vater heißt Carlos'"
        }
      ]
    }
  ]
}
```

### Campo `content[].vocabulary`
Hotspots de vocabulário: palavras que serão destacadas no texto com tooltip. O campo `word` deve ser a forma exata como aparece na `sentence` (ou substring dela).

### Tipos extras em `comprehension_questions`
| `type` | Campos |
|--------|--------|
| `true_false` | `question`, `answer` (boolean), `explanation`? |

---

## 4. Conversation (`data/{lang}/conversation.json`)

```json
{
  "language": "german",
  "level": "A1",
  "dialogues": [
    {
      "id": 1,
      "sub_level": "A1.1",
      "situation": "Sich vorstellen",
      "situation_pt": "Apresentação pessoal",
      "context": "Primeiro dia de aula. Maria conhece Thomas.",
      "lines": [
        {
          "speaker": "Maria",
          "de": "Hallo! Ich heiße Maria. Wie heißt du?",
          "pt": "Olá! Meu nome é Maria. Qual é o seu nome?",
          "audio_tts": "Hallo! Ich heiße Maria. Wie heißt du?",
          "notes": "Informal 'du' — usado com pessoas da mesma idade"
        }
      ],
      "key_phrases": [
        { "de": "Wie heißt du?", "pt": "Qual é o seu nome? (informal)" },
        { "de": "Ich heiße...", "pt": "Meu nome é..." }
      ],
      "forvo_links": [
        { "word": "heißen", "url": "https://forvo.com/word/heißen/#de" }
      ]
    }
  ]
}
```

### Campo `audio_tts`
Texto para geração de áudio via Google TTS. URL construída pelo renderer:
```
https://translate.google.com/translate_tts?ie=UTF-8&q={encodeURIComponent(audio_tts)}&tl={lang_code}&client=tw-ob
```
Onde `lang_code` = `"de"` (alemão) ou `"en"` (inglês).

### Campo `notes`?
Nota explicativa opcional exibida abaixo da linha do diálogo. Pode ser `null`.

---

## 5. Writing (`data/{lang}/writing.json`)

```json
{
  "language": "german",
  "level": "A1",
  "exercises": [
    {
      "id": 1,
      "sub_level": "A1.1",
      "title": "Sich vorstellen",
      "title_pt": "Se apresentar por escrito",
      "prompt_pt": "Escreva um pequeno texto em alemão se apresentando. Inclua: nome, origem, profissão e um hobby.",
      "prompt_de": "Schreibe einen kurzen Text auf Deutsch. Stell dich vor!",
      "min_words": 30,
      "grammar_focus": [
        "Verbos: heißen, kommen, sein, arbeiten",
        "Pronomes: ich, mein/meine"
      ],
      "vocabulary_hints": [
        { "pt": "trabalhar como", "de": "arbeiten als" },
        { "pt": "gostar de", "de": "gern + verbo" },
        { "pt": "morar em", "de": "wohnen in" }
      ],
      "example_answer": "Ich heiße Thomas. Ich komme aus Deutschland und wohne in Berlin. Ich bin Lehrer. Ich spiele gern Gitarre.",
      "example_translation": "Meu nome é Thomas. Sou da Alemanha e moro em Berlim. Sou professor. Gosto de tocar violão.",
      "checklist": [
        "Usei o verbo 'heißen' para meu nome?",
        "Usei 'ich komme aus' para minha origem?",
        "Usei 'ich bin' para profissão?",
        "Escrevi pelo menos 30 palavras?"
      ]
    }
  ]
}
```

### Armazenamento de Textos
O texto escrito pelo usuário é salvo em localStorage como:
```
lang_writing_{lang} → { "1": "texto escrito...", "2": "..." }
```

---

## 6. Pronunciation (`data/{lang}/pronunciation.json`)

```json
{
  "language": "german",
  "level": "A1",
  "sections": [
    {
      "id": 1,
      "sub_level": "A1.1",
      "title": "O Alfabeto Alemão",
      "phoneme_groups": [
        {
          "group": "Vogais com Umlaut",
          "phonemes": [
            {
              "symbol": "ä",
              "ipa": "/ɛ/",
              "description": "Como o 'é' aberto em português. Ex: 'é' de 'café'.",
              "examples": [
                {
                  "word": "Mädchen",
                  "translation": "menina",
                  "phonetic": "[ˈmɛːtçən]"
                }
              ],
              "forvo_url": "https://forvo.com/word/Mädchen/#de",
              "youtube_url": null
            }
          ]
        }
      ]
    }
  ]
}
```

### Campos de `phonemes`
| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `symbol` | sim | Letra ou dígrafo (`"ä"`, `"ch"`, `"sch"`) |
| `ipa` | sim | Notação IPA entre barras |
| `description` | sim | Explicação em português com analogia ao português |
| `examples[]` | sim | Pelo menos 1 exemplo com `word`, `translation`, `phonetic` |
| `forvo_url`? | não | Link direto para pronúncia no Forvo (ou `null`) |
| `youtube_url`? | não | Link YouTube explicativo (ou `null`) |

---

## Sumário de Arquivos por Idioma

| Arquivo | Sub-níveis | Qtd. Items |
|---------|-----------|------------|
| `data/german/grammar.json` | A1.1 (7), A1.2 (7), A1.3 (7) | 21 tópicos |
| `data/german/vocabulary.json` | A1.1 (2), A1.2 (2), A1.3 (2) | 6+ categorias |
| `data/german/texts.json` | A1.1, A1.2, A1.3 | 3 textos |
| `data/german/conversation.json` | A1.1, A1.2, A1.3 | 3 diálogos |
| `data/german/writing.json` | A1.1, A1.2, A1.3 | 3 exercícios |
| `data/german/pronunciation.json` | A1.1, A1.2, A1.3 | 3 seções |
| `data/english/grammar.json` | A2.1 (8), A2.2 (7) | 15 tópicos |
| `data/english/vocabulary.json` | A2.1 (3), A2.2 (3) | 6+ categorias |
| `data/english/texts.json` | A2.1, A2.2 | 2 textos |
| `data/english/conversation.json` | A2.1, A2.2 | 2 diálogos |
| `data/english/writing.json` | A2.1, A2.2 | 2 exercícios |
| `data/english/pronunciation.json` | A2.1, A2.2 | 2 seções |
