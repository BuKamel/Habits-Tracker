let currentUser = null;
let currentYear = 2026;
let currentMonth = 6;
let currentMonthName = "يوليو";
let currentDayIndex = 0;

const defaultHabits = [
    { id: 'fajr', name: 'صلاة الفجر', icon: '🌅', scope: 'year' },
    { id: 'duha', name: 'صلاة الضحى', icon: '☀️', scope: 'year' },
    { id: 'teeth', name: 'غسيل الأسنان', icon: '🪥', scope: 'year' },
    { id: 'dhuhr', name: 'صلاة الظهر', icon: '🕌', scope: 'year' },
    { id: 'asr', name: 'صلاة العصر', icon: '🕌', scope: 'year' },
    { id: 'maghrib', name: 'صلاة المغرب', icon: '🌅', scope: 'year' },
    { id: 'isha', name: 'صلاة العشاء', icon: '🌙', scope: 'year' },
    { id: 'quran', name: 'الورد اليومي (قرآن/قراءة)', icon: '📖', scope: 'year' }
];

let availableYears = JSON.parse(localStorage.getItem('bu_kamel_years')) || [2023, 2024, 2025, 2026];

let db = JSON.parse(localStorage.getItem('bu_kamel_db')) || {
    users: []
};

function saveDatabase() {
    localStorage.setItem('bu_kamel_db', JSON.stringify(db));
}

function playSound(type) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'success') {
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
            osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'super') {
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
            osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
            osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'clear') {
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        }
    } catch (e) {
        console.log("Audio not supported or blocked");
    }
}

function toggleTheme() {
    const htmlRoot = document.getElementById('htmlRoot');
    const currentTheme = htmlRoot.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        htmlRoot.removeAttribute('data-theme');
        localStorage.setItem('bu_kamel_theme', 'light');
    } else {
        htmlRoot.setAttribute('data-theme', 'dark');
        localStorage.setItem('bu_kamel_theme', 'dark');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('bu_kamel_theme');
    if (savedTheme === 'dark') {
        document.getElementById('htmlRoot').setAttribute('data-theme', 'dark');
    }
    
    const activeSession = localStorage.getItem('bu_kamel_active_user');
    if (activeSession) {
        const found = db.users.find(u => u.username === activeSession);
        if (found) {
            currentUser = found;
            if (!currentUser.customHabits) {
                currentUser.customHabits = JSON.parse(JSON.stringify(defaultHabits));
            }
            initAppDashboard();
        }
    }
});

function switchAuthView(viewType) {
    if (viewType === 'register') {
        document.getElementById('loginView').classList.add('hidden');
        document.getElementById('registerView').classList.remove('hidden');
    } else {
        document.getElementById('registerView').classList.add('hidden');
        document.getElementById('loginView').classList.remove('hidden');
    }
}

function handleRegister() {
    const username = document.getElementById('regUser').value.trim();
    const pass1 = document.getElementById('regPass1').value;
    const pass2 = document.getElementById('regPass2').value;

    if (!username || !pass1) {
        alert('الرجاء إدخال اسم المستخدم وكلمة المرور!');
        return;
    }

    if (pass1 !== pass2) {
        alert('كلمتا المرور غير متطابقتين!');
        return;
    }

    const existingUser = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
        alert('⚠️ عذراً، اسم المستخدم هذا موجود مسبقاً! الرجاء اختيار اسم آخر.');
        return;
    }

    const newUser = {
        username: username,
        pass: pass1,
        data: {},
        customHabits: JSON.parse(JSON.stringify(defaultHabits))
    };

    db.users.push(newUser);
    saveDatabase();
    alert(`تم إنشاء الحساب بنجاح يا ${username}! يمكنك تسجيل الدخول الآن.`);
    switchAuthView('login');
}

function handleLogin() {
    const uInput = document.getElementById('loginUser').value.trim();
    const pInput = document.getElementById('loginPass').value;

    const user = db.users.find(u => u.username === uInput && u.pass === pInput);
    if (!user) {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة!');
        return;
    }

    currentUser = user;
    if (!currentUser.customHabits) {
        currentUser.customHabits = JSON.parse(JSON.stringify(defaultHabits));
    }
    localStorage.setItem('bu_kamel_active_user', user.username);
    initAppDashboard();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('bu_kamel_active_user');
    document.getElementById('mainAppLayout').classList.add('hidden');
    document.getElementById('loginViewContainer').classList.remove('hidden');
}

