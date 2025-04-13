// Asynchronously fetch config and initialize Supabase
async function initializeSupabaseAdmin() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const config = await response.json();

        if (!config.url || !config.anonKey) {
            throw new Error('Fetched config is missing URL or anonKey.');
        }

        // Check if Supabase library is loaded
        if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
            throw new Error('Supabase client library not loaded.');
        }

        // Initialize and return the client
        return supabase.createClient(config.url, config.anonKey);

    } catch (error) {
        console.error('CRITICAL Error initializing Supabase:', error);
        alert('CRITICAL Error: Could not initialize Supabase client. Check console for details.');
        // Prevent further execution by returning null or re-throwing
        return null;
    }
}

// --- Global Variable for Supabase Client ---
let supabaseClient = null; // Will be initialized asynchronously

// --- DOM Elements ---
const loginSection = document.getElementById('login-section');
const adminContent = document.getElementById('admin-content');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginMessage = document.getElementById('login-message');

const researchForm = document.getElementById('research-form');
const researchMessage = document.getElementById('research-message');
const newsletterForm = document.getElementById('newsletter-form');
const newsletterMessage = document.getElementById('newsletter-message');
const teamForm = document.getElementById('team-form');
const teamMessage = document.getElementById('team-message');

// --- Admin List Display Functions ---

const adminResearchList = document.getElementById('admin-research-list');
const adminNewsletterList = document.getElementById('admin-newsletter-list');
const adminTeamList = document.getElementById('admin-team-list');

function renderAdminItem(item, type) {
    // Basic rendering, enhance as needed
    const title = item.title || item.name;
    const editButton = `<button data-id="${item.id}" data-type="${type}" class="edit-btn text-xs bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded">Edit</button>`;
    const deleteButton = `<button data-id="${item.id}" data-type="${type}" data-files='${JSON.stringify({ pdf: item.file_url, image: item.image_url })}' class="delete-btn text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded ml-1">Delete</button>`;
    
    // Add drag handle for team members
    const dragHandle = type === 'team' ? 
        `<div class="team-item-handle mr-2 flex-shrink-0 text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg></div>` : '';
    
    return `
        <div class="admin-item flex justify-between items-center p-2 border-b border-gray-200" data-item-id="${item.id}" ${type === 'team' ? `data-position="${item.position || 0}"` : ''}>
            <div class="flex items-center">
                ${dragHandle}
                <span class="text-sm text-gray-700">${title}</span>
            </div>
            <div>
                ${editButton}
                ${deleteButton}
            </div>
        </div>
    `;
}

async function displayAdminList(type) {
    let listElement, tableName, orderByField;
    switch(type) {
        case 'research': 
            listElement = adminResearchList; 
            tableName = 'research_papers'; 
            orderByField = 'title';
            break;
        case 'newsletter': 
            listElement = adminNewsletterList; 
            tableName = 'newsletters'; 
            orderByField = 'title';
            break;
        case 'team': 
            listElement = adminTeamList; 
            tableName = 'team_members'; 
            orderByField = 'position';
            break;
        default: return;
    }

    if (!listElement) return;
    listElement.innerHTML = 'Loading...';

    try {
        const { data, error } = await supabaseClient
            .from(tableName)
            .select('*') // Select all fields for editing
            .order(orderByField, { ascending: true });

        if (error) {
            console.error(`Error fetching admin ${type} list:`, error);
            listElement.innerHTML = `<p class="text-red-500">Error loading ${type} list.</p>`;
            return;
        }

        if (!data || data.length === 0) {
            listElement.innerHTML = `<p class="text-gray-500">No ${type} items found.</p>`;
            return;
        }

        listElement.innerHTML = data.map(item => renderAdminItem(item, type)).join('');
        
        // Add event listeners after rendering
        addAdminListEventListeners(listElement);
        
        // Initialize Sortable for team members list
        if (type === 'team') {
            initTeamSortable(listElement);
        }

    } catch (err) {
        console.error(`Exception fetching admin ${type} list:`, err);
        listElement.innerHTML = `<p class="text-red-500">Exception loading ${type} list.</p>`;
    }
}

