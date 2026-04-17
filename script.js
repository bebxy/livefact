// Available versions
const VERSIONS = [
    { id: 'nov_2025', name: 'November 2025', file: 'data/2025_11.csv' },
];

let currentVersionIndex = 0;
let currentData = null;
let sortConfig = { metric: 'overall', ascending: false };

function calculateRunningMonths() {
    const startDate = new Date(2025, 10);
    const now = new Date();
    const months = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    return Math.max(1, months + 1);
}

function initializeNavigation() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }

    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileToggle && mobileToggle.classList.remove('active');
        });
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const targetPosition = target.offsetTop - offset;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        const scroll = window.pageYOffset;
        navbar.style.background = scroll > 100 ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.8)';
        navbar.style.boxShadow = scroll > 100 ? '0 4px 20px rgba(0, 0, 0, 0.1)' : 'none';
    });

    const heroBackground = document.querySelector('.hero-background');
    if (heroBackground) {
        window.addEventListener('scroll', () => {
            heroBackground.style.transform = `translateY(${window.pageYOffset * 0.5}px)`;
        });
    }
}

function initializeVersionSelector() {
    const prevBtn = document.getElementById('prev-version');
    const nextBtn = document.getElementById('next-version');

    prevBtn.addEventListener('click', () => {
        if (currentVersionIndex > 0) {
            currentVersionIndex--;
            updateVersionDisplay();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentVersionIndex < VERSIONS.length - 1) {
            currentVersionIndex++;
            updateVersionDisplay();
        }
    });

    updateVersionDisplay();
}

function updateVersionDisplay() {
    const version = VERSIONS[currentVersionIndex];
    document.getElementById('current-version').textContent = version.name;
    document.getElementById('prev-version').disabled = currentVersionIndex === 0;
    document.getElementById('next-version').disabled = currentVersionIndex === VERSIONS.length - 1;
    loadLeaderboardData();
}

function loadLeaderboardData() {
    const version = VERSIONS[currentVersionIndex];
    sortConfig = { metric: 'overall', ascending: false };

    fetch(version.file)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load CSV');
            return response.text();
        })
        .then(csvData => {
            currentData = parseCSV(csvData);
            displayLeaderboard(currentData);
            attachSortHandlers();
        })
        .catch(error => {
            console.error('Error:', error);
            showLoadingError();
        });
}

function parseCSV(csvData) {
    const lines = csvData.trim().split('\n');
    return lines.slice(1).map((line, idx) => {
        const values = line.split(',').map(v => v.trim());
        return {
            rank: idx + 1,
            model: values[0],
            organization: values[1],
            overall: parseFloat(values[2]),
            before_cls: parseFloat(values[3]),
            before_inf: parseFloat(values[4]),
            during_cls: parseFloat(values[5]),
            during_inf: parseFloat(values[6]),
            after_cls: parseFloat(values[7]),
            after_inf: parseFloat(values[8])
        };
    });
}

function displayLeaderboard(data) {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    const sorted = sortData(data, sortConfig.metric, sortConfig.ascending);

    sorted.forEach((item, idx) => {
        const row = document.createElement('tr');
        let rankClass = '';
        if (idx === 0) rankClass = 'rank-1';
        else if (idx === 1) rankClass = 'rank-2';
        else if (idx === 2) rankClass = 'rank-3';
        row.className = rankClass;
        
        row.innerHTML = `
            <td>${idx < 3 ? `<span class="rank-badge ${['gold', 'silver', 'bronze'][idx]}">${idx + 1}</span>` : `<span class="rank-number">${idx + 1}</span>`}</td>
            <td class="model-name">${item.model}</td>
            <td>${item.organization}</td>
            <td class="score">${item.overall.toFixed(1)}</td>
            <td>${item.before_cls.toFixed(1)}</td>
            <td>${item.before_inf.toFixed(1)}</td>
            <td>${item.during_cls.toFixed(1)}</td>
            <td>${item.during_inf.toFixed(1)}</td>
            <td>${item.after_cls.toFixed(1)}</td>
            <td>${item.after_inf.toFixed(1)}</td>
        `;
        
        tbody.appendChild(row);
    });

    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, idx) => {
        row.style.cssText = `opacity: 0; transform: translateY(10px); transition: opacity 0.3s ease ${idx * 0.05}s, transform 0.3s ease ${idx * 0.05}s;`;
        setTimeout(() => { row.style.cssText = 'opacity: 1; transform: translateY(0);'; }, 10);
    });
}

