const ADMIN_KEY = '323157';

const cloudbaseConfig = {
    env: 'bilingual-reader-d2emnwecc8dfea6',
    region: 'ap-shanghai'
};

let cloudbaseApp = null;

class BilingualReader {
    constructor() {
        this.articles = [];
        this.filteredArticles = [];
        this.activeTag = null;
        this.searchQuery = '';
        this.deletingArticleId = null;
        this.editingArticleId = null;
        this.isAdmin = false;
        this.init();
    }

    async init() {
        try {
            await this.initCloudbase();
            await this.loadFromStorage();
        } catch (error) {
            console.warn('数据库连接失败，使用离线测试模式:', error.message);
            this.articles = this.getSampleArticles().map((a, i) => ({
                ...a,
                id: 'sample_' + i,
                objectId: 'sample_' + i
            }));
            this.filteredArticles = [...this.articles];
            this.showToast('离线测试模式 - 使用本地测试文章', 'warning');
        }

        this.checkAdminStatus();
        this.bindEvents();
        this.renderArticles();
        this.renderTags();
        this.initStreaks();
        this.updateAdminUI();
    }

    async initCloudbase() {
        if (cloudbaseApp) return;

        if (typeof cloudbase === 'undefined') {
            throw new Error('腾讯云SDK未加载，请检查网络连接');
        }

        try {
            registerAuth(cloudbase);
            registerDatabase(cloudbase);

            cloudbaseApp = cloudbase.init(cloudbaseConfig);

            const { data, error } = await cloudbaseApp.auth.signInAnonymously();
            if (error) {
                throw new Error(error.message);
            }

            const db = cloudbaseApp.database();

            const result = await db.collection('articles').limit(1).get();
            console.log('腾讯云数据库连接成功, 已存在文档数:', result.data.length);
            this.showToast('已连接到腾讯云数据库', 'success');
        } catch (error) {
            cloudbaseApp = null;
            throw new Error('无法连接到腾讯云: ' + error.message);
        }
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = '✓';
        if (type === 'error') icon = '✕';
        if (type === 'warning') icon = '⚠';

        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-content">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s cubic-bezier(0.7, 0, 0.84, 0) forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    checkAdminStatus() {
        const adminExpire = localStorage.getItem('admin_expire');
        if (adminExpire && Date.now() < parseInt(adminExpire)) {
            this.isAdmin = true;
        }
    }

    setAdminStatus(isAdmin) {
        this.isAdmin = isAdmin;
        if (isAdmin) {
            localStorage.setItem('admin_expire', (Date.now() + 24 * 60 * 60 * 1000).toString());
        } else {
            localStorage.removeItem('admin_expire');
        }
        this.updateAdminUI();
        this.renderArticles();
    }

    updateAdminUI() {
        const uploadBtn = document.getElementById('upload-btn');
        const logoIcon = document.getElementById('logo-admin');

        if (this.isAdmin) {
            uploadBtn.style.display = 'inline-block';
            logoIcon.classList.add('admin-active');
        } else {
            uploadBtn.style.display = 'none';
            logoIcon.classList.remove('admin-active');
        }
    }