function loadAllAdminLists() {
    displayAdminList('research');
    displayAdminList('newsletter');
    displayAdminList('team');
}

// --- Event Listeners for Edit/Delete (Placeholder) ---
function addAdminListEventListeners(listElement) {
    listElement.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEditClick);
    });
    listElement.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteClick);
    });
}

// Store the ID of the item being edited
let currentlyEditing = { type: null, id: null };

// Helper function to display current file info
function displayCurrentFile(elementId, fileUrl) {
    const displayArea = document.getElementById(elementId);
    if (!displayArea) return;

    if (fileUrl) {
        const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
        // Decode potential URL encoding in filename
        const decodedFileName = decodeURIComponent(fileName.split('?')[0]); // Remove query params if any

        displayArea.innerHTML = `
            Current file: <a href="${fileUrl}" target="_blank" class="text-blue-600 hover:underline">${decodedFileName}</a>
            <label class="ml-4">
                <input type="checkbox" name="remove_${elementId.replace('current-', '')}" class="remove-file-checkbox mr-1">
                Remove current file
            </label>
        `;
        displayArea.classList.remove('hidden');
    } else {
        displayArea.innerHTML = 'No current file.'; // Or keep hidden
        displayArea.classList.add('hidden'); // Ensure it's hidden if no file
    }
}

async function handleEditClick(event) {
    const button = event.target;
    const id = button.dataset.id;
    const type = button.dataset.type;
    console.log(`Edit clicked for type: ${type}, ID: ${id}`);

    let tableName, formElement, submitButton;
    let cancelButtonId;
    switch(type) {
        case 'research': 
            tableName = 'research_papers'; 
            formElement = researchForm; 
            submitButton = researchForm.querySelector('button[type="submit"]');
            cancelButtonId = 'cancel-edit-research';
            break;
        case 'newsletter': 
            tableName = 'newsletters'; 
            formElement = newsletterForm; 
            submitButton = newsletterForm.querySelector('button[type="submit"]');
            cancelButtonId = 'cancel-edit-newsletter';
            break;
        case 'team': 
            tableName = 'team_members'; 
            formElement = teamForm; 
            submitButton = teamForm.querySelector('button[type="submit"]');
            cancelButtonId = 'cancel-edit-team';
            break;
        default: 
            alert('Unknown item type for editing.'); 
            return;
    }

    const cancelButton = document.getElementById(cancelButtonId);

    // Fetch the full item data
    const { data: item, error } = await supabaseClient
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single(); // Expect only one item

    if (error || !item) {
        console.error(`Error fetching item ${type} ID ${id} for edit:`, error);
        alert('Could not load item data for editing.');
        return;
    }

    // Populate the form
    if (type === 'research') {
        formElement.querySelector('#research-title').value = item.title || '';
        formElement.querySelector('#research-description').value = item.description || '';
        displayCurrentFile('current-research-pdf', item.file_url);
        displayCurrentFile('current-research-image', item.image_url);
        formElement.querySelector('#research-pdf').value = null;
        formElement.querySelector('#research-image').value = null;
        // Mark PDF as not required during edit, handled in submit logic
        formElement.querySelector('#research-pdf').required = false; 
    } else if (type === 'newsletter') {
        formElement.querySelector('#newsletter-title').value = item.title || '';
        formElement.querySelector('#newsletter-description').value = item.description || '';
        displayCurrentFile('current-newsletter-pdf', item.file_url);
        displayCurrentFile('current-newsletter-image', item.image_url);
        formElement.querySelector('#newsletter-pdf').value = null;
        formElement.querySelector('#newsletter-image').value = null;
        formElement.querySelector('#newsletter-pdf').required = false;
    } else if (type === 'team') {
        formElement.querySelector('#team-name').value = item.name || '';
        formElement.querySelector('#team-role').value = item.role || '';
        formElement.querySelector('#team-description').value = item.description || '';
        displayCurrentFile('current-team-image', item.image_url);
        formElement.querySelector('#team-image').value = null;
    }

    // Store editing state
    currentlyEditing = { type: type, id: id };

    // Update button text and scroll form into view
    if (submitButton) submitButton.textContent = 'Update ' + type.charAt(0).toUpperCase() + type.slice(1);
    if (cancelButton) cancelButton.classList.remove('hidden'); // Show cancel button
    formElement.scrollIntoView({ behavior: 'smooth' });
}

