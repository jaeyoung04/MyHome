document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 2. Mobile Hamburger Navigation
  const hamburger = document.getElementById('hamburger-menu');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('active');
      
      // Toggle Hamburger icon & Body scroll lock
      const icon = hamburger.querySelector('i');
      if (icon) {
        if (navMenu.classList.contains('active')) {
          icon.setAttribute('data-lucide', 'x');
          document.body.style.overflow = 'hidden'; // 스크롤 방지
        } else {
          icon.setAttribute('data-lucide', 'menu');
          document.body.style.overflow = ''; // 스크롤 허용
        }
        lucide.createIcons();
      }
    });

    // Close menu when clicking links
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        const icon = hamburger.querySelector('i');
        if (icon) {
          icon.setAttribute('data-lucide', 'menu');
          lucide.createIcons();
        }
        document.body.style.overflow = ''; // 메뉴 닫힐 때 스크롤 잠금 해제
      });
    });
  }

  // 3. Interactive Mouse Spotlight Effect
  const spotlightElements = document.querySelectorAll('.act-card, .research-item, .proj-card, .t-card, .company-card');
  
  // Only apply on desktop devices with hover capabilities
  if (window.matchMedia('(hover: hover)').matches) {
    spotlightElements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        element.style.setProperty('--mouse-x', `${x}px`);
        element.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  // 4. Page Scroll Progress & Header sticky & Timeline Active Line
  const header = document.getElementById('main-header');
  const sections = document.querySelectorAll('section[id]');
  const progressBar = document.getElementById('scroll-progress');
  const timelineWrapper = document.querySelector('.timeline-outer');
  const timelineProgressLine = document.querySelector('.timeline-fill');
  const timelineDots = document.querySelectorAll('.t-dot');

  function handleScrollEffects() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // Fade out hero background image on scroll
    const heroBg = document.querySelector('.hero-bg-img');
    if (heroBg) {
      const scrollRatio = Math.min(scrollY / window.innerHeight, 1);
      heroBg.style.opacity = 0.25 * (1 - scrollRatio);
    }
    
    // Top Scroll Progress Bar
    if (progressBar && docHeight > 0) {
      const scrollPercent = (scrollY / docHeight) * 100;
      progressBar.style.width = `${scrollPercent}%`;
    }

    // Header sticky styling
    if (header) {
      if (scrollY > 50) {
        header.classList.add('header-active');
      } else {
        header.classList.remove('header-active');
      }
    }

    // Scroll Active Link Highlighting has been removed as this is now a multi-page site

    // Dynamic Timeline Roadmap Active Line Height calculation
    if (timelineWrapper && timelineProgressLine) {
      const rect = timelineWrapper.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      
      // Calculate how much the timeline wrapper has scrolled into the viewport
      const startTrigger = viewHeight * 0.85; // start showing progress early
      const totalHeight = rect.height;
      const progressTop = -rect.top + startTrigger;
      
      let percentage = (progressTop / totalHeight) * 100;
      
      // Force 100% if we hit the bottom of the page so it doesn't get stuck on short pages
      if (Math.ceil(window.scrollY + viewHeight) >= document.documentElement.scrollHeight - 20) {
        percentage = 100;
      }
      
      percentage = Math.max(0, Math.min(100, percentage)); // clamp between 0% and 100%
      
      timelineProgressLine.style.height = `${percentage}%`;

      // Activate dots based on progress
      timelineDots.forEach(dot => {
        const dotRect = dot.getBoundingClientRect();
        // If the progress line crosses the dot or timeline is fully completed
        if (dotRect.top < startTrigger || percentage === 100) {
          dot.classList.add('lit');
        } else {
          dot.classList.remove('lit');
        }
      });
    }
  }

  window.addEventListener('scroll', handleScrollEffects);
  handleScrollEffects(); // Trigger once on load

  // 5. Scroll Reveal Animation (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });

  // 6. Project Details Data & Premium Modal Controls
  const projectData = {
    shm: {
      title: "AI 비전인식을 활용한 분리수거 시스템",
      img: "assets/images/project_shm_ism.jpg",
      description: "2025년 첨단산업 인재양성 부트캠프 경진대회에서 1등상(한국산업기술진흥원장상)을 수상한 작품입니다. 반도체 생산 설비 구역 내 가스 누출, 인화성 물질 보관 관리 상태를 통합 실시간 모니터링합니다. AI 스마트 IP 카메라로 작업자의 보호구 착용 여부 및 허가받지 않은 인원의 출입을 자동으로 식별하고 경보를 발령합니다.",
      specs: [
        "<strong>주제어 장치:</strong> NVIDIA Jetson Orin Nano (Edge AI), Arduino Mega 2560",
        "<strong>비전 인식:</strong> OpenCV & YOLOv8 기반 실시간 안전모 미착용 탐지",
        "<strong>센서 인터페이스:</strong> 전기 화학식 가스 누출 센서, 연기 감지, 열화상 어레이 센서",
        "<strong>무선 데이터 통신:</strong> ESP32 WiFi 모듈 및 MQTT 프로토콜 활용 실시간 데이터 스트리밍",
        "<strong>PLC 통합 제어:</strong> LS electric XGB PLC 연동을 통한 공장 내 비상 환기팬 자동 구동"
      ],
      impact: "이 시스템은 고위험 물질을 취급하는 정밀 반도체 공장뿐 아니라 제약, 정유 등 다양한 고위험 화학 생산 기지로의 우수한 확장성을 갖췄습니다. 실시간 감지 로그와 카메라 피드를 결합한 통합 시각화 기술로 고위험 근로 환경의 산업 재해율을 획기적으로 낮추는 사회적 기여를 인정받았습니다."
    },
    cafe: {
      title: "무인화 로봇카페 시스템",
      img: "assets/images/project_robot_cafe.jpg",
      description: "2024년 제42회 동양미래EXPO 최우수상 수상작입니다. 현대의 스마트 무인 매장 트렌드에 대응하여 설계되었으며, 음료의 주문, 제조, 밀봉 및 서빙 구역 전달까지의 전 과정에 사람이 개입하지 않는 100% 자동화를 시연했습니다.",
      specs: [
        "<strong>로봇 팔 본체:</strong> Doosan Robotics M0609 (6축 다관절 협동 로봇, 가반하중 6kg)",
        "<strong>통신 프레임워크:</strong> ROS2 (Robot Operating System) Foxy 기반 토픽/서비스 통신 연동",
        "<strong>비전/구동부:</strong> RealSense 3D 카메라 공간 매핑, 공압 그리퍼 및 서보 로테이터",
        "<strong>제어 시퀀스:</strong> 로봇 머니퓰레이터 기구학(Kinematics) 역해석 및 정밀 궤적 추종 제어",
        "<strong>사용자 연동 UI:</strong> 15.6인치 Android 기반 주문 키오스크 및 TCP/IP 소켓 주문 송수신 모듈"
      ],
      impact: "협동로봇과 기존 상용 에스프레소 머신, 시럽 디스펜서, 컵 투입기 등 이기종 시스템들 간의 타이밍 시퀀스 제어 기술을 입증했습니다. 특히, 오차 범위 ±0.1mm의 가동 정밀도를 유지하여 음료 유실 없는 신뢰도 높은 스마트 F&B 키친 솔루션의 표준을 선보였습니다."
    },
    digi: {
      title: "Digi-Star 대상 융합 자동화 시스템",
      img: "assets/images/mca_hero_bg.png",
      description: "2023년 디지텍 캡스톤디자인 경진대회에서 대상(디지스타상)을 차지한 학과의 핵심 역량 결집 작품입니다. 가로, 세로, 대각선 및 제자리 360도 회전이 자유로운 메카넘 휠 자율 주행 차량(AGV) 위에 정밀 자동 제어 프레임워크를 결합하여 미지의 장애물을 탐지 및 회피하며 임무를 완수합니다.",
      specs: [
        "<strong>메인 프로세서:</strong> Raspberry Pi 4 Model B (상위 제어), STM32F407 Cortex-M4 (하위 모터 제어)",
        "<strong>주행 모듈:</strong> 고출력 DC 엔코더 모터 4축 독립 제어 및 8인치 메카넘 휠 탑재",
        "<strong>슬램 기술 (SLAM):</strong> RPLIDAR A2M1 2D 레이저 스캐너 활용 실시간 지도 작성 및 자기 위치 추정",
        "<strong>장애물 검출:</strong> RealSense D435i 깊이 카메라와 적외선 거리 센서 융합 장애물 3차원 회피",
        "<strong>주행 알고리즘:</strong> ROS Cartographer 기반 매핑 및 A* / DWA 알고리즘 경로 추종"
      ],
      impact: "물류 허브 및 대규모 자동화 창고에서 다수의 무인 운반 로봇(AGV/AMR)을 동시 제어할 수 있는 자율주행 원천 기술을 성공적으로 실현한 점에서 기술적 완성도를 높게 평가받았습니다. 학생 수준을 뛰어넘은 임베디드 및 펌웨어 기술이 통합된 우수 사례입니다."
    }
  };

  const modal = document.getElementById('project-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  
  const modalTitle = document.getElementById('modal-project-title');
  const modalImg = document.getElementById('modal-project-img');
  const modalDesc = document.getElementById('modal-project-description');
  const modalSpecs = document.getElementById('modal-project-specs');
  const modalImpact = document.getElementById('modal-project-impact');

  function openModal(projectId) {
    const data = projectData[projectId];
    if (!data) return;

    modalTitle.textContent = data.title;
    modalImg.src = data.img;
    modalImg.alt = data.title;
    modalDesc.textContent = data.description;
    modalImpact.textContent = data.impact;

    modalSpecs.innerHTML = '';
    data.specs.forEach(spec => {
      const li = document.createElement('li');
      li.innerHTML = spec;
      modalSpecs.appendChild(li);
    });

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; 
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; 
  }

  const projectButtons = document.querySelectorAll('.proj-link');
  projectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const projectId = btn.getAttribute('data-project-id');
      openModal(projectId);
    });
  });

  if (modalCloseBtn && modalOverlay) {
    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
      closeModal();
    }
  });
});
