// Available monthly releases. `claims` is the published claim count for that
// release (from the paper); model count is derived from the CSV itself so it
// can never drift out of sync the way a hardcoded stat would.
const VERSIONS = [
    { id: 'nov_2025', name: 'November 2025', file: 'data/2025_11.csv', claims: 4392 },
    { id: 'dec_2025', name: 'December 2025', file: 'data/2025_12.csv', claims: 4222 },
];

const METRIC_KEYS = ['before_cls', 'before_inf', 'during_cls', 'during_inf', 'after_cls', 'after_inf'];

let currentVersionIndex = VERSIONS.length - 1;
let currentData = null;
let metricMode = 'acc';
let sortConfig = { metric: 'overall', ascending: false };

function formatNumber(n) {
    return n.toLocaleString('en-US');
}

function calculateRunningMonths() {
    const startDate = new Date(2025, 10);
    const now = new Date();
    const months = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
    return Math.max(1, months + 1);
}

function initializeScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    const update = () => {
        const scrollTop = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (height > 0 ? (scrollTop / height) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
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

    document.querySelectorAll('.nav-links a').forEach(item => {
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
    document.querySelectorAll('.sortable').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
    const overallHeader = document.querySelector('th[data-metric="overall"]');
    if (overallHeader) overallHeader.classList.add('sort-desc');

    fetch(version.file)
        .then(response => {
            if (!response.ok) throw new Error('Failed to load CSV');
            return response.text();
        })
        .then(csvData => {
            currentData = parseCSV(csvData);
            displayLeaderboard(currentData);
            attachSortHandlers();
            const meta = document.getElementById('version-meta');
            if (meta) meta.textContent = `${currentData.length} models · ${formatNumber(version.claims)} claims evaluated`;
        })
        .catch(error => {
            console.error('Error:', error);
            showLoadingError();
        });
}

function parseCSV(csvData) {
    const lines = csvData.trim().split('\n');
    return lines.slice(1).map(line => {
        const v = line.split(',').map(s => s.trim());
        return {
            model: v[0],
            organization: v[1],
            overall: parseFloat(v[2]),
            before_cls_acc: parseFloat(v[3]), before_cls_f1: parseFloat(v[4]),
            before_inf_acc: parseFloat(v[5]), before_inf_f1: parseFloat(v[6]),
            during_cls_acc: parseFloat(v[7]), during_cls_f1: parseFloat(v[8]),
            during_inf_acc: parseFloat(v[9]), during_inf_f1: parseFloat(v[10]),
            after_cls_acc: parseFloat(v[11]), after_cls_f1: parseFloat(v[12]),
            after_inf_acc: parseFloat(v[13]), after_inf_f1: parseFloat(v[14]),
        };
    });
}

function getMetricValue(item, metric) {
    if (metric === 'overall') return item.overall;
    return item[`${metric}_${metricMode}`];
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

        const rankCell = idx < 3
            ? `<span class="rank-badge ${['gold', 'silver', 'bronze'][idx]}">${idx + 1}</span>`
            : `<span class="rank-number">${idx + 1}</span>`;

        row.innerHTML = `
            <td>${rankCell}</td>
            <td class="model-name">${item.model}</td>
            <td>${item.organization}</td>
            <td class="score">${item.overall.toFixed(1)}</td>
            ${METRIC_KEYS.map(k => `<td>${getMetricValue(item, k).toFixed(1)}</td>`).join('')}
        `;

        tbody.appendChild(row);
    });

    animateRows(tbody);
}

function animateRows(tbody) {
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, idx) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        row.style.transition = `opacity 0.3s ease ${idx * 0.04}s, transform 0.3s ease ${idx * 0.04}s`;
    });
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            rows.forEach(row => {
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            });
        });
    });
}

function sortData(data, metric, ascending) {
    return [...data].sort((a, b) => {
        const av = getMetricValue(a, metric);
        const bv = getMetricValue(b, metric);
        return ascending ? av - bv : bv - av;
    });
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

function initializeMetricToggle() {
    const toggle = document.querySelector('.metric-toggle');
    const buttons = document.querySelectorAll('.metric-btn');
    if (!toggle || !buttons.length) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode-btn');
            if (mode === metricMode) return;
            metricMode = mode;
            buttons.forEach(b => {
                const isActive = b === btn;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            toggle.setAttribute('data-mode', metricMode);
            if (currentData) displayLeaderboard(currentData);
        });
    });
}