// Reset editing state helper
function resetEditingState(formType) {
    let formElement, submitButton, cancelButtonId;
    if (formType === 'research') { 
        formElement = researchForm; 
        submitButton = formElement.querySelector('button[type="submit"]');
        cancelButtonId = 'cancel-edit-research'; 
    }
    else if (formType === 'newsletter') { 
        formElement = newsletterForm; 
        submitButton = formElement.querySelector('button[type="submit"]');
        cancelButtonId = 'cancel-edit-newsletter'; 
    }
    else if (formType === 'team') { 
        formElement = teamForm; 
        submitButton = formElement.querySelector('button[type="submit"]');
        cancelButtonId = 'cancel-edit-team'; 
    }
    
    if (formElement) formElement.reset();
    if (submitButton) { 
        // Reset submit button text more reliably
        if (formType === 'research') submitButton.textContent = 'Upload Research Paper';
        else if (formType === 'newsletter') submitButton.textContent = 'Upload Newsletter';
        else if (formType === 'team') submitButton.textContent = 'Add Team Member';
    }
    
    // Hide cancel button
    const cancelButton = document.getElementById(cancelButtonId);
    if (cancelButton) cancelButton.classList.add('hidden');

    // Hide current file displays
    if (formType === 'research') {
        document.getElementById('current-research-pdf')?.classList.add('hidden');
        document.getElementById('current-research-image')?.classList.add('hidden');
        // Restore required attribute for adding new
        researchForm.querySelector('#research-pdf').required = true;
    } else if (formType === 'newsletter') {
        document.getElementById('current-newsletter-pdf')?.classList.add('hidden');
        document.getElementById('current-newsletter-image')?.classList.add('hidden');
        newsletterForm.querySelector('#newsletter-pdf').required = true;
    } else if (formType === 'team') {
        document.getElementById('current-team-image')?.classList.add('hidden');
    }

    currentlyEditing = { type: null, id: null };
}

// Add listeners for Cancel buttons (call this once, e.g., on DOMContentLoaded or after initial auth check)
function setupCancelButtons() {
    document.getElementById('cancel-edit-research')?.addEventListener('click', () => resetEditingState('research'));
    document.getElementById('cancel-edit-newsletter')?.addEventListener('click', () => resetEditingState('newsletter'));
    document.getElementById('cancel-edit-team')?.addEventListener('click', () => resetEditingState('team'));
}

async function handleDeleteClick(event) {
    const button = event.target;
    const id = button.dataset.id;
    const type = button.dataset.type;
    const files = JSON.parse(button.dataset.files || '{}');
    const itemName = button.closest('.admin-item').querySelector('span').textContent;

    if (!confirm(`Are you sure you want to delete "${itemName}"? This cannot be undone.`)) {
        return;
    }

    console.log(`Attempting delete for type: ${type}, ID: ${id}, Files:`, files);
    button.disabled = true;
    button.textContent = 'Deleting...';

    let tableName;
    switch(type) {
        case 'research': tableName = 'research_papers'; break;
        case 'newsletter': tableName = 'newsletters'; break;
        case 'team': tableName = 'team_members'; break;
        default: 
            alert('Unknown item type for deletion.');
            button.disabled = false;
            button.textContent = 'Delete';
            return;
    }

    try {
        // 1. Delete files from Storage first
        const storageErrors = await deleteStorageFiles(files);
        if (storageErrors.length > 0) {
            // Log error but proceed to delete DB record anyway? Or stop?
            console.warn('Storage deletion errors:', storageErrors);
            // alert(`Warning: Could not delete some associated files: ${storageErrors.join(', ')}`);
        }

        // 2. Delete record from Database
        const { error: dbError } = await supabaseClient
            .from(tableName)
            .delete()
            .eq('id', id);

        if (dbError) {
            console.error(`Error deleting ${type} ID ${id} from DB:`, dbError);
            alert(`Failed to delete database record: ${dbError.message}`);
            button.disabled = false;
            button.textContent = 'Delete';
        } else {
            console.log(`Successfully deleted ${type} ID ${id}`);
            // Remove item from UI
            button.closest('.admin-item').remove();
            // No need for alert on success, UI removal is feedback
        }

    } catch (err) {
        console.error(`Exception during delete for ${type} ID ${id}:`, err);
        alert(`An unexpected error occurred during deletion: ${err.message}`);
        button.disabled = false;
        button.textContent = 'Delete';
    }
}

