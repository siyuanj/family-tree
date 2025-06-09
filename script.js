google.charts.load('current', { packages:['orgchart', 'timeline'] });
google.charts.setOnLoadCallback(initialize);

// 全局变量
let orgChart, timelineChart;
let familyData = [];
let focalPersonId = 'JiangSiyuan';
let selectedPersonId = null;
let currentView = 'orgchart';
const LOCAL_STORAGE_KEY = 'familyTreeData_v3';

// --- 初始化 ---
function initialize() {
    orgChart = new google.visualization.OrgChart(document.getElementById('orgchart_div'));
    timelineChart = new google.visualization.Timeline(document.getElementById('timeline_div'));
    
    // 绑定UI事件
    document.getElementById('orgchart_div').addEventListener('click', handleNodeClick);
    document.getElementById('addBtn').addEventListener('click', addMember);
    document.getElementById('saveBtn').addEventListener('click', saveChanges);
    document.getElementById('cancelBtn').addEventListener('click', closeEditModal);
    document.getElementById('editModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeEditModal(); });
    document.getElementById('exportBtn').addEventListener('click', exportDataToFile);
    document.getElementById('import-file').addEventListener('change', importDataFromFile);
    document.getElementById('resetBtn').addEventListener('click', resetToDefault);
    
    // 使用 setTimeout 确保在 DOM 完全渲染和计算后才加载数据和绘图
    setTimeout(loadData, 100);
    // [新增] 主题切换逻辑
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.dataset.theme;
            document.body.className = ''; // 先清除所有 class
            document.body.classList.add(`theme-${theme}`);

            // 更新按钮的激活状态
            themeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 可选：将主题选择保存到 localStorage
            localStorage.setItem('familyTreeTheme', theme);
        });
    });

    // [新增] 页面加载时，应用上次保存的主题
    const savedTheme = localStorage.getItem('familyTreeTheme');
    if (savedTheme) {
        const savedThemeButton = document.querySelector(`.theme-btn[data-theme="${savedTheme}"]`);
        if (savedThemeButton) {
            savedThemeButton.click(); // 模拟点击以应用主题和样式
        }
    } else {
        // 默认激活亮色模式按钮
         document.querySelector('.theme-btn[data-theme="light"]').classList.add('active');
    }
}

// --- 数据与绘图核心 ---
function loadData(dataArray = null) {
    console.log("Loading data...");
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    // 注意：initialFamilyData 来自 data.js 文件
    familyData = dataArray || (savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(initialFamilyData)));
    
    console.log("Family data loaded:", familyData);

    if (!familyData.find(p => p.id === focalPersonId)) {
        focalPersonId = familyData.length > 0 ? familyData[0].id : null;
    }
    redrawAll();
}

function saveDataAndRedraw() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(familyData));
    redrawAll();
}

function redrawAll() {
    drawCurrentView();
    updateAllDropdowns();
    updateDetailsPanel();
}

function drawCurrentView() {
    if (currentView === 'orgchart') drawOrgChart();
    else if (currentView === 'timeline') drawTimelineChart();
}

function drawOrgChart() {
    if (!familyData || familyData.length === 0) {
        document.getElementById('orgchart_div').innerHTML = "<p>家谱为空,请添加成员。</p>";
        return;
    }
    const dataTable = buildDataTableForFocalPerson(focalPersonId);
    orgChart.draw(dataTable, { allowHtml: true, allowCollapse: true });
}

function buildDataTableForFocalPerson(personId) {
    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'Name');
    dataTable.addColumn('string', 'Manager');
    dataTable.addColumn('string', 'ToolTip');

    familyData.forEach(person => {
        // 避免为有配偶的女性创建独立节点，她将被包含在配偶节点中
        if (person.gender === 'female' && person.spouseId) {
            const spouseExists = familyData.some(p => p.id === person.spouseId);
            if (spouseExists) {
                return;
            }
        }
        const spouse = person.spouseId ? familyData.find(p => p.id === person.spouseId) : null;
        const nodeContent = formatNodeContent(person, spouse);
        
        // ==================================================================
        // ========================= 核心修改点 =========================
        // ==================================================================
        // 任何一个人的管理者（Manager）优先是其父亲ID，如果没有父亲则使用母亲ID。
        const managerId = person.fatherId || person.motherId || null;
        // ==================================================================
        
        dataTable.addRow([{ v: person.id, f: nodeContent.html }, managerId, person.tooltip]);
    });
    
    // 动态设置节点的 CSS 类
    for (let i = 0; i < dataTable.getNumberOfRows(); i++) {
        const rowId = dataTable.getValue(i, 0);
        let className = 'google-visualization-orgchart-node'; // 基础类
        
        if(rowId === focalPersonId){
            className += ' highlight-node'; // 为焦点人物追加高亮类
        }
        
        dataTable.setRowProperty(i, 'className', className);
    }
    return dataTable;
}