function initializeLegend() {
    const btn = document.getElementById('legend-toggle');
    const panel = document.getElementById('legend-panel');
    if (!btn || !panel) return;

    btn.addEventListener('click', () => {
        const isHidden = panel.hasAttribute('hidden');
        if (isHidden) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });
}

function initializeCitationCopy() {
    const btn = document.getElementById('copy-bibtex');
    const block = document.getElementById('bibtex-block');
    if (!btn || !block) return;

    btn.addEventListener('click', () => {
        const text = block.textContent.trim();
        const done = () => {
            const original = 'Copy BibTeX';
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = original; }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
            done();
        }
    });
}

function showLoadingError() {
    document.getElementById('leaderboard-body').innerHTML = '<tr><td colspan="10" class="error-message">Unable to load data for this release.</td></tr>';
}

function calculateAndDisplayStats() {
    document.getElementById('running-months').textContent = calculateRunningMonths();
}

// Uses the server-reported file modification time so this never needs
// manual upkeep. Falls back silently if a host doesn't send one.
function displayLastUpdated() {
    const el = document.getElementById('last-updated');
    if (!el) return;
    const modified = new Date(document.lastModified);
    if (isNaN(modified.getTime())) return;
    const formatted = modified.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    el.textContent = `Last updated: ${formatted}`;
}

// Fetches every release once (small local CSVs) to derive site-wide totals
// that stay correct as new monthly releases are added, instead of hardcoding them.
function computeGlobalStats() {
    const totalClaims = VERSIONS.reduce((sum, v) => sum + v.claims, 0);
    document.getElementById('test-claims').textContent = formatNumber(totalClaims) + '+';

    return Promise.all(VERSIONS.map(v => fetch(v.file).then(r => r.text()).then(parseCSV)))
        .then(allData => {
            const modelSet = new Set();
            allData.forEach(rows => rows.forEach(row => modelSet.add(row.model)));
            document.getElementById('models-evaluated').textContent = modelSet.size;
        })
        .catch(() => {
            document.getElementById('models-evaluated').textContent = '—';
        });
}

function animateCounter(el) {
    const raw = el.textContent;
    const match = raw.match(/^([\d,]+)(\+?)$/);
    if (!match) return;
    const target = parseInt(match[1].replace(/,/g, ''), 10);
    const suffix = match[2];
    if (isNaN(target)) return;

    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const timer = setInterval(() => {
        cur += inc;
        if (cur >= target) {
            el.textContent = formatNumber(target) + suffix;
            clearInterval(timer);
        } else {
            el.textContent = formatNumber(Math.floor(cur)) + suffix;
        }
    }, 2000 / steps);
}

function typeWriter() {
    const title = document.querySelector('.hero-title .gradient-text');
    if (!title || window.innerWidth < 768) return;
    const text = title.textContent;
    title.textContent = '';

    // A separate caret element blinks alongside the typing effect without
    // touching title.style.animation, which would otherwise clobber the
    // gradient-text class's own gradientShift animation.
    const caret = document.createElement('span');
    caret.className = 'type-caret';
    title.insertAdjacentElement('afterend', caret);

    let idx = 0;
    const type = () => {
        if (idx < text.length) {
            title.textContent += text[idx++];
            setTimeout(type, 140);
        } else {
            // Fade the caret out instead of removing it from the DOM: removing
            // it would shrink the centered line's total width and make the
            // text visibly re-center (jump sideways). Hiding it in place keeps
            // the reserved layout width constant, so nothing shifts.
            setTimeout(() => {
                caret.style.animation = 'none';
                caret.style.opacity = '0';
            }, 1400);
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

function setupRevealObserver() {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.feature-card, .method-step, .contact-card, .fog-node').forEach(el => {
        el.style.cssText += 'opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease;';
        obs.observe(el);
    });
}

function setupStatsObserver() {
    const statsObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting && !e.target.classList.contains('animated')) {
                e.target.classList.add('animated');
                animateCounter(e.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(s => statsObs.observe(s));
}

document.addEventListener('DOMContentLoaded', function() {
    initializeScrollProgress();
    initializeNavigation();
    initializeVersionSelector();
    initializeMetricToggle();
    initializeLegend();
    initializeCitationCopy();
    calculateAndDisplayStats();
    displayLastUpdated();
    typeWriter();
    setupRevealObserver();

    computeGlobalStats().finally(setupStatsObserver);
});

window.addEventListener('load', createParticles);
