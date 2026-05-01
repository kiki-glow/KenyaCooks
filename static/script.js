let isFetching = false;
let currentMeal = "";
let currentMealData = null;
let timerInterval;

function setUIState(state, payload) {
    const btn = document.getElementById("generateBtn");
    const btnLabel = document.getElementById("btnLabel");
    const extraInfo = document.getElementById("extraInfo");
    const secondaryBtns = document.getElementById("secondaryBtns");

    extraInfo.classList.remove("is-loading", "is-success", "is-error");
    btn.classList.remove("is-loading");

    if (state === "loading") {
        extraInfo.setAttribute("aria-hidden", "true");
        extraInfo.style.display = "block";
        extraInfo.classList.add("is-loading");
        btn.disabled = true;
        btn.classList.add("is-loading");
        btnLabel.textContent = "Finding a meal...";
        secondaryBtns.style.display = "none";
        return;
    }

    if (state === "success") {
        currentMealData = normalizeMeal(payload);
        currentMeal = getMealTitle(currentMealData);

        document.getElementById("idea").innerText = currentMealData.legacy
            ? `Saved meal: ${currentMeal}`
            : `You can cook ${currentMeal}!`;
        renderSteps(currentMealData.steps);
        document.getElementById("healthDisplay").innerText =
            currentMealData.health_tip || "No nutritional tip was saved with this favorite.";

        extraInfo.removeAttribute("aria-hidden");
        extraInfo.style.display = "block";
        extraInfo.classList.add("is-success");

        btn.disabled = false;
        btnLabel.textContent = "Generate Idea";
        secondaryBtns.style.display = "flex";
        return;
    }

    if (state === "error") {
        const msg = payload || "Something went wrong. Please try again.";
        document.getElementById("errorMsg").textContent = msg;

        extraInfo.removeAttribute("aria-hidden");
        extraInfo.style.display = "block";
        extraInfo.classList.add("is-error");

        btn.disabled = false;
        btnLabel.textContent = "Generate Idea";
        secondaryBtns.style.display = "none";
    }
}

async function getIdea() {
    if (isFetching) return;
    isFetching = true;

    setUIState("loading");

    try {
        const res = await fetch("/generate");

        if (!res.ok) {
            throw new Error(`status:${res.status}`);
        }

        const data = await res.json();
        setUIState("success", data);
    } catch (err) {
        let msg;
        if (!navigator.onLine) {
            msg = "No internet connection. Check your network and try again.";
        } else if (err.message.includes("500")) {
            msg = "The kitchen is waking up (Render cold start). Wait 30 seconds and try again.";
        } else if (err.message.includes("429")) {
            msg = "Slow down, chef! Too many requests. Wait a moment and try again.";
        } else {
            msg = "Unable to reach the server. Please try again.";
        }

        setUIState("error", msg);
        console.error("getIdea failed:", err);
    } finally {
        isFetching = false;
    }
}

function normalizeMeal(meal) {
    if (typeof meal === "string") {
        return {
            legacy: true,
            title: meal,
            base: meal,
            side: "",
            steps: [],
            health_tip: "",
        };
    }

    return {
        base: meal.base || "",
        side: meal.side || "",
        steps: Array.isArray(meal.steps) ? meal.steps : [],
        health_tip: meal.health_tip || "",
    };
}

function getMealTitle(meal) {
    if (meal.title) return meal.title;
    return meal.side ? `${meal.base} with ${meal.side}` : meal.base;
}

function renderSteps(steps) {
    const recipeDisplay = document.getElementById("recipeDisplay");
    recipeDisplay.innerHTML = "";

    if (!steps.length) {
        const item = document.createElement("li");
        item.className = "step-item";
        item.textContent = "No preparation steps available.";
        recipeDisplay.appendChild(item);
        return;
    }

    steps.forEach((step, index) => {
        const item = document.createElement("li");
        item.className = "step-item";

        const instruction = document.createElement("span");
        instruction.className = "step-instruction";
        instruction.textContent = step.instruction;
        item.appendChild(instruction);

        if (Number.isFinite(step.duration_mins) && step.duration_mins > 0) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "step-timer-btn";
            button.textContent = `Start ${step.duration_mins}m`;
            button.addEventListener("click", () => {
                startTimer(step.duration_mins, `Step ${index + 1}: ${step.instruction}`);
            });
            item.appendChild(button);
        }

        recipeDisplay.appendChild(item);
    });
}