// --- Initial State ---
// Disable login button until Supabase client is ready
if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = 'Loading...'; // Indicate loading state
}

// --- Authentication Logic ---

loginButton?.addEventListener('click', async (e) => {
    e.preventDefault();
    loginMessage.textContent = ''; // Clear previous messages
    const email = emailInput?.value;
    // Password input is removed from HTML and logic

    if (!email) {
        showMessage(loginMessage, 'Email address is required.', true);
        return;
    }

    showMessage(loginMessage, 'Sending login link...'); // Give feedback

    try {
        // Use signInWithOtp for Magic Link
        const { error } = await supabaseClient.auth.signInWithOtp({
            email: email,
            options: {
                // Optional: Redirect URL after clicking the link in the email
                // Make sure this matches your Supabase Auth settings
                // emailRedirectTo: window.location.origin + '/admin.html' 
                emailRedirectTo: window.location.href // Redirect back to current admin page
            }
        });

        if (error) {
            console.error('Magic Link error:', error);
            showMessage(loginMessage, `Failed to send link: ${error.message}`, true);
        } else {
            // Show success message to the user
            showMessage(loginMessage, 'Login link sent! Please check your email (including spam folder). Link is valid for a short time.');
            emailInput.value = ''; // Clear email field on success
        }
    } catch (error) {
        console.error('Magic Link exception:', error);
        showMessage(loginMessage, `Sending exception: ${error.message || 'An unexpected error occurred'}`, true);
    }
});

logoutButton?.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error('Logout error:', error);
        alert(`Logout failed: ${error.message}`); // Use alert for logout errors as elements might be hidden
    }
    // Auth state change listener will handle UI update
});

// --- Form Submission Logic (UPDATED for Edit) ---

researchForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEditing = currentlyEditing.type === 'research' && currentlyEditing.id;
    const itemId = currentlyEditing.id;

    const formData = new FormData(researchForm);
    const title = formData.get('title');
    const description = formData.get('description');
    const pdfFile = formData.get('pdf');
    const imageFile = formData.get('image');
    const removePdf = formData.get('remove_current-research-pdf') === 'on';
    const removeImage = formData.get('remove_current-research-image') === 'on';

    showMessage(researchMessage, isEditing ? 'Updating...' : 'Uploading...');

    let finalPdfUrl = null;
    let finalImageUrl = null;
    let oldFiles = null;
    let fileToDelete = { pdf: null, image: null }; // Track files needing deletion

    if (isEditing) {
        const { data: oldItem } = await supabaseClient.from('research_papers').select('file_url, image_url').eq('id', itemId).single();
        oldFiles = { pdf: oldItem?.file_url, image: oldItem?.image_url };
        finalPdfUrl = oldFiles.pdf; // Start with existing URLs
        finalImageUrl = oldFiles.image;
    }

    // Handle PDF: Upload new, remove existing, or keep existing
    if (removePdf && isEditing) {
        finalPdfUrl = null;
        if (oldFiles?.pdf) fileToDelete.pdf = oldFiles.pdf;
    } else if (pdfFile?.size > 0) { 
        const newUrl = await uploadFile(pdfFile, 'research-pdfs');
        if (!newUrl) return showMessage(researchMessage, 'Failed to upload new PDF.', true); 
        finalPdfUrl = newUrl;
        if (oldFiles?.pdf && oldFiles.pdf !== newUrl) fileToDelete.pdf = oldFiles.pdf; // Delete old only if different
    }
    // Final check: PDF is required if *adding* new or if *removing* the old one without replacement
    if (!finalPdfUrl && (!isEditing || removePdf)) {
         return showMessage(researchMessage, 'A PDF file is required.', true);
    }
    
    // Handle Image: Upload new, remove existing, or keep existing
     if (removeImage && isEditing) {
        finalImageUrl = null;
        if (oldFiles?.image) fileToDelete.image = oldFiles.image;
    } else if (imageFile?.size > 0) {
        const newUrl = await uploadFile(imageFile, 'research-previews');
        if (!newUrl) {
             console.warn('Optional image upload failed. Proceeding without image update.');
             // Keep the existing image if upload fails
             finalImageUrl = isEditing ? oldFiles.image : null; 
        } else {
            finalImageUrl = newUrl;
            if (oldFiles?.image && oldFiles.image !== newUrl) fileToDelete.image = oldFiles.image;
        }
    }

    const dataToUpsert = {
        title: title,
        description: description,
        file_url: finalPdfUrl,
        image_url: finalImageUrl, 
    };

    let resultError = null;
    showMessage(researchMessage, isEditing ? 'Saving changes...' : 'Adding item...'); // Update message

    if (isEditing) {
        // UPDATE
        const { error } = await supabaseClient
            .from('research_papers')
            .update(dataToUpsert)
            .eq('id', itemId);
        resultError = error;
    } else {
        // INSERT
        const { error } = await supabaseClient
            .from('research_papers')
            .insert(dataToUpsert);
        resultError = error;
    }

    if (resultError) {
        console.error(`Error ${isEditing ? 'updating' : 'inserting'} research paper:`, resultError);
        showMessage(researchMessage, `Error saving data: ${resultError.message}`, true);
    } else {
         // Delete old files AFTER successful DB operation
         if (fileToDelete.pdf || fileToDelete.image) {
             console.log('Deleting old files:', fileToDelete);
             await deleteStorageFiles(fileToDelete);
         }

        showMessage(researchMessage, `Research paper ${isEditing ? 'updated' : 'added'} successfully!`);
        resetEditingState('research'); 
        displayAdminList('research'); 
    }
});

newsletterForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEditing = currentlyEditing.type === 'newsletter' && currentlyEditing.id;
    const itemId = currentlyEditing.id;

    const formData = new FormData(newsletterForm);
    const title = formData.get('title');
    const description = formData.get('description');
    const pdfFile = formData.get('pdf');
    const imageFile = formData.get('image');
    const removePdf = formData.get('remove_current-newsletter-pdf') === 'on';
    const removeImage = formData.get('remove_current-newsletter-image') === 'on';

    showMessage(newsletterMessage, isEditing ? 'Updating...' : 'Uploading...');
    
    let finalPdfUrl = null;
    let finalImageUrl = null;
    let oldFiles = null;
    let fileToDelete = { pdf: null, image: null };

    if (isEditing) {
        const { data: oldItem } = await supabaseClient.from('newsletters').select('file_url, image_url').eq('id', itemId).single();
        oldFiles = { pdf: oldItem?.file_url, image: oldItem?.image_url };
        finalPdfUrl = oldFiles.pdf;
        finalImageUrl = oldFiles.image;
    }

    // Handle PDF
    if (removePdf && isEditing) {
        finalPdfUrl = null;
        if (oldFiles?.pdf) fileToDelete.pdf = oldFiles.pdf;
    } else if (pdfFile?.size > 0) { 
        const newUrl = await uploadFile(pdfFile, 'newsletter-pdfs');
        if (!newUrl) return showMessage(newsletterMessage, 'Failed to upload new PDF.', true); 
        finalPdfUrl = newUrl;
         if (oldFiles?.pdf && oldFiles.pdf !== newUrl) fileToDelete.pdf = oldFiles.pdf;
    }
    if (!finalPdfUrl && (!isEditing || removePdf)) {
         return showMessage(newsletterMessage, 'A PDF file is required.', true);
    }
    
    // Handle Image
     if (removeImage && isEditing) {
        finalImageUrl = null;
        if (oldFiles?.image) fileToDelete.image = oldFiles.image;
    } else if (imageFile?.size > 0) {
        const newUrl = await uploadFile(imageFile, 'newsletter-previews');
        if (!newUrl) {
             console.warn('Optional newsletter image upload failed. Proceeding without image update.');
             finalImageUrl = isEditing ? oldFiles.image : null; 
        } else {
            finalImageUrl = newUrl;
            if (oldFiles?.image && oldFiles.image !== newUrl) fileToDelete.image = oldFiles.image;
        }
    }

    const dataToUpsert = {
        title: title,
        description: description,
        file_url: finalPdfUrl,
        image_url: finalImageUrl,
    };

    let resultError = null;
    showMessage(newsletterMessage, isEditing ? 'Saving changes...' : 'Adding item...');

    if (isEditing) {
        const { error } = await supabaseClient.from('newsletters').update(dataToUpsert).eq('id', itemId);
        resultError = error;
    } else {
        const { error } = await supabaseClient.from('newsletters').insert(dataToUpsert);
        resultError = error;
    }

    if (resultError) {
        console.error(`Error ${isEditing ? 'updating' : 'inserting'} newsletter:`, resultError);
        showMessage(newsletterMessage, `Error saving data: ${resultError.message}`, true);
    } else {
         if (fileToDelete.pdf || fileToDelete.image) {
             console.log('Deleting old newsletter files:', fileToDelete);
             await deleteStorageFiles(fileToDelete);
         }
        showMessage(newsletterMessage, `Newsletter ${isEditing ? 'updated' : 'added'} successfully!`);
        resetEditingState('newsletter');
        displayAdminList('newsletter');
    }
});

teamForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEditing = currentlyEditing.type === 'team' && currentlyEditing.id;
    const itemId = currentlyEditing.id;

    const formData = new FormData(teamForm);
    const name = formData.get('name');
    const role = formData.get('role');
    const description = formData.get('description');
    const imageFile = formData.get('image');
    const removeImage = formData.get('remove_current-team-image') === 'on';

    showMessage(teamMessage, isEditing ? 'Updating...' : 'Uploading...');

    let finalImageUrl = null;
    let oldFiles = null;
    let fileToDelete = { image: null };

    if (isEditing) {
        const { data: oldItem } = await supabaseClient.from('team_members').select('image_url').eq('id', itemId).single();
        oldFiles = { image: oldItem?.image_url };
        finalImageUrl = oldFiles.image;
    }

    // Handle Image
     if (removeImage && isEditing) {
        finalImageUrl = null;
        if (oldFiles?.image) fileToDelete.image = oldFiles.image;
    } else if (imageFile?.size > 0) {
        console.log("Team form: Image file detected, attempting upload..."); 
        // Use hyphenated bucket name
        const newUrl = await uploadFile(imageFile, 'team-images');
        console.log("Team form: Upload result URL:", newUrl); 
        if (!newUrl) {
             console.warn('Team image upload failed. Proceeding without image update.');
             finalImageUrl = isEditing ? oldFiles.image : null; 
        } else {
            finalImageUrl = newUrl;
             if (oldFiles?.image && oldFiles.image !== newUrl) fileToDelete.image = oldFiles.image;
        }
    } else {
        console.log("Team form: No new image file provided or remove not checked."); // Log: No image action
    }

    const dataToUpsert = {
        name: name,
        role: role,
        description: description,
        image_url: finalImageUrl, // This should be the URL if upload succeeded
    };
    console.log("Team form: Data to upsert:", dataToUpsert); // Log: Data before insert/update

    let resultError = null;
     showMessage(teamMessage, isEditing ? 'Saving changes...' : 'Adding item...');

    if (isEditing) {
        const { error } = await supabaseClient.from('team_members').update(dataToUpsert).eq('id', itemId);
        resultError = error;
    } else {
        const { error } = await supabaseClient.from('team_members').insert(dataToUpsert);
        resultError = error;
    }

    if (resultError) {
        console.error(`Error ${isEditing ? 'updating' : 'inserting'} team member:`, resultError);
        showMessage(teamMessage, `Error saving data: ${resultError.message}`, true);
    } else {
        if (fileToDelete.image) {
             console.log('Deleting old team image:', fileToDelete);
             await deleteStorageFiles(fileToDelete);
         }
        showMessage(teamMessage, `Team member ${isEditing ? 'updated' : 'added'} successfully!`);
        resetEditingState('team');
        displayAdminList('team');
    }
});

