"""
Menu Principal - Ferramenta de Estudo de Inglês (A2 → B2)
"""

import json
import os
import sys

# Ajustar path para imports
CLI_DIR = os.path.dirname(os.path.abspath(__file__))
ENGLISH_DIR = os.path.dirname(CLI_DIR)
CONTENT_DIR = os.path.join(ENGLISH_DIR, "content")

# Adicionar diretório pai ao path para imports relativos
if ENGLISH_DIR not in sys.path:
    sys.path.insert(0, ENGLISH_DIR)

from cli.flashcards import run_flashcards
from cli.quiz import run_quiz
from cli import spaced_repetition as sr


def load_content():
    """Carrega os arquivos de conteúdo JSON."""
    grammar_path = os.path.join(CONTENT_DIR, "grammar.json")
    vocab_path = os.path.join(CONTENT_DIR, "vocabulary.json")

    with open(grammar_path, "r", encoding="utf-8") as f:
        grammar = json.load(f)

    with open(vocab_path, "r", encoding="utf-8") as f:
        vocabulary = json.load(f)

    return grammar, vocabulary


def show_banner():
    """Mostra o banner inicial."""
    print()
    print("  ╔════════════════════════════════════════════════════════╗")
    print("  ║        ENGLISH STUDY TOOL  -  A2 → B2                 ║")
    print("  ║        Ferramenta de Estudo de Inglês                  ║")
    print("  ╚════════════════════════════════════════════════════════╝")
    print()


def show_progress_summary():
    """Mostra um resumo rápido do progresso."""
    progress = sr.load_progress()
    stats = sr.get_stats(progress)

    if stats["total_cards_studied"] > 0:
        print(f"  Cards estudados: {stats['total_cards_studied']} | "
              f"Dominados: {stats['mastered']} | "
              f"Sequência: {stats['streak_days']} dia(s)")
        print()


def show_detailed_progress(grammar_data, vocabulary_data):
    """Mostra progresso detalhado."""
    progress = sr.load_progress()
    stats = sr.get_stats(progress)

    print(f"\n{'='*60}")
    print("  SEU PROGRESSO")
    print(f"{'='*60}")
    print(f"\n  Total de cards estudados: {stats['total_cards_studied']}")
    print(f"  Total de revisões feitas: {stats['total_reviews']}")
    print(f"  Sequência de dias: {stats['streak_days']}")
    print(f"  Cards dominados: {stats['mastered']}")
    print(f"  Cards em aprendizado: {stats['learning']}")
    print(f"  Cards difíceis: {stats['difficult']}")

    if stats["total_cards_studied"] > 0:
        print(f"  Facilidade média: {stats['average_easiness']}")

    # Contar total de cards disponíveis
    total_grammar = sum(len(t["flashcards"]) + len(t["quiz_questions"]) for t in grammar_data["topics"])
    total_vocab = sum(len(c["flashcards"]) + len(c["quiz_questions"]) for c in vocabulary_data["categories"])
    total_available = total_grammar + total_vocab

    print(f"\n  Conteúdo disponível:")
    print(f"    Gramática: {total_grammar} itens ({len(grammar_data['topics'])} tópicos)")
    print(f"    Vocabulário: {total_vocab} itens ({len(vocabulary_data['categories'])} categorias)")
    print(f"    Total: {total_available} itens")

    if stats["total_cards_studied"] > 0:
        coverage = (stats["total_cards_studied"] / total_available) * 100
        print(f"\n  Cobertura: {coverage:.1f}%")

    # Progresso por nível
    print(f"\n  {'─'*50}")
    print("  Progresso por nível:")
    for level in ["A2", "B1", "B2"]:
        level_cards = 0
        level_studied = 0
        for topic in grammar_data["topics"]:
            if topic["level"] == level:
                for i in range(len(topic["flashcards"])):
                    key = sr.get_card_key("grammar", topic["id"], i)
                    level_cards += 1
                    if key in progress["cards"]:
                        level_studied += 1
                for i in range(len(topic["quiz_questions"])):
                    key = sr.get_card_key("grammar_quiz", topic["id"], i)
                    level_cards += 1
                    if key in progress["cards"]:
                        level_studied += 1

        for cat in vocabulary_data["categories"]:
            if cat["level"] == level:
                for i in range(len(cat["flashcards"])):
                    key = sr.get_card_key("vocab", cat["id"], i)
                    level_cards += 1
                    if key in progress["cards"]:
                        level_studied += 1
                for i in range(len(cat["quiz_questions"])):
                    key = sr.get_card_key("vocab_quiz", cat["id"], i)
                    level_cards += 1
                    if key in progress["cards"]:
                        level_studied += 1

        if level_cards > 0:
            pct = (level_studied / level_cards) * 100
            bar_len = 20
            filled = int(bar_len * pct / 100)
            bar = "█" * filled + "░" * (bar_len - filled)
            print(f"    {level}: [{bar}] {pct:.0f}% ({level_studied}/{level_cards})")
        else:
            print(f"    {level}: Sem conteúdo")

    # Cards para revisão hoje
    due = sr.get_due_cards(progress, grammar_data, vocabulary_data)
    print(f"\n  Cards para revisão hoje: {len(due)}")

    print(f"\n{'='*60}")
    input("  [Enter para voltar]")


