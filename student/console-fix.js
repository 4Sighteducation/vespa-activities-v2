// PASTE THIS INTO YOUR CONSOLE TO FIX THE MODAL IMMEDIATELY:

// 1. Fix the backdrop opacity
document.querySelector('.welcome-modal-backdrop').style.background = 'rgba(0, 0, 0, 0.6)';

// 2. Fix the modal content positioning
let modalContent = document.querySelector('.new-user-welcome .welcome-modal-content');
if (modalContent) {
    modalContent.style.position = 'fixed';
    modalContent.style.top = '50%';
    modalContent.style.left = '50%';
    modalContent.style.transform = 'translate(-50%, -50%)';
    modalContent.style.background = 'white';
    modalContent.style.borderRadius = '20px';
    modalContent.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)';
}

// 3. Fix the grid display
let gridContainer = document.querySelector('.how-it-works-grid');
if (gridContainer) {
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    gridContainer.style.gridTemplateRows = 'repeat(2, 1fr)';
    gridContainer.style.gap = '20px';
    gridContainer.style.marginTop = '20px';
}

// 4. Style the grid items
let gridItems = document.querySelectorAll('.how-it-works-item');
gridItems.forEach(item => {
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '15px';
    item.style.padding = '15px';
    item.style.background = 'white';
    item.style.borderRadius = '10px';
    item.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
    item.style.border = '1px solid #e0e0e0';
});

// 5. Style the step numbers
let stepNumbers = document.querySelectorAll('.step-number');
stepNumbers.forEach(num => {
    num.style.display = 'flex';
    num.style.alignItems = 'center';
    num.style.justifyContent = 'center';
    num.style.width = '40px';
    num.style.height = '40px';
    num.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    num.style.color = 'white';
    num.style.borderRadius = '50%';
    num.style.fontWeight = 'bold';
    num.style.fontSize = '18px';
    num.style.flexShrink = '0';
});

// 6. Fix the overlay z-index
document.querySelector('.new-user-welcome').style.display = 'flex';
document.querySelector('.new-user-welcome').style.alignItems = 'center';
document.querySelector('.new-user-welcome').style.justifyContent = 'center';

console.log('Modal styles fixed! The backdrop should now be semi-transparent and the grid should be visible.');
