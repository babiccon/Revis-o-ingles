// ===== DATA: Will be loaded from JSON files or embedded =====
let grammarData = null;
let vocabularyData = null;

// ===== LOCALSTORAGE PROGRESS =====
const STORAGE_KEY = 'english_study_progress';

function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  return { cards: {}, stats: { total_reviews: 0, streak_days: 0, last_review_date: null } };
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function getCardKey(source, topicId, index) {
  return `${source}_${topicId}_${index}`;
}

// ===== SM-2 ALGORITHM =====
function sm2(quality, reps, ease, interval) {
  let newInterval, newReps;
  if (quality >= 3) {
    if (reps === 0) newInterval = 1;
    else if (reps === 1) newInterval = 6;
    else newInterval = Math.round(interval * ease);
    newReps = reps + 1;
  } else {
    newReps = 0;
    newInterval = 1;
  }
  let newEase = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEase < 1.3) newEase = 1.3;
  return { repetitions: newReps, easiness: Math.round(newEase * 100) / 100, interval: newInterval };
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getCardData(progress, key) {
  if (progress.cards[key]) return progress.cards[key];
  return { repetitions: 0, easiness: 2.5, interval: 0, next_review: getToday(), last_quality: null, review_count: 0 };
}

function updateCard(key, quality) {
  const progress = loadProgress();
  const card = getCardData(progress, key);
  const result = sm2(quality, card.repetitions, card.easiness, card.interval);
  const nextDate = addDays(getToday(), result.interval);

  progress.cards[key] = {
    repetitions: result.repetitions,
    easiness: result.easiness,
    interval: result.interval,
    next_review: nextDate,
    last_quality: quality,
    review_count: card.review_count + 1
  };

  progress.stats.total_reviews++;
  const today = getToday();
  if (progress.stats.last_review_date !== today) {
    if (progress.stats.last_review_date) {
      const last = new Date(progress.stats.last_review_date);
      const now = new Date(today);
      const diff = Math.round((now - last) / (1000 * 60 * 60 * 24));
      if (diff === 1) progress.stats.streak_days++;
      else if (diff > 1) progress.stats.streak_days = 1;
    } else {
      progress.stats.streak_days = 1;
    }
    progress.stats.last_review_date = today;
  }

  saveProgress(progress);
  updateStatsBar();
}

// ===== STATS =====
function getStats() {
  const progress = loadProgress();
  const cards = Object.values(progress.cards);
  const total = cards.length;
  if (total === 0) return { studied: 0, reviews: 0, streak: 0, mastered: 0, learning: 0, difficult: 0, avgEase: 0 };

  return {
    studied: total,
    reviews: progress.stats.total_reviews,
    streak: progress.stats.streak_days,
    mastered: cards.filter(c => c.repetitions >= 3 && c.easiness >= 2.5).length,
    learning: cards.filter(c => c.repetitions > 0 && c.repetitions < 3).length,
    difficult: cards.filter(c => c.easiness < 2.0).length,
    avgEase: Math.round((cards.reduce((s, c) => s + c.easiness, 0) / total) * 100) / 100
  };
}

function getDueCards() {
  const progress = loadProgress();
  const today = getToday();
  const due = [];

  if (!grammarData || !vocabularyData) return due;

  grammarData.topics.forEach(topic => {
    topic.flashcards.forEach((card, i) => {
      const key = getCardKey('grammar', topic.id, i);
      const data = getCardData(progress, key);
      if (data.next_review <= today) {
        due.push({ key, type: 'flashcard', source: 'grammar', topic: topic.topic, level: topic.level, front: card.front, back: card.back, explanation: topic.explanation, cardData: data });
      }
    });
    topic.quiz_questions.forEach((q, i) => {
      const key = getCardKey('grammar_quiz', topic.id, i);
      const data = getCardData(progress, key);
      if (data.next_review <= today) {
        due.push({ key, type: 'quiz', source: 'grammar', topic: topic.topic, level: topic.level, question: q, cardData: data });
      }
    });
  });

  vocabularyData.categories.forEach(cat => {
    cat.flashcards.forEach((card, i) => {
      const key = getCardKey('vocab', cat.id, i);
      const data = getCardData(progress, key);
      if (data.next_review <= today) {
        due.push({ key, type: 'flashcard', source: 'vocabulary', topic: cat.category, level: cat.level, front: card.front, back: card.back, explanation: '', cardData: data });
      }
    });
    cat.quiz_questions.forEach((q, i) => {
      const key = getCardKey('vocab_quiz', cat.id, i);
      const data = getCardData(progress, key);
      if (data.next_review <= today) {
        due.push({ key, type: 'quiz', source: 'vocabulary', topic: cat.category, level: cat.level, question: q, cardData: data });
      }
    });
  });

  due.sort((a, b) => {
    if (a.cardData.next_review !== b.cardData.next_review) return a.cardData.next_review < b.cardData.next_review ? -1 : 1;
    return a.cardData.easiness - b.cardData.easiness;
  });

  return due;
}

