from flask import Flask, render_template, jsonify, request
from collections import defaultdict
import threading
import random
import time
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# a secret key for sessions/flashing
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-local')

# ----RATE LIMITER----
RATE_LIMIT = 10
WINDOW_SECONDS = 60
CLEANUP_EVERY = 300

_request_log = defaultdict(list)
_log_rock = threading.Lock()

def is_rate_limited(ip: str) -> bool:
    """
    Returns True if the IP has exceeded the limit.
    Also evicts stale timestamps and appends the current one if allowed.
    """
    now = time.time()
    cutoff = now - WINDOW_SECONDS

    with _log_rock:
        _request_log[ip] = [t for t in _request_log[ip] if t > cutoff]

        if len(_request_log[ip]) >= RATE_LIMIT:
            return True
        
        _request_log[ip].append(now)
        return False
    
def _cleanup_loop():
    """
    Runs in a daemon thread. Every CLEANUP_EVERY seconds it removes entries
    for IPs whose timestamp lists are empty, preventing unbounded dict growth
    after a traffic spike passes.
    """
    while True:
        time.sleep(CLEANUP_EVERY)
        now = time.time()
        cutoff = now - WINDOW_SECONDS
        with _log_rock:
            stale = [
                ip for ip, timestamps in _request_log.items()
                if not any(t > cutoff for t in timestamps)
            ]
            for ip in stale:
                del _request_log[ip]

_cleanup_thread = threading.Thread(target=_cleanup_loop, daemon=True)
_cleanup_thread.start()

# ----DATA----
# upgraded data structure to address user feedback (Fred & Dan)
CHOICES = {
    "ugali": {
        "sides": ["sukuma wiki", "spinach", "cabbage", "beef stew", "fish", "omena"],
        "steps": [
            {"instruction": "Bring 2 cups of water to a rolling boil in a heavy pot.", "duration_mins": 5},
            {"instruction": "Reduce heat to medium. Add maize flour slowly in a steady stream, stirring constantly to prevent lumps.", "duration_mins": None},
            {"instruction": "Mash and fold the dough firmly until it pulls away from the sides of the pot.", "duration_mins": None},
            {"instruction": "Cover and steam on the lowest heat to finish.", "duration_mins": 5},
        ],
        "health_tip": "Add a side of kachumbari or avocado for healthy fats and vitamins!"
    },
    "rice": {
        "sides": ["cabbage", "ndengu/green grams", "kamande/lentils", "beef stew"],
        "steps": [
            {"instruction": "Rinse 1 cup of rice under cold water until it runs clear.", "duration_mins": None},
            {"instruction": "Add rice and 2 cups water to a pot with a pinch of salt and a dash of oil. Bring to the boil.", "duration_mins": 5},
            {"instruction": "Reduce to the lowest heat, cover tightly, and simmer until all water is absorbed.", "duration_mins": 15},
            {"instruction": "Remove from heat and leave covered to rest — do not lift the lid.", "duration_mins": 5}
        ],
        "health_tip": "Mix in some minji or carrots while boiling for extra fibre and colour."
    },
    "chapati": {
        "sides": ["ndengu", "beans", "chicken curry"],
        "steps": [
            {"instruction": "Mix 2 cups of flour with a pinch of salt, 1 tsp sugar, and 2 tbsp oil. Add warm water gradually and knead into a smooth, soft dough.", "duration_mins": None},
            {"instruction": "Divide into balls and roll each one thin on a floured surface. Brush with oil and fold into layers, then roll flat again.", "duration_mins": None},
            {"instruction": "Cook each chapati on a medium-hot pan, turning and pressing until golden patches appear on both sides.", "duration_mins": 3}
        ],
        "health_tip": "Serve with plenty of protein-rich ndengu stew spinach on the side."
    },
    "spaghetti": {
        "sides": ["eggs", "minced meat", "sukuma wiki"],
        "steps": [
            {"instruction": "Bring a large pot of well-salted water to a full boil.", "duration_mins": 8},
            {"instruction": "Add spaghetti and cook until al dente — firm to the bite.", "duration_mins": 10},
            {"instruction": "While pasta cooks, fry your protein (minced meat or eggs) with onions and tomatoes until cooked through.", "duration_mins": None},
            {"instruction": "Drain the pasta, toss immediately with the fried mixture, and serve hot.", "duration_mins": None}
        ],
        "health_tip": "Add a handful of sukuma wiki or spinach to the fry for a complete, balanced meal."
    },
    "githeri": {
        "sides": ["avocado", "steamed cabbage"],
        "steps": [
            {"instruction": "If using dry maize and beans, soak them together overnight. Drain and rinse well.", "duration_mins": None},
            {"instruction": "Cover with fresh water and boil until both are completely soft — this takes time, don't rush it.", "duration_mins": 45},
            {"instruction": "In a separate pan, fry onions until golden, then add tomatoes and spices. Cook down into a thick sauce.", "duration_mins": 10},
            {"instruction": "Add the boiled maize and beans to the sauce. Stir to combine and simmer to let the flavours meld.", "duration_mins": 5}
        ],
        "health_tip": "Githeri is a powerhouse! Pair with a large slice of avocado for the perfect balance."
    }
}

# ----ROUTES----
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate')
def generate():
    ip = request.remote_addr

    if is_rate_limited(ip):
        return jsonify({
            "error": "Too many requests. Slow down, chef – wait a minute and try again."
        }), 429
    
    base = random.choice(list(CHOICES.keys()))
    data = CHOICES[base]
    side = random.choice(data["sides"])

    return jsonify({
        "base": base, 
        "side": side, 
        "steps": data["steps"], 
        "health_tip": data["health_tip"]
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))

    # in production, set FLASK_DEBUG=False in Render's env variables
    debug_mode = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'

    app.run(host='0.0.0.0', port=port)