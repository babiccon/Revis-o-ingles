"""
Módulo de Quizzes
Perguntas de múltipla escolha e preenchimento, com feedback e explicações.
"""

import random
from . import spaced_repetition as sr


def run_quiz(grammar_data, vocabulary_data):
    """Menu principal do quiz."""
    while True:
        print(f"\n{'='*60}")
        print("  QUIZ")
        print(f"{'='*60}")
        print("\n  Escolha o modo:")
        print("  [1] Quiz por tópico (gramática)")
        print("  [2] Quiz por categoria (vocabulário)")
        print("  [3] Quiz misto (todos)")
        print("  [4] Quiz progressivo (A2 → B2)")
        print("  [0] Voltar")

        choice = input("\n  Opção: ").strip()

        if choice == "0":
            return
        elif choice == "1":
            _quiz_grammar(grammar_data)
        elif choice == "2":
            _quiz_vocabulary(vocabulary_data)
        elif choice == "3":
            _quiz_mixed(grammar_data, vocabulary_data)
        elif choice == "4":
            _quiz_progressive(grammar_data, vocabulary_data)


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


def _quiz_grammar(grammar_data):
    """Quiz por tópico de gramática."""
    level = _select_level()
    topics = grammar_data["topics"]
    if level:
        topics = [t for t in topics if t["level"] == level]

    if not topics:
        print("  Nenhum tópico encontrado.")
        return

    print(f"\n  TÓPICOS:")
    for i, t in enumerate(topics):
        n = len(t["quiz_questions"])
        print(f"  [{i+1}] [{t['level']}] {t['topic']} ({n} perguntas)")
    print(f"  [0] Voltar")

    choice = input("\n  Escolha: ").strip()
    if choice == "0":
        return

    try:
        idx = int(choice) - 1
        if 0 <= idx < len(topics):
            topic = topics[idx]
            _show_explanation(topic)
            _run_questions(
                topic["quiz_questions"],
                topic["topic"],
                topic["level"],
                source="grammar_quiz",
                topic_id=topic["id"]
            )
    except (ValueError, IndexError):
        print("  Opção inválida.")


def _quiz_vocabulary(vocabulary_data):
    """Quiz por categoria de vocabulário."""
    level = _select_level()
    categories = vocabulary_data["categories"]
    if level:
        categories = [c for c in categories if c["level"] == level]

    if not categories:
        print("  Nenhuma categoria encontrada.")
        return

    print(f"\n  CATEGORIAS:")
    for i, c in enumerate(categories):
        n = len(c["quiz_questions"])
        print(f"  [{i+1}] [{c['level']}] {c['category']} ({n} perguntas)")
    print(f"  [0] Voltar")

    choice = input("\n  Escolha: ").strip()
    if choice == "0":
        return

    try:
        idx = int(choice) - 1
        if 0 <= idx < len(categories):
            cat = categories[idx]
            _run_questions(
                cat["quiz_questions"],
                cat["category"],
                cat["level"],
                source="vocab_quiz",
                topic_id=cat["id"]
            )
    except (ValueError, IndexError):
        print("  Opção inválida.")