function updateStatsBar() {
  const stats = getStats();
  const due = getDueCards();
  document.getElementById('statStudied').textContent = stats.studied;
  document.getElementById('statMastered').textContent = stats.mastered;
  document.getElementById('statStreak').textContent = stats.streak;
  document.getElementById('statDueToday').textContent = due.length;
  document.getElementById('reviewCount').textContent = due.length;
}

// ===== TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');

    if (btn.dataset.tab === 'progress') renderProgress();
    if (btn.dataset.tab === 'review') updateStatsBar();
  });
});

// ===== LOAD DATA =====
async function loadData() {
  try {
    const [gRes, vRes] = await Promise.all([
      fetch('english/content/grammar.json'),
      fetch('english/content/vocabulary.json')
    ]);
    if (!gRes.ok || !vRes.ok) throw new Error('HTTP error');
    grammarData = await gRes.json();
    vocabularyData = await vRes.json();
  } catch (e) {
    // If fetch fails (file:// protocol), try loading from embedded data
    console.warn('Could not fetch JSON files, check if running from a server:', e.message);
    // Show user-friendly message
    document.querySelector('.container').innerHTML = `
      <div class="empty-state" style="padding:3rem;">
        <h3>Erro ao carregar dados</h3>
        <p style="margin-top:0.5rem;">Para a versão web, use o launcher: <code>python start.py web</code></p>
        <p style="margin-top:0.5rem;">Isso inicia um servidor local que permite carregar os arquivos JSON.</p>
      </div>`;
    return;
  }

  initApp();
}

function initApp() {
  populateTopicSelects();
  renderTopicLists();
  renderContentList();
  updateStatsBar();
}

// ===== POPULATE SELECTS =====
function getTopics(source, level) {
  let topics = [];
  if (source === 'grammar' || source === 'all') {
    grammarData.topics.forEach(t => {
      if (!level || t.level === level) {
        topics.push({ id: t.id, name: t.topic, level: t.level, source: 'grammar', cardCount: t.flashcards.length, quizCount: t.quiz_questions.length });
      }
    });
  }
  if (source === 'vocabulary' || source === 'all') {
    vocabularyData.categories.forEach(c => {
      if (!level || c.level === level) {
        topics.push({ id: c.id, name: c.category, level: c.level, source: 'vocabulary', cardCount: c.flashcards.length, quizCount: c.quiz_questions.length });
      }
    });
  }
  return topics;
}

function populateTopicSelect(selectId, sourceId, levelId) {
  const source = document.getElementById(sourceId).value;
  const level = document.getElementById(levelId).value;
  const select = document.getElementById(selectId);
  const topics = getTopics(source, level);

  select.innerHTML = '<option value="">Todos os Tópicos</option>';
  topics.forEach(t => {
    const opt = document.createElement('option');
    opt.value = `${t.source}_${t.id}`;
    opt.textContent = `[${t.level}] ${t.name}`;
    select.appendChild(opt);
  });
}

function populateTopicSelects() {
  populateTopicSelect('fcTopic', 'fcSource', 'fcLevel');
  populateTopicSelect('qzTopic', 'qzSource', 'qzLevel');
}

document.getElementById('fcSource').addEventListener('change', () => populateTopicSelect('fcTopic', 'fcSource', 'fcLevel'));
document.getElementById('fcLevel').addEventListener('change', () => populateTopicSelect('fcTopic', 'fcSource', 'fcLevel'));
document.getElementById('qzSource').addEventListener('change', () => populateTopicSelect('qzTopic', 'qzSource', 'qzLevel'));
document.getElementById('qzLevel').addEventListener('change', () => populateTopicSelect('qzTopic', 'qzSource', 'qzLevel'));

// ===== TOPIC LISTS =====
function renderTopicLists() {
  renderTopicList('fcTopicList', 'flashcard');
  renderTopicList('qzTopicList', 'quiz');
}

function renderTopicList(containerId, mode) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const allTopics = getTopics('all', '');
  allTopics.forEach(t => {
    const div = document.createElement('div');
    div.className = 'topic-item';
    div.innerHTML = `
      <span class="topic-name">${t.name}</span>
      <span class="topic-meta">
        <span class="level-badge ${t.level.toLowerCase()}">${t.level}</span>
        <span>${mode === 'flashcard' ? t.cardCount + ' cards' : t.quizCount + ' perguntas'}</span>
      </span>`;
    div.addEventListener('click', () => {
      if (mode === 'flashcard') {
        document.getElementById('fcSource').value = t.source;
        populateTopicSelect('fcTopic', 'fcSource', 'fcLevel');
        document.getElementById('fcTopic').value = `${t.source}_${t.id}`;
        startFlashcards();
      } else {
        document.getElementById('qzSource').value = t.source;
        populateTopicSelect('qzTopic', 'qzSource', 'qzLevel');
        document.getElementById('qzTopic').value = `${t.source}_${t.id}`;
        startQuiz();
      }
    });
    container.appendChild(div);
  });
}