function initAppDashboard() {
    document.getElementById('loginViewContainer').classList.add('hidden');
    document.getElementById('mainAppLayout').classList.remove('hidden');

    document.getElementById('userHeaderInfo').classList.remove('hidden');
    document.getElementById('headerUsername').textContent = `مرحباً، ${currentUser.username}`;

    renderYearsList();
    renderMonthsGrid();
    renderAdminHabitsList();
    updateDashboardPerformance();
}

function handleScopeChange(val) {
    const monthWrap = document.getElementById('scopeMonthWrapper');
    const quarterWrap = document.getElementById('scopeQuarterWrapper');
    
    monthWrap.classList.add('hidden');
    quarterWrap.classList.add('hidden');

    if (val === 'month') {
        monthWrap.classList.remove('hidden');
    } else if (val === 'quarter') {
        quarterWrap.classList.remove('hidden');
    }
}

function addNewCustomHabit() {
    const name = document.getElementById('newHabitName').value.trim();
    let icon = document.getElementById('newHabitIcon').value.trim() || '⭐';
    const scopeType = document.getElementById('habitScopeType').value;

    if (!name) {
        alert('الرجاء كتابة اسم العادة!');
        return;
    }

    let scopeVal = 'year';
    if (scopeType === 'month') {
        scopeVal = `month_${document.getElementById('habitTargetMonth').value}`;
    } else if (scopeType === 'quarter') {
        scopeVal = document.getElementById('habitTargetQuarter').value;
    }

    const newId = 'habit_' + Date.now();
    currentUser.customHabits.push({
        id: newId,
        name: name,
        icon: icon,
        scope: scopeVal
    });

    saveDatabase();
    document.getElementById('newHabitName').value = '';
    document.getElementById('newHabitIcon').value = '';
    renderAdminHabitsList();
    alert('تمت إضافة العادة بنجاح! 🎉');
}

function deleteHabit(habitId) {
    if (confirm('هل أنت متأكد من حذف هذه العادة نهائياً؟')) {
        currentUser.customHabits = currentUser.customHabits.filter(h => h.id !== habitId);
        saveDatabase();
        renderAdminHabitsList();
        updateDashboardPerformance();
    }
}

