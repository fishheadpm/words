'use strict';

const DATA_URL = './data.json';

const MODE_INPUT = 'input';
const MODE_SELFCHECK = 'selfcheck';

const seriesScreen = document.getElementById('seriesScreen');
const titleScreen = document.getElementById('titleScreen');
const quizScreen = document.getElementById('quizScreen');
const completeScreen = document.getElementById('completeScreen');
const historyScreen = document.getElementById('historyScreen');

const seriesButtonGroup = document.getElementById('seriesButtonGroup');
const titleRoundName = document.getElementById('titleRoundName');
const historyTitle = document.getElementById('historyTitle');

const startInputModeButton = document.getElementById('startInputModeButton');
const continueInputModeButton = document.getElementById('continueInputModeButton');
const startSelfCheckModeButton = document.getElementById('startSelfCheckModeButton');
const continueSelfCheckModeButton = document.getElementById('continueSelfCheckModeButton');
const historyButton = document.getElementById('historyButton');
const resetRoundButton = document.getElementById('resetRoundButton');
const backToSeriesButton = document.getElementById('backToSeriesButton');

const progressLabel = document.getElementById('progressLabel');
const roundLabel = document.getElementById('roundLabel');
const modeLabel = document.getElementById('modeLabel');
const questionText = document.getElementById('questionText');

const inputArea = document.getElementById('inputArea');
const answerInput = document.getElementById('answerInput');
const yourAnswerBlock = document.getElementById('yourAnswerBlock');
const yourAnswer = document.getElementById('yourAnswer');

const beforeRevealArea = document.getElementById('beforeRevealArea');
const answerArea = document.getElementById('answerArea');
const answerTerm = document.getElementById('answerTerm');

const showAnswerButton = document.getElementById('showAnswerButton');
const correctButton = document.getElementById('correctButton');
const wrongButton = document.getElementById('wrongButton');

const backToTitleFromQuizButton = document.getElementById('backToTitleFromQuizButton');
const backToTitleAfterRevealButton = document.getElementById('backToTitleAfterRevealButton');
const backToTitleFromCompleteButton = document.getElementById('backToTitleFromCompleteButton');
const backToTitleFromHistoryButton = document.getElementById('backToTitleFromHistoryButton');

const historyList = document.getElementById('historyList');

let allRounds = [];
let selectedRound = null;
let currentProgress = null;
let currentMode = MODE_INPUT;

function getProgressStorageKey(roundId, mode) {
  return `english_word_progress_${roundId}_${mode}`;
}

function getHistoryStorageKey(roundId) {
  return `english_word_history_${roundId}`;
}

function hideAllScreens() {
  seriesScreen.classList.add('hidden');
  titleScreen.classList.add('hidden');
  quizScreen.classList.add('hidden');
  completeScreen.classList.add('hidden');
  historyScreen.classList.add('hidden');
}

function showSeriesScreen() {
  hideAllScreens();
  seriesScreen.classList.remove('hidden');
}

function showTitleScreen() {
  hideAllScreens();
  titleScreen.classList.remove('hidden');
}

function showQuizScreen() {
  hideAllScreens();
  quizScreen.classList.remove('hidden');
}

function showCompleteScreen() {
  hideAllScreens();
  completeScreen.classList.remove('hidden');
}

function showHistoryScreen() {
  hideAllScreens();
  historyScreen.classList.remove('hidden');
}

function getSelectedRoundQuestions() {
  return selectedRound ? selectedRound.questions : [];
}

function loadHistoryMap() {
  if (!selectedRound) {
    return {};
  }

  const raw = localStorage.getItem(getHistoryStorageKey(selectedRound.id));
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('履歴データの読み込みに失敗しました', error);
    return {};
  }
}

function saveHistoryMap(historyMap) {
  if (!selectedRound) {
    return;
  }
  localStorage.setItem(getHistoryStorageKey(selectedRound.id), JSON.stringify(historyMap));
}