// ===== FLASHCARDS =====
let fcCards = [];
let fcIndex = 0;

document.getElementById('fcStart').addEventListener('click', startFlashcards);
document.getElementById('fcShuffle').addEventListener('click', () => {
  if (fcCards.length > 0) {
    shuffleArray(fcCards);
    fcIndex = 0;
    showFlashcard();
  }
});

document.getElementById('flashcard').addEventListener('click', () => {
  document.getElementById('flashcard').classList.toggle('flipped');
  if (document.getElementById('flashcard').classList.contains('flipped')) {
    document.getElementById('fcRating').style.display = 'flex';
  }
});

document.getElementById('fcPrev').addEventListener('click', () => {
  if (fcIndex > 0) { fcIndex--; showFlashcard(); }
});

document.getElementById('fcNext').addEventListener('click', () => {
  if (fcIndex < fcCards.length - 1) { fcIndex++; showFlashcard(); }
});

function startFlashcards() {
  const source = document.getElementById('fcSource').value;
  const level = document.getElementById('fcLevel').value;
  const topicVal = document.getElementById('fcTopic').value;

  fcCards = [];

  if (topicVal) {
    const [src, id] = topicVal.split('_');
    const topicId = parseInt(id);
    if (src === 'grammar') {
      const topic = grammarData.topics.find(t => t.id === topicId);
      if (topic) {
        showExplanation(topic);
        topic.flashcards.forEach((c, i) => fcCards.push({ ...c, topic: topic.topic, level: topic.level, source: 'grammar', topicId: topic.id, index: i }));
      }
    } else {
      const cat = vocabularyData.categories.find(c => c.id === topicId);
      if (cat) {
        document.getElementById('fcExplanation').style.display = 'none';
        cat.flashcards.forEach((c, i) => fcCards.push({ ...c, topic: cat.category, level: cat.level, source: 'vocab', topicId: cat.id, index: i }));
      }
    }
  } else {
    document.getElementById('fcExplanation').style.display = 'none';
    if (source === 'grammar' || source === 'all') {
      grammarData.topics.forEach(topic => {
        if (!level || topic.level === level) {
          topic.flashcards.forEach((c, i) => fcCards.push({ ...c, topic: topic.topic, level: topic.level, source: 'grammar', topicId: topic.id, index: i }));
        }
      });
    }
    if (source === 'vocabulary' || source === 'all') {
      vocabularyData.categories.forEach(cat => {
        if (!level || cat.level === level) {
          cat.flashcards.forEach((c, i) => fcCards.push({ ...c, topic: cat.category, level: cat.level, source: 'vocab', topicId: cat.id, index: i }));
        }
      });
    }
  }

  if (fcCards.length === 0) {
    alert('Nenhum flashcard encontrado para esta seleção.');
    return;
  }

  fcIndex = 0;
  document.getElementById('fcArea').style.display = 'block';
  document.getElementById('fcTopicList').style.display = 'none';
  showFlashcard();
}

function showExplanation(topic) {
  const box = document.getElementById('fcExplanation');
  let html = `<h3>${topic.level} - ${topic.topic}</h3><p>${topic.explanation}</p>`;
  if (topic.rules && topic.rules.length) {
    html += '<ul>' + topic.rules.map(r => `<li>${r}</li>`).join('') + '</ul>';
  }
  box.innerHTML = html;
  box.style.display = 'block';
}

function showFlashcard() {
  const card = fcCards[fcIndex];
  document.getElementById('flashcard').classList.remove('flipped');
  document.getElementById('fcRating').style.display = 'none';
  document.getElementById('fcFront').textContent = card.front;
  document.getElementById('fcBack').textContent = card.back;
  document.getElementById('fcMeta').textContent = `${card.level} - ${card.topic}`;
  document.getElementById('fcCounter').textContent = `${fcIndex + 1}/${fcCards.length}`;
}

function rateFlashcard(quality) {
  const card = fcCards[fcIndex];
  const key = getCardKey(card.source, card.topicId, card.index);
  updateCard(key, quality);

  if (fcIndex < fcCards.length - 1) {
    fcIndex++;
    showFlashcard();
  } else {
    document.getElementById('fcArea').style.display = 'none';
    document.getElementById('fcTopicList').style.display = 'flex';
    document.getElementById('fcExplanation').style.display = 'none';
    alert('Parabéns! Você terminou todos os flashcards desta sessão!');
  }
}

// ===== QUIZ =====
let qzQuestions = [];
let qzIndex = 0;
let qzScore = 0;
let qzAnswered = false;