def _quiz_mixed(grammar_data, vocabulary_data):
    """Quiz com perguntas misturadas."""
    level = _select_level()
    all_questions = []

    for topic in grammar_data["topics"]:
        if level and topic["level"] != level:
            continue
        for i, q in enumerate(topic["quiz_questions"]):
            all_questions.append({
                "question": q,
                "topic": topic["topic"],
                "level": topic["level"],
                "source": "grammar_quiz",
                "topic_id": topic["id"],
                "index": i
            })

    for cat in vocabulary_data["categories"]:
        if level and cat["level"] != level:
            continue
        for i, q in enumerate(cat["quiz_questions"]):
            all_questions.append({
                "question": q,
                "topic": cat["category"],
                "level": cat["level"],
                "source": "vocab_quiz",
                "topic_id": cat["id"],
                "index": i
            })

    if not all_questions:
        print("  Nenhuma pergunta encontrada.")
        return

    random.shuffle(all_questions)
    questions = all_questions[:20]

    print(f"\n  Quiz misto: {len(questions)} perguntas (de {len(all_questions)} disponíveis)")
    print(f"  Nível: {level or 'Todos'}")

    progress = sr.load_progress()
    score = 0
    total = 0

    for i, item in enumerate(questions):
        q = item["question"]
        print(f"\n  [{i+1}/{len(questions)}] {item['level']} - {item['topic']}")
        print(f"  {'─'*50}")

        result = _ask_question(q)
        if result is None:
            break

        correct, quality = result
        total += 1
        if correct:
            score += 1

        card_key = sr.get_card_key(item["source"], item["topic_id"], item["index"])
        sr.update_card(progress, card_key, quality)

    _show_score(score, total)


def _quiz_progressive(grammar_data, vocabulary_data):
    """Quiz progressivo: começa no A2, avança com acertos."""
    levels = ["A2", "B1", "B2"]
    current_level_idx = 0
    consecutive_correct = 0
    total_score = 0
    total_questions = 0
    progress = sr.load_progress()

    print(f"\n{'='*60}")
    print("  QUIZ PROGRESSIVO")
    print("  Comece no A2 e avance para B1 e B2 com bom desempenho!")
    print(f"  3 acertos seguidos = avança de nível")
    print(f"  2 erros seguidos = volta de nível")
    print(f"{'='*60}")

    consecutive_wrong = 0

    while True:
        current_level = levels[current_level_idx]

        # Coletar perguntas do nível atual
        level_questions = []
        for topic in grammar_data["topics"]:
            if topic["level"] == current_level:
                for i, q in enumerate(topic["quiz_questions"]):
                    level_questions.append({
                        "question": q,
                        "topic": topic["topic"],
                        "source": "grammar_quiz",
                        "topic_id": topic["id"],
                        "index": i
                    })

        for cat in vocabulary_data["categories"]:
            if cat["level"] == current_level:
                for i, q in enumerate(cat["quiz_questions"]):
                    level_questions.append({
                        "question": q,
                        "topic": cat["category"],
                        "source": "vocab_quiz",
                        "topic_id": cat["id"],
                        "index": i
                    })

        if not level_questions:
            print(f"  Sem perguntas para {current_level}.")
            break

        random.shuffle(level_questions)
        item = level_questions[0]
        q = item["question"]

        total_questions += 1
        print(f"\n  Nível atual: {current_level} | Placar: {total_score}/{total_questions-1}")
        print(f"  Tópico: {item['topic']}")
        print(f"  {'─'*50}")

        result = _ask_question(q)
        if result is None:
            break

        correct, quality = result
        card_key = sr.get_card_key(item["source"], item["topic_id"], item["index"])
        sr.update_card(progress, card_key, quality)

        if correct:
            total_score += 1
            consecutive_correct += 1
            consecutive_wrong = 0

            if consecutive_correct >= 3 and current_level_idx < len(levels) - 1:
                current_level_idx += 1
                consecutive_correct = 0
                print(f"\n  ★ Parabéns! Avançou para {levels[current_level_idx]}!")
        else:
            consecutive_wrong += 1
            consecutive_correct = 0

            if consecutive_wrong >= 2 and current_level_idx > 0:
                current_level_idx -= 1
                consecutive_wrong = 0
                print(f"\n  ↓ Voltando para {levels[current_level_idx]} para reforçar.")

        # Perguntar se quer continuar a cada 10 perguntas
        if total_questions % 10 == 0:
            cont = input(f"\n  Continuar? ({total_score}/{total_questions} acertos) [s/n]: ").strip().lower()
            if cont not in ("s", "sim", "y", "yes", ""):
                break

    _show_score(total_score, total_questions)
    print(f"  Nível final: {levels[current_level_idx]}")


