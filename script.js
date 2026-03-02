// -------------------------------------------------------------
// KONFIGURASI FIREBASE (Database Realtime Gratis buatan Google)
// -------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyB2oIYlE_BGP5YDkpiV8KFoqSJRJHf380w",
    authDomain: "undangan-syahrul-rita.firebaseapp.com",
    databaseURL: "https://undangan-syahrul-rita-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "undangan-syahrul-rita",
    storageBucket: "undangan-syahrul-rita.firebasestorage.app",
    messagingSenderId: "571963273406",
    appId: "1:571963273406:web:4de18597130a6ff37eaeef",
    measurementId: "G-81KCBQMPVV"
};

const isFirebaseConfigured = firebaseConfig.apiKey !== "API_KEY_ANDA";
let db;

if (isFirebaseConfigured) {
    // Memulai Javascript Firebase dengan kompatibilitas format standar
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
}

document.addEventListener('DOMContentLoaded', () => {

    // 0. Ambil Nama Tamu dari URL (misal: ?to=Fazrian)
    const urlParams = new URLSearchParams(window.location.search);
    const guestNameParam = urlParams.get('to') || urlParams.get('nama');
    const guestNameElement = document.getElementById('guest-name');

    if (guestNameParam && guestNameElement) {
        // Render the name, replace + or %20 with spaces
        guestNameElement.innerText = guestNameParam;
    }

    // 1. Lock Scroll Initially
    const body = document.body;
    body.style.overflow = 'hidden';

    // Memaksakan kotak pembuka tampil ke layar, jaga-jaga jika tersembunyi
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '1';
        heroContent.style.transform = 'translateY(0)';
    }

    const openBtn = document.getElementById('open-invite');
    const mainContent = document.getElementById('main-content');
    const bgMusic = document.getElementById('bg-music');
    const toggleMusicBtn = document.getElementById('toggle-music');
    const musicIcon = toggleMusicBtn.querySelector('i');

    // 2. Open Invitation Logic
    openBtn.addEventListener('click', () => {
        // Allow scroll
        body.style.overflow = 'auto';

        // Show main content (fade in)
        mainContent.classList.remove('hidden-content');
        mainContent.classList.add('show-content');

        // Scroll to couple section smoothly
        document.getElementById('couple').scrollIntoView({ behavior: 'smooth' });

        // Play Music
        playMusic();
    });

    // 3. Music Control
    let isPlaying = false;

    function playMusic() {
        bgMusic.play().then(() => {
            isPlaying = true;
            toggleMusicBtn.classList.add('spin-slow');
            musicIcon.classList.remove('fa-play');
            musicIcon.classList.add('fa-compact-disc');
        }).catch(err => {
            console.log("Autoplay prevented by browser policy", err);
            // Provide visual cue that music is paused
            isPlaying = false;
            toggleMusicBtn.classList.remove('spin-slow');
            musicIcon.classList.remove('fa-compact-disc');
            musicIcon.classList.add('fa-play');
        });
    }

    toggleMusicBtn.addEventListener('click', () => {
        if (isPlaying) {
            bgMusic.pause();
            isPlaying = false;
            toggleMusicBtn.classList.remove('spin-slow');
        } else {
            bgMusic.play();
            isPlaying = true;
            toggleMusicBtn.classList.add('spin-slow');
        }
    });

    // 4. Scroll Animations (AOS equivalent)
    const observerOptions = {
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });

    // 5. Copy to Clipboard
    window.copyText = function (elementId) {
        const textToCopy = document.getElementById(elementId).innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast("Nomor berhasil disalin!");
        }).catch(err => {
            console.error('Gagal menyalin text', err);
            showToast("Gagal menyalin, coba manual.");
        });
    }

    function showToast(message) {
        const toast = document.getElementById('toast-message');
        toast.innerText = message;
        toast.classList.remove('hidden');
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }

    // 6. Wishes / Comments System (Firebase or LocalStorage Fallback)
    const wishesForm = document.getElementById('wishes-form');
    const wishesList = document.getElementById('wishes-list');
    const STORAGE_KEY = 'wedding_wishes_romeo_juliet';

    // Initialize data load
    if (isFirebaseConfigured) {
        // Realtime Firebase Listener (Format Standar/Compat)
        db.ref('wedding_wishes').on('value', (snapshot) => {
            const data = snapshot.val();
            const wishes = [];
            if (data) {
                // Convert object to array and reverse to show newest first
                Object.keys(data).forEach(key => {
                    wishes.push({ id: key, ...data[key] });
                });
                wishes.reverse();
            }
            renderWishes(wishes);
        });
    } else {
        // Load Local Storage
        const wishes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        renderWishes(wishes);
    }

    wishesForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('sender-name').value;
        const message = document.getElementById('sender-message').value;
        const attendance = document.getElementById('attendance').value;

        const dateString = new Date().toLocaleDateString('id-ID', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const newWish = {
            name,
            message,
            attendance,
            date: dateString,
            timestamp: Date.now()
        };

        if (isFirebaseConfigured) {
            // Save to Firebase
            db.ref('wedding_wishes').push(newWish).then(() => {
                wishesForm.reset();
                showToast("Ucapan berhasil dikirim secara publik!");
            }).catch(error => {
                console.error("Error writing to Firebase:", error);
                showToast("Gagal mengirim ucapan!");
            });
        } else {
            // Fallback Local Storage
            let wishes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            wishes.unshift({ id: Date.now(), ...newWish });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));

            wishesForm.reset();
            renderWishes(wishes);
            showToast("Tersimpan secara luring (Tambahkan akun Firebase untuk daring!)");
        }
    });

    function renderWishes(wishes) {
        wishesList.innerHTML = '';

        if (wishes.length === 0) {
            wishesList.innerHTML = '<p class="text-center" style="color:#999;">Belum ada ucapan. Jadilah yang pertama mengirim doa!</p>';
            return;
        }

        wishes.forEach(wish => {
            const wishItem = document.createElement('div');
            wishItem.classList.add('wish-item');

            // Set styling badge based on attendance status
            let attendanceColor = "var(--primary-color)"; // Pink/Rose
            let bgAlpha = "15"; // Hex alpha value roughly 10%

            if (wish.attendance === "Tidak Hadir") {
                attendanceColor = "#e74c3c"; // Reddish
                bgAlpha = "15";
            } else if (wish.attendance === "Belum Pasti") {
                attendanceColor = "#f39c12"; // Orange
                bgAlpha = "20";
            } else {
                attendanceColor = "#27ae60"; // Green for attending
                bgAlpha = "15";
            }

            wishItem.style.borderLeftColor = attendanceColor;

            wishItem.innerHTML = `
                <div class="wish-header">
                    <span class="wish-name">${sanitizeHTML(wish.name)}</span>
                    <span class="wish-attendance" style="color: ${attendanceColor}; background-color: ${attendanceColor}${bgAlpha};">${wish.attendance}</span>
                </div>
                <p class="wish-message">${sanitizeHTML(wish.message)}</p>
                <span class="wish-date">${wish.date}</span>
            `;
            wishesList.appendChild(wishItem);
        });
    }

    function sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

});
