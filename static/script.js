let currentMeal = "";
let timerInterval;

async function getIdea() {
    const res = await fetch('/generate');
    const data = await res.json();
    currentMeal = `${data.base} with ${data.side}`;
    
    // Update UI
    document.getElementById('idea').innerText = `You can cook ${currentMeal}!`;
    document.getElementById('recipeDisplay').innerText = data.recipe;
    document.getElementById('healthDisplay').innerText = data.health_tip;
    
    // Show sections
    document.getElementById('extraInfo').style.display = "block";
    document.getElementById('saveBtn').style.display = "block";
    document.getElementById('shareBtn').style.display = "block";
}

function startTimer(minutes) {
    clearInterval(timerInterval);
    let time = minutes * 60;
    
    timerInterval = setInterval(() => {
        let mins = Math.floor(time / 60);
        let secs = time % 60;
        document.getElementById('timerDisplay').innerText = 
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (time <= 0) {
            clearInterval(timerInterval);
            alert("Chakula tayari! Time to serve.");
        }
        time--;
    }, 1000);
}

function saveFavorite() {
    let favorites = JSON.parse(localStorage.getItem('favMeals')) || [];
    if (!favorites.includes(currentMeal)) {
        favorites.push(currentMeal);
        localStorage.setItem('favMeals', JSON.stringify(favorites));
        displayFavorites();
    }
}

function displayFavorites() {
    const list = document.getElementById('favoritesList');
    const favorites = JSON.parse(localStorage.getItem('favMeals')) || [];
    list.innerHTML = favorites.map(meal => `<li style="padding: 5px 0; border-bottom: 1px solid #ddd;">${meal}</li>`).join('');
}

// Show favorites on load
window.onload = displayFavorites;

function shareToWhatsApp() {
    if (!currentMeal) return;
    
    // The message that will be sent
    const message = `Leo tunapika: ${currentMeal}. Utanunua ingredients kabla tufike kwa nyumba?`;
    
    // Encode for URL and open WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

async function getIdea() {
    const res = await fetch('/generate');
    const data = await res.json();
    
    // 1. Save the meal for the WhatsApp/Save features
    currentMeal = `${data.base} with ${data.side}`;
    
    // 2. Update the main text
    document.getElementById('idea').innerText = `You can cook ${currentMeal}!`;
    
    // 3. Update the new Recipe and Health Tip fields
    document.getElementById('recipeDisplay').innerText = data.recipe;
    document.getElementById('healthDisplay').innerText = data.health_tip;
    
    // 4. Make the info box and buttons visible
    document.getElementById('extraInfo').style.display = "block";
    document.getElementById('saveBtn').style.display = "block";
    document.getElementById('shareBtn').style.display = "block";
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/sw.js');
}