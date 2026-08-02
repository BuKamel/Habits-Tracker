import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://xqonshwjiojmuojzwkihd.supabase.co'
const SUPABASE_KEY = 'sb_publishable_G-tmLaiO0_WgsR4Wyyk7-Q_WwX7lQKw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

let currentUser = null;
let currentYear = 2026;
let currentMonth = 6;
let currentMonthName = "يوليو";
let currentDayIndex = 0;

const defaultHabits = [
    { name: 'صلاة الفجر', icon: '🌅' },
    { name: 'صلاة الضحى', icon: '☀️' },
    { name: 'غسيل الأسنان', icon: '🪥' },
    { name: 'صلاة الظهر', icon: '🕌' },
    { name: 'صلاة العصر', icon: '🕌' },
    { name: 'صلاة المغرب', icon: '🌅' },
    { name: 'صلاة العشاء', icon: '🌙' },
    { name: 'الورد اليومي (قرآن/قراءة)', icon: '📖' }
];

let availableYears = [2023, 2024, 2025, 2026];

// --- جلب بيانات المستخدم والعادات والسجلات ---
async function fetchUserData(userId) {
  try {
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);

    if (habitsError) throw habitsError;

    let userHabits = habits;
    
    // إذا كان الحساب جديداً ولا توجد عادات، ننشئ له العادات الافتراضية تلقائياً
    if (!userHabits || userHabits.length === 0) {
        userHabits = [];
        for (const defHabit of defaultHabits) {
            const { data: insertedHabit, error: insErr } = await supabase
                .from('habits')
                .insert({ user_id: userId, habit_name: defHabit.name, habit_icon: defHabit.icon, scope: 'year' })
                .select()
                .single();
            if (!insErr && insertedHabit) {
                userHabits.push({ id: insertedHabit.id, name: insertedHabit.habit_name, icon: insertedHabit.habit_icon, scope: insertedHabit.scope });
            }
        }
    }

    const habitIds = userHabits.map(h => h.id);
    let userLogs = [];
    
    if (habitIds.length > 0) {
        const { data: logs, error: logsError } = await supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', userId);

        if (logsError) throw logsError;
        userLogs = logs || [];
    }

    return { habits: userHabits, logs: userLogs };
  } catch (error) {
    console.error('Error fetching user data:', error.message);
    return null;
  }
}

// --- حفظ حالة العادة في Supabase ---
async function saveLogToSupabase(habitId, targetDate, status) {
  try {
    if (!currentUser) return;
    const { error } = await supabase
      .from('habit_logs')
      upsert(
        { user_id: currentUser.id, habit_id: habitId, log_date: targetDate, status: status },
        { onConflict: ['habit_id', 'log_date'] }
      );

    if (error) throw error;
  } catch (error) {
    console.error('Error saving log:', error.message);
  }
}

// --- مراقبة حالة الجلسة وتسجيل الدخول ---
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    currentUser = session.user;
    
    // جلب اسم المستخدم من جدول profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (profile) {
        currentUser.username = profile.username;
    }

    const userData = await fetchUserData(currentUser.id);
    if (userData) {
      currentUser.customHabits = userData.habits;
      currentUser.logsData = userData.logs;
      initAppDashboard();
    }
  } else {
    currentUser = null;
  }
});

