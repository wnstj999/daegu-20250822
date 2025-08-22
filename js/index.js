// Database
let recipeDatabase = {};

// Sorting preference
let currentSortOrder = 'alphabetical';

// History management
let history = [];
let historyIndex = -1;
let isApplyingHistory = false;

// Image loading state
let imageLoadTimeout = null;

// Default suggestions
const defaultCategories = ['Brød', 'Bakverk', 'Kake', 'Grateng', 'Gryte', 'Kjeks', 'Grøt', 'Suppe', 'Salat', 'Kjøttkaker'];
const defaultMeals = ['Frokost', 'Lunsj', 'Middag', 'Dessert', 'Snacks', 'Tilbehør'];
const defaultCuisines = ['Norsk', 'Italiensk', 'Skandinavisk', 'Internasjonal', 'Asiatisk', 'Meksikansk', 'Fransk'];

// Export image prompt function
async function exportImagePrompt() {
    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value.trim();
    const meal = document.getElementById('meal').value.trim();
    const cuisine = document.getElementById('cuisine').value.trim();
    const description = document.getElementById('description').value.trim();
    const ingredientsText = document.getElementById('ingredients').value.trim();
    const instructionsText = document.getElementById('instructions').value.trim();

    if (!title) {
        showNotification('Vennligst fyll inn minst en tittel først', 'warning');
        return;
    }

    // Format ingredients
    let formattedIngredients = '';
    if (ingredientsText) {
        const ingredients = parseIngredients(ingredientsText);
        ingredients.forEach(item => {
            if (typeof item === 'string') {
                formattedIngredients += item + ', ';
            } else if (item.group && item.items) {
                formattedIngredients += item.group + ': ' + item.items.join(', ') + '. ';
            }
        });
        formattedIngredients = formattedIngredients.trim().replace(/,$/, '');
    }

    // Format instructions
    let formattedInstructions = '';
    if (instructionsText) {
        const instructions = parseInstructions(instructionsText);
        formattedInstructions = instructions.join('. ');
    }

    // Build the AI prompt
    const aiPrompt = `Generate a high-quality advertisement image for a food presentation. The image should be a close-up shot at a 40-degree angle of a well-decorated and dramatically lit table, where the ready food product is the main focus point. Use welcoming colors that give a cozy, presenting vibe. Create a professional food photography style image with beautiful lighting and composition. Pay close attention to the dishs ingredients and procedure and typical design when composing the image.

        Recipe title: ${title || 'Not specified'}
        Description: ${description || 'Not specified'}
        Category: ${category || 'Not specified'} | Meal: ${meal || 'Not specified'} | Cuisine: ${cuisine || 'Not specified'}
        Ingredients: ${formattedIngredients || 'Not specified'}
        Instructions: ${formattedInstructions || 'Not specified'}

        The final dish should look appetizing, fresh, and professionally plated. Include appropriate table settings, garnishes, and background elements that complement the dish without overwhelming it. The lighting should be warm and inviting, highlighting the textures and colors of the food. The image should be widescreen. The image should contain no recipes and no text.`;

    try {
        await navigator.clipboard.writeText(aiPrompt);
        showNotification('Bildeprompt kopiert til utklippstavlen!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = aiPrompt;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Bildeprompt kopiert til utklippstavlen!', 'success');
    }
}

// Update image preview with better error handling
function updateImagePreview() {
    const imageUrl = document.getElementById('image').value.trim();
    const loadingState = document.getElementById('imageLoadingState');
    const errorState = document.getElementById('imageErrorState');
    const successState = document.getElementById('imageSuccessState');
    const previewImg = document.getElementById('imagePreview');

    // Clear any existing timeout
    if (imageLoadTimeout) {
        clearTimeout(imageLoadTimeout);
    }

    // Hide all states initially
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    successState.classList.add('hidden');

    if (!imageUrl) {
        return; // No URL provided, show nothing
    }

    // No validation needed - allow relative URLs, absolute URLs, and data URLs

    // Show loading state
    loadingState.classList.remove('hidden');

    // Create new image element to test loading
    const testImg = new Image();

    // Set timeout for slow loading
    imageLoadTimeout = setTimeout(() => {
        showImageError('Bildet tar for lang tid å laste. Sjekk URL-en og prøv igjen.');
        testImg.src = ''; // Cancel loading
    }, 10000); // 10 second timeout

    testImg.onload = function () {
        clearTimeout(imageLoadTimeout);
        // Image loaded successfully
        loadingState.classList.add('hidden');
        previewImg.src = imageUrl;
        successState.classList.remove('hidden');
    };

    testImg.onerror = function () {
        clearTimeout(imageLoadTimeout);
        let errorMsg = 'Kunne ikke laste bildet. ';

        // Try to provide more specific error messages
        if (imageUrl.includes('unsplash.com')) {
            errorMsg += 'Sjekk at Unsplash URL-en er korrekt formatert.';
        } else if (imageUrl.startsWith('./') || imageUrl.startsWith('../') || !imageUrl.includes('://')) {
            errorMsg += 'Relative URL funnet. Sjekk at bildefilen eksisterer på riktig sti.';
        } else if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
            errorMsg += 'Sjekk at lokal server kjører og at bildet er tilgjengelig.';
        } else {
            errorMsg += 'Sjekk at URL-en er riktig og at bildet er tilgjengelig.';
        }

        showImageError(errorMsg);
    };

    // Start loading the image
    testImg.src = imageUrl;
}