document.getElementById('qzStart').addEventListener('click', startQuiz);
document.getElementById('qzProgressive').addEventListener('click', startProgressiveQuiz);
document.getElementById('qzNext').addEventListener('click', nextQuestion);

function startQuiz() {
  const source = document.getElementById('qzSource').value;
  const level = document.getElementById('qzLevel').value;
  const topicVal = document.getElementById('qzTopic').value;

  qzQuestions = [];

  if (topicVal) {
    const [src, id] = topicVal.split('_');
    const topicId = parseInt(id);
    if (src === 'grammar') {
      const topic = grammarData.topics.find(t => t.id === topicId);
      if (topic) topic.quiz_questions.forEach((q, i) => qzQuestions.push({ question: q, topic: topic.topic, level: topic.level, source: 'grammar_quiz', topicId: topic.id, index: i }));
    } else {
      const cat = vocabularyData.categories.find(c => c.id === topicId);
      if (cat) cat.quiz_questions.forEach((q, i) => qzQuestions.push({ question: q, topic: cat.category, level: cat.level, source: 'vocab_quiz', topicId: cat.id, index: i }));
    }
  } else {
    if (source === 'grammar' || source === 'all') {
      grammarData.topics.forEach(topic => {
        if (!level || topic.level === level) {
          topic.quiz_questions.forEach((q, i) => qzQuestions.push({ question: q, topic: topic.topic, level: topic.level, source: 'grammar_quiz', topicId: topic.id, index: i }));
        }
      });
    }
    if (source === 'vocabulary' || source === 'all') {
      vocabularyData.categories.forEach(cat => {
        if (!level || cat.level === level) {
          cat.quiz_questions.forEach((q, i) => qzQuestions.push({ question: q, topic: cat.category, level: cat.level, source: 'vocab_quiz', topicId: cat.id, index: i }));
        }
      });
    }
    shuffleArray(qzQuestions);
    qzQuestions = qzQuestions.slice(0, 20);
  }

  if (qzQuestions.length === 0) {
    alert('Nenhuma pergunta encontrada para esta seleção.');
    return;
  }

  qzIndex = 0;
  qzScore = 0;
  document.getElementById('qzArea').style.display = 'block';
  document.getElementById('qzScore').style.display = 'none';
  document.getElementById('qzTopicList').style.display = 'none';
  showQuestion();
}

function startProgressiveQuiz() {
  qzQuestions = [];
  const levels = ['A2', 'B1', 'B2'];

  levels.forEach(level => {
    const levelQs = [];
    grammarData.topics.forEach(topic => {
      if (topic.level === level) {
        topic.quiz_questions.forEach((q, i) => levelQs.push({ question: q, topic: topic.topic, level: topic.level, source: 'grammar_quiz', topicId: topic.id, index: i }));
      }
    });
    vocabularyData.categories.forEach(cat => {
      if (cat.level === level) {
        cat.quiz_questions.forEach((q, i) => levelQs.push({ question: q, topic: cat.category, level: cat.level, source: 'vocab_quiz', topicId: cat.id, index: i }));
      }
    });
    shuffleArray(levelQs);
    qzQuestions.push(...levelQs.slice(0, 7));
  });

  if (qzQuestions.length === 0) return;

  qzIndex = 0;
  qzScore = 0;
  document.getElementById('qzArea').style.display = 'block';
  document.getElementById('qzScore').style.display = 'none';
  document.getElementById('qzTopicList').style.display = 'none';
  showQuestion();
}

function showQuestion() {
  const item = qzQuestions[qzIndex];
  const q = item.question;
  qzAnswered = false;

  document.getElementById('qzLabel').textContent = `${item.level} - ${item.topic}`;
  document.getElementById('qzQuestion').textContent = q.question;
  document.getElementById('qzCounter').textContent = `Pergunta ${qzIndex + 1} de ${qzQuestions.length} | Acertos: ${qzScore}`;
  document.getElementById('qzFeedback').className = 'feedback';
  document.getElementById('qzFeedback').style.display = 'none';
  document.getElementById('qzNext').style.display = 'none';

  const optionsDiv = document.getElementById('qzOptions');
  optionsDiv.innerHTML = '';

  if (q.type === 'multiple_choice') {
    q.options.forEach((opt, j) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = `${j + 1}. ${opt}`;
      btn.addEventListener('click', () => answerQuestion(j));
      optionsDiv.appendChild(btn);
    });
  } else {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'fill-blank-input';
    input.placeholder = 'Digite sua resposta...';
    input.id = 'fillBlankInput';
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !qzAnswered) answerFillBlank();
    });
    optionsDiv.appendChild(input);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Verificar';
    submitBtn.style.marginTop = '0.75rem';
    submitBtn.addEventListener('click', answerFillBlank);
    optionsDiv.appendChild(submitBtn);

    setTimeout(() => input.focus(), 100);
  }
}