def browse_content(grammar_data, vocabulary_data):
    """Navega pelo conteúdo disponível (só leitura)."""
    while True:
        print(f"\n{'='*60}")
        print("  EXPLORAR CONTEÚDO")
        print(f"{'='*60}")
        print("\n  [1] Tópicos de Gramática")
        print("  [2] Categorias de Vocabulário")
        print("  [0] Voltar")

        choice = input("\n  Opção: ").strip()

        if choice == "0":
            return
        elif choice == "1":
            _browse_grammar_topics(grammar_data)
        elif choice == "2":
            _browse_vocab_categories(vocabulary_data)


def _browse_grammar_topics(grammar_data):
    """Lista e permite ler tópicos de gramática."""
    topics = grammar_data["topics"]
    current_level = None

    for topic in topics:
        if topic["level"] != current_level:
            current_level = topic["level"]
            print(f"\n  ── {current_level} ──")
        print(f"  [{topic['id']:2d}] {topic['topic']}")

    print(f"\n  [0] Voltar")

    choice = input("\n  Número do tópico para ver detalhes: ").strip()
    if choice == "0":
        return

    try:
        topic_id = int(choice)
        topic = next((t for t in topics if t["id"] == topic_id), None)
        if topic:
            _show_full_topic(topic)
    except ValueError:
        print("  Opção inválida.")


def _show_full_topic(topic):
    """Mostra um tópico completo."""
    print(f"\n{'='*60}")
    print(f"  [{topic['level']}] {topic['topic']}")
    print(f"{'='*60}")

    print(f"\n  EXPLICAÇÃO:")
    print(f"  {topic['explanation']}")

    if topic.get("rules"):
        print(f"\n  REGRAS:")
        for rule in topic["rules"]:
            print(f"    • {rule}")

    if topic.get("examples"):
        print(f"\n  EXEMPLOS:")
        for ex in topic["examples"]:
            print(f"    EN: {ex['en']}")
            print(f"    PT: {ex['pt']}")
            print()

    if topic.get("common_mistakes"):
        print(f"  ERROS COMUNS DE BRASILEIROS:")
        for m in topic["common_mistakes"]:
            print(f"    ✗ {m['wrong']}")
            print(f"    ✓ {m['correct']}")
            print(f"      → {m['explanation']}")
            print()

    input("  [Enter para voltar]")


def _browse_vocab_categories(vocabulary_data):
    """Lista e permite ler categorias de vocabulário."""
    categories = vocabulary_data["categories"]

    for cat in categories:
        print(f"  [{cat['id']:2d}] [{cat['level']}] {cat['category']} ({len(cat['words'])} palavras)")

    print(f"\n  [0] Voltar")

    choice = input("\n  Número da categoria: ").strip()
    if choice == "0":
        return

    try:
        cat_id = int(choice)
        cat = next((c for c in categories if c["id"] == cat_id), None)
        if cat:
            _show_full_category(cat)
    except ValueError:
        print("  Opção inválida.")


def _show_full_category(cat):
    """Mostra uma categoria completa."""
    print(f"\n{'='*60}")
    print(f"  [{cat['level']}] {cat['category']}")
    print(f"{'='*60}")

    print(f"\n  PALAVRAS:")
    for w in cat["words"]:
        past = f" (past: {w['past']})" if "past" in w else ""
        print(f"    • {w['en']}{past} — {w['pt']}")
        print(f"      Ex: {w['example']}")

    input("\n  [Enter para voltar]")


def main():
    """Loop principal do programa."""
    try:
        grammar_data, vocabulary_data = load_content()
    except FileNotFoundError as e:
        print(f"\n  Erro: Arquivo de conteúdo não encontrado: {e}")
        print("  Verifique se os arquivos grammar.json e vocabulary.json existem em english/content/")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"\n  Erro: JSON inválido: {e}")
        sys.exit(1)

    show_banner()

    while True:
        show_progress_summary()

        print("  Menu Principal:")
        print("  [1] Flashcards")
        print("  [2] Quiz")
        print("  [3] Revisão do Dia (Espaçada)")
        print("  [4] Meu Progresso")
        print("  [5] Explorar Conteúdo")
        print("  [0] Sair")

        choice = input("\n  Opção: ").strip()

        if choice == "0":
            print("\n  Até a próxima! Keep studying! 📚\n")
            break
        elif choice == "1":
            run_flashcards(grammar_data, vocabulary_data)
        elif choice == "2":
            run_quiz(grammar_data, vocabulary_data)
        elif choice == "3":
            sr.run_daily_review(grammar_data, vocabulary_data)
        elif choice == "4":
            show_detailed_progress(grammar_data, vocabulary_data)
        elif choice == "5":
            browse_content(grammar_data, vocabulary_data)
        else:
            print("  Opção inválida. Tente novamente.")


if __name__ == "__main__":
    main()