// Show image error
function showImageError(message) {
    const loadingState = document.getElementById('imageLoadingState');
    const errorState = document.getElementById('imageErrorState');
    const successState = document.getElementById('imageSuccessState');
    const errorMessage = document.getElementById('imageErrorMessage');

    loadingState.classList.add('hidden');
    successState.classList.add('hidden');
    errorMessage.textContent = message;
    errorState.classList.remove('hidden');
}

// Refresh image (force reload)
function refreshImage() {
    const imageUrl = document.getElementById('image').value.trim();
    if (!imageUrl) {
        showNotification('Ingen bilde-URL å oppdatere', 'warning');
        return;
    }

    const loadingState = document.getElementById('imageLoadingState');
    const errorState = document.getElementById('imageErrorState');
    const successState = document.getElementById('imageSuccessState');

    // Hide all states and show loading
    errorState.classList.add('hidden');
    successState.classList.add('hidden');
    loadingState.classList.remove('hidden');

    // Clear any existing timeout
    if (imageLoadTimeout) {
        clearTimeout(imageLoadTimeout);
    }

    // Force reload by adding a cache-busting parameter
    const separator = imageUrl.includes('?') ? '&' : '?';
    const tempUrl = imageUrl + separator + 't=' + Date.now();

    // Create new image element to test loading
    const testImg = new Image();

    // Set timeout for slow loading
    imageLoadTimeout = setTimeout(() => {
        showImageError('Bildet tar for lang tid å laste. Sjekk URL-en og prøv igjen.');
        testImg.src = ''; // Cancel loading
    }, 10000); // 10 second timeout

    testImg.onload = function () {
        clearTimeout(imageLoadTimeout);
        // Once loaded with cache buster, update the preview with original URL
        updateImagePreview();
    };

    testImg.onerror = function () {
        clearTimeout(imageLoadTimeout);
        updateImagePreview(); // This will show the error
    };

    testImg.src = tempUrl;
}

// Change sort order
function changeSortOrder(order) {
    currentSortOrder = order;
    localStorage.setItem('recipeSortOrder', order);
    renderRecipeList();
}

// Save current form state to history
function saveToHistory() {
    if (isApplyingHistory) return; // Don't save when applying history

    const currentState = getFormState();

    // Remove any states after current index
    history = history.slice(0, historyIndex + 1);

    // Add new state
    history.push(currentState);
    historyIndex++;

    // Limit history to 50 states
    if (history.length > 50) {
        history.shift();
        historyIndex--;
    }

    updateHistoryButtons();
}

// Get current form state
function getFormState() {
    return {
        recipeId: document.getElementById('recipeId').value,
        title: document.getElementById('title').value,
        provider: document.getElementById('provider').value,
        reference: document.getElementById('reference').value,
        pageNumber: document.getElementById('pageNumber').value,
        servings: document.getElementById('servings').value,
        category: document.getElementById('category').value,
        meal: document.getElementById('meal').value,
        cuisine: document.getElementById('cuisine').value,
        description: document.getElementById('description').value,
        image: document.getElementById('image').value,
        ingredients: document.getElementById('ingredients').value,
        instructions: document.getElementById('instructions').value
    };
}

