// 1. 데이터 상태 관리
let menuLibrary = [
    { id: 1, name: '제육볶음', category: '한식', optionText: '제육' },
    { id: 2, name: '돈까스', category: '일식', optionText: '돈까스' },
    { id: 3, name: '된장찌개', category: '한식', optionText: '된장' }
];

// 2. 초기 로드 시 실행
window.onload = () => {
    renderMenuList();
};

// 3. 새 메뉴 등록 함수 (HTML의 onclick="addNewMenu()"와 연결)
window.addNewMenu = function() {
    const nameInput = document.getElementById('menu-name');
    const categoryInput = document.getElementById('menu-category-input');
    const optionInput = document.getElementById('menu-option-text');

    if (!nameInput.value.trim()) {
        alert('메뉴명을 입력해주세요!');
        return;
    }

    const newMenu = {
        id: Date.now(),
        name: nameInput.value,
        category: categoryInput.value || '미분류',
        optionText: optionInput.value || nameInput.value
    };

    menuLibrary.push(newMenu);
    
    // 입력창 초기화
    nameInput.value = '';
    categoryInput.value = '';
    optionInput.value = '';

    renderMenuList();
};

// 4. 메뉴 리스트 렌더링
window.renderMenuList = function() {
    const container = document.getElementById('menu-list');
    if (!container) return;

    container.innerHTML = '';
    
    menuLibrary.forEach(menu => {
        const card = document.createElement('div');
        card.className = 'menu-item-card';
        // 클릭 시 해당 메뉴명이 식단표로 들어가도록 설정
        card.onclick = () => insertToSelectedGrid(menu.optionText);
        
        card.innerHTML = `
            <div class="menu-info">
                <span class="category-tag">${menu.category}</span>
                <strong class="menu-title">${menu.name}</strong>
                <p class="menu-option">클릭 시 식단 입력</p>
            </div>
            <button class="btn-delete" onclick="event.stopPropagation(); deleteMenu(${menu.id})">×</button>
        `;
        container.appendChild(card);
    });
};

// 5. 메뉴 삭제
window.deleteMenu = function(id) {
    menuLibrary = menuLibrary.filter(m => m.id !== id);
    renderMenuList();
};

// 6. 식단표 그리드 생성 (HTML의 onclick="generateMealGrid()"와 연결)
window.generateMealGrid = function() {
    const weekLength = document.getElementById('week-length').value;
    const startDate = document.getElementById('start-date').value;
    const gridContainer = document.getElementById('meal-plan-grid');

    if (!startDate) {
        alert('시작일을 선택해주세요!');
        return;
    }

    let html = `<table class="meal-table">
        <thead>
            <tr>
                <th>주차</th>
                <th>월</th><th>화</th><th>수</th><th>목</th><th>금</th>
            </tr>
        </thead>
        <tbody>`;

    for (let i = 1; i <= weekLength; i++) {
        html += `<tr>
            <td>${i}주차</td>
            ${[1, 2, 3, 4, 5].map(() => `<td class="drop-zone" contenteditable="true" onclick="selectGrid(this)"></td>`).join('')}
        </tr>`;
    }

    html += `</tbody></table>`;
    gridContainer.innerHTML = html;
};

// 7. 식단표 칸 선택 및 메뉴 자동 입력 로직
let selectedCell = null;

window.selectGrid = function(cell) {
    // 이전에 선택된 칸의 강조 제거
    if (selectedCell) selectedCell.style.background = '#fff';
    
    selectedCell = cell;
    selectedCell.style.background = '#f0f3ff'; // 선택 강조
};

function insertToSelectedGrid(text) {
    if (!selectedCell) {
        alert('식단표에서 입력할 칸을 먼저 클릭해주세요!');
        return;
    }
    selectedCell.innerText = text;
    // 입력 후 다음 칸으로 자동 이동하는 로직을 추가할 수도 있습니다.
}