    initStreaks() {
        const container = document.getElementById('bg-streaks-container');
        if (!container) return;

        const createStreak = () => {
            const streak = document.createElement('div');
            streak.className = 'dynamic-streak';

            const angle = Math.random() * 360;
            const length = 80 + Math.random() * 200;
            const duration = 1 + Math.random() * 2;
            const delay = Math.random() * 0.8;
            const translateX1 = 100 + Math.random() * 200;
            const translateX2 = 300 + Math.random() * 500;
            const opacityPeak = 0.4 + Math.random() * 0.6;

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            streak.style.cssText = `
                position: absolute;
                left: ${centerX}px;
                top: ${centerY}px;
                width: ${length}px;
                height: ${1 + Math.random() * 2}px;
                background: linear-gradient(90deg,
                    transparent 0%,
                    rgba(125, 211, 252, ${0.1 + Math.random() * 0.3}) 20%,
                    rgba(125, 211, 252, ${0.4 + Math.random() * 0.4}) 40%,
                    rgba(192, 132, 252, ${0.3 + Math.random() * 0.3}) 60%,
                    rgba(240, 171, 252, ${0.2 + Math.random() * 0.2}) 80%,
                    transparent 100%);
                transform: rotate(${angle}deg) translateX(0);
                transform-origin: left center;
                opacity: 0;
                pointer-events: none;
            `;

            container.appendChild(streak);

            const startTime = Date.now() + delay * 1000;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / (duration * 1000), 1);

                if (progress >= 1) {
                    streak.remove();
                    return;
                }

                let opacity = 0;
                let translateX = 0;
                let scaleX = 0;

                if (progress < 0.2) {
                    opacity = (progress / 0.2) * opacityPeak;
                    scaleX = progress / 0.2;
                    translateX = 0;
                } else if (progress < 0.6) {
                    const t = (progress - 0.2) / 0.4;
                    opacity = opacityPeak - t * (opacityPeak * 0.4);
                    translateX = t * translateX1;
                    scaleX = 1;
                } else if (progress < 0.8) {
                    const t = (progress - 0.6) / 0.2;
                    opacity = opacityPeak * 0.6 - t * (opacityPeak * 0.5);
                    translateX = translateX1 + t * (translateX2 - translateX1);
                    scaleX = 1 - t * 0.3;
                } else {
                    const t = (progress - 0.8) / 0.2;
                    opacity = opacityPeak * 0.1 - t * (opacityPeak * 0.1);
                    translateX = translateX2;
                    scaleX = 0.7 - t * 0.7;
                }

                if (Math.random() > 0.85) {
                    opacity *= 0.3;
                } else if (Math.random() > 0.7) {
                    opacity *= 0.7;
                }

                streak.style.opacity = Math.max(0, opacity);
                streak.style.transform = `rotate(${angle}deg) translateX(${translateX}px) scaleX(${Math.max(0, scaleX)})`;

                requestAnimationFrame(animate);
            };

