"""
Sistema de Revisão Espaçada (SM-2)
Algoritmo SuperMemo 2 para agendamento inteligente de revisões.
"""

import json
import os
import math
from datetime import datetime, timedelta

PROGRESS_FILE = os.path.join(os.path.dirname(__file__), "progress.json")


def load_progress():
    """Carrega o progresso do arquivo JSON."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"cards": {}, "stats": {"total_reviews": 0, "streak_days": 0, "last_review_date": None}}


def save_progress(progress):
    """Salva o progresso no arquivo JSON."""
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def get_card_key(source, topic_id, card_index):
    """Gera uma chave única para cada card."""
    return f"{source}_{topic_id}_{card_index}"


def sm2_algorithm(quality, repetitions, easiness, interval):
    """
    Implementação do algoritmo SM-2.

    quality: 0-5 (0-2 = errou, 3 = difícil, 4 = médio, 5 = fácil)
    repetitions: número de revisões consecutivas corretas
    easiness: fator de facilidade (mínimo 1.3)
    interval: intervalo atual em dias

    Retorna: (new_repetitions, new_easiness, new_interval)
    """
    if quality >= 3:
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = round(interval * easiness)
        new_repetitions = repetitions + 1
    else:
        new_repetitions = 0
        new_interval = 1

    new_easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if new_easiness < 1.3:
        new_easiness = 1.3

    return new_repetitions, round(new_easiness, 2), new_interval


def get_card_data(progress, card_key):
    """Retorna os dados de um card ou os valores iniciais."""
    if card_key in progress["cards"]:
        return progress["cards"][card_key]
    return {
        "repetitions": 0,
        "easiness": 2.5,
        "interval": 0,
        "next_review": datetime.now().strftime("%Y-%m-%d"),
        "last_quality": None,
        "review_count": 0
    }


def update_card(progress, card_key, quality):
    """Atualiza um card após revisão."""
    card = get_card_data(progress, card_key)

    new_reps, new_ease, new_interval = sm2_algorithm(
        quality,
        card["repetitions"],
        card["easiness"],
        card["interval"]
    )

    next_date = (datetime.now() + timedelta(days=new_interval)).strftime("%Y-%m-%d")

    progress["cards"][card_key] = {
        "repetitions": new_reps,
        "easiness": new_ease,
        "interval": new_interval,
        "next_review": next_date,
        "last_quality": quality,
        "review_count": card["review_count"] + 1
    }

    progress["stats"]["total_reviews"] += 1
    today = datetime.now().strftime("%Y-%m-%d")
    if progress["stats"]["last_review_date"] != today:
        if progress["stats"]["last_review_date"]:
            last = datetime.strptime(progress["stats"]["last_review_date"], "%Y-%m-%d")
            if (datetime.now() - last).days == 1:
                progress["stats"]["streak_days"] += 1
            elif (datetime.now() - last).days > 1:
                progress["stats"]["streak_days"] = 1
        else:
            progress["stats"]["streak_days"] = 1
        progress["stats"]["last_review_date"] = today

    save_progress(progress)


def get_due_cards(progress, grammar_data, vocabulary_data):
    """Retorna todos os cards que precisam de revisão hoje."""
    today = datetime.now().strftime("%Y-%m-%d")
    due = []

    # Cards de gramática
    for topic in grammar_data["topics"]:
        for i, card in enumerate(topic["flashcards"]):
            key = get_card_key("grammar", topic["id"], i)
            card_data = get_card_data(progress, key)
            if card_data["next_review"] <= today:
                due.append({
                    "key": key,
                    "type": "flashcard",
                    "source": "grammar",
                    "topic": topic["topic"],
                    "level": topic["level"],
                    "front": card["front"],
                    "back": card["back"],
                    "explanation": topic.get("explanation", ""),
                    "card_data": card_data
                })

        for i, q in enumerate(topic["quiz_questions"]):
            key = get_card_key("grammar_quiz", topic["id"], i)
            card_data = get_card_data(progress, key)
            if card_data["next_review"] <= today:
                due.append({
                    "key": key,
                    "type": "quiz",
                    "source": "grammar",
                    "topic": topic["topic"],
                    "level": topic["level"],
                    "question": q,
                    "card_data": card_data
                })

    # Cards de vocabulário
    for cat in vocabulary_data["categories"]:
        for i, card in enumerate(cat["flashcards"]):
            key = get_card_key("vocab", cat["id"], i)
            card_data = get_card_data(progress, key)
            if card_data["next_review"] <= today:
                due.append({
                    "key": key,
                    "type": "flashcard",
                    "source": "vocabulary",
                    "topic": cat["category"],
                    "level": cat["level"],
                    "front": card["front"],
                    "back": card["back"],
                    "explanation": "",
                    "card_data": card_data
                })

        for i, q in enumerate(cat["quiz_questions"]):
            key = get_card_key("vocab_quiz", cat["id"], i)
            card_data = get_card_data(progress, key)
            if card_data["next_review"] <= today:
                due.append({
                    "key": key,
                    "type": "quiz",
                    "source": "vocabulary",
                    "topic": cat["category"],
                    "level": cat["level"],
                    "question": q,
                    "card_data": card_data
                })

    # Ordenar: cards mais atrasados e mais difíceis primeiro
    due.sort(key=lambda x: (x["card_data"]["next_review"], x["card_data"]["easiness"]))

    return due


def get_new_cards(grammar_data, vocabulary_data, progress, level=None, limit=20):
    """Retorna cards novos (nunca revisados) para introdução."""
    new_cards = []

    for topic in grammar_data["topics"]:
        if level and topic["level"] != level:
            continue
        for i, card in enumerate(topic["flashcards"]):
            key = get_card_key("grammar", topic["id"], i)
            if key not in progress["cards"]:
                new_cards.append({
                    "key": key,
                    "type": "flashcard",
                    "source": "grammar",
                    "topic": topic["topic"],
                    "level": topic["level"],
                    "front": card["front"],
                    "back": card["back"],
                    "explanation": topic.get("explanation", ""),
                    "card_data": get_card_data(progress, key)
                })

    for cat in vocabulary_data["categories"]:
        if level and cat["level"] != level:
            continue
        for i, card in enumerate(cat["flashcards"]):
            key = get_card_key("vocab", cat["id"], i)
            if key not in progress["cards"]:
                new_cards.append({
                    "key": key,
                    "type": "flashcard",
                    "source": "vocabulary",
                    "topic": cat["category"],
                    "level": cat["level"],
                    "front": card["front"],
                    "back": card["back"],
                    "explanation": "",
                    "card_data": get_card_data(progress, key)
                })

    return new_cards[:limit]


def get_stats(progress):
    """Retorna estatísticas do progresso."""
    cards = progress["cards"]
    total = len(cards)

    if total == 0:
        return {
            "total_cards_studied": 0,
            "total_reviews": progress["stats"]["total_reviews"],
            "streak_days": progress["stats"]["streak_days"],
            "mastered": 0,
            "learning": 0,
            "difficult": 0,
            "average_easiness": 0
        }

    mastered = sum(1 for c in cards.values() if c["repetitions"] >= 3 and c["easiness"] >= 2.5)
    learning = sum(1 for c in cards.values() if 0 < c["repetitions"] < 3)
    difficult = sum(1 for c in cards.values() if c["easiness"] < 2.0)
    avg_ease = sum(c["easiness"] for c in cards.values()) / total

    return {
        "total_cards_studied": total,
        "total_reviews": progress["stats"]["total_reviews"],
        "streak_days": progress["stats"]["streak_days"],
        "mastered": mastered,
        "learning": learning,
        "difficult": difficult,
        "average_easiness": round(avg_ease, 2)
    }


def run_daily_review(grammar_data, vocabulary_data):
    """Executa a revisão diária interativa no terminal."""
    progress = load_progress()
    due_cards = get_due_cards(progress, grammar_data, vocabulary_data)

    if not due_cards:
        new = get_new_cards(grammar_data, vocabulary_data, progress, limit=10)
        if new:
            print(f"\n{'='*60}")
            print("  Nenhuma revisão pendente! Que tal aprender cards novos?")
            print(f"  {len(new)} cards novos disponíveis.")
            print(f"{'='*60}")
            resp = input("\n  Estudar cards novos? (s/n): ").strip().lower()
            if resp in ("s", "sim", "y", "yes"):
                due_cards = new
            else:
                print("\n  Tudo em dia! Volte amanhã para mais revisões.")
                return
        else:
            print("\n  Parabéns! Você revisou TODOS os cards disponíveis!")
            return

    total = len(due_cards)
    print(f"\n{'='*60}")
    print(f"  REVISÃO DO DIA - {total} itens para revisar")
    print(f"{'='*60}")

    reviewed = 0
    correct = 0

    for i, item in enumerate(due_cards):
        print(f"\n  [{i+1}/{total}] {item['level']} - {item['topic']}")
        print(f"  {'─'*50}")

        if item["type"] == "flashcard":
            result = _review_flashcard(item)
        else:
            result = _review_quiz(item)

        if result is None:
            break

        quality, was_correct = result
        update_card(progress, item["key"], quality)
        reviewed += 1
        if was_correct:
            correct += 1

    # Resumo
    if reviewed > 0:
        pct = (correct / reviewed) * 100
        print(f"\n{'='*60}")
        print(f"  RESUMO DA SESSÃO")
        print(f"  {'─'*50}")
        print(f"  Revisados: {reviewed}/{total}")
        print(f"  Acertos: {correct}/{reviewed} ({pct:.0f}%)")
        stats = get_stats(progress)
        print(f"  Sequência: {stats['streak_days']} dia(s)")
        print(f"  Total de revisões: {stats['total_reviews']}")
        print(f"{'='*60}")


def _review_flashcard(item):
    """Revisa um flashcard. Retorna (quality, was_correct) ou None para sair."""
    print(f"\n  FLASHCARD:")
    print(f"  {item['front']}")

    resp = input("\n  [Enter para ver resposta, 'q' para sair]: ").strip().lower()
    if resp == 'q':
        return None

    print(f"\n  Resposta: {item['back']}")

    if item.get("explanation"):
        print(f"\n  Contexto: {item['explanation'][:100]}...")

    print("\n  Como foi?")
    print("  [1] Errei / Não lembrei")
    print("  [2] Difícil (lembrei com esforço)")
    print("  [3] Médio (lembrei bem)")
    print("  [4] Fácil (lembrei instantaneamente)")

    while True:
        choice = input("  Sua avaliação (1-4): ").strip()
        if choice in ("1", "2", "3", "4"):
            break
        print("  Por favor, escolha 1, 2, 3 ou 4.")

    quality_map = {"1": 1, "2": 3, "3": 4, "4": 5}
    quality = quality_map[choice]
    was_correct = choice != "1"

    return quality, was_correct


def _review_quiz(item):
    """Revisa uma questão de quiz. Retorna (quality, was_correct) ou None para sair."""
    q = item["question"]
    print(f"\n  QUIZ:")
    print(f"  {q['question']}")

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

        correct_answer = q["options"][q["answer"]]

    else:  # fill_blank
        resp = input("\n  Sua resposta (ou 'q' para sair): ").strip()
        if resp.lower() == 'q':
            return None

        correct_answer = q["answer"]
        # Comparação flexível
        correct = resp.lower().strip() == correct_answer.lower().strip()
        if not correct:
            # Verificar se contém as palavras-chave
            key_words = correct_answer.lower().split()
            resp_words = resp.lower().split()
            if len(key_words) > 0 and all(w in resp_words for w in key_words):
                correct = True

    if correct:
        print(f"\n  ✓ Correto!")
    else:
        print(f"\n  ✗ Incorreto!")
        print(f"  Resposta correta: {q.get('answer') if q['type'] == 'fill_blank' else q['options'][q['answer']]}")

    print(f"  Explicação: {q['explanation']}")

    if correct:
        print("\n  Nível de dificuldade:")
        print("  [1] Foi difícil")
        print("  [2] Normal")
        print("  [3] Fácil")
        while True:
            choice = input("  Avaliação (1-3): ").strip()
            if choice in ("1", "2", "3"):
                break
        quality_map = {"1": 3, "2": 4, "3": 5}
        return quality_map[choice], True
    else:
        return 1, False
