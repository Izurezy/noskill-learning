# StudySpace frontend

This is a small Flask web app. It does not need the Node/Phaser project in the sibling `Game-server` directory.

## Run locally

From the repository root, start the entire local stack with:

```bash
./run-dev.sh
```

This launches the Flask frontend, Phaser game, and game event API; press `Ctrl+C` to stop them together.

To run only the frontend, use the manual steps below.

From this directory:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

Then open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser. Stop the server with `Ctrl+C`.

## Live game embed

Study pages use the `default` game session unless you pass `?sessionId=your-session`. The Phaser iframe uses a trusted, origin-checked message bridge. Quiz answers are sent to the game event API; tower, enemy progress, and game-over events update the status above the iframe live.

For local development, also run the following from `../Game-server` in separate terminals:

```bash
npm run api
npm run dev-nolog
```

The defaults are `http://localhost:8080` for the game and `http://localhost:3001` for its event API. Configure deployed URLs before starting Flask:

```bash
GAME_URL=https://game.example.com GAME_API_URL=https://game-api.example.com python app.py
```

## Development

Flask debug mode is enabled for local development, so template and Python edits automatically reload the server.