function answerQuestion(selectedIndex) {
  if (qzAnswered) return;
  qzAnswered = true;

  const item = qzQuestions[qzIndex];
  const q = item.question;
  const correct = selectedIndex === q.answer;

  const options = document.querySelectorAll('.quiz-option');
  options.forEach((opt, j) => {
    opt.classList.add('disabled');
    if (j === q.answer) opt.classList.add('correct');
    if (j === selectedIndex && !correct) opt.classList.add('incorrect');
  });

  showFeedback(correct, q.explanation, q.options[q.answer]);

  const key = getCardKey(item.source, item.topicId, item.index);
  updateCard(key, correct ? 4 : 1);
  if (correct) qzScore++;

  document.getElementById('qzCounter').textContent = `Pergunta ${qzIndex + 1} de ${qzQuestions.length} | Acertos: ${qzScore}`;
}

function answerFillBlank() {
  if (qzAnswered) return;
  qzAnswered = true;

  const item = qzQuestions[qzIndex];
  const q = item.question;
  const input = document.getElementById('fillBlankInput');
  const userAnswer = input.value.trim();

  const correctAnswer = q.answer;
  let correct = userAnswer.toLowerCase().replace(/\.$/, '') === correctAnswer.toLowerCase().replace(/\.$/, '');

  if (!correct) {
    const parts = correctAnswer.toLowerCase().split(' ... ');
    if (parts.length > 1) {
      const allWords = parts.join(' ').split(/\s+/);
      const userWords = userAnswer.toLowerCase().split(/\s+/);
      correct = allWords.every(w => userWords.includes(w));
    } else {
      const keyWords = correctAnswer.toLowerCase().split(/\s+/);
      const userWords = userAnswer.toLowerCase().split(/\s+/);
      if (keyWords.length <= userWords.length) {
        correct = keyWords.every(w => userWords.includes(w));
      }
    }
  }

  input.classList.add(correct ? 'correct' : 'incorrect');
  input.disabled = true;

  showFeedback(correct, q.explanation, correctAnswer);

  const key = getCardKey(item.source, item.topicId, item.index);
  updateCard(key, correct ? 4 : 1);
  if (correct) qzScore++;

  document.getElementById('qzCounter').textContent = `Pergunta ${qzIndex + 1} de ${qzQuestions.length} | Acertos: ${qzScore}`;
}

function showFeedback(correct, explanation, correctAnswer) {
  const fb = document.getElementById('qzFeedback');
  fb.className = `feedback show ${correct ? 'correct' : 'incorrect'}`;
  fb.innerHTML = correct
    ? `<div class="correct-answer">Correto!</div><div>${explanation}</div>`
    : `<div class="correct-answer">Resposta correta: ${correctAnswer}</div><div>${explanation}</div>`;
  fb.style.display = 'block';
  document.getElementById('qzNext').style.display = 'inline-flex';
}

function nextQuestion() {
  qzIndex++;
  if (qzIndex < qzQuestions.length) {
    showQuestion();
  } else {
    showQuizScore();
  }
}

function showQuizScore() {
  document.getElementById('qzArea').style.display = 'none';
  const pct = Math.round((qzScore / qzQuestions.length) * 100);
  let message;
  if (pct >= 90) message = 'Excelente! Domine este nível!';
  else if (pct >= 70) message = 'Muito bom! Continue praticando!';
  else if (pct >= 50) message = 'Bom progresso! Revise os erros.';
  else message = 'Revise o conteúdo e tente novamente!';

  const scoreDiv = document.getElementById('qzScore');
  scoreDiv.innerHTML = `
    <div class="score-number">${pct}%</div>
    <div class="score-label">${qzScore} de ${qzQuestions.length} corretas</div>
    <div class="score-message">${message}</div>
    <button class="btn btn-primary" onclick="document.getElementById('qzScore').style.display='none'; document.getElementById('qzTopicList').style.display='flex';">Voltar</button>
  `;
  scoreDiv.style.display = 'block';
}

// ===== SPACED REPETITION REVIEW =====
let reviewCards = [];
let reviewIndex = 0;
let reviewCorrect = 0;

document.getElementById('reviewStart').addEventListener('click', startReview);
document.getElementById('reviewNewCards').addEventListener('click', startNewCards);

function startReview() {
  reviewCards = getDueCards();
  if (reviewCards.length === 0) {
    alert('Nenhum card para revisar hoje! Use "Aprender Cards Novos" para adicionar.');
    return;
  }
  reviewIndex = 0;
  reviewCorrect = 0;
  document.getElementById('reviewSummary').style.display = 'none';
  document.getElementById('reviewArea').style.display = 'block';
  document.getElementById('reviewScore').style.display = 'none';
  showReviewItem();
}

