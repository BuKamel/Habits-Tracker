import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://xqonshwjiojmuojzwkihd.supabase.co'
const SUPABASE_KEY = 'sb_publishable_G-tmLaIO0_WgsR4Wyyk7-Q_WwX7lQKw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
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
        console.log("Audio not supported");
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

const availableLanguages = [
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'en', name: 'الإنجليزية (English)' },
    { code: 'fr', name: 'الفرنسية (French)' },
    { code: 'es', name: 'الإسبانية (Spanish)' },
    { code: 'de', name: 'الألمانية (German)' },
    { code: 'it', name: 'الإيطالية (Italian)' },
    { code: 'tr', name: 'التركية (Turkish)' },
    { code: 'ur', name: 'الأوردو (Urdu)' },
    { code: 'hi', name: 'الهندية (Hindi)' },
    { code: 'zh-CN', name: 'الصينية (Chinese)' },
    { code: 'ja', name: 'اليابانية (Japanese)' },
    { code: 'ru', name: 'الروسية (Russian)' },
    { code: 'fa', name: 'الفارسية (Persian)' },
    { code: 'id', name: 'الإندونيسية (Indonesian)' }
];

function toggleTranslateMenu() {
    const dropdown = document.getElementById('translateDropdown');
    dropdown.classList.toggle('hidden');
    if (!dropdown.classList.contains('hidden')) {
        renderLanguagesList(availableLanguages);
        const searchInput = document.getElementById('langSearchInput');
        searchInput.value = '';
        searchInput.focus();
    }
}

function renderLanguagesList(langs) {
    const box = document.getElementById('languagesListBox');
    box.innerHTML = '';
    if (langs.length === 0) {
        box.innerHTML = `<div style="padding: 8px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">لا توجد لغة مطابقة</div>`;
        return;
    }
    langs.forEach(lang => {
        const div = document.createElement('div');
        div.className = 'lang-option-item';
        div.textContent = lang.name;
        div.onclick = () => triggerGoogleTranslate(lang.code);
        box.appendChild(div);
    });
}

function filterLanguages(query) {
    const q = query.trim().toLowerCase();
    const filtered = availableLanguages.filter(l => l.name.toLowerCase().includes(q));
    renderLanguagesList(filtered);
}

function triggerGoogleTranslate(langCode) {
    const selectField = document.querySelector('.goog-te-combo');
    if (selectField) {
        selectField.value = langCode;
        selectField.dispatchEvent(new Event('change'));
    }
    document.getElementById('translateDropdown').classList.add('hidden');
}