            if (delay > 0) {
                setTimeout(() => requestAnimationFrame(animate), delay * 1000);
            } else {
                requestAnimationFrame(animate);
            }
        };

        const createBatch = () => {
            const count = 2 + Math.floor(Math.random() * 6);
            for (let i = 0; i < count; i++) {
                setTimeout(() => createStreak(), i * 80 + Math.random() * 150);
            }
        };

        createBatch();
        setInterval(() => {
            createBatch();
        }, 500 + Math.random() * 800);
    }

    async getDb() {
        if (!cloudbaseApp) {
            await this.initCloudbase();
        }
        return cloudbaseApp.database();
    }

    async loadFromStorage() {
        try {
            const db = await this.getDb();
            const result = await db.collection('articles').orderBy('createdAt', 'desc').get();

            if (result.data.length === 0) {
                await this.addSampleArticles();
                const newResult = await db.collection('articles').orderBy('createdAt', 'desc').get();
                this.articles = newResult.data.map(r => this.convertToArticle(r));
            } else {
                this.articles = result.data.map(r => this.convertToArticle(r));
            }

            this.filteredArticles = [...this.articles];
        } catch (error) {
            console.warn('数据库加载失败，使用离线测试文章:', error.message);
            this.articles = this.getSampleArticles().map((a, i) => ({
                ...a,
                id: 'sample_' + i,
                objectId: 'sample_' + i
            }));
            this.filteredArticles = [...this.articles];
        }
    }

    convertToArticle(record) {
        return {
            id: record._id,
            objectId: record._id,
            title: record.title,
            english: record.english,
            chinese: record.chinese,
            tags: record.tags || [],
            level: record.level || 'intermediate',
            date: record.date || new Date().toISOString().split('T')[0],
            createdAt: record.createdAt
        };
    }

    async addSampleArticles() {
        const samples = this.getSampleArticles();
        const db = await this.getDb();
        for (const sample of samples) {
            await db.collection('articles').add({
                title: sample.title,
                english: sample.english,
                chinese: sample.chinese,
                tags: sample.tags,
                level: sample.level,
                date: sample.date
            });
        }
    }

    getSampleArticles() {
        return [
            {
                title: "Climate and Earth Systems",
                english: `To understand climate, we must look at the "horizon" of the whole Earth system. Over the "globe", the "ocean" and "marine" regions affect the air. The "current" inside the ocean may flow like a "stream" or a "torrent", moving heat and influencing the atmosphere. Sea "tide" and "source" water also matter. Warm water can produce "evaporation", turning liquid into "vapour". That vapour then "circulates" through the air and eventually "precipitate"s as rain.\n\nOn dry days, the same processes lead to "arid" land. In arid regions, the ground lacks "moist" air and becomes "dry" or "damp" depending on season. When the air is "humid", clouds grow thicker and the sky becomes "stormy". Many storms begin with "gust" winds, then turn into "gale", and later become "hurricane" or even "tornado". In extreme cases, a "catastrophic" event may endanger communities.`,
                chinese: `要理解气候，我们必须从整个地球系统的"视野"来观察。在"全球"范围内，"海洋"和"海洋"区域影响着大气。海洋内部的"洋流"可能像"溪流"或"激流"一样流动，输送热量并影响大气。海洋"潮汐"和"源头"水也很重要。温暖的水会产生"蒸发"，将液体转化为"蒸汽"。然后，这些蒸汽在空气中"循环"，最终以降水的形式"沉降"为雨。\n\n在干燥的日子里，同样的过程也会导致"干旱"的土地。在干旱地区，地面缺少"湿润"的空气，因此可能变得干燥，或在不同季节呈现"潮湿"。当空气"潮湿"时，云层会变厚，天空会变得"暴风雨"。许多风暴从"阵风"开始，随后发展成"大风"，再进一步变成"飓风"，甚至演变为"龙卷风"。在极端情况下，一个"灾难性的"事件可能会危及社区。`,
                tags: ["自然", "地理", "气候"],
                level: "intermediate",
                date: "2024-01-15"
            },
            {
                title: "The Art of Slow Living",
                english: "In a world that constantly pushes us to move faster, do more, and achieve greater heights, there's a growing movement towards slow living. This philosophy encourages us to savor each moment, find joy in simplicity, and cultivate mindfulness in our daily lives.\n\nSlow living is not about being unproductive or lazy; rather, it's about intentionality. It's about focusing on what truly matters, eliminating unnecessary busyness, and creating space for the things that bring us genuine happiness and fulfillment.",
                chinese: "在一个不断推动我们更快前进、做得更多、追求更高成就的世界里，慢生活的运动正在兴起。这种哲学鼓励我们品味每一个时刻，在简单中寻找快乐，并在日常生活中培养正念。\n\n慢生活并不是指不高效或懒惰；相反，它是关于 intentionality。它是关于专注于真正重要的事情，消除不必要的忙碌，为那些给我们带来真正快乐和满足感的事情创造空间。",
                tags: ["生活", "哲学", "健康"],
                level: "beginner",
                date: "2024-01-10"
            },
            {
                title: "Climate Change: A Call to Action",
                english: "Climate change is one of the most pressing issues of our time, affecting every corner of the globe. The scientific evidence is clear: human activities are fundamentally altering our planet's climate system, with far-reaching consequences for ecosystems, economies, and human well-being.\n\nThe impacts of climate change are already evident. Rising global temperatures, extreme weather events, melting ice caps, and sea-level rise are just a few of the changes we're witnessing.",
                chinese: "气候变化是我们这个时代最紧迫的问题之一，影响着全球的每一个角落。科学证据是明确的：人类活动正在从根本上改变我们星球的气候系统，对生态系统、经济和人类福祉产生深远的影响。\n\n气候变化的影响已经显而易见。全球气温上升、极端天气事件、冰盖融化和海平面上升只是我们正在目睹的一些变化。",
                tags: ["环境", "气候", "可持续"],
                level: "intermediate",
                date: "2024-01-05"
            }
        ];
    }

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        document.getElementById('logo-admin').addEventListener('click', () => {
            if (this.isAdmin) {
                this.showLogoutModal();
            } else {
                this.showAdminModal();
            }
        });

        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterArticles();
        });

        document.getElementById('upload-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addArticle();
        });

        document.getElementById('btn-batch').addEventListener('click', () => {
            if (!this.isAdmin) {
                this.showToast('请先登录管理员账号！', 'warning');
                return;
            }
            this.loadBatchSamples();
        });

        document.getElementById('back-btn').addEventListener('click', () => {
            this.switchView('list');
        });

        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('modal-confirm').addEventListener('click', () => {
            this.confirmDelete();
        });

        document.getElementById('edit-modal-cancel').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });

        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') {
                this.closeDeleteModal();
            }
        });

        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeEditModal();
            }
        });

        document.getElementById('modal-close-btn').addEventListener('click', () => {
            this.closeArticleModal();
        });

        document.getElementById('article-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'article-modal-overlay') {
                this.closeArticleModal();
            }
        });

        document.getElementById('admin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.verifyAdmin();
        });

        document.getElementById('admin-modal-cancel').addEventListener('click', () => {
            this.closeAdminModal();
        });

        document.getElementById('admin-modal').addEventListener('click', (e) => {
            if (e.target.id === 'admin-modal') {
                this.closeAdminModal();
            }
        });

        document.getElementById('logout-cancel').addEventListener('click', () => {
            this.closeLogoutModal();
        });

        document.getElementById('logout-confirm').addEventListener('click', () => {
            this.confirmLogout();
        });

        document.getElementById('logout-modal').addEventListener('click', (e) => {
            if (e.target.id === 'logout-modal') {
                this.closeLogoutModal();
            }
        });
    }

    showAdminModal() {
        document.getElementById('admin-key').value = '';
        document.getElementById('admin-status').style.display = 'none';
        document.getElementById('admin-modal').classList.add('show');
    }

    closeAdminModal() {
        document.getElementById('admin-modal').classList.remove('show');
    }

    verifyAdmin() {
        const inputKey = document.getElementById('admin-key').value;

        if (inputKey === ADMIN_KEY) {
            this.setAdminStatus(true);
            this.closeAdminModal();
            this.showToast('登录成功！', 'success');
        } else {
            document.getElementById('admin-status').textContent = '密钥错误，请重试！';
            document.getElementById('admin-status').style.display = 'block';
            document.getElementById('admin-status').style.color = '#ef4444';
        }
    }

    showLogoutModal() {
        document.getElementById('logout-modal').classList.add('show');
    }

    closeLogoutModal() {
        document.getElementById('logout-modal').classList.remove('show');
    }

    confirmLogout() {
        this.setAdminStatus(false);
        this.closeLogoutModal();
        this.showToast('已退出登录！', 'success');
    }

    switchView(view) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}-view`).classList.add('active');
    }

    getAllTags() {
        const tags = new Set();
        this.articles.forEach(article => {
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags);
    }

    renderTags() {
        const tagsContainer = document.getElementById('tags-filter');
        const tags = this.getAllTags();

        tagsContainer.innerHTML = '';

        const allBtn = document.createElement('button');
        allBtn.className = 'tag-btn' + (!this.activeTag ? ' active' : '');
        allBtn.textContent = '全部';
        allBtn.addEventListener('click', () => {
            this.activeTag = null;
            this.filterArticles();
            this.renderTags();
        });
        tagsContainer.appendChild(allBtn);

        tags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = 'tag-btn' + (this.activeTag === tag ? ' active' : '');
            btn.textContent = tag;
            btn.addEventListener('click', () => {
                this.activeTag = tag;
                this.filterArticles();
                this.renderTags();
            });
            tagsContainer.appendChild(btn);
        });
    }

    filterArticles() {
        this.filteredArticles = this.articles.filter(article => {
            const matchesSearch = !this.searchQuery ||
                article.title.toLowerCase().includes(this.searchQuery) ||
                (article.english && article.english.toLowerCase().includes(this.searchQuery)) ||
                (article.chinese && article.chinese.includes(this.searchQuery)) ||
                (article.tags && article.tags.some(tag => tag.toLowerCase().includes(this.searchQuery)));

            const matchesTag = !this.activeTag || (article.tags && article.tags.includes(this.activeTag));

            return matchesSearch && matchesTag;
        });

        this.renderArticles();
    }

    renderArticles() {
        const grid = document.getElementById('articles-grid');
        const emptyState = document.getElementById('empty-state');

        if (this.filteredArticles.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.add('show');
            return;
        }

        emptyState.classList.remove('show');
        grid.innerHTML = this.filteredArticles.map(article => this.createArticleCard(article)).join('');

        grid.querySelectorAll('.article-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-actions')) {
                    this.showArticleModal(card.dataset.id);
                }
            });
        });

        grid.querySelectorAll('.card-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showDeleteModal(btn.closest('.article-card').dataset.id);
            });
        });

        grid.querySelectorAll('.card-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!this.isAdmin) {
                    this.showToast('请先登录管理员账号！', 'warning');
                    return;
                }
                this.showEditModal(btn.closest('.article-card').dataset.id);
            });
        });
    }

    createArticleCard(article) {
        const levelLabels = {
            beginner: '入门级',
            intermediate: '中级',
            advanced: '高级'
        };

        const deleteBtn = this.isAdmin ? `
            <button class="card-action-btn delete" title="删除">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
            </button>
        ` : '';

        return `
            <div class="article-card" data-id="${article.id}">
                <div class="card-header">
                    <h2 class="card-title">${article.title}</h2>
                    <div class="card-actions">
                        ${this.isAdmin ? `
                        <button class="card-action-btn edit" title="编辑">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        ` : ''}
                        ${deleteBtn}
                    </div>
                </div>
                <span class="card-level ${article.level}">${levelLabels[article.level] || '中级'}</span>
                <p class="card-preview">${article.english ? article.english.substring(0, 150) : ''}...</p>
                <div class="card-tags">
                    ${article.tags ? article.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('') : ''}
                </div>
                <div class="card-meta">
                    <span>${article.date || ''}</span>
                    <span>${article.english ? this.countWords(article.english) : 0} words</span>
                </div>
            </div>
        `;
    }

    countWords(text) {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }

    splitSentences(text) {
        const sentences = [];
        const regex = /[^。！？\.\!\?\n]+[。！？\.\!\?\n]?/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            const s = match[0].trim();
            if (s) sentences.push(s);
        }
        return sentences.length ? sentences : [text.trim()];
    }

    buildSentenceSpans(text, lang) {
        const sentences = this.splitSentences(text);
        return sentences.map((s, i) =>
            `<span class="sent-${lang}" data-idx="${i}">${s}</span>`
        ).join(' ');
    }

    showArticleDetail(id) {
        const article = this.articles.find(a => a.id == id);
        if (!article) return;

        const levelLabels = {
            beginner: '入门级',
            intermediate: '中级',
            advanced: '高级'
        };

        const enParagraphs = article.english.split('\n\n').filter(p => p.trim());
        const zhParagraphs = article.chinese.split('\n\n').filter(p => p.trim());

        const pairs = enParagraphs.map((en, i) => ({
            en,
            zh: zhParagraphs[i] || ''
        }));

        const deleteBtn = this.isAdmin ? `
            <button class="detail-action-btn delete" data-id="${article.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
                删除
            </button>
        ` : '';

        const detailContainer = document.getElementById('article-detail');
        detailContainer.innerHTML = `
            <div class="detail-sticky-header">
                <div class="detail-header-info">
                    <div class="detail-header">
                        <h1 class="detail-title">${article.title}</h1>
                        <div class="detail-actions">
                            ${this.isAdmin ? `
                            <button class="detail-action-btn edit" data-id="${article.id}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                编辑
                            </button>
                            ` : ''}
                            ${deleteBtn}
                        </div>
                    </div>
                    <div class="detail-meta">
                        <span class="detail-level ${article.level}">${levelLabels[article.level] || '中级'}</span>
                        <div class="detail-tags">
                            ${article.tags ? article.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('') : ''}
                        </div>
                    </div>
                </div>
                <div class="zoom-slider-container">
                    <span class="zoom-cat">🐱</span>
                    <input type="range" class="zoom-slider" min="0" max="100" value="50">
                    <span class="zoom-value">50%</span>
                    <button class="orientation-btn" title="切换横竖屏">🔄</button>
                </div>
            </div>
            <div class="article-content" data-orientation="landscape">
                ${pairs.map(pair => `
                    <div class="paragraph-pair">
                        <p class="paragraph-en">${this.buildSentenceSpans(pair.en, 'en')}</p>
                        <p class="paragraph-zh">${this.buildSentenceSpans(pair.zh, 'zh')}</p>
                    </div>
                `).join('')}
            </div>
        `;

        this.bindSentenceHover();
        this.bindZoomSlider(detailContainer);
        this.bindOrientationToggle(detailContainer);
        this.bindDetailScrollHide();

        if (this.isAdmin) {
            document.querySelector('.detail-action-btn.edit')?.addEventListener('click', () => {
                this.showEditModal(article.id);
            });

            document.querySelector('.detail-action-btn.delete')?.addEventListener('click', () => {
                this.showDeleteModal(article.id);
            });
        }

        this.switchView('detail');
    }

    bindSentenceHover() {
        document.querySelectorAll('.sent-en').forEach(el => {
            el.addEventListener('mouseenter', () => {
                const idx = el.dataset.idx;
                const pair = el.closest('.paragraph-pair');
                const zh = pair.querySelector(`.sent-zh[data-idx="${idx}"]`);
                if (zh) zh.classList.add('highlight');
            });
            el.addEventListener('mouseleave', () => {
                const idx = el.dataset.idx;
                const pair = el.closest('.paragraph-pair');
                const zh = pair.querySelector(`.sent-zh[data-idx="${idx}"]`);
                if (zh) zh.classList.remove('highlight');
            });
        });

        document.querySelectorAll('.sent-zh').forEach(el => {
            el.addEventListener('mouseenter', () => {
                const idx = el.dataset.idx;
                const pair = el.closest('.paragraph-pair');
                const en = pair.querySelector(`.sent-en[data-idx="${idx}"]`);
                if (en) en.classList.add('highlight');
            });
            el.addEventListener('mouseleave', () => {
                const idx = el.dataset.idx;
                const pair = el.closest('.paragraph-pair');
                const en = pair.querySelector(`.sent-en[data-idx="${idx}"]`);
                if (en) en.classList.remove('highlight');
            });
        });
    }

    bindZoomSlider(container) {
        const slider = container.querySelector('.zoom-slider');
        const valueLabel = container.querySelector('.zoom-value');
        const contentEl = container.querySelector('.article-content');
        if (!slider || !contentEl) return;

        const isMobile = window.innerWidth <= 768;
        const defaultValue = isMobile ? 0 : 50;
        slider.value = defaultValue;

        const updateZoom = () => {
            const zoom = parseInt(slider.value);
            const scale = 0.5 + (zoom / 100) * 1.0;
            contentEl.style.setProperty('--zoom-scale', scale);
            if (valueLabel) {
                valueLabel.textContent = zoom + '%';
            }
        };

        slider.addEventListener('input', updateZoom);
        updateZoom();
    }

    bindOrientationToggle(container) {
        const btn = container.querySelector('.orientation-btn');
        if (!btn) return;
        const content = container.querySelector('.article-content');
        if (!content) return;

        btn.addEventListener('click', () => {
            const current = content.dataset.orientation;
            const next = current === 'landscape' ? 'portrait' : 'landscape';
            content.dataset.orientation = next;
            btn.textContent = next === 'landscape' ? '🔄' : '📱';
            btn.title = next === 'landscape' ? '切换到竖屏' : '切换到横屏';
        });
    }

    bindDetailScrollHide() {
        const header = document.querySelector('.detail-sticky-header');
        if (!header) return;

        const handler = () => {
            const detailEl = document.querySelector('.article-detail');
            if (!detailEl) return;
            const rect = detailEl.getBoundingClientRect();
            if (rect.top < -10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', handler, { passive: true });
    }

    bindModalScrollHide(container) {
        const header = container.querySelector('.modal-sticky-header');
        if (!header) return;
        const scrollEl = container.closest('.modal-content') || container;

        scrollEl.addEventListener('scroll', () => {
            if (scrollEl.scrollTop > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    showArticleModal(id) {
        const article = this.articles.find(a => a.id == id);
        if (!article) return;

        const levelLabels = {
            beginner: '入门级',
            intermediate: '中级',
            advanced: '高级'
        };

        const enParagraphs = article.english.split('\n\n').filter(p => p.trim());
        const zhParagraphs = article.chinese.split('\n\n').filter(p => p.trim());

        let allEnSpans = '';
        let allZhSpans = '';
        let sentIdx = 0;
        enParagraphs.forEach((enPara, pi) => {
            const enSentences = this.splitSentences(enPara);
            const zhSentences = this.splitSentences(zhParagraphs[pi] || '');
            const maxLen = Math.max(enSentences.length, zhSentences.length);
            for (let i = 0; i < maxLen; i++) {
                const en = enSentences[i] || '';
                const zh = zhSentences[i] || '';
                if (!en && !zh) continue;
                allEnSpans += `<span class="sent-en" data-idx="${sentIdx}">${en}</span> `;
                allZhSpans += `<span class="sent-zh" data-idx="${sentIdx}">${zh}</span> `;
                sentIdx++;
            }
        });

        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
            <div class="modal-sticky-header">
                <div class="modal-header-info">
                    <h1 class="detail-title">${article.title}</h1>
                    <div class="detail-meta">
                        <span class="detail-level ${article.level}">${levelLabels[article.level] || '中级'}</span>
                        <div class="detail-tags">
                            ${article.tags ? article.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('') : ''}
                        </div>
                    </div>
                </div>
                <div class="zoom-slider-container">
                    <span class="zoom-cat">🐱</span>
                    <input type="range" class="zoom-slider" min="0" max="100" value="50">
                    <span class="zoom-value">50%</span>
                    <button class="orientation-btn" title="切换横竖屏">🔄</button>
                </div>
            </div>
            <div class="article-content" data-orientation="landscape">
                <div class="columns-header">
                    <div class="column-title">English</div>
                    <div class="column-title">中文译文</div>
                </div>
                <div class="paragraph-pair">
                    <p class="paragraph-en">${allEnSpans}</p>
                    <p class="paragraph-zh">${allZhSpans}</p>
                </div>
            </div>
        `;

        this.bindSentenceHover();
        this.bindZoomSlider(modalContent);
        this.bindOrientationToggle(modalContent);
        this.bindModalScrollHide(modalContent);

        document.getElementById('article-modal-overlay').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeArticleModal() {
        document.getElementById('article-modal-overlay').classList.remove('show');
        document.body.style.overflow = '';
    }

    async addArticle() {
        if (!this.isAdmin) {
            this.showToast('请先登录管理员账号！', 'warning');
            return;
        }

        const title = document.getElementById('article-title').value.trim();
        const tags = document.getElementById('article-tags').value.split(',').map(t => t.trim()).filter(t => t);
        const level = document.getElementById('article-level').value;
        const english = document.getElementById('article-english').value.trim();
        const chinese = document.getElementById('article-chinese').value.trim();

        if (!title || !english || !chinese) {
            this.showToast('请填写完整信息！', 'error');
            return;
        }

        try {
            const db = await this.getDb();
            await db.collection('articles').add({
                title: title,
                english: english,
                chinese: chinese,
                tags: tags.length ? tags : ['未分类'],
                level: level,
                date: new Date().toISOString().split('T')[0]
            });

            await this.loadFromStorage();
            this.renderArticles();
            this.renderTags();

            document.getElementById('upload-form').reset();
            this.showToast('文章添加成功！', 'success');
            this.switchView('list');
        } catch (error) {
            console.error('添加文章失败:', error);
            this.showToast('添加文章失败: ' + error.message, 'error');
        }
    }

    async loadBatchSamples() {
        if (!this.isAdmin) {
            this.showToast('请先登录管理员账号！', 'warning');
            return;
        }

        try {
            await this.addSampleArticles();
            await this.loadFromStorage();
            this.renderArticles();
            this.renderTags();

            this.showToast('示例文章加载成功！', 'success');
            this.switchView('list');
        } catch (error) {
            console.error('加载示例文章失败:', error);
            this.showToast('加载示例文章失败: ' + error.message, 'error');
        }
    }

    showDeleteModal(id) {
        if (!this.isAdmin) {
            this.showToast('请先登录管理员账号！', 'warning');
            return;
        }
        this.deletingArticleId = id;
        document.getElementById('delete-modal').classList.add('show');
    }

    closeDeleteModal() {
        this.deletingArticleId = null;
        document.getElementById('delete-modal').classList.remove('show');
    }

    async confirmDelete() {
        if (!this.isAdmin) {
            this.showToast('请先登录管理员账号！', 'warning');
            return;
        }

        if (this.deletingArticleId === null) return;

        try {
            const articleToDelete = this.articles.find(a => a.id == this.deletingArticleId);
            if (!articleToDelete || !articleToDelete.objectId) {
                this.showToast('文章不存在', 'error');
                return;
            }

            const db = await this.getDb();
            await db.collection('articles').doc(articleToDelete.objectId).remove();

            await this.loadFromStorage();
            this.renderArticles();
            this.renderTags();

            this.closeDeleteModal();
            this.showToast('文章删除成功！', 'success');

            if (document.getElementById('detail-view').classList.contains('active')) {
                this.switchView('list');
            }
        } catch (error) {
            console.error('删除文章失败:', error);
            this.showToast('删除文章失败: ' + error.message, 'error');
        }
    }

    showEditModal(id) {
        if (!this.isAdmin) {
            this.showToast('请先登录管理员账号！', 'warning');
            return;
        }

        const article = this.articles.find(a => a.id == id);
        if (!article) return;

        this.editingArticleId = id;

        document.getElementById('edit-title').value = article.title;
        document.getElementById('edit-tags').value = article.tags ? article.tags.join(', ') : '';
        document.getElementById('edit-level').value = article.level;
        document.getElementById('edit-english').value = article.english;
        document.getElementById('edit-chinese').value = article.chinese;

        document.getElementById('edit-modal').classList.add('show');
    }

    closeEditModal() {
        this.editingArticleId = null;
        document.getElementById('edit-modal').classList.remove('show');
    }

    async saveEdit() {
        if (!this.isAdmin) {
            this.showToast('请先登录管理员账号！', 'warning');
            return;
        }

        if (this.editingArticleId === null) return;

        const title = document.getElementById('edit-title').value.trim();
        const tags = document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(t => t);
        const level = document.getElementById('edit-level').value;
        const english = document.getElementById('edit-english').value.trim();
        const chinese = document.getElementById('edit-chinese').value.trim();

        if (!title || !english || !chinese) {
            this.showToast('请填写完整信息！', 'error');
            return;
        }

        try {
            const articleToEdit = this.articles.find(a => a.id == this.editingArticleId);
            if (!articleToEdit || !articleToEdit.objectId) {
                this.showToast('文章不存在', 'error');
                return;
            }

            const db = await this.getDb();
            await db.collection('articles').doc(articleToEdit.objectId).update({
                title: title,
                english: english,
                chinese: chinese,
                tags: tags.length ? tags : ['未分类'],
                level: level
            });

            await this.loadFromStorage();
            this.renderArticles();
            this.renderTags();

            this.closeEditModal();
            this.showToast('文章编辑成功！', 'success');

            if (document.getElementById('detail-view').classList.contains('active')) {
                this.showArticleDetail(this.editingArticleId);
            }
        } catch (error) {
            console.error('编辑文章失败:', error);
            this.showToast('编辑文章失败: ' + error.message, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.reader = new BilingualReader();
});