// --- Auth State Change Handling ---
/* MOVED to initializeAdminPortal:
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, 'Session:', session);
    const user = session?.user;

    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (user) {
            loginSection?.classList.add('hidden');
            adminContent?.classList.remove('hidden');
            loadAllAdminLists(); 
            setupCancelButtons(); 
        } else {
            loginSection?.classList.remove('hidden');
            adminContent?.classList.add('hidden');
        }
    } else if (event === 'SIGNED_OUT') {
        loginSection?.classList.remove('hidden');
        adminContent?.classList.add('hidden');
        if(adminResearchList) adminResearchList.innerHTML = '';
        if(adminNewsletterList) adminNewsletterList.innerHTML = '';
        if(adminTeamList) adminTeamList.innerHTML = '';
    }
});
*/

// --- Initial Check ---
async function checkInitialSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session?.user;
    setupCancelButtons();

    if (user) {
        loginSection?.classList.add('hidden');
        adminContent?.classList.remove('hidden');
        loadAllAdminLists(); 
    } else {
        loginSection?.classList.remove('hidden');
        adminContent?.classList.add('hidden');
    }
}

async function initializeAdminPortal() {
    try {
        supabaseClient = await initializeSupabaseAdmin();
        if (!supabaseClient) throw new Error("Supabase client initialization failed."); // Add check

        // SETUP AUTH LISTENER HERE, only after client is valid
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event, 'Session:', session);
            const user = session?.user;
        
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                if (user) {
                    loginSection?.classList.add('hidden');
                    adminContent?.classList.remove('hidden');
                    loadAllAdminLists(); 
                    setupCancelButtons(); 
                    // Ensure login button is disabled if user is signed in
                    if(loginButton) loginButton.disabled = true; 
                } else {
                    loginSection?.classList.remove('hidden');
                    adminContent?.classList.add('hidden');
                    // Re-enable login button if user is signed out and it exists
                    if(loginButton) {
                        loginButton.disabled = false;
                        loginButton.textContent = 'Send Login Link';
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                loginSection?.classList.remove('hidden');
                adminContent?.classList.add('hidden');
                if(adminResearchList) adminResearchList.innerHTML = '';
                if(adminNewsletterList) adminNewsletterList.innerHTML = '';
                if(adminTeamList) adminTeamList.innerHTML = '';
                 // Re-enable login button on sign out
                 if(loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Send Login Link';
                 }
            }
        });

        // Client is ready, check session
        await checkInitialSession(); 
        
        // Re-enable the login button IF the login section is still visible 
        // (This might be redundant now due to logic in onAuthStateChange, but safe to keep)
        if (loginButton && !loginSection.classList.contains('hidden')) {
            loginButton.disabled = false;
            loginButton.textContent = 'Send Login Link'; 
        }

    } catch (initError) {
        console.error("Initialization failed:", initError);
        loginMessage.textContent = 'Error loading admin portal configuration.';
        loginMessage.classList.add('text-red-500');
        if (loginButton) {
            loginButton.disabled = true; // Ensure it stays disabled on error
            loginButton.textContent = 'Error';
        }
    }
}

// --- Helper Functions (Add showMessage and getFormMessageElement back if needed) ---
function showMessage(element, message, isError = false) {
    if (!element) return;
    element.textContent = message;
    element.className = `text-sm mt-2 ${isError ? 'text-red-500' : 'text-green-500'}`;
    setTimeout(() => { element.textContent = ''; }, 5000);
}

async function uploadFile(file, bucketName, fileName = null) {
    if (!file) return null;
    const filePath = `${Date.now()}-${fileName || file.name}`.replace(/\s+/g, '_');
    try {
        // Assume buckets are created manually in dashboard
        const { data, error } = await supabaseClient.storage
            .from(bucketName)
            .upload(filePath, file);
        if (error) {
            console.error(`Error uploading ${file.name} to ${bucketName}:`, error);
            showMessage(getFormMessageElement(bucketName), `Error uploading file: ${error.message}`, true);
            return null;
        }
        const { data: urlData } = supabaseClient.storage.from(bucketName).getPublicUrl(filePath);
        return urlData?.publicUrl || null;
    } catch (uploadError) {
        console.error(`Exception during upload to ${bucketName}:`, uploadError);
        showMessage(getFormMessageElement(bucketName), `Upload exception: ${uploadError.message}`, true);
        return null;
    }
}

