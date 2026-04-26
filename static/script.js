let currentMeal = "";

async function getIdea() {
    const res = await fetch('/generate');
    const data = await res.json();
    currentMeal = `${data.base} with ${data.side}`;
    document.getElementById('idea').innerText = `You can cook ${currentMeal}!`;
    document.getElementById('saveBtn').style.display = "inline-block";
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

// Update getIdea to show the share button too
async function getIdea() {
    const res = await fetch('/generate');
    const data = await res.json();
    currentMeal = `${data.base} with ${data.side}`;
    document.getElementById('idea').innerText = `You can cook ${currentMeal}!`;
    
    // Show both Save and Share buttons
    document.getElementById('saveBtn').style.display = "block";
    document.getElementById('shareBtn').style.display = "block";
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/sw.js');
}