function renderAdminHabitsList() {
    const container = document.getElementById('currentHabitsListAdmin');
    if (!container) return;
    container.innerHTML = '';

    currentUser.customHabits.forEach(habit => {
        let scopeDesc = 'طوال السنة';
        if (habit.scope.startsWith('month_')) {
            const mIdx = parseInt(habit.scope.split('_')[1]);
            const mNames = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
            scopeDesc = `شهر ${mNames[mIdx]}`;
        } else if (['Q1', 'Q2', 'Q3', 'Q4'].includes(habit.scope)) {
            scopeDesc = `ربع سنة ${habit.scope}`;
        }

        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-glass); font-size: 0.9rem;";
        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${habit.icon}</span>
                <strong>${habit.name}</strong>
                <span style="font-size: 0.75rem; color: var(--text-muted); background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 4px;">(${scopeDesc})</span>
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteHabit('${habit.id}')" style="padding: 4px 10px; font-size: 0.8rem;">🗑 حذف</button>
        `;
        container.appendChild(row);
    });
}

function getActiveHabitsForCurrentMonth() {
    return currentUser.customHabits.filter(habit => {
        if (habit.scope === 'year') return true;
        if (habit.scope.startsWith('month_')) {
            const mIdx = parseInt(habit.scope.split('_')[1]);
            return mIdx === currentMonth;
        }
        if (['Q1', 'Q2', 'Q3', 'Q4'].includes(habit.scope)) {
            const qMap = { 'Q1': [0, 1, 2], 'Q2': [3, 4, 5], 'Q3': [6, 7, 8], 'Q4': [9, 10, 11] };
            return qMap[habit.scope].includes(currentMonth);
        }
        return true;
    });
}

function renderYearsList() {
    const listContainer = document.getElementById('sidebarYearsList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    availableYears.forEach(year => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (currentYear === year) {
            btn.classList.add('active');
            btn.textContent = `📅 ${year} (الحالية)`;
        } else {
            btn.textContent = `📅 ${year}`;
        }
        btn.onclick = () => openYear(year);
        listContainer.appendChild(btn);
    });
}

function addNewYear() {
    const actualCurrentYear = new Date().getFullYear();
    const nextExpectedYear = Math.max(...availableYears) + 1;

    if (actualCurrentYear < nextExpectedYear) {
        alert(`عذراً يا بطل! لا يمكنك إضافة سنة ${nextExpectedYear} لأننا ما زلنا في عام ${actualCurrentYear}.`);
        return;
    }

    if (!availableYears.includes(nextExpectedYear)) {
        availableYears.push(nextExpectedYear);
        localStorage.setItem('bu_kamel_years', JSON.stringify(availableYears));
        renderYearsList();
        alert(`تم فتح وإضافة عام ${nextExpectedYear} بنجاح! 🎉`);
    } else {
        alert('هذه السنة موجودة بالفعل في السجل.');
    }
}

function openYear(year) {
    currentYear = year;
    renderYearsList();
    renderMonthsGrid();
    updateDashboardPerformance();
}

function renderMonthsGrid() {
    const months = [
        "يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    const grid = document.getElementById('monthsGrid');
    grid.innerHTML = '';

    months.forEach((mName, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (currentYear === 2026 && index === 6) {
            btn.classList.add('active');
            btn.textContent = `⭐ شهر ${mName} (الحالي)`;
        } else {
            btn.textContent = `شهر ${mName}`;
        }
        btn.onclick = () => openMonth(index, mName);
        grid.appendChild(btn);
    });
}

function openMonth(monthIndex, monthName) {
    currentMonth = monthIndex;
    currentMonthName = monthName;
    currentDayIndex = 0;

    document.getElementById('mainDashboardView').classList.add('hidden');
    document.getElementById('fullMonthView').classList.add('hidden');
    document.getElementById('evaluationView').classList.add('hidden');
    document.getElementById('monthView').classList.remove('hidden');
    
    document.getElementById('activeMonthTitle').textContent = `تتبع عادات شهر ${monthName} (${currentYear})`;

    populateQuickDayDropdown();
    renderDayHabits();
}

function populateQuickDayDropdown() {
    const dropdown = document.getElementById('quickDayDropdown');
    dropdown.innerHTML = '<option value="" disabled selected>-- اختر اليوم الانتقالي --</option>';
    
    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= daysCount; i++) {
        const opt = document.createElement('option');
        opt.value = i - 1;
        opt.textContent = `اليوم رقم ${i}`;
        if ((i - 1) === currentDayIndex) opt.selected = true;
        dropdown.appendChild(opt);
    }
}

function jumpToSelectedDay(val) {
    if (val !== "") {
        currentDayIndex = parseInt(val);
        renderDayHabits();
    }
}

function changeDay(direction) {
    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    currentDayIndex += direction;
    if (currentDayIndex < 0) currentDayIndex = 0;
    if (currentDayIndex >= daysCount) currentDayIndex = daysCount - 1;
    renderDayHabits();
}

function renderDayHabits() {
    const dayNumber = currentDayIndex + 1;
    document.getElementById('activeDayTitle').textContent = `اليوم رقم ${dayNumber} من شهر ${currentMonthName}`;
    
    const container = document.getElementById('habitsListContainer');
    container.innerHTML = '';

    const activeHabits = getActiveHabitsForCurrentMonth();
    if (activeHabits.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد عادات مخصصة لهذا الشهر. أضف عادات جديدة من لوحة التحكم الرئيسية!</p>`;
        return;
    }

    activeHabits.forEach(habit => {
        const key = `${currentYear}_${currentMonth}_${currentDayIndex}_${habit.id}`;
        const currentStatus = currentUser.data[key] || 'none';

        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-glass);";

        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; font-weight: 600;">
                <span>${habit.icon}</span>
                <span>${habit.name}</span>
            </div>
            <select class="status-select" onchange="updateHabitStatus('${habit.id}', this.value)">
                <option value="none" ${currentStatus === 'none' ? 'selected' : ''}>❌ لم تفعل</option>
                <option value="done" ${currentStatus === 'done' ? 'selected' : ''}>✅ تم الإنجاز</option>
                <option value="super" ${currentStatus === 'super' ? 'selected' : ''}>🌟 إنجاز فائق</option>
            </select>
        `;
        container.appendChild(row);
    });

    const dropdown = document.getElementById('quickDayDropdown');
    if (dropdown) dropdown.value = currentDayIndex;
}

function updateHabitStatus(habitId, status) {
    const key = `${currentYear}_${currentMonth}_${currentDayIndex}_${habitId}`;
    currentUser.data[key] = status;
    saveDatabase();

    if (status === 'done') playSound('success');
    else if (status === 'super') playSound('super');
    else playSound('clear');

    updateDashboardPerformance();
}

function goHome() {
    document.getElementById('monthView').classList.add('hidden');
    document.getElementById('fullMonthView').classList.add('hidden');
    document.getElementById('evaluationView').classList.add('hidden');
    document.getElementById('mainDashboardView').classList.remove('hidden');
    renderAdminHabitsList();
    updateDashboardPerformance();
}

function updateDashboardPerformance() {
    if (!currentUser) return;
    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    const activeHabits = getActiveHabitsForCurrentMonth();
    let totalPossible = daysCount * activeHabits.length;
    let earnedPoints = 0;

    for (let d = 0; d < daysCount; d++) {
        activeHabits.forEach(habit => {
            const key = `${currentYear}_${currentMonth}_${d}_${habit.id}`;
            const status = currentUser.data[key];
            if (status === 'done') earnedPoints += 1;
            else if (status === 'super') earnedPoints += 1.25;
        });
    }

    const percentage = totalPossible > 0 ? Math.min(100, Math.round((earnedPoints / totalPossible) * 100)) : 0;
    const displayEl = document.getElementById('actualPerformanceDisplay');
    if (displayEl) {
        displayEl.textContent = `${percentage}%`;
    }
}

function openFullMonthView() {
    document.getElementById('monthView').classList.add('hidden');
    document.getElementById('fullMonthView').classList.remove('hidden');
    document.getElementById('fullMonthHeaderTitle').textContent = `تعديل شهر ${currentMonthName} كاملًا (${currentYear})`;

    const container = document.getElementById('fullMonthContentContainer');
    container.innerHTML = '';

    const activeHabits = getActiveHabitsForCurrentMonth();
    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let d = 0; d < daysCount; d++) {
        const dayBox = document.createElement('div');
        dayBox.className = 'card';
        dayBox.style.padding = '15px';

        let html = `<div style="font-weight: 700; margin-bottom: 10px; color: var(--accent-color);">📅 اليوم رقم ${d + 1}</div><div style="display: flex; flex-direction: column; gap: 8px;">`;

        activeHabits.forEach(habit => {
            const key = `${currentYear}_${currentMonth}_${d}_${habit.id}`;
            const status = currentUser.data[key] || 'none';
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem;">
                    <span>${habit.icon} ${habit.name}</span>
                    <select class="status-select btn-sm" onchange="updateFullMonthHabit(${d}, '${habit.id}', this.value)">
                        <option value="none" ${status === 'none' ? 'selected' : ''}>❌ لم تفعل</option>
                        <option value="done" ${status === 'done' ? 'selected' : ''}>✅ تم</option>
                        <option value="super" ${status === 'super' ? 'selected' : ''}>🌟 فائق</option>
                    </select>
                </div>
            `;
        });
        html += `</div>`;
        dayBox.innerHTML = html;
        container.appendChild(dayBox);
    }
}