function getFormMessageElement(bucketOrFormType) {
    if (bucketOrFormType.includes('research')) return researchMessage;
    if (bucketOrFormType.includes('newsletter')) return newsletterMessage;
    if (bucketOrFormType.includes('team')) return teamMessage;
    return null;
}

// Helper to extract file path from public URL for deletion
function getPathFromUrl(url) {
    if (!url) return null;
    try {
        const parsedUrl = new URL(url);
        // Path is usually after /object/public/bucket_name/
        const pathSegments = parsedUrl.pathname.split('/');
        if (pathSegments.length > 4) {
            return pathSegments.slice(4).join('/');
        }
    } catch (e) {
        console.error('Error parsing URL for path:', url, e);
    }
    return null;
}

// Helper to delete files from storage
async function deleteStorageFiles(filesToDelete) {
    const pathsToDelete = [];
    const bucketMap = {
        'research-pdfs': [],
        'research-previews': [],
        'newsletter-pdfs': [],
        'newsletter-previews': [],
        'team-images': []
    };

    // Categorize paths by bucket based on URL hints or known structure
    if (filesToDelete.pdf) {
        const pdfPath = getPathFromUrl(filesToDelete.pdf);
        if (pdfPath) {
            // Use hyphenated names for matching
            if (filesToDelete.pdf.includes('/research-pdfs/')) bucketMap['research-pdfs'].push(pdfPath);
            else if (filesToDelete.pdf.includes('/newsletter-pdfs/')) bucketMap['newsletter-pdfs'].push(pdfPath);
        }
    }
    if (filesToDelete.image) {
        const imgPath = getPathFromUrl(filesToDelete.image);
        if (imgPath) {
            // Use hyphenated names for matching
            if (filesToDelete.image.includes('/research-previews/')) bucketMap['research-previews'].push(imgPath);
            else if (filesToDelete.image.includes('/newsletter-previews/')) bucketMap['newsletter-previews'].push(imgPath);
            else if (filesToDelete.image.includes('/team-images/')) bucketMap['team-images'].push(imgPath);
        }
    }

    let errors = [];
    for (const [bucketName, paths] of Object.entries(bucketMap)) {
        if (paths.length > 0) {
            console.log(`Deleting from ${bucketName}:`, paths);
            const { error } = await supabaseClient.storage.from(bucketName).remove(paths);
            if (error) {
                console.error(`Error deleting from ${bucketName}:`, error);
                errors.push(error.message);
            }
        }
    }
    return errors;
}

// --- Initialization ---
// Start the initialization process when the script loads
document.addEventListener('DOMContentLoaded', initializeAdminPortal); 

// Function to initialize Sortable for team members
function initTeamSortable(listElement) {
    if (typeof Sortable === 'undefined') {
        console.error('Sortable library not loaded');
        return;
    }
    
    if (listElement.sortableInstance) {
        listElement.sortableInstance.destroy();
    }
    
    listElement.sortableInstance = new Sortable(listElement, {
        handle: '.team-item-handle',
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: async function(evt) {
            await updateTeamPositions(listElement);
        }
    });
}

// Function to update team positions after drag & drop
async function updateTeamPositions(listElement) {
    const teamItems = Array.from(listElement.querySelectorAll('.admin-item'));
    
    // First, update the local positions
    teamItems.forEach((item, index) => {
        item.dataset.position = index + 1;
    });
    
    try {
        // Prepare batch update
        const updates = teamItems.map((item, index) => ({
            id: item.dataset.itemId,
            position: index + 1
        }));
        
        // Send batch update to Supabase
        const { error } = await supabaseClient
            .from('team_members')
            .upsert(updates, { onConflict: 'id' });
            
        if (error) {
            console.error('Error updating team positions:', error);
            alert('Failed to save new team order. Please try again.');
        } else {
            console.log('Team positions updated successfully');
        }
    } catch (err) {
        console.error('Exception updating team positions:', err);
        alert('An unexpected error occurred while saving team order.');
    }
} 