// Apply form state from history
function applyFormState(state) {
    isApplyingHistory = true;
    document.getElementById('recipeId').value = state.recipeId || '';
    document.getElementById('title').value = state.title || '';
    document.getElementById('provider').value = state.provider || '';
    document.getElementById('reference').value = state.reference || '';
    document.getElementById('pageNumber').value = state.pageNumber || '';
    document.getElementById('servings').value = state.servings || '';
    document.getElementById('category').value = state.category || '';
    document.getElementById('meal').value = state.meal || '';
    document.getElementById('cuisine').value = state.cuisine || '';
    document.getElementById('description').value = state.description || '';
    document.getElementById('image').value = state.image || '';
    document.getElementById('ingredients').value = state.ingredients || '';
    document.getElementById('instructions').value = state.instructions || '';
    updateImagePreview();
    updateRecipeIdDisplay();
    updateDeleteButtonVisibility();
    isApplyingHistory = false;
}

// Undo action
function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        applyFormState(history[historyIndex]);
        updateHistoryButtons();
        updateActiveRecipe();
    }
}

// Redo action
function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        applyFormState(history[historyIndex]);
        updateHistoryButtons();
        updateActiveRecipe();
    }
}

// Update history buttons state
function updateHistoryButtons() {
    document.getElementById('undoBtn').disabled = historyIndex <= 0;
    document.getElementById('redoBtn').disabled = historyIndex >= history.length - 1;
}

// Recipe template for AI systems
function getRecipeTemplate() {
    return {
        title: "Oppskriftens navn (PÅKREVD)",
        servings: "Antall porsjoner, f.eks: '4 porsjoner' eller '12 stk.' (PÅKREVD)",
        provider: "Hvem oppskriften kommer fra (VALGFRITT, f.eks: 'Bestemor')",
        reference: "Kilde/kokebok (VALGFRITT, f.eks: 'Farmors bok')",
        pageNumber: "Sidenummer i kilden (VALGFRITT, tall)",
        category: "Kategori (VALGFRITT, f.eks: 'Brød', 'Kake', 'Grateng', 'Suppe')",
        meal: "Måltidstype (VALGFRITT, f.eks: 'Frokost', 'Middag', 'Dessert', 'Snacks')",
        cuisine: "Kjøkkentype (VALGFRITT, f.eks: 'Norsk', 'Italiensk', 'Asiatisk')",
        description: "Beskrivelse av retten - smak, tekstur, når den passer, tips (VALGFRITT men anbefalt)",
        ingredients: [
            "// For enkle oppskrifter, bruk array av strenger:",
            "500 g hvetemel",
            "2 dl melk",
            "// ELLER for grupperte ingredienser, bruk objekter:",
            {
                group: "Deig",
                items: ["500 g mel", "2 dl melk"]
            },
            {
                group: "Fyll",
                items: ["100 g sukker", "2 ss kanel"]
            }
        ],
        instructions: [
            "Første steg i oppskriften",
            "Andre steg med klare instruksjoner",
            "Tredje steg",
            "Fortsett med alle nødvendige steg",
            "Siste steg og serveringsforslag"
        ],
        image: "URL til bilde (VALGFRITT, kan være absolutt URL som https://images.unsplash.com/photo-XXX eller relativ sti som ./images/bilde.jpg)"
    };
}

// Update recipe ID display
function updateRecipeIdDisplay() {
    const recipeId = document.getElementById('recipeId').value;
    const display = document.getElementById('recipeIdDisplay');
    const regenerateBtn = document.getElementById('regenerateIdBtn');

    if (recipeId) {
        display.textContent = `ID: ${recipeId}`;
        regenerateBtn.classList.remove('hidden');
    } else {
        display.textContent = '';
        regenerateBtn.classList.add('hidden');
    }
}

// Regenerate recipe ID
function regenerateId() {
    const currentTitle = document.getElementById('title').value.trim();

    if (!currentTitle) {
        showNotification('Vennligst fyll inn en tittel først', 'warning');
        return;
    }

    const currentId = document.getElementById('recipeId').value;

    // Check if this ID is already in use
    if (currentId && recipeDatabase[currentId]) {
        if (!confirm('Dette vil endre oppskriftens ID. Den gamle IDen vil ikke lenger fungere. Er du sikker?')) {
            return;
        }

        // Get the current recipe data
        const recipeData = recipeDatabase[currentId];

        // Generate new ID
        const newId = generateId();

        // Move recipe to new ID
        recipeDatabase[newId] = { ...recipeData, id: newId };
        delete recipeDatabase[currentId];

        // Update form
        document.getElementById('recipeId').value = newId;

        // Save changes
        saveDatabase();
        renderRecipeList();
        updateRecipeIdDisplay();
        updateActiveRecipe();
        saveToHistory();

        showNotification('Ny ID generert!', 'success');
    } else {
        // Just generate a new ID if no recipe exists yet
        const newId = generateId();
        document.getElementById('recipeId').value = newId;
        updateRecipeIdDisplay();
        saveToHistory();
        showNotification('Ny ID generert!', 'success');
    }
}