// ================= إدارة الحسابات (تسجيل وحفظ وتسجيل خروج) =================
async function handleRegister() {
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

    // توليد بريد إلكتروني افتراضي فريد بناءً على اسم المستخدم
    const fakeEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}@bukamel.app`;

    const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: pass1,
    });

    if (error) {
        alert('خطأ في التسجيل: ' + error.message);
        return;
    }

    if (data.user) {
        // حفظ البروفايل في جدول profiles الجديد
        const { error: profileErr } = await supabase.from('profiles').insert({
            id: data.user.id,
            username: username,
            is_admin: false
        });

        if (profileErr) {
            console.error('Profile creation error:', profileErr.message);
        }
        
        alert(`تم إنشاء الحساب بنجاح يا ${username}! يمكنك تسجيل الدخول الآن.`);
        switchAuthView('login');
    }
}

async function handleLogin() {
    const uInput = document.getElementById('loginUser').value.trim();
    const pInput = document.getElementById('loginPass').value;

    if (!uInput || !pInput) {
        alert('الرجاء إدخال اسم المستخدم وكلمة المرور!');
        return;
    }

    const fakeEmail = `${uInput.toLowerCase().replace(/[^a-z0-9]/g, '_')}@bukamel.app`;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: pInput,
    });

    if (error) {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة!');
        return;
    }
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    document.getElementById('mainAppLayout').classList.add('hidden');
    document.getElementById('loginViewContainer').classList.remove('hidden');
}

// ================= الواجهة والتحكم بالبيانات =================
function initAppDashboard() {
    document.getElementById('loginViewContainer').classList.add('hidden');
    document.getElementById('mainAppLayout').classList.remove('hidden');
    document.getElementById('userHeaderInfo').classList.remove('hidden');
    document.getElementById('headerUsername').textContent = `مرحباً، ${currentUser.username || 'بطل'}`;

    renderYearsList();
    renderMonthsGrid();
    renderAdminHabitsList();
    updateDashboardPerformance();
}

function handleScopeChange(val) {
    const monthWrap = document.getElementById('scopeMonthWrapper');
    const quarterWrap = document.getElementById('scopeQuarterWrapper');
    if(monthWrap) monthWrap.classList.add('hidden');
    if(quarterWrap) quarterWrap.classList.add('hidden');
    if (val === 'month' && monthWrap) monthWrap.classList.remove('hidden');
    else if (val === 'quarter' && quarterWrap) quarterWrap.classList.remove('hidden');
}

async function addNewCustomHabit() {
    const name = document.getElementById('newHabitName').value.trim();
    let icon = document.getElementById('newHabitIcon').value.trim() || '⭐';

    if (!name) {
        alert('الرجاء كتابة اسم العادة!');
        return;
    }

    const { data, error } = await supabase
        .from('habits')
        .insert({ user_id: currentUser.id, habit_name: name, habit_icon: icon, scope: 'year' })
        .select()
        .single();

    if (error) {
        alert('حدث خطأ أثناء إضافة العادة: ' + error.message);
        return;
    }

    currentUser.customHabits.push({
        id: data.id,
        name: data.habit_name,
        icon: data.habit_icon,
        scope: data.scope
    });

    document.getElementById('newHabitName').value = '';
    document.getElementById('newHabitIcon').value = '';
    renderAdminHabitsList();
    alert('تمت إضافة العادة بنجاح! 🎉');
}

async function deleteHabit(habitId) {
    if (confirm('هل أنت متأكد من حذف هذه العادة؟')) {
        const { error } = await supabase.from('habits').delete().eq('id', habitId);
        if(!error) {
            currentUser.customHabits = currentUser.customHabits.filter(h => h.id !== habitId);
            renderAdminHabitsList();
            updateDashboardPerformance();
        }
    }
}

function renderAdminHabitsList() {
    const container = document.getElementById('currentHabitsListAdmin');
    if (!container) return;
    container.innerHTML = '';

    currentUser.customHabits.forEach(habit => {
        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-glass); font-size: 0.9rem;";
        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${habit.icon}</span>
                <strong>${habit.name}</strong>
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteHabit('${habit.id}')" style="padding: 4px 10px; font-size: 0.8rem;">🗑 حذف</button>
        `;
        container.appendChild(row);
    });
}