function startNewCards() {
  const progress = loadProgress();
  const newCards = [];

  grammarData.topics.forEach(topic => {
    topic.flashcards.forEach((card, i) => {
      const key = getCardKey('grammar', topic.id, i);
      if (!progress.cards[key]) {
        newCards.push({ key, type: 'flashcard', source: 'grammar', topic: topic.topic, level: topic.level, front: card.front, back: card.back, explanation: topic.explanation, cardData: getCardData(progress, key) });
      }
    });
  });

  vocabularyData.categories.forEach(cat => {
    cat.flashcards.forEach((card, i) => {
      const key = getCardKey('vocab', cat.id, i);
      if (!progress.cards[key]) {
        newCards.push({ key, type: 'flashcard', source: 'vocabulary', topic: cat.category, level: cat.level, front: card.front, back: card.back, explanation: '', cardData: getCardData(progress, key) });
      }
    });
  });

  if (newCards.length === 0) {
    alert('Todos os cards já foram estudados!');
    return;
  }

  reviewCards = newCards.slice(0, 15);
  reviewIndex = 0;
  reviewCorrect = 0;
  document.getElementById('reviewSummary').style.display = 'none';
  document.getElementById('reviewArea').style.display = 'block';
  document.getElementById('reviewScore').style.display = 'none';
  showReviewItem();
}

function showReviewItem() {
  const item = reviewCards[reviewIndex];
  const area = document.getElementById('reviewArea');

  if (item.type === 'flashcard') {
    area.innerHTML = `
      <div class="quiz-card">
        <div class="question-label">${item.level} - ${item.topic} (${reviewIndex + 1}/${reviewCards.length})</div>
        <div class="question-text" style="font-size:1.3rem; text-align:center; padding:1rem 0;">${item.front}</div>
        <div id="revAnswer" style="display:none; text-align:center; padding:1rem; background:var(--primary-light); border-radius:8px; margin:1rem 0;">
          <strong style="font-size:1.2rem;">${item.back}</strong>
          ${item.explanation ? `<p style="font-size:0.85rem; color:var(--gray-600); margin-top:0.5rem;">${item.explanation.substring(0, 150)}...</p>` : ''}
        </div>
        <div style="text-align:center;">
          <button class="btn btn-primary" id="revShowBtn" onclick="document.getElementById('revAnswer').style.display='block'; this.style.display='none'; document.getElementById('revRatingDiv').style.display='flex';">Ver Resposta</button>
        </div>
        <div class="rating-buttons" id="revRatingDiv" style="display:none;">
          <button class="rating-btn wrong" onclick="rateReviewItem(1)">Errei</button>
          <button class="rating-btn hard" onclick="rateReviewItem(3)">Difícil</button>
          <button class="rating-btn medium" onclick="rateReviewItem(4)">Médio</button>
          <button class="rating-btn easy" onclick="rateReviewItem(5)">Fácil</button>
        </div>
      </div>`;
  } else {
    const q = item.question;
    let optionsHtml;
    if (q.type === 'multiple_choice') {
      optionsHtml = q.options.map((opt, j) =>
        `<button class="quiz-option" onclick="answerReviewQuiz(${j})">${j + 1}. ${opt}</button>`
      ).join('');
    } else {
      optionsHtml = `
        <input type="text" class="fill-blank-input" id="revFillInput" placeholder="Digite sua resposta..." onkeydown="if(event.key==='Enter')answerReviewFill()">
        <button class="btn btn-primary" style="margin-top:0.75rem;" onclick="answerReviewFill()">Verificar</button>`;
    }

    area.innerHTML = `
      <div class="quiz-card">
        <div class="question-label">${item.level} - ${item.topic} (${reviewIndex + 1}/${reviewCards.length})</div>
        <div class="question-text">${q.question}</div>
        <div class="quiz-options" id="revOptions">${optionsHtml}</div>
        <div class="feedback" id="revFeedback"></div>
        <div style="text-align:center; margin-top:1rem;">
          <button class="btn btn-primary" id="revNextBtn" style="display:none;" onclick="nextReviewItem()">Próximo</button>
        </div>
      </div>`;

    if (q.type === 'fill_blank') {
      setTimeout(() => {
        const inp = document.getElementById('revFillInput');
        if (inp) inp.focus();
      }, 100);
    }
  }
}

function rateReviewItem(quality) {
  const item = reviewCards[reviewIndex];
  updateCard(item.key, quality);
  if (quality >= 3) reviewCorrect++;
  nextReviewItem();
}

