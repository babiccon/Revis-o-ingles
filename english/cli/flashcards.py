"""
Módulo de Flashcards
Navegação por tópicos, exibição de cards com explicações.
"""

import random
from . import spaced_repetition as sr


def run_flashcards(grammar_data, vocabulary_data):
    """Menu principal dos flashcards."""
    while True:
        print(f"\n{'='*60}")
        print("  FLASHCARDS")
        print(f"{'='*60}")
        print("\n  Escolha a fonte:")
        print("  [1] Gramática")
        print("  [2] Vocabulário")
        print("  [3] Misturado (todos)")
        print("  [0] Voltar")

        choice = input("\n  Opção: ").strip()

        if choice == "0":
            return
        elif choice == "1":
            _browse_grammar(grammar_data)
        elif choice == "2":
            _browse_vocabulary(vocabulary_data)
        elif choice == "3":
            _mixed_flashcards(grammar_data, vocabulary_data)


def _select_level():
    """Permite ao usuário filtrar por nível."""
    print("\n  Filtrar por nível:")
    print("  [1] A2 (Básico)")
    print("  [2] B1 (Intermediário)")
    print("  [3] B2 (Intermediário-Avançado)")
    print("  [4] Todos os níveis")

    choice = input("  Opção: ").strip()
    level_map = {"1": "A2", "2": "B1", "3": "B2", "4": None}
    return level_map.get(choice)


def _browse_grammar(grammar_data):
    """Navega pelos tópicos de gramática."""
    level = _select_level()
    topics = grammar_data["topics"]
    if level:
        topics = [t for t in topics if t["level"] == level]

    if not topics:
        print("  Nenhum tópico encontrado para este nível.")
        return

    while True:
        print(f"\n  {'─'*50}")
        print("  TÓPICOS DE GRAMÁTICA:")
        for i, topic in enumerate(topics):
            print(f"  [{i+1}] [{topic['level']}] {topic['topic']} ({len(topic['flashcards'])} cards)")
        print(f"  [0] Voltar")

        choice = input("\n  Escolha um tópico: ").strip()
        if choice == "0":
            return

        try:
            idx = int(choice) - 1
            if 0 <= idx < len(topics):
                topic = topics[idx]
                _show_topic_info(topic)
                _study_cards(
                    topic["flashcards"],
                    topic["topic"],
                    topic["level"],
                    topic.get("explanation", ""),
                    topic.get("common_mistakes", []),
                    source="grammar",
                    topic_id=topic["id"]
                )
        except (ValueError, IndexError):
            print("  Opção inválida.")


def _browse_vocabulary(vocabulary_data):
    """Navega pelas categorias de vocabulário."""
    level = _select_level()
    categories = vocabulary_data["categories"]
    if level:
        categories = [c for c in categories if c["level"] == level]

    if not categories:
        print("  Nenhuma categoria encontrada para este nível.")
        return

    while True:
        print(f"\n  {'─'*50}")
        print("  CATEGORIAS DE VOCABULÁRIO:")
        for i, cat in enumerate(categories):
            print(f"  [{i+1}] [{cat['level']}] {cat['category']} ({len(cat['flashcards'])} cards)")
        print(f"  [0] Voltar")

        choice = input("\n  Escolha uma categoria: ").strip()
        if choice == "0":
            return

        try:
            idx = int(choice) - 1
            if 0 <= idx < len(categories):
                cat = categories[idx]
                _study_cards(
                    cat["flashcards"],
                    cat["category"],
                    cat["level"],
                    "",
                    [],
                    source="vocab",
                    topic_id=cat["id"]
                )
        except (ValueError, IndexError):
            print("  Opção inválida.")


def _show_topic_info(topic):
    """Mostra informações sobre o tópico antes de estudar."""
    print(f"\n{'='*60}")
    print(f"  {topic['level']} - {topic['topic']}")
    print(f"{'='*60}")
    print(f"\n  {topic['explanation']}")

    if topic.get("tips"):
        print(f"\n  DICAS PRÁTICAS:")
        for tip in topic["tips"]:
            print(f"    💡 {tip}")

    if topic.get("rules"):
        print(f"\n  REGRAS:")
        for rule in topic["rules"]:
            print(f"    • {rule}")

    if topic.get("examples"):
        print(f"\n  EXEMPLOS:")
        for ex in topic["examples"][:3]:
            print(f"    EN: {ex['en']}")
            print(f"    PT: {ex['pt']}")
            print()

    input("  [Enter para começar os flashcards]")