function sortData(data, metric, ascending) {
    const map = { 'overall': 'overall', 'before_cls': 'before_cls', 'before_inf': 'before_inf', 'during_cls': 'during_cls', 'during_inf': 'during_inf', 'after_cls': 'after_cls', 'after_inf': 'after_inf' };
    return [...data].sort((a, b) => ascending ? a[map[metric]] - b[map[metric]] : b[map[metric]] - a[map[metric]]);
}

function attachSortHandlers() {
    document.querySelectorAll('.sortable').forEach(header => {
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
        newHeader.addEventListener('click', () => {
            const metric = newHeader.getAttribute('data-metric');
            if (sortConfig.metric === metric) sortConfig.ascending = !sortConfig.ascending;
            else { sortConfig.metric = metric; sortConfig.ascending = false; }
            
            document.querySelectorAll('.sortable').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
            const h = document.querySelector(`th[data-metric="${metric}"]`);
            if (h) h.classList.add(sortConfig.ascending ? 'sort-asc' : 'sort-desc');
            
            displayLeaderboard(currentData);
            attachSortHandlers();
        });
    });
}

function calculateAndDisplayStats() {
    document.getElementById('running-months').textContent = calculateRunningMonths();
}

function showLoadingError() {
    document.getElementById('leaderboard-body').innerHTML = '<tr><td colspan="10">Unable to load data</td></tr>';
}

function typeWriter() {
    const title = document.querySelector('.hero-title .gradient-text');
    if (!title || window.innerWidth < 768) return;
    const text = title.textContent;
    title.textContent = '';
    let idx = 0;
    const type = () => {
        if (idx < text.length) {
            title.textContent += text[idx++];
            setTimeout(type, 150);
        }
    };
    setTimeout(type, 500);
}

function createParticles() {
    const hero = document.querySelector('.hero');
    if (!hero || window.innerWidth < 768) return;

    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `position: absolute; width: ${Math.random() * 3 + 1}px; height: ${Math.random() * 3 + 1}px; background: rgba(99, 102, 241, ${Math.random() * 0.5}); border-radius: 50%; left: ${Math.random() * 100}%; top: ${Math.random() * 100}%; animation: float ${Math.random() * 10 + 10}s infinite ease-in-out; pointer-events: none; z-index: 0;`;
        hero.appendChild(p);
    }

    const s = document.createElement('style');
    s.textContent = '@keyframes float { 0%, 100% { transform: translateY(0) translateX(0); opacity: 0; } 50% { transform: translateY(-100px) translateX(50px); opacity: 1; } }';
    document.head.appendChild(s);
}

function animateCounter(el) {
    const text = el.textContent;
    if (!/^\d+$/.test(text)) return;
    const target = parseInt(text);
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const timer = setInterval(() => {
        cur += inc;
        el.textContent = cur >= target ? text : Math.floor(cur).toString();
        if (cur >= target) clearInterval(timer);
    }, 2000 / steps);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeVersionSelector();
    loadLeaderboardData();
    calculateAndDisplayStats();
    typeWriter();

    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.feature-card, .method-step, .contact-card').forEach(el => {
        el.style.cssText = 'opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease;';
        obs.observe(el);
    });

    const statsObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting && !e.target.classList.contains('animated')) {
                e.target.classList.add('animated');
                animateCounter(e.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(s => statsObs.observe(s));
});

window.addEventListener('load', createParticles);