function formatNodeContent(person, spouse) {
    let spouseHtml = '';
    if (spouse) {
        spouseHtml = ` & <span class="node-name spouse" data-id="${spouse.id}">${spouse.name}</span>`;
    }
    const personClass = person.id === focalPersonId ? "focal-person" : "";
    const personHtml = `<span class="node-name ${personClass}" data-id="${person.id}">${person.name}</span>`;
    const finalHtml = (person.gender === 'female' && spouse) ? (spouseHtml.substring(3) + ' & ' + personHtml) : (personHtml + spouseHtml);
    return {
        html: `<div>${finalHtml}</div><div class="date-info">${person.info || ''}</div>`
    };
}

// --- 交互处理 ---
function handleNodeClick(event) {
    const target = event.target;
    if (target.classList.contains('node-name')) {
        const personId = target.getAttribute('data-id');
        if (personId) {
            selectedPersonId = personId;
            focalPersonId = personId;
            redrawAll();
        }
    }
}

function updateDetailsPanel() {
    const content = document.getElementById('details-content');
    const actions = document.getElementById('details-actions');
    if (!selectedPersonId) {
        content.innerHTML = '<p>请点击家谱中的任意成员进行操作。</p>';
        actions.innerHTML = '';
        return;
    }
    const person = familyData.find(p => p.id === selectedPersonId);
    if (!person) {
        selectedPersonId = null;
        content.innerHTML = '<p>成员未找到。请重新选择。</p>';
        actions.innerHTML = '';
        return;
    }
    content.innerHTML = `<h3>${person.name}</h3><p>${person.tooltip || '暂无简介'}</p>`;
    actions.innerHTML = `<button class="action-btn" onclick="openEditModal('${person.id}')">编辑</button><button class="action-btn" onclick="deleteMember('${person.id}')" style="background-color:#dc3545; color:white;">删除</button>`;
}

// --- 增删改查 ---
function addMember() {
    const name = document.getElementById('newName').value.trim();
    if (!name) { alert('姓名不能为空!'); return; }
    
    const newPerson = {
        id: name.replace(/\s/g, '') + Date.now(),
        name: name,
        gender: document.getElementById('newGender').value,
        info: document.getElementById('newInfo').value.trim(),
        fatherId: document.getElementById('newFather').value || null,
        motherId: document.getElementById('newMother').value || null,
        spouseId: document.getElementById('newSpouse').value || null,
        tooltip: document.getElementById('newTooltip').value.trim()
    };
    familyData.push(newPerson);
    
    if (newPerson.spouseId) {
        const spouse = familyData.find(p => p.id === newPerson.spouseId);
        if (spouse) spouse.spouseId = newPerson.id;
    }
    ['newName', 'newInfo', 'newTooltip'].forEach(id => document.getElementById(id).value = '');
    ['newGender', 'newFather', 'newMother', 'newSpouse'].forEach(id => document.getElementById(id).selectedIndex = 0);
    
    focalPersonId = newPerson.id;
    selectedPersonId = newPerson.id;
    saveDataAndRedraw();
}

function openEditModal(personId) {
    const person = familyData.find(p => p.id === personId);
    if (!person) return;
    updateAllDropdowns(person.id);
    document.getElementById('editId').value = person.id;
    document.getElementById('editName').value = person.name;
    document.getElementById('editGender').value = person.gender;
    document.getElementById('editInfo').value = person.info || '';
    document.getElementById('editFather').value = person.fatherId || '';
    document.getElementById('editMother').value = person.motherId || '';
    document.getElementById('editSpouse').value = person.spouseId || '';
    document.getElementById('editTooltip').value = person.tooltip || '';
    document.getElementById('editModal').style.display = 'flex';
}

