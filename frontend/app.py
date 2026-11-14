
import os
from urllib.parse import urlencode

from flask import Flask, redirect, render_template, request, url_for

app = Flask(__name__)
GAME_URL = os.environ.get("GAME_URL", "http://localhost:8080").rstrip("/")
GAME_API_URL = os.environ.get("GAME_API_URL", "http://localhost:3001").rstrip("/")

@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


# Homepage
@app.route("/", methods=["GET", "POST"])
def home():

    if request.method == "POST":

        topic = request.form.get("topic", "").strip()

        if not topic:
            return render_template("index.html", error="Please enter a topic.")

        # Redirect to study page with topic
        return redirect(url_for("study", topic=topic))

    return render_template("index.html")


# Study page
@app.route("/study/<topic>")
def study(topic):
    # Keep the documented curl command useful by default. A host can still
    # choose a separate game with /study/<topic>?sessionId=class-a.
    session_id = request.args.get("sessionId", "default").strip() or "default"
    parent_origin = request.host_url.rstrip("/")
    game_url = f"{GAME_URL}?{urlencode({
        'sessionId': session_id,
        'parentOrigin': parent_origin,
        'apiUrl': GAME_API_URL,
    })}"

    return render_template(
        "study.html",
        topic=topic,
        game_url=game_url,
        game_origin=GAME_URL,
        game_api_url=GAME_API_URL,
        game_session_id=session_id,
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