// Update delete button visibility
function updateDeleteButtonVisibility() {
    const recipeId = document.getElementById('recipeId').value;
    const deleteBtn = document.getElementById('deleteBtn');
    if (recipeId && recipeDatabase[recipeId]) {
        deleteBtn.classList.remove('hidden');
    } else {
        deleteBtn.classList.add('hidden');
    }
}

// Copy template to clipboard
async function copyTemplate() {
    const template = getRecipeTemplate();
    const templateJson = JSON.stringify(template, null, 2);

    // Add the intro and outro text
    const fullTemplate = `Kan du lese og tolke den håndskrevne oppskriften i det vedlagte bildet? Tolk så mye som mulig fra oppskrift og bruk komplimentære kunnskap fra kjente oppskrifter fra norge på 60-80 tallet for å være sikker på at vi setter opp oppskriften riktig. Moderniser oppskriften ved å bruke moderne mål og beskrivelser. Folk på 60-70 tallet var ofte mye mer erfarne på kjøkkenet og trengte mindre hjelp. Når du er ferdig med dette konverter oppskriften til et JSON objekt med formatet under. Personen som laget oppskriften er Farmor, og kilden er Farmors oppskrifter. JSON FORMAT:

${templateJson}

VIKTIGE MERKNADER: - Tittel og porsjoner er PÅKREVD - Du trenger ikke spesifisere at det er fra 60-70 tallet i beskrivelsen - Alle andre felt er valgfrie - Tips i instruksjoner markeres med "TIP: " i starten av linjen - Ingredienser kan grupperes med objekter som vist i eksemplet - Moderniser gamle mål og beskrivelser`;

    try {
        await navigator.clipboard.writeText(fullTemplate);
        showNotification('Oppskriftmal kopiert til utklippstavlen! Bruk den med AI-systemer.', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = fullTemplate;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Oppskriftmal kopiert til utklippstavlen!', 'success');
    }
}

// Toggle export menu
function toggleExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.classList.toggle('show');

    // Close menu when clicking outside
    if (menu.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', closeExportMenu);
        }, 10);
    }
}

// Close export menu
function closeExportMenu(e) {
    const menu = document.getElementById('exportMenu');
    const button = event.target.closest('button');
    if (!button || !button.textContent.includes('Eksporter')) {
        menu.classList.remove('show');
        document.removeEventListener('click', closeExportMenu);
    }
}

// Notification system
function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');

    const bgColor = type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
            type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';

    const icon = type === 'success' ? '✓' :
        type === 'error' ? '✕' :
            type === 'warning' ? '⚠' : 'ℹ';

    notification.className = `notification pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${bgColor} max-w-md`;
    notification.innerHTML = `
                <span class="text-xl">${icon}</span>
                <span class="flex-1">${message}</span>
            `;

    container.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('hiding');
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize
function init() {
    loadDatabase();
    loadSortPreference();
    renderRecipeList();
    updateDataLists();

    // Initialize history with empty state
    saveToHistory();

    // Form submit handler
    document.getElementById('recipeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveRecipe();
    });

    // Click outside modal to close
    document.getElementById('previewModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closePreview();
        }
    });
}

// Load sort preference
function loadSortPreference() {
    const savedSort = localStorage.getItem('recipeSortOrder');
    if (savedSort) {
        currentSortOrder = savedSort;
        document.querySelector(`input[name="sortOrder"][value="${savedSort}"]`).checked = true;
    }
}