function startTimer(minutes, label = "Kitchen timer") {
    clearInterval(timerInterval);

    const timerStrip = document.getElementById("timerStrip");
    const activeStepLabel = document.getElementById("activeStepLabel");
    const timerDisplay = document.getElementById("timerDisplay");
    let time = minutes * 60;

    timerStrip.classList.add("is-active");
    activeStepLabel.textContent = label;
    updateTimerDisplay(timerDisplay, time);

    timerInterval = setInterval(() => {
        time -= 1;
        updateTimerDisplay(timerDisplay, time);

        if (time <= 0) {
            clearInterval(timerInterval);
            timerStrip.classList.remove("is-active");
            activeStepLabel.textContent = "No active step";
            showToast("Chakula tayari! Time to serve.");
        }
    }, 1000);
}

function updateTimerDisplay(element, secondsLeft) {
    const safeSeconds = Math.max(0, secondsLeft);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    element.innerText = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("is-visible");

    window.setTimeout(() => {
        toast.classList.remove("is-visible");
    }, 3200);
}

function getFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem("favMeals")) || [];
        return Array.isArray(favorites) ? favorites : [];
    } catch (err) {
        console.error("Could not read favorites:", err);
        return [];
    }
}

function setFavorites(favorites) {
    localStorage.setItem("favMeals", JSON.stringify(favorites));
}

function saveFavorite() {
    if (!currentMealData) return;

    const favorites = getFavorites();
    const mealToSave = normalizeMeal(currentMealData);
    const titleToSave = getMealTitle(mealToSave);
    const alreadySaved = favorites.some((meal) => getMealTitle(normalizeMeal(meal)) === titleToSave);

    if (!alreadySaved) {
        favorites.push(mealToSave);
        setFavorites(favorites);
        displayFavorites();
        showToast("Saved to favorites.");
    }
}

function reloadFavorite(index) {
    const meal = getFavorites()[index];
    if (!meal) return;

    setUIState("success", meal);
    showToast("Favorite loaded.");
}

function deleteFavorite(index) {
    const favorites = getFavorites();
    favorites.splice(index, 1);
    setFavorites(favorites);
    displayFavorites();
    showToast("Favorite removed.");
}

function displayFavorites() {
    const list = document.getElementById("favoritesList");
    const favorites = getFavorites();
    list.innerHTML = "";

    favorites.forEach((meal, index) => {
        const normalizedMeal = normalizeMeal(meal);
        const item = document.createElement("li");
        item.className = normalizedMeal.legacy ? "favorite-item is-legacy" : "favorite-item";

        const title = document.createElement("span");
        title.className = "favorite-title";
        title.textContent = getMealTitle(normalizedMeal);
        item.appendChild(title);

        const actions = document.createElement("span");
        actions.className = "favorite-actions";

        const reloadBtn = document.createElement("button");
        reloadBtn.type = "button";
        reloadBtn.className = "favorite-action-btn";
        reloadBtn.textContent = "Load";
        reloadBtn.addEventListener("click", () => reloadFavorite(index));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "favorite-action-btn danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteFavorite(index));

        actions.append(reloadBtn, deleteBtn);
        item.appendChild(actions);

        list.appendChild(item);
    });
}

async function shareToWhatsApp() {
    if (!currentMeal) return;

    const steps = currentMealData?.steps?.length
        ? `\n\nSteps:\n${currentMealData.steps.map((step, index) => `${index + 1}. ${step.instruction}`).join("\n")}`
        : "";
    const message = `Leo tunapika: ${currentMeal}. Utanunua ingredients kabla tufike kwa nyumba?${steps}`;

    if (navigator.share) {
        try {
            await navigator.share({ text: message });
            return;
        } catch (e) {
            const wasCancelled = e?.name === "AbortError"
                || e?.message?.toLowerCase().includes("cancel");
            showToast(wasCancelled
                ? "Share cancelled. Opening WhatsApp instead."
                : "Share sheet unavailable. Opening WhatsApp instead.");
        }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
}

window.addEventListener("load", displayFavorites);

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/static/sw.js");
}
