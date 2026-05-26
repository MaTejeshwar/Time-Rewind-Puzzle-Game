# 🌀 Temporal Echo

A premium, minimalist 2D time-rewind puzzle game built with **vanilla HTML5, CSS3, and JavaScript**, utilizing canvas rendering and Web Audio API synthesis.

Coordinate with your past self to activate switches, unlock gates, avoid spikes, and stabilize the portal loops.

---

## 🎨 Visual Design & Theme

**Temporal Echo** uses a **Zen / Warm Geometric Minimalist** aesthetic inspired by *Monument Valley* and *The Witness*:
- **Background**: Soft linen / warm cream (`#f6f5f0`) with subtle gray grid cells.
- **Active Self**: Deep slate-indigo (`#2d3e50`) circle with a white border.
- **Past Clones**: Semi-transparent terracotta-rust (`#c4553e`) circles.
- **Switches**: Depressing warm gold concentric buttons.
- **Barriers**: Sliding copper-bronze gates.
- **Portals**: Swirling solar-amber rings with rotating particles.
- **Sound Effects**: Organic, woodblock-style plucks and warm chimes dynamically synthesized on the fly via the Web Audio API.

---

## 🎮 Game Controls

Move, wait, rewind, or reset the board using simple keyboard hotkeys:
- **W, A, S, D** or **Arrow Keys**: Move in the grid.
- **Space** or **Period (.)**: Wait in place (passes a turn, allowing clones to walk while you stand still).
- **R**: Rewind time (saves your current path as a new clone and resets you to the start).
- **Backspace**: Restart current loop (resets player to start of current attempt, keeping existing clones).
- **Delete**: Reset level (wipes all active clones and resets the level completely).
- **Escape (Esc)**: Open/close the Timeline selection menu.

---

## 💎 Premium Puzzle Mechanics

1. **Turn-Synchronous steps**: Clones don't move in real time; they only advance when you move or wait. This allows you to plan your steps like a game of chess.
2. **Temporal Paradox (Dephasing)**: If a clone runs into a wall, closed gate, or active spikes, it instantly shatters into square glitch particles. You must coordinate the timing of gates to clear paths for your echoes.
3. **Smooth Movement Easing**: Players and clones smoothly slide (`lerp`) between grid cells rather than teleporting instantly.
4. **Dynamic Particle Engine**: Custom particle effects simulate movement dust, switch pressure waves, portal gravity pull, dephasing shatters, and victory bursts.
5. **High-DPI Support**: Integrates device pixel ratio detection, ensuring all circles, lines, and text render with sharp, native resolution on Retina, 4K, and high-DPI displays.

---

## 📁 File Structure

The project is completely self-contained in 4 core files:
- `index.html`: Main DOM structure, UI screens, SVGs, HUD sidebar, overlays, and canvas.
- `style.css`: Responsive design system, CSS variables, glassmorphic layout cards, custom scrollbars, and keyframe animations.
- `audio.js`: Synthesizes arcade sounds directly using Web Audio API nodes (oscillators, filters, and gain nodes). No external assets required.
- `game.js`: The level maps, game state manager, drawing loop, lerp calculations, collision physics, and particle system.

---

## 🚀 How to Run Locally

Since the game uses standard, self-contained scripts without CORS-sensitive module imports, you can run it in two ways:

1. **Directly from file**: Simply **double-click `index.html`** on your computer. It will open in your web browser and run perfectly out of the box.
2. **Using a local server**: If you prefer, serve the files using a simple HTTP server:
   - *Python*: Run `python -m http.server 8000` in the directory, then open `http://localhost:8000`.
   - *Node.js*: Install `http-server` via npm and run `npx http-server`.

---

## ☁️ Deployment to Vercel

**Yes, this game can be deployed to Vercel instantly!** 

Because **Temporal Echo** is a pure, static client-side web application, it fits Vercel's static file hosting model. It requires no build steps or backend servers.

Here are the two ways to deploy it:

### Method A: Deploying via GitHub (Recommended)
1. Initialize Git in the project folder and push the files to a repository on GitHub, GitLab, or Bitbucket:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Temporal Echo puzzle game"
   # Link to your repository and push:
   git remote add origin <your-repo-url>
   git branch -M main
   git push -u origin main
   ```
2. Log into your [Vercel Dashboard](https://vercel.com).
3. Click **Add New** -> **Project**.
4. Import your repository.
5. Vercel will automatically detect the static project setup. Leave the default settings (Build Command and Output Directory blank) and click **Deploy**.
6. Within a few seconds, your game will be live on a production-ready `.vercel.app` URL!

### Method B: Deploying directly via Vercel CLI
If you do not want to use Git, you can deploy straight from your terminal:
1. Open terminal in the project directory.
2. Run `npx vercel` (or install the CLI globally: `npm i -g vercel` and run `vercel`).
3. Follow the CLI prompts:
   - Log in or sign up.
   - Set project name (e.g. `temporal-echo`).
   - Link to a new project: **Yes**.
   - Output directory / build command options: Keep defaults (press Enter).
4. Vercel will upload your files and output a live deployment URL immediately.