def _show_explanation(topic):
    """Mostra explicação do tópico antes do quiz."""
    print(f"\n{'='*60}")
    print(f"  {topic['level']} - {topic['topic']}")
    print(f"{'='*60}")
    print(f"\n  {topic['explanation']}")

    resp = input("\n  Ver regras antes de começar? (s/n): ").strip().lower()
    if resp in ("s", "sim", "y", "yes"):
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
        input("  [Enter para começar o quiz]")


def _run_questions(questions, topic_name, level, source, topic_id):
    """Executa uma lista de perguntas."""
    progress = sr.load_progress()
    score = 0
    total = len(questions)

    print(f"\n  {total} perguntas sobre '{topic_name}'")
    print(f"  Nível: {level}\n")

    for i, q in enumerate(questions):
        print(f"  [{i+1}/{total}]")
        print(f"  {'─'*50}")

        result = _ask_question(q)
        if result is None:
            total = i
            break

        correct, quality = result
        if correct:
            score += 1

        card_key = sr.get_card_key(source, topic_id, i)
        sr.update_card(progress, card_key, quality)

    _show_score(score, total)


def _ask_question(q):
    """
    Faz uma pergunta ao usuário.
    Retorna (correct: bool, quality: int) ou None se o usuário quer sair.
    """
    print(f"\n  {q['question']}")

    if q["type"] == "multiple_choice":
        for j, opt in enumerate(q["options"]):
            print(f"    {j+1}. {opt}")

        resp = input("\n  Sua resposta (número ou 'q' para sair): ").strip().lower()
        if resp == 'q':
            return None

        try:
            answer_idx = int(resp) - 1
            correct = answer_idx == q["answer"]
        except (ValueError, IndexError):
            correct = False
            answer_idx = -1

        correct_answer = q["options"][q["answer"]]

    elif q["type"] == "fill_blank":
        resp = input("\n  Sua resposta (ou 'q' para sair): ").strip()
        if resp.lower() == 'q':
            return None

        correct_answer = q["answer"]
        # Comparação flexível
        resp_clean = resp.lower().strip().rstrip(".")
        answer_clean = correct_answer.lower().strip().rstrip(".")

        correct = resp_clean == answer_clean
        if not correct:
            # Verificar com ... (respostas compostas)
            parts = answer_clean.split(" ... ")
            if len(parts) > 1:
                resp_parts = resp_clean.replace("...", "").replace("  ", " ").strip()
                all_words = " ".join(parts).split()
                correct = all(w in resp_parts.split() for w in all_words)
            else:
                # Verificar se todas as palavras-chave estão presentes
                key_words = answer_clean.split()
                resp_words = resp_clean.split()
                if key_words and len(key_words) <= len(resp_words):
                    correct = all(w in resp_words for w in key_words)

    else:
        print("  Tipo de pergunta desconhecido.")
        return None

    if correct:
        print(f"\n  ✓ Correto!")
        quality = 4
    else:
        print(f"\n  ✗ Incorreto!")
        if q["type"] == "multiple_choice":
            print(f"  Resposta correta: {q['options'][q['answer']]}")
        else:
            print(f"  Resposta correta: {q['answer']}")
        quality = 1

    print(f"  Explicação: {q['explanation']}")
    print()

    return correct, quality


def _show_score(score, total):
    """Mostra a pontuação final."""
    if total == 0:
        return

    pct = (score / total) * 100
    print(f"\n{'='*60}")
    print(f"  RESULTADO FINAL")
    print(f"  {'─'*50}")
    print(f"  Acertos: {score}/{total} ({pct:.0f}%)")

    if pct >= 90:
        print(f"  Excelente! Domine este nível!")
    elif pct >= 70:
        print(f"  Muito bom! Continue praticando!")
    elif pct >= 50:
        print(f"  Bom progresso! Revise os erros.")
    else:
        print(f"  Revise o conteúdo e tente novamente!")

    print(f"{'='*60}")