function saveChanges() {
    const personId = document.getElementById('editId').value;
    const personIndex = familyData.findIndex(p => p.id === personId);
    if (personIndex === -1) return;
    const person = familyData[personIndex];
    const oldSpouseId = person.spouseId;
    person.name = document.getElementById('editName').value.trim();
    person.gender = document.getElementById('editGender').value;
    person.info = document.getElementById('editInfo').value.trim();
    person.fatherId = document.getElementById('editFather').value || null;
    person.motherId = document.getElementById('editMother').value || null;
    person.spouseId = document.getElementById('editSpouse').value || null;
    person.tooltip = document.getElementById('editTooltip').value.trim();
    if (oldSpouseId && oldSpouseId !== person.spouseId) {
         const oldSpouse = familyData.find(p => p.id === oldSpouseId);
         if (oldSpouse) oldSpouse.spouseId = null;
    }
    if (person.spouseId) {
        const newSpouse = familyData.find(p => p.id === person.spouseId);
        if (newSpouse) newSpouse.spouseId = person.id;
    }
    closeEditModal();
    saveDataAndRedraw();
}

function deleteMember(personId) {
    const personIndex = familyData.findIndex(p => p.id === personId);
    if(personIndex === -1) return;
    const personName = familyData[personIndex].name;
    if (confirm(`确定要删除 "${personName}" 吗？\n此操作会一并移除所有与此人相关的关系链接，且不可撤销。`)) {
        familyData.splice(personIndex, 1);
        familyData.forEach(p => {
            if (p.fatherId === personId) p.fatherId = null;
            if (p.motherId === personId) p.motherId = null;
            if (p.spouseId === personId) p.spouseId = null;
        });
        selectedPersonId = null;
        focalPersonId = familyData.length > 0 ? familyData[0].id : null;
        saveDataAndRedraw();
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// --- 辅助函数 ---
function updateAllDropdowns(excludeId = null) {
    const males = familyData.filter(p => p.gender === 'male' && p.id !== excludeId);
    const females = familyData.filter(p => p.gender === 'female' && p.id !== excludeId);
    const all = familyData.filter(p => p.id !== excludeId);
    populateDropdown(document.getElementById('newFather'), males, '无');
    populateDropdown(document.getElementById('editFather'), males, '无');
    populateDropdown(document.getElementById('newMother'), females, '无');
    populateDropdown(document.getElementById('editMother'), females, '无');
    populateDropdown(document.getElementById('newSpouse'), all, '无');
    populateDropdown(document.getElementById('editSpouse'), all, '无');
}

function populateDropdown(selectElement, optionsArray, defaultOptionText) {
    const currentValue = selectElement.value;
    selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
    optionsArray.forEach(p => {
        selectElement.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
    selectElement.value = currentValue;
}

function exportDataToFile() {
    const dataJson = JSON.stringify(familyData, null, 2);
    const blob = new Blob([dataJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family_tree_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importDataFromFile(event) {
     const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if(Array.isArray(data) && data.every(item => 'id' in item && 'name' in item)) {
                loadData(data);
                alert('导入成功!');
            } else { throw new Error('Invalid format'); }
        } catch(err) { alert('文件格式错误或内容不合法!'); }
        finally { event.target.value = ''; }
    };
    reader.readAsText(file);
}

function resetToDefault() {
    if(confirm('确定要重置为初始演示数据吗？当前所有修改将丢失。')) {
        focalPersonId = 'JiangSiyuan';
        loadData(JSON.parse(JSON.stringify(initialFamilyData)));
    }
}

function switchView(viewName) {
    currentView = viewName;
    document.getElementById('orgchart_div').style.display = viewName === 'orgchart' ? 'block' : 'none';
    document.getElementById('timeline_div').style.display = viewName === 'timeline' ? 'block' : 'none';
    document.getElementById('orgchart-view-btn').classList.toggle('active', viewName === 'orgchart');
    document.getElementById('timeline-view-btn').classList.toggle('active', viewName === 'timeline');
    redrawAll();
}

function drawTimelineChart() {
    const timelineData = new google.visualization.DataTable();
    timelineData.addColumn({ type: 'string', id: 'Name' });
    timelineData.addColumn({ type: 'date', id: 'Start' });
    timelineData.addColumn({ type: 'date', id: 'End' });
    familyData.forEach(member => {
        const yearRegex = /\d{4}/g;
        const years = member.info ? member.info.match(yearRegex) : null;
        if (years && years.length > 0) {
            const start = new Date(parseInt(years[0]), 0, 1);
            const end = years.length > 1 && years[1] ? new Date(parseInt(years[1]), 11, 31) : new Date();
            timelineData.addRow([member.name, start, end]);
        }
    });
    if (timelineData.getNumberOfRows() > 0) {
         timelineChart.draw(timelineData);
    } else {
        document.getElementById('timeline_div').innerHTML = "<p>没有足够的时间信息来生成时间轴。</p>";
    }
}