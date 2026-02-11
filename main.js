
document.addEventListener('DOMContentLoaded', () => {
    // Get modal elements
    const loginModal = document.getElementById('login-modal');
    const registerMenuModal = document.getElementById('register-menu-modal');

    // Get buttons that open the modals
    const loginButton = document.getElementById('login-button');
    const registerMenuButton = document.getElementById('register-menu-button');

    // Get elements that close the modals
    const closeButtons = document.querySelectorAll('.modal .close-button');
    const cancelButtons = document.querySelectorAll('.modal .modal-actions .action-button:first-child');

    // Function to open a modal
    function openModal(modal) {
        modal.style.display = 'flex';
    }

    // Function to close a modal
    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // Event listeners for opening modals
    if (loginButton) {
        loginButton.addEventListener('click', () => openModal(loginModal));
    }
    if (registerMenuButton) {
        registerMenuButton.addEventListener('click', () => openModal(registerMenuModal));
    }

    // Event listeners for closing modals
    closeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            closeModal(event.target.closest('.modal'));
        });
    });

    cancelButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            closeModal(event.target.closest('.modal'));
        });
    });

    // Close modal if user clicks outside of the modal content
    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            closeModal(loginModal);
        }
        if (event.target === registerMenuModal) {
            closeModal(registerMenuModal);
        }
    });
});