// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    // Language Toggle
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }

    // Initialize Particles JS
    if (window.particlesJS) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#06b6d4" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.4, "random": false },
                "size": { "value": 3, "random": true },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#06b6d4",
                    "opacity": 0.3,
                    "width": 1
                },
                "move": { "enable": true, "speed": 1.5, "direction": "none", "random": true, "out_mode": "out" }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": { "enable": true, "mode": "grab" },
                    "onclick": { "enable": true, "mode": "push" },
                    "resize": true
                },
                "modes": {
                    "grab": { "distance": 200, "line_linked": { "opacity": 0.7 } },
                    "push": { "particles_nb": 4 }
                }
            },
            "retina_detect": true
        });
    }

    // Scroll Fade In Animation
    const faders = document.querySelectorAll('.fade-in');
    
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // Smooth Scrolling for Nav Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Free Board Logic using localStorage
    const boardForm = document.getElementById('boardForm');
    const boardList = document.getElementById('boardList');
    const boardFormWrapper = document.getElementById('boardFormWrapper');
    const toggleWriteBtn = document.getElementById('toggleWriteBtn');
    const cancelWriteBtn = document.getElementById('cancelWriteBtn');
    const STORAGE_KEY = 'amk_board_posts';
    let editingId = null;

    function getText(key, defaultText) {
        if (typeof i18n !== 'undefined' && typeof currentLang !== 'undefined' && i18n[currentLang] && i18n[currentLang][key]) {
            return i18n[currentLang][key];
        }
        return defaultText;
    }

    if (toggleWriteBtn && boardFormWrapper) {
        toggleWriteBtn.addEventListener('click', () => {
            boardFormWrapper.style.display = 'block';
            toggleWriteBtn.style.display = 'none';
            document.getElementById('boardName').focus();
        });
    }

    if (cancelWriteBtn && boardFormWrapper) {
        cancelWriteBtn.addEventListener('click', () => {
            boardFormWrapper.style.display = 'none';
            if (toggleWriteBtn) toggleWriteBtn.style.display = 'inline-block';
            if (boardForm) {
                boardForm.reset();
                editingId = null;
                boardForm.querySelector('.submit-btn').textContent = getText('board_btn_submit', '등록하기');
            }
        });
    }

    function loadPosts() {
        if (!boardList) return;
        const posts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        boardList.innerHTML = '';

        if (posts.length === 0) {
            boardList.innerHTML = `<div class="board-empty" style="padding: 3rem 0; color: var(--text-secondary); text-align: center;" data-i18n="board_empty">${getText('board_empty', '아직 등록된 게시글이 없습니다. 첫 글을 남겨보세요!')}</div>`;
            return;
        }

        posts.forEach(post => {
            const item = document.createElement('div');
            item.className = 'board-item';
            
            const header = document.createElement('div');
            header.className = 'board-item-header';
            
            const infoSpan = document.createElement('div');
            infoSpan.innerHTML = `<strong>${escapeHtml(post.name)}</strong> <span style="opacity: 0.7; font-size: 0.85em; margin-left: 10px;">${escapeHtml(post.email)} &bull; ${post.date}</span>`;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.style.display = 'flex';
            actionsDiv.style.gap = '12px';
            
            const editBtn = document.createElement('button');
            editBtn.setAttribute('data-i18n', 'board_btn_edit');
            editBtn.textContent = getText('board_btn_edit', '수정');
            editBtn.style.cssText = 'background:transparent; border:none; color:var(--accent-primary); cursor:pointer; font-size:0.85rem; font-weight:600; font-family:inherit; transition:opacity 0.2s;';
            editBtn.onmouseover = () => editBtn.style.opacity = '0.7';
            editBtn.onmouseout = () => editBtn.style.opacity = '1';
            editBtn.onclick = () => editPost(post.id);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.setAttribute('data-i18n', 'board_btn_delete');
            deleteBtn.textContent = getText('board_btn_delete', '삭제');
            deleteBtn.style.cssText = 'background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:0.85rem; font-weight:600; font-family:inherit; transition:opacity 0.2s;';
            deleteBtn.onmouseover = () => deleteBtn.style.opacity = '0.7';
            deleteBtn.onmouseout = () => deleteBtn.style.opacity = '1';
            deleteBtn.onclick = () => deletePost(post.id);
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            
            header.appendChild(infoSpan);
            header.appendChild(actionsDiv);
            
            const body = document.createElement('div');
            body.className = 'board-item-body';
            body.textContent = post.content;

            item.appendChild(header);
            item.appendChild(body);
            boardList.appendChild(item);
        });
    }

    function editPost(id) {
        const posts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const post = posts.find(p => p.id === id);
        if(post) {
            document.getElementById('boardName').value = post.name;
            document.getElementById('boardEmail').value = post.email;
            document.getElementById('boardContent').value = post.content;
            editingId = id;
            
            if(boardFormWrapper) boardFormWrapper.style.display = 'block';
            if(toggleWriteBtn) toggleWriteBtn.style.display = 'none';

            if(boardForm) {
                boardForm.querySelector('.submit-btn').textContent = getText('board_btn_edit_done', '수정 완료');
            }
            document.getElementById('board').scrollIntoView({behavior: 'smooth'});
        }
    }

    function deletePost(id) {
        if(confirm(getText('board_btn_delete', '삭제') + '?')) {
            let posts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            posts = posts.filter(p => p.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
            
            // 만약 삭제한 글이 현재 수정 중인 글이었다면 폼 초기화
            if(editingId === id) {
                editingId = null;
                if(boardForm) {
                    boardForm.reset();
                    boardForm.querySelector('.submit-btn').textContent = getText('board_btn_submit', '등록하기');
                }
                if(boardFormWrapper) boardFormWrapper.style.display = 'none';
                if(toggleWriteBtn) toggleWriteBtn.style.display = 'inline-block';
            }
            loadPosts();
        }
    }

    if (boardForm) {
        boardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('boardName');
            const emailInput = document.getElementById('boardEmail');
            const contentInput = document.getElementById('boardContent');

            const posts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

            if (editingId) {
                const postIndex = posts.findIndex(p => p.id === editingId);
                if (postIndex > -1) {
                    posts[postIndex].name = nameInput.value;
                    posts[postIndex].email = emailInput.value;
                    posts[postIndex].content = contentInput.value;
                    if (!posts[postIndex].date.includes('(수정됨)')) {
                        posts[postIndex].date += ' (수정됨)';
                    }
                }
                editingId = null;
                boardForm.querySelector('.submit-btn').textContent = '등록하기';
                alert('게시글이 성공적으로 수정되었습니다!');
            } else {
                const newPost = {
                    id: Date.now(),
                    name: nameInput.value,
                    email: emailInput.value,
                    content: contentInput.value,
                    date: new Date().toLocaleString('ko-KR')
                };
                posts.unshift(newPost); // 최신 글이 맨 위로 오도록
                alert('게시글이 성공적으로 등록되었습니다!');
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
            boardForm.reset();

            if (boardFormWrapper) boardFormWrapper.style.display = 'none';
            if (toggleWriteBtn) toggleWriteBtn.style.display = 'inline-block';

            loadPosts();
        });
    }

    function escapeHtml(unsafe) {
        return (unsafe || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    loadPosts();
});