function getActiveHabitsForCurrentMonth() {
    return currentUser.customHabits || [];
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
    const nextExpectedYear = Math.max(...availableYears) + 1;
    if (!availableYears.includes(nextExpectedYear)) {
        availableYears.push(nextExpectedYear);
        renderYearsList();
        alert(`تم فتح عام ${nextExpectedYear} بنجاح! 🎉`);
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
    if (!grid) return;
    grid.innerHTML = '';

    months.forEach((mName, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = `شهر ${mName}`;
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
    if (!dropdown) return;
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

function getLogStatus(habitId, dayIndex) {
    const targetDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayIndex + 1).padStart(2, '0')}`;
    if (!currentUser.logsData) return 'none';
    const log = currentUser.logsData.find(l => l.habit_id == habitId && l.log_date === targetDate);
    return log ? log.status : 'none';
}

function renderDayHabits() {
    const dayNumber = currentDayIndex + 1;
    document.getElementById('activeDayTitle').textContent = `اليوم رقم ${dayNumber} من شهر ${currentMonthName}`;
    
    const container = document.getElementById('habitsListContainer');
    if (!container) return;
    container.innerHTML = '';

    const activeHabits = getActiveHabitsForCurrentMonth();
    if (activeHabits.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد عادات مسجلة.</p>`;
        return;
    }

    activeHabits.forEach(habit => {
        const currentStatus = getLogStatus(habit.id, currentDayIndex);

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
}

async function updateHabitStatus(habitId, status) {
    const targetDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDayIndex + 1).padStart(2, '0')}`;
    
    if (!currentUser.logsData) currentUser.logsData = [];
    const existingLog = currentUser.logsData.find(l => l.habit_id == habitId && l.log_date === targetDate);
    if (existingLog) {
        existingLog.status = status;
    } else {
        currentUser.logsData.push({ habit_id: habitId, log_date: targetDate, status: status });
    }

    await saveLogToSupabase(habitId, targetDate, status);

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
    if (!currentUser || !currentUser.customHabits) return;
    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    const activeHabits = getActiveHabitsForCurrentMonth();
    let totalPossible = daysCount * activeHabits.length;
    let earnedPoints = 0;

    for (let d = 0; d < daysCount; d++) {
        activeHabits.forEach(habit => {
            const status = getLogStatus(habit.id, d);
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
    if (!container) return;
    container.innerHTML = '';

    const activeHabits = getActiveHabitsForCurrentMonth();
    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let d = 0; d < daysCount; d++) {
        const dayBox = document.createElement('div');
        dayBox.className = 'card';
        dayBox.style.padding = '12px';

        let html = `<div style="font-weight: 700; margin-bottom: 8px; color: var(--accent-color);">📅 اليوم رقم ${d + 1}</div><div style="display: flex; flex-direction: column; gap: 6px;">`;

        activeHabits.forEach(habit => {
            const status = getLogStatus(habit.id, d);
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

async function updateFullMonthHabit(dayIdx, habitId, status) {
    const targetDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayIdx + 1).padStart(2, '0')}`;
    
    if (!currentUser.logsData) currentUser.logsData = [];
    const existingLog = currentUser.logsData.find(l => l.habit_id == habitId && l.log_date === targetDate);
    if (existingLog) {
        existingLog.status = status;
    } else {
        currentUser.logsData.push({ habit_id: habitId, log_date: targetDate, status: status });
    }

    await saveLogToSupabase(habitId, targetDate, status);

    if (status === 'done') playSound('success');
    else if (status === 'super') playSound('super');
    else playSound('clear');
}

function getSmartEvaluationMessage(type, ratio, name) {
    if (ratio > 90) {
        return `إنجاز أسطوري في <strong>${name}</strong> بنسبة <span style="color: var(--success-color); font-size: 1.5rem; font-weight: 900;">${ratio}%</span>! 👑🔥\n\nأداء استثنائي وعزيمة حديدية!`;
    } else if (ratio >= 75) {
        return `أداء ممتاز ومبهر لـ <strong>${name}</strong> بنسبة <span style="color: var(--success-color); font-size: 1.4rem; font-weight: 900;">${ratio}%</span>! 💪✨`;
    } else if (ratio >= 45) {
        return `أداء مقبول لـ <strong>${name}</strong> بنسبة <span style="color: var(--accent-color); font-size: 1.4rem; font-weight: 900;">${ratio}%</span>. ☕⚠️`;
    } else {
        return `نسبة الإنجاز في <strong>${name}</strong> وصلت إلى <span style="color: var(--danger-color); font-size: 1.5rem; font-weight: 900;">${ratio}%</span>! 🛑❌\n\nشد الهمة واستعد للانطلاق من جديد!`;
    }
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
        const activeHabits = getActiveHabitsForCurrentMonth();
        totalPossible += daysCount * activeHabits.length;

        for (let d = 0; d < daysCount; d++) {
            activeHabits.forEach(habit => {
                const targetDate = `${currentYear}-${String(mAdjusted + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
                const log = currentUser.logsData && currentUser.logsData.find(l => l.habit_id == habit.id && l.log_date === targetDate);
                const status = log ? log.status : 'none';

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
    document.getElementById('monthView').classList.add('hidden');
    document.getElementById('fullMonthView').classList.add('hidden');
    document.getElementById('evaluationView').classList.remove('hidden');
    
    document.getElementById('evalHeaderTitle').textContent = "التقييم السنوي";
    document.getElementById('evalTitleBox').textContent = `التقرير السنوي الشامل لعام ${currentYear}`;

    let totalPossible = 0;
    let earnedPoints = 0;

    for (let m = 0; m < 12; m++) {
        const daysCount = new Date(currentYear, m + 1, 0).getDate();
        const activeHabits = getActiveHabitsForCurrentMonth();
        totalPossible += daysCount * activeHabits.length;

        for (let d = 0; d < daysCount; d++) {
            activeHabits.forEach(habit => {
                const targetDate = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`;
                const log = currentUser.logsData && currentUser.logsData.find(l => l.habit_id == habit.id && l.log_date === targetDate);
                const status = log ? log.status : 'none';

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
            const status = getLogStatus(habit.id, d);
            if (status === 'done') earnedPoints += 1;
            else if (status === 'super') earnedPoints += 1.25;
        });
    }

    const ratio = totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 100) : 0;
    document.getElementById('evalContentBox').innerHTML = getSmartEvaluationMessage('month', ratio, currentMonthName);
}

