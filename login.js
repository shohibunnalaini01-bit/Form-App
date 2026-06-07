// ===== KONFIGURASI SUPABASE =====
const SUPABASE_URL = 'https://jpkbzwmzzlqudkpjxtvm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LSqEXnT4UalRQJCdYYEfAA_CTw-NhVX';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== JAM REALTIME =====
function updateDatetime() {
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
        'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
    const now = new Date();

    const dayName = days[now.getDay()];
    const dateNum = String(now.getDate()).padStart(2, '0');
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const datePart = dayName + ' ' + dateNum + ' ' + monthName + ' ' + year;
    const timePart = hours + '.' + minutes + '.' + seconds;

    // Strip kiri (desktop) — dengan span berbeda warna
    const stripEl = document.getElementById('stripDatetime');
    if (stripEl) {
        stripEl.innerHTML = datePart + '  <span class="jam">|  ' + timePart + '</span>';
    }

    // Header mobile
    const mobileEl = document.getElementById('mobileDatetime');
    if (mobileEl) {
        mobileEl.innerHTML = datePart + '  |  ' + timePart;
    }
}

// Langsung jalankan & set interval setiap 1 detik
updateDatetime();
setInterval(updateDatetime, 1000);

// ===== CEK SESI =====
document.addEventListener('DOMContentLoaded', function () {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
        window.location.href = 'index.html';
    }
});

// ===== TOGGLE PASSWORD =====
function togglePassword() {
    const passInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.className = 'fas fa-eye-slash';
    } else {
        passInput.type = 'password';
        eyeIcon.className = 'fas fa-eye';
    }
}

// ===== CAPS LOCK DETECTION =====
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('password').addEventListener('keyup', function (e) {
        var capsWarning = document.getElementById('capsWarning');
        if (e.getModifierState && e.getModifierState('CapsLock')) {
            capsWarning.classList.add('show');
        } else {
            capsWarning.classList.remove('show');
        }
    });
});

// ===== LUPA PASSWORD =====
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('forgotLink').addEventListener('click', function (e) {
        e.preventDefault();
        showToast('Hubungi Admin untuk reset password', 'info');
    });
});

// ===== PROSES LOGIN =====
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value;
        var errorEl = document.getElementById('loginError');
        var btnText = document.querySelector('.btn-text');
        var btnLoader = document.querySelector('.btn-loader');

        // Disable seluruh form saat loading
        var allInputs = document.querySelectorAll('#loginForm input, #loginForm button');
        allInputs.forEach(function (el) { el.disabled = true; });

        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
        errorEl.classList.remove('show');

        try {
            var { data: users, error: fetchError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('username', username);

            if (fetchError) throw fetchError;

            if (!users || users.length === 0) {
                throw new Error('Username tidak ditemukan');
            }

            var user = users[0];

            if (user.password !== password) {
                throw new Error('Password salah');
            }

            // Welcome overlay
            document.getElementById('welcomeName').textContent = 'Selamat Datang, ' + user.nama + '!';
            document.getElementById('welcomeRole').textContent = user.role;
            document.getElementById('welcomeOverlay').classList.add('show');

            setTimeout(function () {
                sessionStorage.setItem('currentUser', JSON.stringify({
                    id: user.id,
                    nama: user.nama,
                    username: user.username,
                    role: user.role
                }));
                window.location.href = 'index.html';
            }, 1500);

        } catch (err) {
            errorEl.textContent = err.message || 'Terjadi kesalahan';
            errorEl.classList.add('show');

            allInputs.forEach(function (el) { el.disabled = false; });
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });
});

// ===== TOAST =====
function showToast(msg, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<i class="fas fa-info-circle"></i> ' + msg;
    container.appendChild(toast);
    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s';
        setTimeout(function () { toast.remove(); }, 300);
    }, 3500);
}