// 최의곤법률사무소 랜딩 인터랙션
document.addEventListener('DOMContentLoaded', () => {

  /* 1) 스크롤 시 헤더 배경 전환 */
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* 2) 모바일 네비 토글 */
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => nav.classList.toggle('is-open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('is-open')));
  }

  /* 3) 스크롤 진입 시 차트/카운터 애니메이션 (1회) */
  const animated = new WeakSet();

  const runGauge = (el) => {
    const val = +el.dataset.value;
    const color = el.dataset.color;
    const fg = el.querySelector('.gauge__fg');
    if (color) fg.style.stroke = color;
    fg.style.strokeDashoffset = 157 * (1 - val / 100);
  };

  const runRing = (el) => {
    const val = +el.dataset.value;
    el.querySelector('.ring__fg').style.strokeDashoffset = 214 * (1 - val / 100);
  };

  const runCounter = (el) => {
    const target = +el.dataset.target;
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting || animated.has(target)) return;
      animated.add(target);
      if (target.classList.contains('gauge')) runGauge(target);
      else if (target.classList.contains('ring')) runRing(target);
      else if (target.classList.contains('counter')) runCounter(target);
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.gauge, .ring, .counter').forEach(el => io.observe(el));

  /* 4) FAQ — 한 번에 하나만 열기 */
  const items = document.querySelectorAll('.fitem');
  items.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) items.forEach(o => { if (o !== item) o.open = false; });
    });
  });

  /* 5) 폼 제출(데모) — 실제 전송 로직 연결 전까지 안내 */
  document.querySelectorAll('.quickbar__submit, .applyform__submit').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('상담 신청이 접수되었습니다.\n빠른 시일 내에 연락드리겠습니다.\n(데모: 실제 전송 연동 필요)');
    });
  });

  /* 6) numcards 자동 + 드래그 슬라이드 */
  const numTrack = document.getElementById('numTrack');
  if (numTrack) {
    const slides = numTrack.querySelectorAll('.numslide');
    let current = 0;
    const goTo = (i) => {
      current = (i + slides.length) % slides.length; // 순환
      const sl = slides[current];
      const target = sl.offsetLeft + sl.offsetWidth / 2 - numTrack.clientWidth / 2;
      numTrack.scrollTo({ left: target, behavior: 'smooth' });
    };
    // 가장 가까운 슬라이드로 스냅 + 활성 인덱스 동기화
    const snapToNearest = () => {
      const center = numTrack.scrollLeft + numTrack.clientWidth / 2;
      let nearest = 0, minDist = Infinity;
      slides.forEach((sl, i) => {
        const c = sl.offsetLeft + sl.offsetWidth / 2;
        const d = Math.abs(c - center);
        if (d < minDist) { minDist = d; nearest = i; }
      });
      goTo(nearest);
    };

    // 자동 슬라이드 (5초)
    let timer = setInterval(() => goTo(current + 1), 5000);
    const restart = () => { clearInterval(timer); timer = setInterval(() => goTo(current + 1), 5000); };
    const pause = () => clearInterval(timer);

    // hover 시 일시정지
    const slider = numTrack.closest('.numcards__slider');
    slider?.addEventListener('mouseenter', pause);
    slider?.addEventListener('mouseleave', restart);

    // 드래그(마우스) 슬라이드
    let isDown = false, startX = 0, startScroll = 0, moved = 0;
    numTrack.addEventListener('mousedown', (e) => {
      isDown = true; moved = 0;
      startX = e.pageX;
      startScroll = numTrack.scrollLeft;
      numTrack.classList.add('is-dragging');
      pause();
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      moved = dx;
      numTrack.scrollLeft = startScroll - dx;
    });
    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      numTrack.classList.remove('is-dragging');
      // 드래그 거리에 따라 다음/이전/현재로 스냅
      if (Math.abs(moved) > 60) {
        if (moved < 0) goTo(current + 1); else goTo(current - 1);
      } else {
        snapToNearest();
      }
      restart();
    });

    // 드래그 종료 후 슬라이드 클릭(짧은 드래그)은 해당 슬라이드로 이동
    slides.forEach((sl, i) => sl.addEventListener('click', (e) => {
      if (Math.abs(moved) > 5) { e.preventDefault(); return; }
      if (i !== current) { goTo(i); restart(); }
    }));

    // 터치(모바일) — 브라우저 기본 가로 스크롤 사용, 끝나면 스냅·동기화
    let touchTimer;
    numTrack.addEventListener('scroll', () => {
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => {
        const center = numTrack.scrollLeft + numTrack.clientWidth / 2;
        let nearest = 0, minDist = Infinity;
        slides.forEach((sl, i) => {
          const c = sl.offsetLeft + sl.offsetWidth / 2;
          const d = Math.abs(c - center);
          if (d < minDist) { minDist = d; nearest = i; }
        });
        current = nearest;
      }, 120);
    });
  }
});
