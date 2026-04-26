import random

class CookingIdeaGenerator:
    def __init__(self):
        # Organizing the data clearly
        self.choices = {
            "rice": ["cabbage", "ndengu/green grams", "kamande/lentils", "meat (beef, goat, mutton)"],
            "ugali": ["sukuma wiki", "spinach", "cabbage", "meat (beef, goat, mutton)", "fish", "omena"],
            "chapati": ["ndengu/green grams", "beans"],
            "spaghetti": ["boiled eggs", "sukuma wiki", "spinach"],
            "chips": ["chicken", "beef", "masala sausage"]
        }

    def generate_random_meal(self):
        # Randomly select a base (starch)
        base = random.choice(list(self.choices.keys()))
        
        # Randomly select an accompaniment if it exists
        sides = self.choices[base]
        if sides:
            side = random.choice(sides)
            return f"Tonight, you can cook {base} with {side}."
        else:
            return f"Tonight, you can cook {base}."

# Usage
generator = CookingIdeaGenerator()
print(generator.generate_random_meal())