function updateFullMonthHabit(dayIdx, habitId, status) {
    const key = `${currentYear}_${currentMonth}_${dayIdx}_${habitId}`;
    currentUser.data[key] = status;
    saveDatabase();
    if (status === 'done') playSound('success');
    else if (status === 'super') playSound('super');
    else playSound('clear');
}

function openQuarterEvaluation(title, monthsArray) {
    document.getElementById('mainDashboardView').classList.add('hidden');
    document.getElementById('monthView').classList.add('hidden');
    document.getElementById('fullMonthView').classList.add('hidden');
    document.getElementById('evaluationView').classList.remove('hidden');
    
    document.getElementById('evalHeaderTitle').textContent = title;
    document.getElementById('evalTitleBox').textContent = `تقرير الأداء لـ ${title} (${currentYear})`;

    let totalPossible = 0;
    let earnedPoints = 0;

    monthsArray.forEach(mIdx => {
        const mAdjusted = mIdx - 1;
        const daysCount = new Date(currentYear, mAdjusted + 1, 0).getDate();
        
        // حساب العادات الخاصة بهذا الشهر بدقة
        const monthActiveHabits = currentUser.customHabits.filter(habit => {
            if (habit.scope === 'year') return true;
            if (habit.scope.startsWith('month_')) {
                return parseInt(habit.scope.split('_')[1]) === mAdjusted;
            }
            if (['Q1', 'Q2', 'Q3', 'Q4'].includes(habit.scope)) {
                const qMap = { 'Q1': [0, 1, 2], 'Q2': [3, 4, 5], 'Q3': [6, 7, 8], 'Q4': [9, 10, 11] };
                return qMap[habit.scope].includes(mAdjusted);
            }
            return true;
        });

        totalPossible += daysCount * monthActiveHabits.length;

        for (let d = 0; d < daysCount; d++) {
            monthActiveHabits.forEach(habit => {
                const key = `${currentYear}_${mAdjusted}_${d}_${habit.id}`;
                const status = currentUser.data[key];
                if (status === 'done') earnedPoints += 1;
                else if (status === 'super') earnedPoints += 1.25;
            });
        }
    });

    const ratio = totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 100) : 0;
    document.getElementById('evalContentBox').innerHTML = `نسبة إنجازك الكلية في <strong>${title}</strong> لعام ${currentYear} هي: <span style="color: var(--success-color); font-size: 1.5rem; font-weight: 900;">${ratio}%</span>\n\nاستمر في الحفاظ على هذا المستوى الرائع والالتزام بجدول عاداتك اليومية!`;
}