window.answerReviewQuiz = function(selectedIndex) {
  const item = reviewCards[reviewIndex];
  const q = item.question;
  const correct = selectedIndex === q.answer;

  const options = document.querySelectorAll('#revOptions .quiz-option');
  options.forEach((opt, j) => {
    opt.style.pointerEvents = 'none';
    if (j === q.answer) opt.classList.add('correct');
    if (j === selectedIndex && !correct) opt.classList.add('incorrect');
  });

  const fb = document.getElementById('revFeedback');
  fb.className = `feedback show ${correct ? 'correct' : 'incorrect'}`;
  fb.innerHTML = correct
    ? `<div class="correct-answer">Correto!</div><div>${q.explanation}</div>`
    : `<div class="correct-answer">Resposta correta: ${q.options[q.answer]}</div><div>${q.explanation}</div>`;
  fb.style.display = 'block';

  updateCard(item.key, correct ? 4 : 1);
  if (correct) reviewCorrect++;
  document.getElementById('revNextBtn').style.display = 'inline-flex';
};

window.answerReviewFill = function() {
  const item = reviewCards[reviewIndex];
  const q = item.question;
  const input = document.getElementById('revFillInput');
  if (!input) return;
  const userAnswer = input.value.trim();

  let correct = userAnswer.toLowerCase().replace(/\.$/, '') === q.answer.toLowerCase().replace(/\.$/, '');
  if (!correct) {
    const keyWords = q.answer.toLowerCase().replace(/\.\.\./g, '').split(/\s+/).filter(Boolean);
    const userWords = userAnswer.toLowerCase().split(/\s+/);
    if (keyWords.length > 0) correct = keyWords.every(w => userWords.includes(w));
  }

  input.classList.add(correct ? 'correct' : 'incorrect');
  input.disabled = true;

  const fb = document.getElementById('revFeedback');
  fb.className = `feedback show ${correct ? 'correct' : 'incorrect'}`;
  fb.innerHTML = correct
    ? `<div class="correct-answer">Correto!</div><div>${q.explanation}</div>`
    : `<div class="correct-answer">Resposta correta: ${q.answer}</div><div>${q.explanation}</div>`;
  fb.style.display = 'block';

  updateCard(item.key, correct ? 4 : 1);
  if (correct) reviewCorrect++;
  document.getElementById('revNextBtn').style.display = 'inline-flex';
};

function nextReviewItem() {
  reviewIndex++;
  if (reviewIndex < reviewCards.length) {
    showReviewItem();
  } else {
    showReviewScore();
  }
}

function showReviewScore() {
  document.getElementById('reviewArea').style.display = 'none';
  const total = reviewCards.length;
  const pct = Math.round((reviewCorrect / total) * 100);

  const scoreDiv = document.getElementById('reviewScore');
  scoreDiv.innerHTML = `
    <div class="score-number">${pct}%</div>
    <div class="score-label">${reviewCorrect} de ${total} corretos</div>
    <div class="score-message">${pct >= 70 ? 'Ótimo trabalho!' : 'Continue praticando!'}</div>
    <button class="btn btn-primary" onclick="document.getElementById('reviewScore').style.display='none'; document.getElementById('reviewSummary').style.display='block'; updateStatsBar();">Voltar</button>
  `;
  scoreDiv.style.display = 'block';
  updateStatsBar();
}