// Generate unique ID
function generateId() {
    return 'recipe_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Load database from localStorage
function loadDatabase() {
    const stored = localStorage.getItem('recipeDatabase');
    if (stored) {
        recipeDatabase = JSON.parse(stored);
    }
}

// Save database to localStorage
function saveDatabase() {
    localStorage.setItem('recipeDatabase', JSON.stringify(recipeDatabase));
}

// Update datalist suggestions
function updateDataLists() {
    const categories = new Set(defaultCategories);
    const meals = new Set(defaultMeals);
    const cuisines = new Set(defaultCuisines);

    // Add existing values from database
    Object.values(recipeDatabase).forEach(recipe => {
        if (recipe.category) categories.add(recipe.category);
        if (recipe.meal) meals.add(recipe.meal);
        if (recipe.cuisine) cuisines.add(recipe.cuisine);
    });

    // Update datalists
    document.getElementById('categoryList').innerHTML = Array.from(categories).map(c => `<option value="${c}">`).join('');
    document.getElementById('mealList').innerHTML = Array.from(meals).map(m => `<option value="${m}">`).join('');
    document.getElementById('cuisineList').innerHTML = Array.from(cuisines).map(c => `<option value="${c}">`).join('');
}

// Parse JSON input (handles both strict JSON and JavaScript object notation)
function parseJsonInput() {
    const jsonInput = document.getElementById('jsonPaste').value.trim();
    if (!jsonInput) return;

    try {
        let data;

        // First try parsing as strict JSON
        try {
            data = JSON.parse(jsonInput);
        } catch (e) {
            // Try to extract just the object if it's wrapped
            let cleanedInput = jsonInput;

            // Remove wrapping like "recipe_template": {...} or recipe_template: {...}
            const wrapperMatch = cleanedInput.match(/^["\']?[\w_]+["\']?\s*:\s*(\{[\s\S]*\})\s*$/);
            if (wrapperMatch) {
                cleanedInput = wrapperMatch[1];
            }

            // If that fails, try cleaning up JavaScript object notation
            try {
                // Clean up the JavaScript object notation to make it valid
                const jsObjectStr = cleanedInput
                    .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
                    .replace(/:\s*'([^']*)'/g, ':"$1"') // Convert single quotes to double
                    .replace(/,\s*}/g, '}') // Remove trailing commas
                    .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays

                data = JSON.parse(jsObjectStr);
            } catch (parseError) {
                // Last resort: use eval
                data = eval('(' + cleanedInput + ')');
            }
        }

        // Check if data is wrapped in a single key object (like { recipe_template: {...} })
        const keys = Object.keys(data);
        if (keys.length === 1 && typeof data[keys[0]] === 'object' && !Array.isArray(data[keys[0]])) {
            // Unwrap the nested object
            data = data[keys[0]];
        }

        // ALWAYS generate a new ID for JSON input (don't use provided ID)
        delete data.id;

        // If we have an active recipe that we're editing, keep its ID
        const currentId = document.getElementById('recipeId').value;
        if (currentId && recipeDatabase[currentId]) {
            data.id = currentId; // Keep current ID only if editing existing
        }

        populateForm(data);
        document.getElementById('jsonPaste').value = '';
        showNotification('JSON parsket! Gjennomgå og lagre oppskriften.', 'success');
        saveToHistory();
    } catch (e) {
        showNotification('Ugyldig format: ' + e.message, 'error');
    }
}

// Populate form with recipe data
function populateForm(recipe) {
    document.getElementById('recipeId').value = recipe.id || '';
    document.getElementById('title').value = recipe.title || '';
    document.getElementById('provider').value = recipe.provider || '';
    document.getElementById('reference').value = recipe.reference || '';
    document.getElementById('pageNumber').value = recipe.pageNumber || '';
    document.getElementById('servings').value = recipe.servings || '';
    document.getElementById('category').value = recipe.category || '';
    document.getElementById('meal').value = recipe.meal || '';
    document.getElementById('cuisine').value = recipe.cuisine || '';
    document.getElementById('description').value = recipe.description || '';
    document.getElementById('image').value = recipe.image || '';

    // Update image preview
    updateImagePreview();
    updateRecipeIdDisplay();
    updateDeleteButtonVisibility();

    // Handle ingredients - now with more flexible parsing
    if (recipe.ingredients) {
        let ingredientText = '';

        if (Array.isArray(recipe.ingredients)) {
            // Handle array format
            recipe.ingredients.forEach(item => {
                if (typeof item === 'string') {
                    // Skip comment lines from template
                    if (!item.startsWith('//')) {
                        ingredientText += item + '\n';
                    }
                } else if (item.group && item.items) {
                    // Handle {group: "name", items: [...]} format
                    ingredientText += `---${item.group}---\n`;
                    ingredientText += item.items.join('\n') + '\n';
                }
            });
        } else if (typeof recipe.ingredients === 'object') {
            // Handle object format like {deig: [...], fyll: [...]}
            Object.keys(recipe.ingredients).forEach(groupName => {
                const items = recipe.ingredients[groupName];
                if (Array.isArray(items) && items.length > 0) {
                    // Capitalize first letter of group name
                    const formattedGroupName = groupName.charAt(0).toUpperCase() + groupName.slice(1);
                    ingredientText += `---${formattedGroupName}---\n`;
                    ingredientText += items.join('\n') + '\n';
                }
            });
        }

        document.getElementById('ingredients').value = ingredientText.trim();
    }

    // Handle instructions
    if (recipe.instructions) {
        if (Array.isArray(recipe.instructions)) {
            document.getElementById('instructions').value = recipe.instructions.join('\n');
        } else if (typeof recipe.instructions === 'string') {
            document.getElementById('instructions').value = recipe.instructions;
        }
    }
}

// Parse ingredients text to structured format
function parseIngredients(text) {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const ingredients = [];
    let currentGroup = null;

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('---') && line.endsWith('---')) {
            // Group header
            const groupName = line.slice(3, -3).trim();
            currentGroup = { group: groupName, items: [] };
            ingredients.push(currentGroup);
        } else if (line) {
            // Regular ingredient
            if (currentGroup) {
                currentGroup.items.push(line);
            } else {
                ingredients.push(line);
            }
        }
    });

    // If all ingredients are strings, return simple array
    if (ingredients.every(item => typeof item === 'string')) {
        return ingredients;
    }

    // Filter out empty groups
    return ingredients.filter(item => {
        if (typeof item === 'string') return true;
        return item.items && item.items.length > 0;
    });
}