function incrementWrongCount(questionId) {
  const historyMap = loadHistoryMap();
  historyMap[questionId] = (historyMap[questionId] || 0) + 1;
  saveHistoryMap(historyMap);
}

function loadProgress() {
  if (!selectedRound) {
    return null;
  }

  const raw = localStorage.getItem(getProgressStorageKey(selectedRound.id, currentMode));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('進行データの読み込みに失敗しました', error);
    return null;
  }
}

function saveProgress(progress) {
  if (!selectedRound) {
    return;
  }
  localStorage.setItem(getProgressStorageKey(selectedRound.id, currentMode), JSON.stringify(progress));
}

function clearProgressByMode(mode) {
  if (!selectedRound) {
    return;
  }
  localStorage.removeItem(getProgressStorageKey(selectedRound.id, mode));
}

function clearHistory() {
  if (!selectedRound) {
    return;
  }
  localStorage.removeItem(getHistoryStorageKey(selectedRound.id));
}

function resetSelectedRoundData() {
  clearProgressByMode(MODE_INPUT);
  clearProgressByMode(MODE_SELFCHECK);
  clearHistory();
  currentProgress = null;
}

function shuffle(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function createNewProgress() {
  const shuffledIds = shuffle(getSelectedRoundQuestions().map((q) => q.id));
  return {
    queue: shuffledIds,
    solvedIds: []
  };
}

function getQuestionById(id) {
  return getSelectedRoundQuestions().find((q) => q.id === id) || null;
}

function getCurrentQuestion() {
  if (!currentProgress || !currentProgress.queue.length) {
    return null;
  }
  return getQuestionById(currentProgress.queue[0]);
}

function getModeLabelText() {
  return currentMode === MODE_INPUT ? '入力ありモード' : '自己申告モード';
}

function renderCurrentQuestion() {
  const currentQuestion = getCurrentQuestion();

  if (!currentQuestion) {
    clearProgressByMode(currentMode);
    currentProgress = null;
    showCompleteScreen();
    return;
  }

  const solvedCount = currentProgress.solvedIds.length;
  const totalCount = getSelectedRoundQuestions().length;

  progressLabel.textContent = `進行状況: ${solvedCount} / ${totalCount}`;
  roundLabel.textContent = selectedRound ? selectedRound.name : '';
  modeLabel.textContent = getModeLabelText();
  questionText.textContent = currentQuestion.japanese;
  answerInput.value = '';
  yourAnswer.textContent = '';
  answerTerm.textContent = '';

  if (currentMode === MODE_INPUT) {
    inputArea.classList.remove('hidden');
    yourAnswerBlock.classList.remove('hidden');
  } else {
    inputArea.classList.add('hidden');
    yourAnswerBlock.classList.add('hidden');
  }

  beforeRevealArea.classList.remove('hidden');
  answerArea.classList.add('hidden');

  showQuizScreen();

  if (currentMode === MODE_INPUT) {
    setTimeout(() => answerInput.focus(), 0);
  }
}

function startFromBeginning(mode) {
  currentMode = mode;
  currentProgress = createNewProgress();
  saveProgress(currentProgress);
  renderCurrentQuestion();
}

function continueFromSaved(mode) {
  currentMode = mode;
  const saved = loadProgress();

  if (!saved || !Array.isArray(saved.queue) || !Array.isArray(saved.solvedIds) || saved.queue.length === 0) {
    alert('続きのデータがありません。');
    return;
  }

  currentProgress = saved;
  renderCurrentQuestion();
}

function showAnswer() {
  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) {
    return;
  }

  if (currentMode === MODE_INPUT) {
    yourAnswer.textContent = answerInput.value.trim() || '（未入力）';
  }

  answerTerm.textContent = currentQuestion.english;

  beforeRevealArea.classList.add('hidden');
  answerArea.classList.remove('hidden');
}

