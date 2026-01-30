const state = {
  rounds: [],
  currentRoundIndex: 0,
  revealed: new Set(),
  strikeCount: 0,
  scores: {
    a: 0,
    b: 0,
  },
};

const elements = {
  roundTitle: document.getElementById("round-title"),
  roundQuestion: document.getElementById("round-question"),
  roundSelect: document.getElementById("round-select"),
  answersGrid: document.getElementById("answers-grid"),
  roundTotal: document.getElementById("round-total"),
  strikes: Array.from(document.querySelectorAll(".strike")),
  prevRound: document.getElementById("prev-round"),
  nextRound: document.getElementById("next-round"),
  revealAll: document.getElementById("reveal-all"),
  hideAll: document.getElementById("hide-all"),
  addStrike: document.getElementById("add-strike"),
  clearStrikes: document.getElementById("clear-strikes"),
  scoreA: document.getElementById("score-a"),
  scoreB: document.getElementById("score-b"),
  addA: document.getElementById("add-a"),
  addB: document.getElementById("add-b"),
  resetScores: document.getElementById("reset-scores"),
  adjustButtons: Array.from(document.querySelectorAll("[data-team][data-delta]")),
};

let audioContext;

const initialize = async () => {
  try {
    const response = await fetch("rounds.json");
    if (!response.ok) {
      throw new Error("Unable to load rounds.json");
    }

    const data = await response.json();
    state.rounds = Array.isArray(data.rounds) ? data.rounds : [];

    if (!state.rounds.length) {
      throw new Error("No rounds were found in rounds.json");
    }

    buildRoundSelect();
    setRound(0);
    bindEvents();
  } catch (error) {
    elements.roundQuestion.textContent = "Failed to load rounds.";
    elements.answersGrid.innerHTML = `<p class="error">${error.message}</p>`;
  }
};

const buildRoundSelect = () => {
  elements.roundSelect.innerHTML = "";
  state.rounds.forEach((round, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = round.title || `Round ${index + 1}`;
    elements.roundSelect.appendChild(option);
  });
};

const bindEvents = () => {
  elements.prevRound.addEventListener("click", () => {
    setRound(state.currentRoundIndex - 1);
  });

  elements.nextRound.addEventListener("click", () => {
    setRound(state.currentRoundIndex + 1);
  });

  elements.roundSelect.addEventListener("change", (event) => {
    setRound(Number(event.target.value));
  });

  elements.revealAll.addEventListener("click", revealAllAnswers);
  elements.hideAll.addEventListener("click", hideAllAnswers);
  elements.addStrike.addEventListener("click", addStrike);
  elements.clearStrikes.addEventListener("click", clearStrikes);
  elements.addA.addEventListener("click", () => awardPoints("a"));
  elements.addB.addEventListener("click", () => awardPoints("b"));
  elements.resetScores.addEventListener("click", resetScores);

  elements.adjustButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const team = button.dataset.team;
      const delta = Number(button.dataset.delta);
      adjustScore(team, delta);
    });
  });
};

const setRound = (index) => {
  if (index < 0 || index >= state.rounds.length) {
    return;
  }

  state.currentRoundIndex = index;
  resetRoundState();
  renderRound();
  updateRoundControls();
};

const resetRoundState = () => {
  state.revealed.clear();
  state.strikeCount = 0;
  updateStrikes();
  updateRoundTotal();
};

const renderRound = () => {
  const round = state.rounds[state.currentRoundIndex];
  elements.roundTitle.textContent = round.title || `Round ${state.currentRoundIndex + 1}`;
  elements.roundQuestion.textContent = round.question || "No question available.";
  elements.roundSelect.value = String(state.currentRoundIndex);

  elements.answersGrid.innerHTML = "";
  round.answers.forEach((answer, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "answer-tile is-hidden";
    tile.dataset.index = String(index);

    tile.innerHTML = `
      <span class="answer-tile__index">${index + 1}</span>
      <span class="answer-tile__text">${answer.text}</span>
      <span class="answer-tile__points">${answer.points}</span>
    `;

    tile.addEventListener("click", () => toggleAnswer(index));
    elements.answersGrid.appendChild(tile);
  });
};

const toggleAnswer = (index) => {
  if (state.revealed.has(index)) {
    state.revealed.delete(index);
  } else {
    state.revealed.add(index);
  }

  updateTiles();
  updateRoundTotal();
};

const updateTiles = () => {
  const tiles = Array.from(elements.answersGrid.children);
  tiles.forEach((tile) => {
    const index = Number(tile.dataset.index);
    if (state.revealed.has(index)) {
      tile.classList.remove("is-hidden");
    } else {
      tile.classList.add("is-hidden");
    }
  });
};

const revealAllAnswers = () => {
  const round = state.rounds[state.currentRoundIndex];
  round.answers.forEach((_, index) => state.revealed.add(index));
  updateTiles();
  updateRoundTotal();
};

const hideAllAnswers = () => {
  state.revealed.clear();
  updateTiles();
  updateRoundTotal();
};

const updateRoundTotal = () => {
  const round = state.rounds[state.currentRoundIndex];
  const total = round.answers.reduce((sum, answer, index) => {
    return state.revealed.has(index) ? sum + Number(answer.points || 0) : sum;
  }, 0);

  elements.roundTotal.textContent = total;
};

const updateRoundControls = () => {
  elements.prevRound.disabled = state.currentRoundIndex === 0;
  elements.nextRound.disabled = state.currentRoundIndex === state.rounds.length - 1;
};

const addStrike = () => {
  if (state.strikeCount >= elements.strikes.length) {
    return;
  }

  state.strikeCount += 1;
  updateStrikes();
  playBuzzer();
};

const clearStrikes = () => {
  state.strikeCount = 0;
  updateStrikes();
};

const updateStrikes = () => {
  elements.strikes.forEach((strike, index) => {
    if (index < state.strikeCount) {
      strike.classList.add("is-active");
    } else {
      strike.classList.remove("is-active");
    }
  });
};

const playBuzzer = () => {
  if (!window.AudioContext && !window.webkitAudioContext) {
    return;
  }

  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(120, now);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.4, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  oscillator.connect(gainNode).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.5);
};

const awardPoints = (team) => {
  const roundPoints = Number(elements.roundTotal.textContent) || 0;
  state.scores[team] += roundPoints;
  updateScores();
};

const adjustScore = (team, delta) => {
  state.scores[team] += delta;
  updateScores();
};

const resetScores = () => {
  state.scores.a = 0;
  state.scores.b = 0;
  updateScores();
};

const updateScores = () => {
  elements.scoreA.textContent = state.scores.a;
  elements.scoreB.textContent = state.scores.b;
};

initialize();