window.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.google-translate-wrapper');
    const dropdown = document.getElementById('translateDropdown');
    if (wrapper && dropdown && !wrapper.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('bu_kamel_theme');
    if (savedTheme === 'dark') {
        document.getElementById('htmlRoot').setAttribute('data-theme', 'dark');
    }
    
    const activeSession = localStorage.getItem('bu_kamel_active_user');
    if (activeSession) {
        const found = db.users.find(u => u.email === activeSession);
        if (found) {
            currentUser = found;
            if (!currentUser.customHabits) {
                currentUser.customHabits = JSON.parse(JSON.stringify(defaultHabits));
            }
            if (!currentUser.friends) currentUser.friends = [];
            if (!currentUser.bio) currentUser.bio = "أهلاً بك في بروفايلي! أسعى لتحقيق أهدافي وتطوير عاداتي اليومية باستمرار 🚀";
            if (!currentUser.userCode) currentUser.userCode = 'BK-' + Math.floor(100000 + Math.random() * 900000);
            saveDatabase();
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
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const username = document.getElementById('regUser').value.trim();
    const pass1 = document.getElementById('regPass1').value;
    const pass2 = document.getElementById('regPass2').value;

    if (!email || !username || !pass1) {
        alert('الرجاء إدخال البريد الإلكتروني، اسم المستخدم، وكلمة المرور!');
        return;
    }
    if (pass1 !== pass2) {
        alert('كلمتا المرور غير متطابقتين!');
        return;
    }

    const existingUser = db.users.find(u => u.email.toLowerCase() === email);
    if (existingUser) {
        alert('⚠️ هذا البريد الإلكتروني مسجل مسبقاً!');
        return;
    }

    const userCode = 'BK-' + Math.floor(100000 + Math.random() * 900000);

    db.users.push({
        email: email,
        username: username,
        pass: pass1,
        userCode: userCode,
        bio: "أهلاً بك في بروفايلي! أسعى لتحقيق أهدافي وتطوير عاداتي اليومية باستمرار 🚀",
        friends: [],
        data: {},
        customHabits: JSON.parse(JSON.stringify(defaultHabits))
    });
    saveDatabase();
    alert(`تم إنشاء الحساب بنجاح يا ${username}! رقمك المميز هو: ${userCode}`);
    switchAuthView('login');
}

function handleLogin() {
    const eInput = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pInput = document.getElementById('loginPass').value;

    const user = db.users.find(u => u.email.toLowerCase() === eInput && u.pass === pInput);
    if (!user) {
        alert('البريد الإلكتروني أو كلمة المرور غير صحيحة!');
        return;
    }

    currentUser = user;
    if (!currentUser.customHabits) {
        currentUser.customHabits = JSON.parse(JSON.stringify(defaultHabits));
    }
    if (!currentUser.friends) currentUser.friends = [];
    if (!currentUser.bio) currentUser.bio = "أهلاً بك في بروفايلي!";
    if (!currentUser.userCode) currentUser.userCode = 'BK-' + Math.floor(100000 + Math.random() * 900000);
    saveDatabase();

    localStorage.setItem('bu_kamel_active_user', user.email);
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

// ================= نظام الملف الشخصي والأصدقاء =================
function openProfileView() {
    document.getElementById('mainDashboardView').classList.add('hidden');
    document.getElementById('monthView').classList.add('hidden');
    document.getElementById('fullMonthView').classList.add('hidden');
    document.getElementById('evaluationView').classList.add('hidden');
    document.getElementById('profileView').classList.remove('hidden');

    document.getElementById('profileDisplayName').textContent = currentUser.username;
    // عرض البريد الإلكتروني لصاحب الحساب فقط في بروفايله الخاص سرياً
    document.getElementById('profileDisplayEmail').textContent = `البريد الإلكتروني (سري ولا يراه أحد غيرك): ${currentUser.email || 'غير متوفر'}`;
    document.getElementById('profileDisplayId').textContent = currentUser.userCode;
    document.getElementById('profileBioInput').value = currentUser.bio || '';

    renderFriendsList();
}

function saveProfileBio() {
    const newBio = document.getElementById('profileBioInput').value.trim();
    currentUser.bio = newBio;
    saveDatabase();
    alert('تم تحديث البايو الشخصي بنجاح! ✨');
}

function searchAndAddFriend() {
    const friendId = document.getElementById('searchFriendIdInput').value.trim();
    if (!friendId) {
        alert('الرجاء إدخال الرقم المميز للصديق!');
        return;
    }

    if (friendId === currentUser.userCode) {
        alert('لا يمكنك إضافة نفسك كصديق!');
        return;
    }

    const targetFriend = db.users.find(u => u.userCode === friendId);
    if (!targetFriend) {
        alert('❌ لم يتم العثور على مستخدم بهذا الرقم المميز (ID)!');
        return;
    }

    if (currentUser.friends.includes(targetFriend.email)) {
        alert('⚠️ هذا المستخدم موجود بالفعل في قائمة أصدقائك!');
        return;
    }

    currentUser.friends.push(targetFriend.email);
    saveDatabase();
    document.getElementById('searchFriendIdInput').value = '';
    renderFriendsList();
    alert(`تمت إضافة الصديق ${targetFriend.username} بنجاح! 🎉`);
}

function renderFriendsList() {
    const container = document.getElementById('friendsListContainer');
    container.innerHTML = '';

    if (!currentUser.friends || currentUser.friends.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">ليس لديك أصدقاء مضافون بعد. ابحث عنهم بالرقم المميز وأضفهم لترى أداءهم التشجيعي!</p>`;
        return;
    }

    currentUser.friends.forEach(friendEmail => {
        const friendObj = db.users.find(u => u.email === friendEmail);
        if (!friendObj) return;

        const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
        const friendHabits = friendObj.customHabits || defaultHabits;
        let totalPossible = daysCount * friendHabits.length;
        let earnedPoints = 0;

        for (let d = 0; d < daysCount; d++) {
            friendHabits.forEach(habit => {
                const key = `${currentYear}_${currentMonth}_${d}_${habit.id}`;
                const status = friendObj.data[key];
                if (status === 'done') earnedPoints += 1;
                else if (status === 'super') earnedPoints += 1.25;
            });
        }
        const friendRatio = totalPossible > 0 ? Math.min(100, Math.round((earnedPoints / totalPossible) * 100)) : 0;

        const card = document.createElement('div');
        card.style.cssText = "background: var(--bg-card); padding: 12px; border-radius: 10px; border: 1px solid var(--border-glass); display: flex; justify-content: space-between; align-items: center; gap: 10px;";
        // الاسم فقط والـ ID والنبذة التي تظهر للأصدقاء بدون البريد نهائياً
        card.innerHTML = `
            <div>
                <strong style="color: var(--accent-color); font-size: 0.95rem;">👤 ${friendObj.username}</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 2px 0;">💬 ${friendObj.bio || 'لا يوجد بايو'}</p>
                <span style="font-size: 0.75rem; background: var(--bg-main); padding: 2px 6px; border-radius: 4px;">الرقم المميز: ${friendObj.userCode}</span>
            </div>
            <div style="text-align: center;">
                <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">نسبة الإنجاز:</span>
                <span style="font-size: 1.2rem; font-weight: 900; color: var(--success-color);">${friendRatio}%</span>
            </div>
        `;
        container.appendChild(card);
    });
}
// ==================================================================================

function handleScopeChange(val) {
    const monthWrap = document.getElementById('scopeMonthWrapper');
    const quarterWrap = document.getElementById('scopeQuarterWrapper');
    
    monthWrap.classList.add('hidden');
    quarterWrap.classList.add('hidden');

    if (val === 'month') monthWrap.classList.remove('hidden');
    else if (val === 'quarter') quarterWrap.classList.remove('hidden');
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
    if (scopeType === 'month') scopeVal = `month_${document.getElementById('habitTargetMonth').value}`;
    else if (scopeType === 'quarter') scopeVal = document.getElementById('habitTargetQuarter').value;

    currentUser.customHabits.push({
        id: 'habit_' + Date.now(),
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
    if (confirm('هل أنت متأكد من حذف هذه العادة؟')) {
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
            const mNames = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
            scopeDesc = `شهر ${mNames[parseInt(habit.scope.split('_')[1])]}`;
        } else if (['Q1', 'Q2', 'Q3', 'Q4'].includes(habit.scope)) {
            scopeDesc = `ربع سنة ${habit.scope}`;
        }

        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-glass); font-size: 0.9rem;";
        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${habit.icon}</span>
                <strong>${habit.name}</strong>
                <span style="font-size: 0.75rem; color: var(--text-muted); background: var(--bg-card); padding: 2px 6px; border-radius: 4px;">(${scopeDesc})</span>
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
            return parseInt(habit.scope.split('_')[1]) === currentMonth;
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
        alert(`لا يمكنك إضافة سنة ${nextExpectedYear} قبل حلولها.`);
        return;
    }

    if (!availableYears.includes(nextExpectedYear)) {
        availableYears.push(nextExpectedYear);
        localStorage.setItem('bu_kamel_years', JSON.stringify(availableYears));
        renderYearsList();
        alert(`تم فتح عام ${nextExpectedYear} بنجاح! 🎉`);
    } else {
        alert('هذه السنة موجودة بالفعل.');
    }
}

function openYear(year) {
    currentYear = year;
    renderYearsList();
    renderMonthsGrid();
    updateDashboardPerformance();
}

function renderMonthsGrid() {
    const months = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const grid = document.getElementById('monthsGrid');
    grid.innerHTML = '';

    const todayDate = new Date();
    const isActualCurrentYear = (currentYear === todayDate.getFullYear());
    const actualCurrentMonthIndex = todayDate.getMonth();

    months.forEach((mName, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (isActualCurrentYear && index === actualCurrentMonthIndex) {
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

    const today = new Date();
    if (currentYear === today.getFullYear() && currentMonth === today.getMonth()) {
        currentDayIndex = today.getDate() - 1;
        const maxDays = new Date(currentYear, currentMonth + 1, 0).getDate();
        if (currentDayIndex >= maxDays) currentDayIndex = maxDays - 1;
        if (currentDayIndex < 0) currentDayIndex = 0;
    } else {
        currentDayIndex = 0;
    }

    document.getElementById('mainDashboardView').classList.add('hidden');
    document.getElementById('profileView').classList.add('hidden');
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
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد عادات مخصصة لهذا الشهر.</p>`;
        return;
    }

    activeHabits.forEach(habit => {
        const key = `${currentYear}_${currentMonth}_${currentDayIndex}_${habit.id}`;
        const currentStatus = currentUser.data[key] || 'none';

        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-glass); gap: 10px;";

        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.9rem;">
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
    document.getElementById('profileView').classList.add('hidden');
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
    if (displayEl) displayEl.textContent = `${percentage}%`;
}

function openFullMonthView() {
    document.getElementById('monthView').classList.add('hidden');
    document.getElementById('fullMonthView').classList.remove('hidden');
    document.getElementById('fullMonthHeaderTitle').textContent = `تعديل شهر ${currentMonthName} كاملاً (${currentYear})`;

    const container = document.getElementById('fullMonthContentContainer');
    container.innerHTML = '';

    const activeHabits = getActiveHabitsForCurrentMonth();
    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let d = 0; d < daysCount; d++) {
        const dayBox = document.createElement('div');
        dayBox.className = 'card';
        dayBox.style.padding = '12px';

        let html = `<div style="font-weight: 700; margin-bottom: 8px; color: var(--accent-color);">📅 اليوم رقم ${d + 1}</div><div style="display: flex; flex-direction: column; gap: 6px;">`;

        activeHabits.forEach(habit => {
            const key = `${currentYear}_${currentMonth}_${d}_${habit.id}`;
            const status = currentUser.data[key] || 'none';
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; gap: 10px;">
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

function getSmartEvaluationMessage(type, ratio, name) {
    if (ratio > 90) {
        return `إنجاز أسطوري في شهر <strong>${name}</strong> بنسبة <span style="color: var(--success-color); font-size: 1.5rem; font-weight: 900;">${ratio}%</span>! 👑🔥\n\nيا سلام عليك يا بطل! أنت كدة "تروّق" على أصولها.. التزام حديدي وعزيمة لا تذبل، استمر في هذا المستوى المرعب!`;
    } else if (ratio >= 75) {
        return `أداء ممتاز ومبهر لشهر <strong>${name}</strong> بنسبة <span style="color: var(--success-color); font-size: 1.4rem; font-weight: 900;">${ratio}%</span>! 💪✨\n\nأنت في منطقة الأبطال! دفعة صغيرة وتصل للقمة المطلقة، واصل هذا السير الثابت!`;
    } else if (ratio >= 45) {
        return `أداء مقبول لشهر <strong>${name}</strong> بنسبة <span style="color: var(--accent-color); font-size: 1.4rem; font-weight: 900;">${ratio}%</span>. ☕⚠️\n\nبداية جيدة لكنها لا تليق بطموحاتك! عندك طاقة أكبر بكتير، نظم وقتك وشد الهمة!`;
    } else {
        return `أنا زعلان منك بصراحة! نسبة إنجاز شهر <strong>${name}</strong> نزلت إلى <span style="color: var(--danger-color); font-size: 1.5rem; font-weight: 900;">${ratio}%</span>! 🛑❌\n\nفين العزيمة؟ عاداتك الرائعة تنتظرك، استيقظ وفض الغبار عن همتك!`;
    }
}

function openQuarterEvaluation(title, monthsArray) {
    document.getElementById('mainDashboardView').classList.add('hidden');
    document.getElementById('profileView').classList.add('hidden');
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
        
        const monthActiveHabits = currentUser.customHabits.filter(habit => {
            if (habit.scope === 'year') return true;
            if (habit.scope.startsWith('month_')) return parseInt(habit.scope.split('_')[1]) === mAdjusted;
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
    document.getElementById('evalContentBox').innerHTML = getSmartEvaluationMessage('quarter', ratio, title);
}

function openAnnualEvaluation() {
    document.getElementById('mainDashboardView').classList.add('hidden');
    document.getElementById('profileView').classList.add('hidden');
    document.getElementById('monthView').classList.add('hidden');
    document.getElementById('fullMonthView').classList.add('hidden');
    document.getElementById('evaluationView').classList.remove('hidden');
    
    document.getElementById('evalHeaderTitle').textContent = "التقييم السنوي";
    document.getElementById('evalTitleBox').textContent = `التقرير السنوي الشامل لعام ${currentYear}`;

    let totalPossible = 0;
    let earnedPoints = 0;

    for (let m = 0; m < 12; m++) {
        const daysCount = new Date(currentYear, m + 1, 0).getDate();
        const monthActiveHabits = currentUser.customHabits.filter(habit => {
            if (habit.scope === 'year') return true;
            if (habit.scope.startsWith('month_')) return parseInt(habit.scope.split('_')[1]) === m;
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
    document.getElementById('evalContentBox').innerHTML = getSmartEvaluationMessage('annual', ratio, currentYear);
}

function closeMonthReport() {
    document.getElementById('monthView').classList.add('hidden');
    document.getElementById('evaluationView').classList.remove('hidden');
    
    document.getElementById('evalHeaderTitle').textContent = `تقرير شهر ${currentMonthName}`;
    document.getElementById('evalTitleBox').textContent = `تقرير وتقييم أداء شهر ${currentMonthName} (${currentYear})`;

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

    const ratio = totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 100) : 0;
    document.getElementById('evalContentBox').innerHTML = getSmartEvaluationMessage('month', ratio, currentMonthName);
}