function markCorrect() {
  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) {
    return;
  }

  const currentId = currentQuestion.id;
  currentProgress.queue.shift();

  if (!currentProgress.solvedIds.includes(currentId)) {
    currentProgress.solvedIds.push(currentId);
  }

  saveProgress(currentProgress);
  renderCurrentQuestion();
}

function markWrong() {
  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) {
    return;
  }

  const currentId = currentQuestion.id;
  currentProgress.queue.shift();
  currentProgress.queue.push(currentId);

  incrementWrongCount(currentId);
  saveProgress(currentProgress);
  renderCurrentQuestion();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderHistory() {
  const historyMap = loadHistoryMap();

  const items = Object.entries(historyMap)
    .map(([id, count]) => {
      const question = getQuestionById(id);
      if (!question) {
        return null;
      }

      return {
        id,
        count,
        english: question.english,
        japanese: question.japanese
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count || a.english.localeCompare(b.english, 'en'));

  if (items.length === 0) {
    historyList.innerHTML = '<p class="empty-message">まだ間違えた履歴はありません。</p>';
    return;
  }

  historyList.innerHTML = items.map((item) => `
    <div class="history-item">
      <div class="history-left">
        <div class="history-name">${escapeHtml(item.english)}</div>
        <div class="history-detail">${escapeHtml(item.japanese)}</div>
      </div>
      <div class="history-count">${item.count}回</div>
    </div>
  `).join('');
}

function selectRound(roundId) {
  selectedRound = allRounds.find((round) => round.id === roundId) || null;

  if (!selectedRound) {
    alert('選択した回が見つかりません。');
    return;
  }

  titleRoundName.textContent = `${selectedRound.name} タイトル`;
  historyTitle.textContent = `${selectedRound.name} の間違えた履歴`;
  showTitleScreen();
}

function renderSeriesMenu() {
  seriesButtonGroup.innerHTML = '';

  allRounds.forEach((round) => {
    const button = document.createElement('button');
    button.textContent = round.name;
    button.addEventListener('click', () => {
      selectRound(round.id);
    });
    seriesButtonGroup.appendChild(button);
  });
}

async function loadRounds() {
  const response = await fetch(DATA_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`data.json の読み込みに失敗しました: ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('data.json の形式が不正です。');
  }

  allRounds = data;
}

startInputModeButton.addEventListener('click', () => startFromBeginning(MODE_INPUT));
continueInputModeButton.addEventListener('click', () => continueFromSaved(MODE_INPUT));
startSelfCheckModeButton.addEventListener('click', () => startFromBeginning(MODE_SELFCHECK));
continueSelfCheckModeButton.addEventListener('click', () => continueFromSaved(MODE_SELFCHECK));

historyButton.addEventListener('click', () => {
  renderHistory();
  showHistoryScreen();
});

resetRoundButton.addEventListener('click', () => {
  if (!selectedRound) {
    return;
  }

  const ok = confirm(`${selectedRound.name} の進行状況と間違えた履歴を削除します。よろしいですか？`);
  if (!ok) {
    return;
  }

  resetSelectedRoundData();
  alert(`${selectedRound.name} の履歴をリセットしました。`);
  showTitleScreen();
});

backToSeriesButton.addEventListener('click', showSeriesScreen);

showAnswerButton.addEventListener('click', showAnswer);
correctButton.addEventListener('click', markCorrect);
wrongButton.addEventListener('click', markWrong);

backToTitleFromQuizButton.addEventListener('click', showTitleScreen);
backToTitleAfterRevealButton.addEventListener('click', showTitleScreen);
backToTitleFromCompleteButton.addEventListener('click', showTitleScreen);
backToTitleFromHistoryButton.addEventListener('click', showTitleScreen);

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadRounds();
    renderSeriesMenu();
    showSeriesScreen();
  } catch (error) {
    console.error(error);
    alert('問題データの読み込みに失敗しました。data.json を確認してください。');
  }
});