// Parse instructions text
function parseInstructions(text) {
    return text.trim().split('\n').filter(line => line.trim()).map(line => line.trim());
}

// Save recipe
function saveRecipe() {
    // Generate ID if not present
    let id = document.getElementById('recipeId').value;
    const isNew = !id;

    if (!id) {
        id = generateId();
        document.getElementById('recipeId').value = id;
    }

    const recipe = {
        id: id,
        title: document.getElementById('title').value.trim(),
        servings: document.getElementById('servings').value.trim()
    };

    // Add optional fields
    const provider = document.getElementById('provider').value.trim();
    if (provider) recipe.provider = provider;

    const reference = document.getElementById('reference').value.trim();
    if (reference) recipe.reference = reference;

    const pageNumber = document.getElementById('pageNumber').value.trim();
    if (pageNumber) recipe.pageNumber = parseInt(pageNumber);

    const category = document.getElementById('category').value.trim();
    if (category) recipe.category = category;

    const meal = document.getElementById('meal').value.trim();
    if (meal) recipe.meal = meal;

    const cuisine = document.getElementById('cuisine').value.trim();
    if (cuisine) recipe.cuisine = cuisine;

    const description = document.getElementById('description').value.trim();
    if (description) recipe.description = description;

    const image = document.getElementById('image').value.trim();
    if (image) recipe.image = image;

    // Parse and add ingredients
    const ingredientsText = document.getElementById('ingredients').value;
    if (ingredientsText) {
        recipe.ingredients = parseIngredients(ingredientsText);
    }

    // Parse and add instructions
    const instructionsText = document.getElementById('instructions').value;
    if (instructionsText) {
        recipe.instructions = parseInstructions(instructionsText);
    }

    // Add timestamp - preserve existing timestamp if updating
    recipe.createdAt = recipeDatabase[id]?.createdAt || new Date().toISOString().split('T')[0];

    // Save to database
    recipeDatabase[id] = recipe;
    saveDatabase();

    // Update UI but don't clear form
    document.getElementById('recipeId').value = id;
    updateRecipeIdDisplay();
    updateDeleteButtonVisibility();
    renderRecipeList();
    updateDataLists();
    updateActiveRecipe();
    saveToHistory();

    showNotification(`Oppskrift "${recipe.title}" ${isNew ? 'opprettet' : 'oppdatert'}!`, 'success');
}

// Delete recipe
function deleteRecipe() {
    const id = document.getElementById('recipeId').value;
    if (!id || !recipeDatabase[id]) return;

    const title = recipeDatabase[id].title;

    if (confirm(`Er du sikker på at du vil slette "${title}"?`)) {
        delete recipeDatabase[id];
        saveDatabase();
        renderRecipeList();
        clearForm();
        showNotification(`Oppskrift "${title}" slettet!`, 'warning');
    }
}

