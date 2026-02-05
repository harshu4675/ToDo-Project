import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Sound for timer completion
const playSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = "sine";
  gainNode.gain.value = 0.3;

  oscillator.start();
  setTimeout(() => {
    oscillator.frequency.value = 1000;
    setTimeout(() => {
      oscillator.frequency.value = 800;
      setTimeout(() => oscillator.stop(), 200);
    }, 200);
  }, 200);
};

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("momento-tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [filter, setFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const intervalRef = useRef(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("momento-tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            playSound();
            // Mark task as completed
            if (activeTimer) {
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === activeTimer
                    ? { ...t, completed: true, timerCompleted: true }
                    : t,
                ),
              );
              setActiveTimer(null);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, activeTimer]);

  const addTask = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newTask = {
      id: Date.now(),
      text: input.trim(),
      completed: false,
      duration: timerMinutes * 60,
      createdAt: new Date().toISOString(),
      timerCompleted: false,
    };

    setTasks([newTask, ...tasks]);
    setInput("");
  };

  const toggleTask = (id) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
    if (activeTimer === id) {
      setActiveTimer(null);
      setIsRunning(false);
      setTimeLeft(0);
    }
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
    if (activeTimer === id) {
      setActiveTimer(null);
      setIsRunning(false);
      setTimeLeft(0);
    }
  };

  const startTimer = (task) => {
    if (activeTimer === task.id && isRunning) {
      // Pause
      setIsRunning(false);
    } else if (activeTimer === task.id && !isRunning) {
      // Resume
      setIsRunning(true);
    } else {
      // Start new timer
      setActiveTimer(task.id);
      setTimeLeft(task.duration);
      setIsRunning(true);
    }
  };

  const resetTimer = (task) => {
    if (activeTimer === task.id) {
      setTimeLeft(task.duration);
      setIsRunning(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = (task) => {
    if (activeTimer !== task.id) return 0;
    return ((task.duration - timeLeft) / task.duration) * 100;
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "done") return task.completed;
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;
  const doneCount = tasks.filter((t) => t.completed).length;

  const timerPresets = [5, 10, 15, 25, 30, 45, 60];

  return (
    <div className="app">
      {/* Ambient Background */}
      <div className="ambient-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="logo">
            <div className="logo-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
            </div>
            <div className="logo-text">
              <h1>Momento</h1>
              <span>Focus on what matters</span>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-value">{activeCount}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat">
              <span className="stat-value">{doneCount}</span>
              <span className="stat-label">Done</span>
            </div>
          </div>
        </header>

        {/* Active Timer Display */}
        {activeTimer && (
          <div className="active-timer-display">
            <div className="timer-ring">
              <svg viewBox="0 0 100 100">
                <circle className="timer-bg" cx="50" cy="50" r="45" />
                <circle
                  className="timer-progress"
                  cx="50"
                  cy="50"
                  r="45"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 45}`,
                    strokeDashoffset: `${2 * Math.PI * 45 * (1 - getProgress(tasks.find((t) => t.id === activeTimer)) / 100)}`,
                  }}
                />
              </svg>
              <div className="timer-center">
                <span className="timer-time">{formatTime(timeLeft)}</span>
                <span className="timer-task">
                  {tasks.find((t) => t.id === activeTimer)?.text}
                </span>
              </div>
            </div>
            <div className="timer-controls">
              <button
                className={`timer-btn ${isRunning ? "pause" : "play"}`}
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )}
              </button>
              <button
                className="timer-btn reset"
                onClick={() =>
                  resetTimer(tasks.find((t) => t.id === activeTimer))
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
              <button
                className="timer-btn stop"
                onClick={() => {
                  setActiveTimer(null);
                  setIsRunning(false);
                  setTimeLeft(0);
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Add Task Form */}
        <form className="add-task-form" onSubmit={addTask}>
          <div className="input-wrapper">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What needs your focus today?"
              className="task-input"
            />
            <div className="timer-selector">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              <select
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Number(e.target.value))}
                className="timer-select"
              >
                {timerPresets.map((mins) => (
                  <option key={mins} value={mins}>
                    {mins} min
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="add-btn" disabled={!input.trim()}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Task
          </button>
        </form>

        {/* Quick Timer Presets */}
        <div className="quick-presets">
          <span className="preset-label">Quick set:</span>
          {timerPresets.slice(0, 5).map((mins) => (
            <button
              key={mins}
              className={`preset-btn ${timerMinutes === mins ? "active" : ""}`}
              onClick={() => setTimerMinutes(mins)}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All <span className="count">{tasks.length}</span>
          </button>
          <button
            className={`filter-btn ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active <span className="count">{activeCount}</span>
          </button>
          <button
            className={`filter-btn ${filter === "done" ? "active" : ""}`}
            onClick={() => setFilter("done")}
          >
            Done <span className="count">{doneCount}</span>
          </button>
        </div>

        {/* Task List */}
        <div className="task-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {filter === "done" ? "🎉" : filter === "active" ? "✨" : "🎯"}
              </div>
              <h3>
                {filter === "done"
                  ? "No completed tasks yet"
                  : filter === "active"
                    ? "All caught up!"
                    : "Start your focused day"}
              </h3>
              <p>
                {filter === "done"
                  ? "Complete some tasks to see them here"
                  : filter === "active"
                    ? "Add a new task to get started"
                    : "Add a task with a timer to begin"}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`task-card ${task.completed ? "completed" : ""} ${activeTimer === task.id ? "timing" : ""}`}
              >
                {/* Progress bar for active timer */}
                {activeTimer === task.id && (
                  <div
                    className="task-progress-bar"
                    style={{ width: `${getProgress(task)}%` }}
                  />
                )}

                <div className="task-content">
                  <button
                    className={`checkbox ${task.completed ? "checked" : ""}`}
                    onClick={() => toggleTask(task.id)}
                  >
                    {task.completed && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    )}
                  </button>

                  <div className="task-info">
                    <span
                      className={`task-text ${task.completed ? "done" : ""}`}
                    >
                      {task.text}
                    </span>
                    <div className="task-meta">
                      <span className="task-duration">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12,6 12,12 16,14" />
                        </svg>
                        {Math.floor(task.duration / 60)} min
                      </span>
                      {task.timerCompleted && (
                        <span className="timer-badge">Timer completed ✓</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="task-actions">
                  {!task.completed && (
                    <>
                      <button
                        className={`action-btn timer ${activeTimer === task.id ? (isRunning ? "running" : "paused") : ""}`}
                        onClick={() => startTimer(task)}
                        title={
                          activeTimer === task.id
                            ? isRunning
                              ? "Pause"
                              : "Resume"
                            : "Start Timer"
                        }
                      >
                        {activeTimer === task.id ? (
                          isRunning ? (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="4" width="4" height="16" rx="1" />
                              <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5,3 19,12 5,21" />
                            </svg>
                          )
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        )}
                      </button>
                      {activeTimer === task.id && (
                        <span className="inline-timer">
                          {formatTime(timeLeft)}
                        </span>
                      )}
                    </>
                  )}
                  <button
                    className="action-btn delete"
                    onClick={() => deleteTask(task.id)}
                    title="Delete"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3,6 5,6 21,6" />
                      <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {tasks.length > 0 && (
          <footer className="footer">
            <p>
              {activeCount} task{activeCount !== 1 ? "s" : ""} remaining
            </p>
            {doneCount > 0 && (
              <button
                className="clear-btn"
                onClick={() => setTasks(tasks.filter((t) => !t.completed))}
              >
                Clear completed
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
