
import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("timer-todos");
    if (saved) setTasks(JSON.parse(saved));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem("timer-todos", JSON.stringify(tasks));
  }, [tasks]);

  // Global Interval for all timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.isRunning && task.timeLeft > 0) {
            return { ...task, timeLeft: task.timeLeft - 1 };
          }
          if (task.timeLeft === 0 && task.isRunning) {
            return { ...task, isRunning: false }; // Auto-stop at zero
          }
          return task;
        }),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addTask = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60;

    const newTask = {
      id: Date.now(),
      text: input,
      done: false,
      timeLeft: totalSeconds,
      initialTime: totalSeconds,
      isRunning: totalSeconds > 0, // Start immediately if time is set
    };

    setTasks([...tasks, newTask]);
    setInput("");
    setHours(0);
    setMinutes(0);
  };

  const toggleTimer = (id) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, isRunning: !t.isRunning } : t)),
    );
  };

  const resetTimer = (id) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, timeLeft: t.initialTime, isRunning: false } : t,
      ),
    );
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="desktop-wrapper">
      <div className="todo-main-card">
        <header className="glass-header">
          <h1>Workspace Flux</h1>
          <p className="date-display">High-Performance Dashboard</p>
        </header>

        <form className="input-container" onSubmit={addTask}>
          <input
            className="main-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What are you working on?"
          />
          <div className="timer-inputs">
            <div className="unit">
              <input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                min="0"
                max="24"
              />

              <span>H</span>
            </div>
            <div className="unit">
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                min="0"
                max="59"
              />
              <span>M</span>
            </div>
          </div>
          <button type="submit" className="add-btn">
            Create Task
          </button>
        </form>

        <div className="scrollable-content">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`task-card ${task.done ? "is-done" : ""}`}
            >
              <div className="task-left">
                <button
                  className={`check-circle ${task.done ? "checked" : ""}`}
                  onClick={() =>
                    setTasks(
                      tasks.map((t) =>
                        t.id === task.id ? { ...t, done: !t.done } : t,
                      ),
                    )
                  }
                >
                  {task.done && "✓"}
                </button>
                <span className="task-text">{task.text}</span>
              </div>

              <div className="task-right">
                <div
                  className={`timer-display ${task.timeLeft === 0 ? "expired" : ""}`}
                >
                  {formatTime(task.timeLeft)}
                </div>
                <div className="controls">
                  <button
                    onClick={() => toggleTimer(task.id)}
                    className="control-btn play-pause"
                  >
                    {task.isRunning ? "Pause" : "Start"}
                  </button>
                  <button
                    onClick={() => resetTimer(task.id)}
                    className="control-btn reset"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() =>
                      setTasks(tasks.filter((t) => t.id !== task.id))
                    }
                    className="control-btn del"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