function switchAuthView(viewType) {
    if (viewType === 'register') {
        document.getElementById('loginView').classList.add('hidden');
        document.getElementById('registerView').classList.remove('hidden');
    } else {
        document.getElementById('registerView').classList.add('hidden');
        document.getElementById('loginView').classList.remove('hidden');
    }
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
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        }
    } catch (e) {}
}

function toggleTheme() {
    const htmlRoot = document.getElementById('htmlRoot');
    if (htmlRoot.getAttribute('data-theme') === 'dark') {
        htmlRoot.removeAttribute('data-theme');
    } else {
        htmlRoot.setAttribute('data-theme', 'dark');
    }
}

// ربط الدوال بالنافذة العامة لتتفاعل مع الأزرار في HTML
window.handleRegister = handleRegister;
window.handleLogin = handleLogin;
window.logout = logout;
window.switchAuthView = switchAuthView;
window.addNewCustomHabit = addNewCustomHabit;
window.deleteHabit = deleteHabit;
window.addNewYear = addNewYear;
window.openYear = openYear;
window.openMonth = openMonth;
window.jumpToSelectedDay = jumpToSelectedDay;
window.changeDay = changeDay;
window.updateHabitStatus = updateHabitStatus;
window.goHome = goHome;
window.openFullMonthView = openFullMonthView;
window.updateFullMonthHabit = updateFullMonthHabit;
window.openQuarterEvaluation = openQuarterEvaluation;
window.openAnnualEvaluation = openAnnualEvaluation;
window.closeMonthReport = closeMonthReport;
window.toggleTheme = toggleTheme;
