# Family Feud Game Board (Local Web App)

This is a lightweight, offline-friendly Family Feud-style game board that runs
entirely in the browser. It loads multiple rounds from a local JSON file,
supports click-to-reveal answer tiles, plays a buzzer on strikes, tracks team
scores, and includes round navigation.

## Getting Started

You need a local web server so the browser can fetch `rounds.json`.

### Option 1: VS Code Live Server
1. Open the project folder in VS Code.
2. Right-click `index.html` and choose **Open with Live Server**.

### Option 2: Python HTTP Server
```bash
python -m http.server
```
Then open `http://localhost:8000` in your browser.

## Editing Rounds
Update `rounds.json` to add or change rounds. Each round includes a title,
question, and list of answers with point values.
