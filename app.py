from flask import Flask, render_template, jsonify
import random
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# a secret key for sessions/flashing
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-local')

# upgraded data structure to address user feedback (Fred & Dan)
CHOICES = {
    "ugali": {
        "sides": ["sukuma wiki", "spinach", "cabbage", "beef stew", "fish", "omena"],
        "recipe": "Boil 2 cups water. Add maize flour slowly while stirring. Mash until firm. Cover and steam for 5 mins.",
        "health_tip": "Add a side of kachumbari or avocado for healthy fats and vitamins!"
    },
    "rice": {
        "sides": ["cabbage", "ndengu/green grams", "kamande/lentils", "beef stew"],
        "recipe": "Use 1:2 rice to water ratio. Add a pinch of salt/oil. Simmer on low heat until water evaporates.",
        "health_tip": "Mix in some minji or carrots while boiling for a more balanced fiber intake."
    },
    "chapati": {
        "sides": ["ndengu", "beans", "chicken curry"],
        "recipe": "Knead flour with warm water + salt/sugar + oil. Let rest for 20 mins. Roll, oil, and fry until golden brown.",
        "health_tip": "Serve with plenty of protein (ndengu) and a side of steamed spinach."
    },
    "spaghetti": {
        "sides": ["eggs", "minced meat", "sukuma wiki"],
        "recipe": "Boil in salted water for 8-10 mins. Drain and toss with your fried protein/veggies.",
        "health_tip": "Don't skip the veggies! Adding spinach or cabbage makes this a complete meal."
    },
    "githeri": {
        "sides": ["avocado", "steamed cabbage"],
        "recipe": "Boil maize and beans until soft. Fry with onions, tomatoes, and preferred spices.",
        "health_tip": "Githeri is a powerhouse! Pair with a large slice of avocado for the perfect balance."
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate')
def generate():
    base = random.choice(list(CHOICES.keys()))
    data = CHOICES[base]
    side = random.choice(data["sides"])

    return jsonify({
        "base": base, 
        "side": side, 
        "recipe": data["recipe"], 
        "health_tip": data["health_tip"]
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))

    # in production, set FLASK_DEBUG=False in Render's env variables
    debug_mode = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'

    app.run(host='0.0.0.0', port=port)