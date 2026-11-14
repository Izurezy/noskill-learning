
import os
import string
from urllib.parse import urlparse, parse_qs
import re
from flask import Flask, flash, redirect, render_template, request, session, url_for

app = Flask(__name__)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

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

    return render_template("study.html", topic=topic)


if __name__ == "__main__":
    app.run(debug=True)
