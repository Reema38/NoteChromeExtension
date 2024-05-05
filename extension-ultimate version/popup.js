// Save or update notes to Chrome's local storage
function saveNote() {
    let noteTitle = document.getElementById('note-title').value || new Date().toLocaleString();
    let noteContent = document.getElementById('note-input').value;
    let securityQuestion = document.getElementById('security-question').value;
    let securityAnswer = document.getElementById('security-answer').value;

    if (noteContent.trim() && securityQuestion.trim() && securityAnswer.trim()) {
        chrome.storage.local.get({ notes: [] }, function (data) {
            let notes = data.notes;
            let encryptedContent = encryptNote(noteContent, "Bahrain");

            let noteData = {
                title: noteTitle,
                content: encryptedContent,
                securityQuestion: securityQuestion,
                securityAnswer: securityAnswer
            };

            if (document.getElementById('note-index') && document.getElementById('note-index').value !== '') {
                let index = parseInt(document.getElementById('note-index').value, 10);
                notes[index] = noteData;
                document.getElementById('note-index').value = '';
            } else {
                notes.push(noteData);
            }

            chrome.storage.local.set({ notes: notes }, function () {
                displayNotes();
                document.getElementById('note-title').value = '';
                document.getElementById('note-input').value = '';
                document.getElementById('security-question').value = '';
                document.getElementById('security-answer').value = '';
            });
        });
    } else {
        alert('Please fill out all fields.');
    }
}


function clearInputs() {
    document.getElementById('note-title').value = '';
    document.getElementById('note-input').value = '';
    document.getElementById('security-question').value = '';
    document.getElementById('security-answer').value = '';
    document.getElementById('note-index').value = '';
}





// Utility function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Utility function to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
}









// Display all notes
function displayNotes() {
    let savedNotesDiv = document.getElementById('saved-notes');
    savedNotesDiv.innerHTML = '';

    chrome.storage.local.get({ notes: [] }, function (data) {
        data.notes.forEach((note, index) => {
            if (!note || !note.title) {
                return; // Skip this iteration if the note is null or title is missing
            }

            let noteDiv = document.createElement('div');
            noteDiv.classList.add('note-div');

            let titleDiv = document.createElement('div');
            titleDiv.textContent = note.title; // This should now be safe

            titleDiv.classList.add('note-title'); // Add a CSS class to style the title

            noteDiv.appendChild(titleDiv);

            let contentDiv = document.createElement('div');
            contentDiv.textContent = getRandomSubstrings(note.content, 25);
            noteDiv.appendChild(contentDiv);

            let buttonsDiv = document.createElement('div');
            buttonsDiv.classList.add('buttons-div');

            let readButton = document.createElement('button');
            readButton.textContent = '📖';
            readButton.title = 'Read Note'; // Tooltip text
            readButton.onclick = function () { readNote(index); };
            buttonsDiv.appendChild(readButton);

            let deleteButton = document.createElement('button');
            deleteButton.textContent = '🗑️';
            deleteButton.title = 'Delete Note'; // Tooltip text
            deleteButton.onclick = function () { deleteNote(index); };
            buttonsDiv.appendChild(deleteButton);

            let modifyButton = document.createElement('button');
            modifyButton.textContent = '✏️';
            modifyButton.title = 'Modify Note'; // Tooltip text
            modifyButton.onclick = function () { modifyNote(index); };
            buttonsDiv.appendChild(modifyButton);

            noteDiv.appendChild(buttonsDiv);
            savedNotesDiv.appendChild(noteDiv);
        });
    });
}


function modifyNote(index) {
    chrome.storage.local.get({ notes: [] }, function (data) {
        let note = data.notes[index];

        // Prompt the user for the answer to the security question
        let userAnswer = prompt(note.securityQuestion);
        let storedAnswer = note.securityAnswer;

        // Check if the provided answer matches the stored answer
        if (userAnswer === storedAnswer) {
            // If the answer is correct, allow the user to modify the note
            document.getElementById('note-title').value = note.title;
            document.getElementById('note-input').value = decryptNote(note.content, "Bahrain");
            document.getElementById('note-input').focus();

            // Store the index in a hidden field for later use
            if (!document.getElementById('note-index')) {
                let noteIndex = document.createElement('input');
                noteIndex.type = 'hidden';
                noteIndex.id = 'note-index';
                document.body.appendChild(noteIndex);
            }
            document.getElementById('note-index').value = index;
        } else {
            // If the answer is incorrect, display an error message
            alert('Incorrect answer to the security question.');
        }
    });
}


// Delete a note
function deleteNote(index) {
    chrome.storage.local.get({ notes: [] }, function (data) {
        let notes = data.notes;
        if (confirm("Are you sure you want to delete this note?")) {
            notes.splice(index, 1);
            chrome.storage.local.set({ notes: notes }, displayNotes);
        }
    });
}

// Exit read mode
function exitReadMode() {
    document.getElementById('note-title').disabled = false;
    document.getElementById('note-input').disabled = false;
    document.getElementById('save-note').disabled = false;
    document.getElementById('security-question').disabled = false;
    document.getElementById('security-answer').disabled = false;

    // Clear the inputs and hide the "Exit Read Mode" button
    document.getElementById('note-title').value = '';
    document.getElementById('note-input').value = '';
    document.getElementById('security-question').value = '';
    document.getElementById('security-answer').value = '';
    document.getElementById('exit-read-mode').style.display = 'none';
}

// Read a note
function readNote(index) {
    chrome.storage.local.get({ notes: [] }, function (data) {
        let note = data.notes[index];

        // Prompt the user for the answer to the security question
        let userAnswer = prompt(note.securityQuestion);

        // Decrypt the stored answer for comparison
        let StoredAnswer = note.securityAnswer;

        // Check if the provided answer matches the decrypted stored answer
        if (userAnswer === StoredAnswer) {
            // If the answer is correct, display the note content and title
            document.getElementById('note-title').value = note.title;
            document.getElementById('note-input').value = decryptNote(note.content, "Bahrain");
            document.getElementById('security-question').value = note.securityQuestion; // Display security question
            document.getElementById('security-answer').value = ''; // Clear security answer field for security

            // Disable the input fields and the "Save Note" button
            document.getElementById('note-title').disabled = true;
            document.getElementById('note-input').disabled = true;
            document.getElementById('save-note').disabled = true;
            document.getElementById('security-question').disabled = true; // Disable security question field
            document.getElementById('security-answer').disabled = true; // Disable security answer field

            // Show the "Exit Read Mode" button
            document.getElementById('exit-read-mode').style.display = 'inline';
        } else {
            // If the answer is incorrect, display an error message
            alert('Incorrect answer to the security question.');
        }
    });
}


// Encrypt the note content
function encryptNote(content, passphrase) {
    return CryptoJS.AES.encrypt(content, passphrase).toString();
}

// Decrypt the note content
function decryptNote(ciphertext, passphrase) {
    var bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Function to get random substrings from the note content
function getRandomSubstrings(content, length) {
    let result = '';
    while (result.length < length && content.length > 0) {
        let randomIndex = Math.floor(Math.random() * content.length);
        let randomLength = Math.min(content.length - randomIndex, Math.floor(Math.random() * (length - result.length + 1)));
        result += content.substring(randomIndex, randomIndex + randomLength) + (result.length + randomLength < length ? '...' : '');
    }
    return result;
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('save-note').addEventListener('click', saveNote);
    document.getElementById('exit-read-mode').addEventListener('click', exitReadMode);
    displayNotes();
});