function openAnnualEvaluation() {
    document.getElementById('mainDashboardView').classList.add('hidden');
    document.getElementById('monthView').classList.add('hidden');
    document.getElementById('fullMonthView').classList.add('hidden');
    document.getElementById('evaluationView').classList.remove('hidden');
    
    document.getElementById('evalHeaderTitle').textContent = "التقييم السنوي الشامل";
    document.getElementById('evalTitleBox').textContent = `التقرير السنوي الشامل لعام ${currentYear}`;

    let totalPossible = 0;
    let earnedPoints = 0;

    for (let m = 0; m < 12; m++) {
        const daysCount = new Date(currentYear, m + 1, 0).getDate();
        const monthActiveHabits = currentUser.customHabits.filter(habit => {
            if (habit.scope === 'year') return true;
            if (habit.scope.startsWith('month_')) {
                return parseInt(habit.scope.split('_')[1]) === m;
            }
            if (['Q1', 'Q2', 'Q3', 'Q4'].includes(habit.scope)) {
                const qMap = { 'Q1': [0, 1, 2], 'Q2': [3, 4, 5], 'Q3': [6, 7, 8], 'Q4': [9, 10, 11] };
                return qMap[habit.scope].includes(m);
            }
            return true;
        });

        totalPossible += daysCount * monthActiveHabits.length;

        for (let d = 0; d < daysCount; d++) {
            monthActiveHabits.forEach(habit => {
                const key = `${currentYear}_${m}_${d}_${habit.id}`;
                const status = currentUser.data[key];
                if (status === 'done') earnedPoints += 1;
                else if (status === 'super') earnedPoints += 1.25;
            });
        }
    }

    const ratio = totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 100) : 0;
    document.getElementById('evalContentBox').innerHTML = `متوسط إنجازك العام طوال عام ${currentYear} هو: <span style="color: var(--success-color); font-size: 1.5rem; font-weight: 900;">${ratio}%</span>\n\nالالتزام بالخطوات الصغيرة يومياً يصنع إنجازات وتغييرات جذرية على المدى الطويل!`;
}

function closeMonthReport() {
    alert(`تم إصدار تقرير وإغلاق شهر ${currentMonthName} بنجاح!`);
    goHome();
}