// PASTE THIS INTO CONSOLE TO UPDATE THE LAYOUT:

// 1. Update the welcome sections container to use a better grid
let sectionsContainer = document.querySelector('.welcome-sections');
if (sectionsContainer) {
    sectionsContainer.style.display = 'grid';
    sectionsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    sectionsContainer.style.gap = '20px';
    sectionsContainer.style.marginBottom = '30px';
}

// 2. Make the first section (Smart Activity) span full width
let firstSection = document.querySelector('.welcome-section:first-child');
if (firstSection) {
    firstSection.style.gridColumn = '1 / -1'; // Span full width
    firstSection.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))';
    firstSection.style.border = '2px solid #667eea';
    firstSection.style.padding = '30px';
}

// 3. Make the text bigger in the first section
let firstSectionH3 = firstSection?.querySelector('h3');
if (firstSectionH3) {
    firstSectionH3.style.fontSize = '20px';
    firstSectionH3.style.marginBottom = '15px';
    firstSectionH3.style.color = '#667eea';
}

let firstSectionP = firstSection?.querySelector('p');
if (firstSectionP) {
    firstSectionP.style.fontSize = '16px';
    firstSectionP.style.lineHeight = '1.6';
}

// 4. Update the icon for the first section
let firstSectionIcon = firstSection?.querySelector('.section-icon');
if (firstSectionIcon) {
    firstSectionIcon.style.fontSize = '48px';
    firstSectionIcon.style.marginBottom = '15px';
}

// 5. Style the other two sections
let otherSections = document.querySelectorAll('.welcome-section:not(:first-child)');
otherSections.forEach(section => {
    section.style.padding = '25px';
    section.style.background = '#f9f9f9';
    section.style.borderRadius = '12px';
    section.style.border = '1px solid #e0e0e0';
});

console.log('Layout updated! Smart Activity Suggestions now spans full width with larger text.');
