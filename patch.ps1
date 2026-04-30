$file = "c:\Users\4-410\Downloads\MyHome-master\board.html"
$text = [IO.File]::ReadAllText($file)
$marker1 = "<script>`n        let currentOpenPostId = null;"
$marker2 = "<script>`r`n        let currentOpenPostId = null;"

$idx = $text.IndexOf($marker1)
if ($idx -lt 0) {
    $idx = $text.IndexOf($marker2)
}

if ($idx -ge 0) {
    $before = $text.Substring(0, $idx)
    $newScript = @"
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

        // 🔥 이곳에 본인의 Firebase Project 설정값을 넣어주세요 🔥
        const firebaseConfig = {
            apiKey: "본인의_API_KEY_입력",
            authDomain: "본인의_PROJECT_ID.firebaseapp.com",
            projectId: "본인의_PROJECT_ID",
            storageBucket: "본인의_PROJECT_ID.appspot.com",
            messagingSenderId: "본인의_SENDER_ID",
            appId: "본인의_APP_ID"
        };

        let db = null;
        try {
            if(firebaseConfig.apiKey !== "본인의_API_KEY_입력") {
                const app = initializeApp(firebaseConfig);
                db = getFirestore(app);
            }
        } catch(e) {
            console.error("Firebase 초기화 에러:", e);
        }

        let currentOpenPostId = null;

        // Theme Logic
        window.updateThemeUI = function(isLight) {
            const icon = document.querySelector('#themeToggle i');
            const textSpan = document.getElementById('themeText');
            if(icon) icon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            if (textSpan) {
                const key = isLight ? 'theme_light' : 'theme_dark';
                textSpan.setAttribute('data-i18n', key);
                if (typeof i18n !== 'undefined' && i18n[currentLang]) {
                    textSpan.innerText = i18n[currentLang][key];
                }
            }
        }

        window.toggleTheme = function() {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('portfolio-theme', isLight ? 'light' : 'dark');
            window.updateThemeUI(isLight);
        }

        const savedTheme = localStorage.getItem('portfolio-theme');
        const isLight = savedTheme !== 'dark';
        if (isLight) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
        window.updateThemeUI(isLight);

        // Modal Logic
        window.openModal = function(id) {
            document.getElementById(id).classList.add('active');
        }
        window.closeModal = function(id) {
            document.getElementById(id).classList.remove('active');
        }

        // --- Data layer ---
        window.getMessages = async function() {
            if(!db) {
                // Firebase 연동 에러/미설정 시 기존 LocalStorage 로직 사용
                let messages = JSON.parse(localStorage.getItem('amk_board')) || [];
                let needsSave = false;
                messages.forEach(msg => {
                    if(!msg.id) { msg.id = Date.now().toString(36) + Math.random().toString(36).substr(2); needsSave = true; }
                    if(msg.likes === undefined) { msg.likes = 0; needsSave = true; }
                    if(msg.password === undefined) { msg.password = '0000'; needsSave = true; }
                    if(msg.title === undefined) { msg.title = "자유게시판 게시글입니다."; needsSave = true; }
                });
                if(needsSave) localStorage.setItem('amk_board', JSON.stringify(messages));
                return messages;
            }

            try {
                const q = query(collection(db, "posts"), orderBy("createdAt", "asc"));
                const querySnapshot = await getDocs(q);
                let messages = [];
                querySnapshot.forEach((docSnap) => {
                    let data = docSnap.data();
                    messages.push({
                        fs_id: docSnap.id,
                        id: data.id || docSnap.id,
                        title: data.title,
                        name: data.name,
                        password: data.password,
                        content: data.content,
                        date: data.date,
                        createdAt: data.createdAt,
                        likes: data.likes || 0,
                        isSecret: data.isSecret || false,
                        comments: data.comments || []
                    });
                });
                return messages;
            } catch(e) {
                console.error("데이터 읽기 실패:", e);
                return [];
            }
        }

        window.renderBoard = async function() {
            const tbody = document.getElementById('boardTableBody');
            const searchInput = document.getElementById('searchInput');
            const searchKeyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
            const messages = await window.getMessages();
            
            if(tbody) tbody.innerHTML = '';
            
            const filtered = messages.filter(m => 
                (m.title && m.title.toLowerCase().includes(searchKeyword)) || 
                (m.name && m.name.toLowerCase().includes(searchKeyword))
            ).reverse();
            
            if (filtered.length === 0) {
                const emptyMsg = (typeof currentLang !== 'undefined' && currentLang === 'en') ? "No posts found." : "등록된 게시글이 없습니다.";
                if(tbody) tbody.innerHTML = `<tr><td colspan="5" class="empty-row">` + emptyMsg + `</td></tr>`;
                return;
            }

            filtered.forEach((msg, idx) => {
                const tr = document.createElement('tr');
                const secretTxt = (typeof currentLang !== 'undefined' && currentLang === 'en') ? "Secret Post." : "비밀글입니다.";
                const commentCount = (msg.comments && msg.comments.length > 0) ? ` <span style="color: var(--accent-primary); font-size: 0.85rem; font-weight: 700;">[` + msg.comments.length + `]</span>` : '';
                const displayTitle = (msg.isSecret ? `<i class="fa-solid fa-lock lock-icon"></i>` + secretTxt : msg.title) + commentCount;
                
                tr.innerHTML = `
                    <td class="col-id">` + (filtered.length - idx) + `</td>
                    <td class="col-title">` + displayTitle + `</td>
                    <td class="col-author">` + msg.name + `</td>
                    <td class="col-date">` + msg.date + `</td>
                    <td class="col-likes">` + (msg.likes > 0 ? '<i class="fa-solid fa-heart"></i> ' + msg.likes : '-') + `</td>
                `;
                tr.querySelector('.col-title').onclick = () => window.viewPost(msg.id);
                if(tbody) tbody.appendChild(tr);
            });
        }

        window.submitPost = async function() {
            const title = document.getElementById('writeTitle').value.trim();
            const name = document.getElementById('writeName').value.trim();
            const password = document.getElementById('writePw').value.trim();
            const content = document.getElementById('writeContent').value.trim();
            const isSecret = document.getElementById('writeSecret').checked;
            
            if(!title || !name || !password || !content) {
                alert('모든 항목을 입력해주세요.');
                return;
            }

            const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' });
            const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
            
            const newPost = { id, title, name, password, content, date: dateStr, createdAt: new Date().getTime(), likes: 0, isSecret, comments: [] };

            if(!db) {
                let messages = await window.getMessages();
                messages.push(newPost);
                localStorage.setItem('amk_board', JSON.stringify(messages));
            } else {
                try {
                    await addDoc(collection(db, "posts"), newPost);
                } catch(e) {
                    console.error("쓰기 실패", e);
                }
            }
            
            document.getElementById('writeTitle').value = '';
            document.getElementById('writeName').value = '';
            document.getElementById('writePw').value = '';
            document.getElementById('writeContent').value = '';
            document.getElementById('writeSecret').checked = false;
            
            window.closeModal('writeModal');
            await window.renderBoard();
        }

        window.viewPost = async function(id) {
            const messages = await window.getMessages();
            const msg = messages.find(m => m.id === id);
            if(!msg) return;

            if (msg.isSecret) {
                const pw = prompt('비밀글입니다. 비밀번호를 입력하세요:', '');
                if (pw === null) return;
                if (pw !== msg.password) {
                    alert('비밀번호가 일치하지 않습니다.');
                    return;
                }
            }

            currentOpenPostId = id;
            document.getElementById('viewTitle').textContent = msg.title;
            document.getElementById('viewAuthor').textContent = msg.name;
            document.getElementById('viewDate').textContent = msg.date;
            document.getElementById('viewContent').textContent = msg.content;
            document.getElementById('viewLikes').textContent = msg.likes;
            
            window.openModal('viewModal');
            await window.renderComments(id);
        }

        window.renderComments = async function(postId) {
            const messages = await window.getMessages();
            const msg = messages.find(m => m.id === postId);
            if(!msg) return;

            const commentList = document.getElementById('commentList');
            const commentCount = document.getElementById('commentCount');
            const comments = msg.comments || [];

            if(commentCount) commentCount.textContent = comments.length;
            if(commentList) commentList.innerHTML = '';

            if(comments.length === 0) {
                if(commentList) commentList.innerHTML = '<div style="text-align: center; color: var(--text-secondary); font-size: 0.85rem; padding: 1rem;">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</div>';
                return;
            }

            comments.forEach(c => {
                const item = document.createElement('div');
                item.className = 'comment-item';
                item.innerHTML = `
                    <div class="comment-meta">
                        <div>
                            <span class="comment-author">` + c.name + `</span>
                            <span class="comment-date">` + c.date + `</span>
                        </div>
                        <i class="fa-solid fa-trash comment-delete" onclick="window.deleteComment('` + postId + `', '` + c.id + `')"></i>
                    </div>
                    <div class="comment-body">` + c.content.replace(/\n/g, '<br>') + `</div>
                    <div class="comment-actions">
                        <span class="comment-action-btn like" onclick="window.likeComment('` + postId + `', '` + c.id + `')">
                            <i class="fa-solid fa-thumbs-up"></i> ` + (c.likes || 0) + `
                        </span>
                        <span class="comment-action-btn dislike" onclick="window.dislikeComment('` + postId + `', '` + c.id + `')">
                            <i class="fa-solid fa-thumbs-down"></i> ` + (c.dislikes || 0) + `
                        </span>
                    </div>
                `;
                if(commentList) commentList.appendChild(item);
            });
        }

        window.updatePostInDB = async function(postId, updatedData) {
             const messages = await window.getMessages();
             const msg = messages.find(m => m.id === postId);
             if(!msg) return;

             if(!db) {
                 const idx = messages.findIndex(m => m.id === postId);
                 messages[idx] = Object.assign({}, messages[idx], updatedData);
                 localStorage.setItem('amk_board', JSON.stringify(messages));
             } else {
                 if(msg.fs_id) {
                     const docRef = doc(db, "posts", msg.fs_id);
                     await updateDoc(docRef, updatedData);
                 }
             }
        }

        window.submitComment = async function() {
            if(!currentOpenPostId) return;

            const name = document.getElementById('commentName').value.trim();
            const password = document.getElementById('commentPw').value.trim();
            const content = document.getElementById('commentContent').value.trim();

            if(!name || !password || !content) {
                alert('이름, 비밀번호, 내용을 모두 입력해주세요.');
                return;
            }

            const messages = await window.getMessages();
            const msgIndex = messages.findIndex(m => m.id === currentOpenPostId);
            if(msgIndex === -1) return;

            let currentComments = messages[msgIndex].comments || [];

            const newComment = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                name,
                password,
                content,
                likes: 0,
                dislikes: 0,
                date: new Date().toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })
            };

            currentComments.push(newComment);
            await window.updatePostInDB(currentOpenPostId, { comments: currentComments });

            document.getElementById('commentName').value = '';
            document.getElementById('commentPw').value = '';
            document.getElementById('commentContent').value = '';

            await window.renderComments(currentOpenPostId);
        }

        window.deleteComment = async function(postId, commentId) {
            const messages = await window.getMessages();
            const msgIndex = messages.findIndex(m => m.id === postId);
            if(msgIndex === -1) return;

            const comments = messages[msgIndex].comments || [];
            const commentIndex = comments.findIndex(c => c.id === commentId);
            if(commentIndex === -1) return;

            const pw = prompt('댓글을 삭제하시겠습니까? 비밀번호를 입력하세요:', '');
            if(pw === null) return;

            if(pw === comments[commentIndex].password) {
                comments.splice(commentIndex, 1);
                await window.updatePostInDB(postId, { comments: comments });
                await window.renderComments(postId);
            } else {
                alert('비밀번호가 일치하지 않습니다.');
            }
        }

        window.likeComment = async function(postId, commentId) {
            const messages = await window.getMessages();
            const msgIndex = messages.findIndex(m => m.id === postId);
            const comments = messages[msgIndex].comments || [];
            const commentIndex = comments.findIndex(c => c.id === commentId);
            if(commentIndex !== -1) {
                comments[commentIndex].likes = (comments[commentIndex].likes || 0) + 1;
                await window.updatePostInDB(postId, { comments: comments });
                await window.renderComments(postId);
            }
        }

        window.dislikeComment = async function(postId, commentId) {
            const messages = await window.getMessages();
            const msgIndex = messages.findIndex(m => m.id === postId);
            const comments = messages[msgIndex].comments || [];
            const commentIndex = comments.findIndex(c => c.id === commentId);
            if(commentIndex !== -1) {
                comments[commentIndex].dislikes = (comments[commentIndex].dislikes || 0) + 1;
                await window.updatePostInDB(postId, { comments: comments });
                await window.renderComments(postId);
            }
        }

        window.likeCurrentPost = async function() {
            if(!currentOpenPostId) return;
            const messages = await window.getMessages();
            const msg = messages.find(m => m.id === currentOpenPostId);
            if(msg) {
                let newLikes = (msg.likes || 0) + 1;
                await window.updatePostInDB(currentOpenPostId, { likes: newLikes });
                document.getElementById('viewLikes').textContent = newLikes;
                await window.renderBoard();
            }
        }

        window.deleteCurrentPost = async function() {
            if(!currentOpenPostId) return;
            const messages = await window.getMessages();
            const msg = messages.find(m => m.id === currentOpenPostId);
            if(msg) {
                const pw = prompt('게시글을 삭제하시겠습니까? 비밀번호를 입력하세요:', '');
                if (pw === null) return;
                if(pw === msg.password) {
                    if(!db) {
                        const index = messages.findIndex(m => m.id === currentOpenPostId);
                        messages.splice(index, 1);
                        localStorage.setItem('amk_board', JSON.stringify(messages));
                    } else if(msg.fs_id) {
                        await deleteDoc(doc(db, "posts", msg.fs_id));
                    }
                    window.closeModal('viewModal');
                    await window.renderBoard();
                    alert('성공적으로 삭제되었습니다.');
                } else {
                    alert('비밀번호가 일치하지 않습니다.');
                }
            }
        }

        // Init
        document.addEventListener('DOMContentLoaded', async () => {
            await window.renderBoard();
        });
    </script>
    <script src="js/i18n.js"></script>
</body>
</html>
"@

    [IO.File]::WriteAllText($file, $before + $newScript)
    Write-Host "Patched successfully!"
} else {
    Write-Host "Target script marker not found."
}