// Clear form
function clearForm() {
    document.getElementById('recipeForm').reset();
    document.getElementById('recipeId').value = '';

    // Hide all image preview states
    document.getElementById('imageLoadingState').classList.add('hidden');
    document.getElementById('imageErrorState').classList.add('hidden');
    document.getElementById('imageSuccessState').classList.add('hidden');

    updateRecipeIdDisplay();
    updateDeleteButtonVisibility();
    updateActiveRecipe();

    // Reset history
    history = [];
    historyIndex = -1;
    saveToHistory();
}

// Update active recipe highlight
function updateActiveRecipe() {
    const currentId = document.getElementById('recipeId').value;
    const items = document.querySelectorAll('.recipe-item');
    items.forEach(item => {
        if (item.dataset.recipeId === currentId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Sort recipes based on current sort order
function getSortedRecipes() {
    let recipes = Object.values(recipeDatabase);

    switch (currentSortOrder) {
        case 'alphabetical':
            recipes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;

        case 'person':
            recipes.sort((a, b) => {
                const providerA = a.provider || 'Zzz'; // Put empty at end
                const providerB = b.provider || 'Zzz';
                const providerCompare = providerA.localeCompare(providerB);
                if (providerCompare !== 0) return providerCompare;
                return (a.title || '').localeCompare(b.title || '');
            });
            break;

        case 'source':
            recipes.sort((a, b) => {
                const refA = a.reference || 'Zzz'; // Put empty at end
                const refB = b.reference || 'Zzz';
                const refCompare = refA.localeCompare(refB);
                if (refCompare !== 0) return refCompare;

                // If same reference, sort by page number
                const pageA = a.pageNumber || 99999;
                const pageB = b.pageNumber || 99999;
                if (pageA !== pageB) return pageA - pageB;

                // If same page, sort by title
                return (a.title || '').localeCompare(b.title || '');
            });
            break;

        case 'date':
            recipes.sort((a, b) => {
                const dateA = a.createdAt || '1970-01-01';
                const dateB = b.createdAt || '1970-01-01';
                const dateCompare = dateB.localeCompare(dateA); // Newest first
                if (dateCompare !== 0) return dateCompare;
                return (a.title || '').localeCompare(b.title || '');
            });
            break;
    }

    return recipes;
}

// Render recipe list
function renderRecipeList() {
    const list = document.getElementById('recipeList');
    const recipes = getSortedRecipes();

    const currentId = document.getElementById('recipeId').value;

    list.innerHTML = '';
    recipes.forEach(recipe => {
        const item = document.createElement('div');
        item.className = `recipe-item p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer ${recipe.id === currentId ? 'active' : ''}`;
        item.dataset.recipeId = recipe.id;

        // Build meta info based on sort order
        let metaInfo = [];
        if (currentSortOrder === 'person' && recipe.provider) {
            metaInfo.push(`👤 ${recipe.provider}`);
        } else if (currentSortOrder === 'source' && recipe.reference) {
            let sourceInfo = `📖 ${recipe.reference}`;
            if (recipe.pageNumber) sourceInfo += ` s.${recipe.pageNumber}`;
            metaInfo.push(sourceInfo);
        } else if (currentSortOrder === 'date' && recipe.createdAt) {
            metaInfo.push(`📅 ${recipe.createdAt}`);
        } else {
            if (recipe.category) metaInfo.push(recipe.category);
            if (recipe.meal) metaInfo.push(recipe.meal);
        }

        item.innerHTML = `
                    <div class="font-medium recipe-title">${recipe.title}</div>
                    <div class="text-xs recipe-meta">
                        ${metaInfo.join(' • ')}
                    </div>
                `;
        item.onclick = () => editRecipe(recipe.id);
        list.appendChild(item);
    });

    document.getElementById('recipeCount').textContent = `${recipes.length} oppskrifter`;
}

// Edit recipe
function editRecipe(id) {
    const recipe = recipeDatabase[id];
    if (!recipe) return;
    populateForm(recipe);
    updateActiveRecipe();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showNotification(`Redigerer "${recipe.title}"`, 'info');

    // Reset history for this recipe
    history = [];
    historyIndex = -1;
    saveToHistory();
}

// Preview recipe
function previewRecipe() {
    const title = document.getElementById('title').value.trim();
    if (!title) {
        showNotification('Vennligst fyll inn minst en tittel', 'warning');
        return;
    }

    // Build preview HTML
    let html = `<h3 class="text-xl font-bold text-gray-800">${title}</h3>`;

    const provider = document.getElementById('provider').value.trim();
    const reference = document.getElementById('reference').value.trim();
    const pageNumber = document.getElementById('pageNumber').value.trim();

    if (provider || reference) {
        html += '<div class="text-sm text-gray-600">';
        if (provider) html += `${provider}s oppskrift`;
        if (provider && reference) html += ' • ';
        if (reference) {
            html += `📖 ${reference}`;
            if (pageNumber) html += ` s.${pageNumber}`;
        }
        html += '</div>';
    }

    const servings = document.getElementById('servings').value.trim();
    if (servings) html += `<p class="text-sm text-gray-600 mb-2">Porsjoner: ${servings}</p>`;

    const meta = [];
    const category = document.getElementById('category').value.trim();
    if (category) meta.push(`Kategori: ${category}`);
    const meal = document.getElementById('meal').value.trim();
    if (meal) meta.push(`Måltid: ${meal}`);
    const cuisine = document.getElementById('cuisine').value.trim();
    if (cuisine) meta.push(`Kjøkken: ${cuisine}`);
    if (meta.length) html += `<p class="text-xs text-gray-500 mb-3">${meta.join(' • ')}</p>`;

    const description = document.getElementById('description').value.trim();
    if (description) html += `<p class="text-gray-700 mb-4">${description}</p>`;

    const image = document.getElementById('image').value.trim();
    if (image) html += `<img src="${image}" class="w-full h-48 object-cover rounded-lg mb-4">`;

    // Ingredients
    const ingredientsText = document.getElementById('ingredients').value.trim();
    if (ingredientsText) {
        const ingredients = parseIngredients(ingredientsText);
        html += '<h4 class="font-semibold text-gray-800 mb-2">Ingredienser:</h4>';
        html += '<div class="mb-4">';
        ingredients.forEach(item => {
            if (typeof item === 'string') {
                html += `<div class="text-gray-700">• ${item}</div>`;
            } else if (item.group) {
                html += `<div class="font-medium text-gray-700 mt-2">${item.group}:</div>`;
                item.items.forEach(ing => {
                    html += `<div class="text-gray-700 ml-4">• ${ing}</div>`;
                });
            }
        });
        html += '</div>';
    }

    // Instructions
    const instructionsText = document.getElementById('instructions').value.trim();
    if (instructionsText) {
        const instructions = parseInstructions(instructionsText);
        html += '<h4 class="font-semibold text-gray-800 mb-2">Fremgangsmåte:</h4>';
        html += '<ol class="list-decimal list-inside space-y-1">';
        instructions.forEach(inst => {
            html += `<li class="text-gray-700">${inst}</li>`;
        });
        html += '</ol>';
    }

    document.getElementById('previewContent').innerHTML = html;
    document.getElementById('previewModal').classList.remove('hidden');
}

// Close preview
function closePreview() {
    document.getElementById('previewModal').classList.add('hidden');
}

// Export database (to file or clipboard)
async function exportDatabase(method) {
    const recipes = getSortedRecipes(); // Use sorted recipes for export
    if (recipes.length === 0) {
        showNotification('Ingen oppskrifter å eksportere', 'warning');
        document.getElementById('exportMenu').classList.remove('show');
        return;
    }

    // Create compact format
    const compactJson = recipes.map(recipe =>
        JSON.stringify(recipe)
    ).join(',\n');

    const jsonContent = '[\n' + compactJson + '\n]';

    if (method === 'clipboard') {
        // Copy to clipboard
        try {
            await navigator.clipboard.writeText(jsonContent);
            showNotification(`${recipes.length} oppskrifter kopiert til utklippstavlen!`, 'success');
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = jsonContent;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showNotification(`${recipes.length} oppskrifter kopiert til utklippstavlen!`, 'success');
        }
    } else {
        // Export to file
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recipes_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification(`${recipes.length} oppskrifter eksportert til fil!`, 'success');
    }

    // Close menu
    document.getElementById('exportMenu').classList.remove('show');
}

// Import database
function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            const recipes = Array.isArray(imported) ? imported : [imported];

            let count = 0;
            recipes.forEach(recipe => {
                if (recipe.title) {
                    // Always generate new ID for imported recipes
                    recipe.id = generateId();
                    recipeDatabase[recipe.id] = recipe;
                    count++;
                }
            });

            saveDatabase();
            renderRecipeList();
            updateDataLists();
            showNotification(`${count} oppskrifter importert!`, 'success');
        } catch (err) {
            showNotification('Feil ved import: ' + err.message, 'error');
        }

        // Reset file input
        event.target.value = '';
    };
    reader.readAsText(file);
}

// Initialize on load
init();

