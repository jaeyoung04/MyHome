// Firebase Realtime Database Compat SDK 사용
const firebaseConfig = {
  apiKey: "AIzaSyBLwVgUYOAeOjxNh_62HUI-55jrkzKtQv0",
  authDomain: "portfolio-website-b2903.firebaseapp.com",
  projectId: "portfolio-website-b2903",
  databaseURL: "https://portfolio-website-b2903-default-rtdb.firebaseio.com",
  storageBucket: "portfolio-website-b2903.firebasestorage.app",
  messagingSenderId: "336728440891",
  appId: "1:336728440891:web:e4c50fe86e2921bde09c1e",
  measurementId: "G-9M4Y1PRWQD"
};

let app, db;
try {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.database();
} catch (e) {
  console.error("Firebase 초기화 에러:", e);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('board-form');
  const nameInput = document.getElementById('board-name');
  const passwordInput = document.getElementById('board-password');
  const messageInput = document.getElementById('board-message');
  const charCount = document.getElementById('char-count');
  const messagesContainer = document.getElementById('board-messages');
  const submitBtn = document.getElementById('board-submit-btn');

  if (!db) {
    messagesContainer.innerHTML = `<div style="text-align:center; padding: 2rem; color: #ef4444;">Firebase 연결 실패</div>`;
    return;
  }

  const boardRef = db.ref('mca_board');

  // 글자 수 실시간 카운팅
  messageInput.addEventListener('input', () => {
    const len = messageInput.value.length;
    charCount.textContent = len;
    if (len >= 300) {
      charCount.parentElement.classList.add('limit');
    } else {
      charCount.parentElement.classList.remove('limit');
    }
  });

  // 초기 로딩 애니메이션 제거
  messagesContainer.innerHTML = '';

  // Firebase 실시간 데이터 이벤트 (child 단위로 관리하여 깜빡임 방지)
  boardRef.orderByChild('createdAt').on('child_added', (snapshot) => {
    const data = { id: snapshot.key, ...snapshot.val() };
    const cardDOM = createCardDOM(data);
    
    // 시간 역순(최신 글이 위로)이므로 첫 번째 자식으로 삽입 (prepend)
    messagesContainer.insertBefore(cardDOM, messagesContainer.firstChild);
    
    if (window.lucide) window.lucide.createIcons();
    bindActionEvents(cardDOM, data);
  });

  boardRef.on('child_changed', (snapshot) => {
    const data = { id: snapshot.key, ...snapshot.val() };
    const existingCard = document.getElementById(`post-${data.id}`);
    
    if (existingCard) {
      updateCardDOM(existingCard, data);
    }
  });

  boardRef.on('child_removed', (snapshot) => {
    const existingCard = document.getElementById(`post-${snapshot.key}`);
    if (existingCard) {
      existingCard.style.opacity = '0';
      existingCard.style.transform = 'translateY(20px)';
      setTimeout(() => existingCard.remove(), 300);
    }
  });

  // 카드 DOM 생성 함수
  function createCardDOM(data) {
    const timeString = timeAgo(data.createdAt);
    
    const likedPosts = JSON.parse(localStorage.getItem('mca_liked_posts') || '{}');
    const isLiked = likedPosts[data.id] === true;
    const likesCount = data.likes || 0;

    let commentsHtml = '';
    let commentsCount = 0;
    if (data.comments) {
      const comments = Object.keys(data.comments).map(key => ({
        id: key,
        ...data.comments[key]
      }));
      commentsCount = comments.length;
      comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      
      comments.forEach(c => {
        commentsHtml += createCommentHTML(c, data.id);
      });
    }

    const seed = encodeURIComponent(data.name || 'User');
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=e2e8f0,c7d2fe,fbcfe8,bae6fd,ddd6fe&textColor=1e293b`;

    const messageCard = document.createElement('div');
    messageCard.className = 'feed-card';
    messageCard.id = `post-${data.id}`;
    messageCard.innerHTML = `
      <div class="feed-main">
        <div class="feed-avatar">
          <img src="${avatarUrl}" alt="profile" loading="lazy">
        </div>
        <div class="feed-content">
          <div class="feed-header">
            <span class="feed-author">${escapeHTML(data.name)}</span>
            <span class="feed-time">${timeString}</span>
          </div>
          <div class="feed-text">${escapeHTML(data.message)}</div>
          <div class="feed-actions">
            <button class="action-btn btn-like ${isLiked ? 'liked' : ''}" data-id="${data.id}" data-likes="${likesCount}">
              <i data-lucide="heart" ${isLiked ? 'fill="currentColor"' : ''}></i>
              <span class="like-count">${likesCount}</span>
            </button>
            <button class="action-btn btn-toggle-comment">
              <i data-lucide="message-circle"></i>
              <span>댓글 (<span class="comments-count-text">${commentsCount}</span>)</span>
            </button>
            <button class="action-btn btn-delete" data-id="${data.id}" data-pw="${data.password || ''}" style="margin-left: auto;">
              <i data-lucide="trash-2"></i>
              <span>삭제</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Comment Section -->
      <div class="comment-section">
        <div class="comment-list">
          ${commentsHtml}
        </div>
        <form class="comment-form" data-post-id="${data.id}">
          <div class="comment-compose">
            <div class="comment-inputs">
              <input type="text" class="comment-input" name="cname" placeholder="닉네임" required maxlength="15">
              <input type="password" class="comment-input" name="cpw" placeholder="비밀번호" required minlength="4">
            </div>
            <textarea class="comment-textarea" name="cmsg" placeholder="댓글을 남겨보세요..." required maxlength="200"></textarea>
            <div class="comment-submit-wrap">
              <button type="submit" class="btn-comment">
                <span>등록</span>
                <i data-lucide="send" style="width:14px; height:14px;"></i>
              </button>
            </div>
          </div>
        </form>
      </div>
    `;
    return messageCard;
  }

  // 카드 일부분만 업데이트하는 함수 (전체 리렌더링 방지)
  function updateCardDOM(card, data) {
    // 1. 좋아요 수 업데이트 (직접 클릭한 경우 로컬 값이 우선될 수 있으므로 DB 값과 비교)
    const btnLike = card.querySelector('.btn-like');
    const currentLikes = parseInt(btnLike.querySelector('.like-count').textContent, 10);
    const dbLikes = data.likes || 0;
    
    // 만약 DB 값이 더 최신이거나 다르면 업데이트 (본인 클릭 직후는 제외하도록 할 수도 있으나 단순화)
    btnLike.setAttribute('data-likes', dbLikes);
    btnLike.querySelector('.like-count').textContent = dbLikes;

    // 2. 댓글 리스트 업데이트 (새로운 댓글만 추가 또는 삭제된 댓글 반영)
    let commentsCount = 0;
    let commentsHtml = '';
    if (data.comments) {
      const comments = Object.keys(data.comments).map(key => ({ id: key, ...data.comments[key] }));
      commentsCount = comments.length;
      comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      
      comments.forEach(c => {
        commentsHtml += createCommentHTML(c, data.id);
      });
    }

    card.querySelector('.comments-count-text').textContent = commentsCount;
    
    // 댓글 목록만 교체 (폼에 입력 중인 텍스트는 유지됨)
    const commentList = card.querySelector('.comment-list');
    commentList.innerHTML = commentsHtml;
    
    if (window.lucide) window.lucide.createIcons();
    
    // 새 댓글들의 삭제 및 액션 버튼에 이벤트 리바인딩
    bindCommentActionEvents(card);
  }

  // 개별 댓글 HTML 생성 함수
  function createCommentHTML(c, postId) {
    const cTime = timeAgo(c.createdAt);
    const cSeed = encodeURIComponent(c.name || 'User');
    const cAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${cSeed}&backgroundColor=e2e8f0,c7d2fe,fbcfe8,bae6fd,ddd6fe&textColor=1e293b`;
    
    // 댓글 좋아요 관련
    const likedComments = JSON.parse(localStorage.getItem('mca_liked_comments') || '{}');
    const isLiked = likedComments[c.id] === true;
    const likesCount = c.likes || 0;
    
    return `
      <div class="comment-item">
        <div class="comment-avatar"><img src="${cAvatar}" alt="avatar"></div>
        <div class="comment-content">
          <div class="comment-header">
            <span class="comment-author">${escapeHTML(c.name)}</span>
            <span class="comment-time">${cTime}</span>
            <button class="comment-delete" data-post-id="${postId}" data-comment-id="${c.id}" data-pw="${c.password || ''}" aria-label="댓글 삭제">
              <i data-lucide="x" style="width:14px; height:14px;"></i>
            </button>
          </div>
          <div class="comment-text">${escapeHTML(c.message)}</div>
          <div class="comment-actions">
            <button class="comment-like ${isLiked ? 'liked' : ''}" data-post-id="${postId}" data-comment-id="${c.id}">
              <i data-lucide="heart" style="width:12px; height:12px;" ${isLiked ? 'fill="currentColor"' : ''}></i>
              <span class="comment-like-count">${likesCount}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 메시지 등록하기 (Write to Realtime Database)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = nameInput.value.trim();
    const password = passwordInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!name || !message || !password) return;
    
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>등록 중...</span><i data-lucide="loader-2" class="spin-icon"></i>';
    submitBtn.disabled = true;

    try {
      const newMsgRef = boardRef.push();
      await newMsgRef.set({
        name: name,
        password: password,
        message: message,
        likes: 0,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
      
      messageInput.value = '';
      charCount.textContent = '0';
      charCount.parentElement.classList.remove('limit');
    } catch (error) {
      console.error("메시지 등록 실패:", error);
      alert("등록에 실패했습니다. " + error.message);
    } finally {
      submitBtn.innerHTML = originalBtnHTML;
      submitBtn.disabled = false;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // 단일 카드의 이벤트 바인딩
  function bindActionEvents(card, data) {
    // 좋아요 기능
    const btnLike = card.querySelector('.btn-like');
    btnLike.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const id = data.id;
      let currentLikes = parseInt(btnLike.querySelector('.like-count').textContent, 10) || 0;
      
      const likedPosts = JSON.parse(localStorage.getItem('mca_liked_posts') || '{}');
      const isLiked = likedPosts[id] === true;

      const postRef = db.ref('mca_board/' + id + '/likes');
      const icon = btnLike.querySelector('svg') || btnLike.querySelector('i');

      if (isLiked) {
        likedPosts[id] = false;
        currentLikes = Math.max(0, currentLikes - 1);
        btnLike.classList.remove('liked');
        if (icon) icon.removeAttribute('fill');
      } else {
        likedPosts[id] = true;
        currentLikes += 1;
        btnLike.classList.add('liked');
        if (icon) icon.setAttribute('fill', 'currentColor');
      }
      btnLike.querySelector('.like-count').textContent = currentLikes;
      localStorage.setItem('mca_liked_posts', JSON.stringify(likedPosts));

      try {
        const incrementVal = isLiked ? -1 : 1;
        await postRef.set(firebase.database.ServerValue.increment(incrementVal));
      } catch (err) {
        console.error("좋아요 업데이트 실패:", err);
      }
    });

    // 댓글 창 토글
    const btnToggle = card.querySelector('.btn-toggle-comment');
    btnToggle.addEventListener('click', () => {
      const commentSection = card.querySelector('.comment-section');
      commentSection.classList.toggle('active');
    });

    // 본문 삭제 기능
    const btnDelete = card.querySelector('.btn-delete');
    btnDelete.addEventListener('click', async () => {
      const id = data.id;
      const actualPw = data.password;
      
      if (!actualPw) {
        alert("비밀번호가 설정되지 않은 예전 게시글은 삭제할 수 없습니다.");
        return;
      }
      const inputPw = prompt("게시글을 삭제하려면 비밀번호를 입력하세요.");
      if (inputPw === null) return;
      
      if (inputPw === actualPw) {
        if (confirm("정말로 삭제하시겠습니까?")) {
          try {
            await db.ref('mca_board/' + id).remove();
          } catch (err) {
            alert("삭제 중 오류가 발생했습니다.");
          }
        }
      } else {
        alert("비밀번호가 일치하지 않습니다.");
      }
    });

    // 댓글 등록 기능
    const commentForm = card.querySelector('.comment-form');
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const postId = data.id;
      const cname = commentForm.elements['cname'].value.trim();
      const cpw = commentForm.elements['cpw'].value.trim();
      const cmsg = commentForm.elements['cmsg'].value.trim();

      if(!cname || !cpw || !cmsg) return;

      const btn = commentForm.querySelector('.btn-comment');
      const originalBtnHTML = btn.innerHTML;
      btn.innerHTML = '<span>등록 중...</span>';
      btn.disabled = true;

      try {
        const newCommentRef = db.ref(`mca_board/${postId}/comments`).push();
        await newCommentRef.set({
          name: cname,
          password: cpw,
          message: cmsg,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        commentForm.reset();
      } catch(error) {
        console.error("댓글 등록 실패:", error);
        alert("댓글 등록에 실패했습니다.");
      } finally {
        btn.innerHTML = originalBtnHTML;
        btn.disabled = false;
      }
    });

    bindCommentActionEvents(card);
  }

  // 댓글 액션 이벤트 리바인딩용 함수 (리스트 업데이트 시 필요)
  function bindCommentActionEvents(card) {
    // 1. 댓글 삭제
    card.querySelectorAll('.comment-delete').forEach(btn => {
      // 중복 방지: 이미 처리된 버튼은 무시 (data-bound 속성 활용)
      if (btn.getAttribute('data-delete-bound')) return;
      btn.setAttribute('data-delete-bound', 'true');
      
      btn.addEventListener('click', async () => {
        const postId = btn.getAttribute('data-post-id');
        const commentId = btn.getAttribute('data-comment-id');
        const actualPw = btn.getAttribute('data-pw');

        if (!actualPw) {
          alert("비밀번호가 없는 예전 댓글입니다.");
          return;
        }
        const inputPw = prompt("댓글을 삭제하려면 비밀번호를 입력하세요.");
        if (inputPw === null) return;

        if (inputPw === actualPw) {
          if (confirm("댓글을 삭제하시겠습니까?")) {
            try {
              await db.ref(`mca_board/${postId}/comments/${commentId}`).remove();
            } catch (err) {
              alert("댓글 삭제 중 오류가 발생했습니다.");
            }
          }
        } else {
          alert("비밀번호가 일치하지 않습니다.");
        }
      });
    });

    // 2. 댓글 좋아요
    card.querySelectorAll('.comment-like').forEach(btn => {
      if (btn.getAttribute('data-like-bound')) return;
      btn.setAttribute('data-like-bound', 'true');
      
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const postId = btn.getAttribute('data-post-id');
        const commentId = btn.getAttribute('data-comment-id');
        let currentLikes = parseInt(btn.querySelector('.comment-like-count').textContent, 10) || 0;
        
        const likedComments = JSON.parse(localStorage.getItem('mca_liked_comments') || '{}');
        const isLiked = likedComments[commentId] === true;

        const postRef = db.ref(`mca_board/${postId}/comments/${commentId}/likes`);
        const icon = btn.querySelector('svg') || btn.querySelector('i');

        if (isLiked) {
          likedComments[commentId] = false;
          currentLikes = Math.max(0, currentLikes - 1);
          btn.classList.remove('liked');
          if (icon) icon.removeAttribute('fill');
        } else {
          likedComments[commentId] = true;
          currentLikes += 1;
          btn.classList.add('liked');
          if (icon) icon.setAttribute('fill', 'currentColor');
        }
        btn.querySelector('.comment-like-count').textContent = currentLikes;
        localStorage.setItem('mca_liked_comments', JSON.stringify(likedComments));

        try {
          const incrementVal = isLiked ? -1 : 1;
          await postRef.set(firebase.database.ServerValue.increment(incrementVal));
        } catch (err) {
          console.error("댓글 좋아요 실패:", err);
        }
      });
    });
  }

  // 상대 시간(Time Ago) 변환 함수
  function timeAgo(timestamp) {
    if (!timestamp) return '방금 전';
    
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "년 전";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "개월 전";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "일 전";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "시간 전";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "분 전";
    if (seconds < 10) return '방금 전';
    return Math.floor(seconds) + "초 전";
  }

  // XSS 방지용 문자열 치환 함수
  function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, 
      tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
      }[tag])
    );
  }
});