// ===== PROGRESS =====
function renderProgress() {
  const stats = getStats();
  const progress = loadProgress();

  const grid = document.getElementById('progressGrid');
  grid.innerHTML = `
    <div class="progress-card"><div class="number">${stats.studied}</div><div class="label">Cards Estudados</div></div>
    <div class="progress-card"><div class="number">${stats.reviews}</div><div class="label">Total de Revisões</div></div>
    <div class="progress-card"><div class="number">${stats.streak}</div><div class="label">Dias em Sequência</div></div>
    <div class="progress-card"><div class="number">${stats.mastered}</div><div class="label">Dominados</div></div>
    <div class="progress-card"><div class="number">${stats.learning}</div><div class="label">Aprendendo</div></div>
    <div class="progress-card"><div class="number">${stats.difficult}</div><div class="label">Difíceis</div></div>
  `;

  const levelDiv = document.getElementById('levelProgress');
  levelDiv.innerHTML = '';

  ['A2', 'B1', 'B2'].forEach(level => {
    let total = 0, studied = 0;

    grammarData.topics.forEach(topic => {
      if (topic.level === level) {
        topic.flashcards.forEach((_, i) => { total++; if (progress.cards[getCardKey('grammar', topic.id, i)]) studied++; });
        topic.quiz_questions.forEach((_, i) => { total++; if (progress.cards[getCardKey('grammar_quiz', topic.id, i)]) studied++; });
      }
    });
    vocabularyData.categories.forEach(cat => {
      if (cat.level === level) {
        cat.flashcards.forEach((_, i) => { total++; if (progress.cards[getCardKey('vocab', cat.id, i)]) studied++; });
        cat.quiz_questions.forEach((_, i) => { total++; if (progress.cards[getCardKey('vocab_quiz', cat.id, i)]) studied++; });
      }
    });

    const pct = total > 0 ? Math.round((studied / total) * 100) : 0;
    levelDiv.innerHTML += `
      <div style="margin-bottom:1rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
          <span><span class="level-badge ${level.toLowerCase()}">${level}</span></span>
          <span style="font-size:0.85rem; color:var(--gray-500);">${studied}/${total} (${pct}%)</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  });
}

document.getElementById('resetProgress').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja resetar todo o progresso? Esta ação não pode ser desfeita.')) {
    localStorage.removeItem(STORAGE_KEY);
    updateStatsBar();
    renderProgress();
    alert('Progresso resetado!');
  }
});

// ===== UTILS =====
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== CONTENT TAB =====
document.getElementById('ctLevel').addEventListener('change', renderContentList);

function renderContentList() {
  const level = document.getElementById('ctLevel').value;
  const container = document.getElementById('ctTopicList');
  const detail = document.getElementById('ctDetail');
  detail.style.display = 'none';
  container.style.display = 'block';
  container.innerHTML = '';

  const levels = level ? [level] : ['A2', 'B1', 'B2'];
  const levelNames = { 'A2': 'A2 — Básico', 'B1': 'B1 — Intermediário', 'B2': 'B2 — Intermediário-Avançado' };

  levels.forEach(lv => {
    const topics = grammarData.topics.filter(t => t.level === lv);
    if (topics.length === 0) return;

    const section = document.createElement('div');
    section.className = 'level-section';
    section.innerHTML = `<h2>${levelNames[lv]}</h2>`;

    const list = document.createElement('div');
    list.className = 'topic-list';

    topics.forEach(topic => {
      const item = document.createElement('div');
      item.className = 'topic-item';
      item.innerHTML = `
        <span class="topic-name">${topic.topic}</span>
        <span class="topic-meta">
          <span class="level-badge ${lv.toLowerCase()}">${lv}</span>
          <span>${topic.flashcards.length} cards &middot; ${topic.quiz_questions.length} quiz</span>
        </span>`;
      item.addEventListener('click', () => showContentDetail(topic));
      list.appendChild(item);
    });

    section.appendChild(list);
    container.appendChild(section);
  });
}

function showContentDetail(topic) {
  const container = document.getElementById('ctTopicList');
  const detail = document.getElementById('ctDetail');
  container.style.display = 'none';
  detail.style.display = 'block';

  let html = `
    <div class="content-detail">
      <div class="detail-header">
        <button class="back-btn" onclick="backToContentList()">&#8592; Voltar</button>
        <span class="level-badge ${topic.level.toLowerCase()}">${topic.level}</span>
        <h2>${topic.topic}</h2>
      </div>

      <div class="content-section">
        <h3>Explicação</h3>
        <p>${topic.explanation}</p>
      </div>`;

  if (topic.rules && topic.rules.length) {
    html += `
      <div class="content-section">
        <h3>Regras</h3>
        <ul class="rules-list">
          ${topic.rules.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>`;
  }

  if (topic.examples && topic.examples.length) {
    html += `
      <div class="content-section">
        <h3>Exemplos</h3>
        ${topic.examples.map(ex => `
          <div class="example-card">
            <span class="en">${ex.en}</span>
            <span class="pt">${ex.pt}</span>
          </div>`).join('')}
      </div>`;
  }

  if (topic.common_mistakes && topic.common_mistakes.length) {
    html += `
      <div class="content-section">
        <h3>Erros Comuns de Brasileiros</h3>
        ${topic.common_mistakes.map(m => `
          <div class="mistake-card">
            <div class="wrong">&#10007; ${m.wrong}</div>
            <div class="correct">&#10003; ${m.correct}</div>
            <div class="mistake-explanation">${m.explanation}</div>
          </div>`).join('')}
      </div>`;
  }

  html += `
      <div class="detail-actions">
        <button class="btn btn-primary" onclick="goStudyFlashcards('${topic.id}')">Estudar Flashcards</button>
        <button class="btn btn-outline" onclick="goStudyQuiz('${topic.id}')">Fazer Quiz</button>
      </div>
    </div>`;

  detail.innerHTML = html;
}

function backToContentList() {
  document.getElementById('ctTopicList').style.display = 'block';
  document.getElementById('ctDetail').style.display = 'none';
}

function goStudyFlashcards(topicId) {
  // Switch to flashcards tab and start
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="flashcards"]').classList.add('active');
  document.getElementById('tab-flashcards').classList.add('active');

  document.getElementById('fcSource').value = 'grammar';
  populateTopicSelect('fcTopic', 'fcSource', 'fcLevel');
  document.getElementById('fcTopic').value = `grammar_${topicId}`;
  startFlashcards();
}

function goStudyQuiz(topicId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="quiz"]').classList.add('active');
  document.getElementById('tab-quiz').classList.add('active');

  document.getElementById('qzSource').value = 'grammar';
  populateTopicSelect('qzTopic', 'qzSource', 'qzLevel');
  document.getElementById('qzTopic').value = `grammar_${topicId}`;
  startQuiz();
}

// ===== INIT =====
loadData();
