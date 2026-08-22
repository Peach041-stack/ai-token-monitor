const usageData = [
    {
        id: 'claude',
        name: 'ClaudeCowork',
        icon: 'C',
        limit5h: 50,
        used5h: 32,
        limitWeek: 500,
        usedWeek: 150
    },
    {
        id: 'codex',
        name: 'Codex',
        icon: 'X',
        limit5h: 100,
        used5h: 85,
        limitWeek: 1000,
        usedWeek: 720
    },
    {
        id: 'anti',
        name: 'Antigravity',
        icon: 'A',
        limit5h: 200,
        used5h: 45,
        limitWeek: 2000,
        usedWeek: 450
    }
];

function renderWidget() {
    const list = document.getElementById('usage-list');
    
    usageData.forEach(item => {
        // Calculate percentages ensuring they don't exceed 100%
        const percent5h = Math.min((item.used5h / item.limit5h) * 100, 100);
        const percentWeek = Math.min((item.usedWeek / item.limitWeek) * 100, 100);
        
        // Add color coding for approaching limits (optional feature)
        const isNearLimit5h = percent5h > 80;
        const isNearLimitWeek = percentWeek > 80;
        
        const html = `
            <div class="usage-item">
                <div class="item-header">
                    <div class="icon-box ${item.id}">${item.icon}</div>
                    <div class="item-title">${item.name}</div>
                </div>
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-label">5 Hours</div>
                        <div class="stat-value" ${isNearLimit5h ? 'style="color:#ef4444;"' : ''}>
                            ${item.used5h} <span class="stat-limit">/ ${item.limit5h}</span>
                        </div>
                        <div class="progress-bg">
                            <div class="progress-fill ${item.id}" style="width: 0%" data-width="${percent5h}%"></div>
                        </div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Weekly</div>
                        <div class="stat-value" ${isNearLimitWeek ? 'style="color:#ef4444;"' : ''}>
                            ${item.usedWeek} <span class="stat-limit">/ ${item.limitWeek}</span>
                        </div>
                        <div class="progress-bg">
                            <div class="progress-fill ${item.id}" style="width: 0%" data-width="${percentWeek}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', html);
    });

    // Animate progress bars after render for a smooth effect
    setTimeout(() => {
        const bars = document.querySelectorAll('.progress-fill');
        bars.forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
    }, 100);
}

document.addEventListener('DOMContentLoaded', renderWidget);
