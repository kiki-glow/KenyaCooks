from flask import Flask, render_template, jsonify
import random

app = Flask(__name__)

CHOICES = {
    "ugali": ["sukuma wiki", "spinach", "cabbage", "meat", "fish", "omena"],
    "rice": ["cabbage", "ndengu", "kamande", "beef stew"],
    "chapati": ["ndengu", "beans", "chicken curry"],
    "spaghetti": ["eggs", "minced meat"],
    "githeri": ["avocado", "steamed cabbage"]
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate')
def generate():
    base = random.choice(list(CHOICES.keys()))
    side = random.choice(CHOICES[base])
    return jsonify({"base": base, "side": side})

if __name__ == '__main__':
    app.run(debug=True)