def _study_cards(cards, topic_name, level, explanation, common_mistakes, source, topic_id):
    """Estuda uma lista de flashcards."""
    progress = sr.load_progress()
    total = len(cards)
    current = 0
    correct = 0
    incorrect = 0

    print(f"\n  {total} flashcards para estudar")
    print(f"  Comandos: [Enter] ver resposta, [p] pular, [e] explicação, [q] sair\n")

    while current < total:
        card = cards[current]
        card_key = sr.get_card_key(source, topic_id, current)

        print(f"  [{current+1}/{total}] {level} - {topic_name}")
        print(f"  {'─'*50}")
        print(f"\n  {card['front']}")

        cmd = input("\n  > ").strip().lower()

        if cmd == 'q':
            break
        elif cmd == 'p':
            current += 1
            continue
        elif cmd == 'e':
            if explanation:
                print(f"\n  {explanation}")
            if common_mistakes:
                print(f"\n  ERROS COMUNS:")
                for m in common_mistakes:
                    print(f"    ✗ {m['wrong']}")
                    print(f"    ✓ {m['correct']}")
                    print(f"      → {m['explanation']}")
                    print()
            input("  [Enter para continuar]")
            continue

        # Mostrar resposta
        print(f"\n  ➜ {card['back']}")

        print("\n  Como foi?")
        print("  [1] Errei / Não lembrei")
        print("  [2] Difícil")
        print("  [3] Médio")
        print("  [4] Fácil")

        while True:
            rating = input("  Avaliação: ").strip()
            if rating in ("1", "2", "3", "4"):
                break
            print("  Escolha 1, 2, 3 ou 4.")

        quality_map = {"1": 1, "2": 3, "3": 4, "4": 5}
        quality = quality_map[rating]
        sr.update_card(progress, card_key, quality)

        if rating == "1":
            incorrect += 1
            if explanation:
                print(f"\n  Dica: {explanation[:150]}...")
        else:
            correct += 1

        current += 1
        print()

    # Resumo
    reviewed = correct + incorrect
    if reviewed > 0:
        pct = (correct / reviewed) * 100
        print(f"\n  {'='*50}")
        print(f"  RESUMO - {topic_name}")
        print(f"  {'─'*50}")
        print(f"  Cards estudados: {reviewed}/{total}")
        print(f"  Acertos: {correct} ({pct:.0f}%)")
        print(f"  Erros: {incorrect}")
        print(f"  {'='*50}")


def _mixed_flashcards(grammar_data, vocabulary_data):
    """Estuda flashcards misturados de todas as fontes."""
    level = _select_level()

    all_cards = []

    for topic in grammar_data["topics"]:
        if level and topic["level"] != level:
            continue
        for i, card in enumerate(topic["flashcards"]):
            all_cards.append({
                "front": card["front"],
                "back": card["back"],
                "topic": topic["topic"],
                "level": topic["level"],
                "source": "grammar",
                "topic_id": topic["id"],
                "index": i,
                "explanation": topic.get("explanation", "")
            })

    for cat in vocabulary_data["categories"]:
        if level and cat["level"] != level:
            continue
        for i, card in enumerate(cat["flashcards"]):
            all_cards.append({
                "front": card["front"],
                "back": card["back"],
                "topic": cat["category"],
                "level": cat["level"],
                "source": "vocab",
                "topic_id": cat["id"],
                "index": i,
                "explanation": ""
            })

    if not all_cards:
        print("  Nenhum card encontrado.")
        return

    random.shuffle(all_cards)

    # Limitar a 30 cards por sessão
    cards_to_study = all_cards[:30]

    print(f"\n  {len(cards_to_study)} flashcards misturados (de {len(all_cards)} disponíveis)")
    print(f"  Nível: {level or 'Todos'}")

    progress = sr.load_progress()
    correct = 0
    total_done = 0

    for i, item in enumerate(cards_to_study):
        print(f"\n  [{i+1}/{len(cards_to_study)}] {item['level']} - {item['topic']}")
        print(f"  {'─'*50}")
        print(f"\n  {item['front']}")

        cmd = input("\n  [Enter] ver resposta, [q] sair: ").strip().lower()
        if cmd == 'q':
            break

        print(f"\n  ➜ {item['back']}")

        print("\n  [1] Errei  [2] Difícil  [3] Médio  [4] Fácil")

        while True:
            rating = input("  > ").strip()
            if rating in ("1", "2", "3", "4"):
                break

        quality_map = {"1": 1, "2": 3, "3": 4, "4": 5}
        card_key = sr.get_card_key(item["source"], item["topic_id"], item["index"])
        sr.update_card(progress, card_key, quality_map[rating])

        if rating != "1":
            correct += 1
        total_done += 1

    if total_done > 0:
        pct = (correct / total_done) * 100
        print(f"\n  Sessão: {correct}/{total_done} ({pct:.0f}%) acertos")
