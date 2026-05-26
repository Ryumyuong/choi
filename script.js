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

  /* 6) numcards 슬라이드 캐러셀 */
  const numTrack = document.getElementById('numTrack');
  const numDots = document.querySelectorAll('#numDots .numcards__dot');
  const numPrev = document.querySelector('.numcards__nav--prev');
  const numNext = document.querySelector('.numcards__nav--next');
  if (numTrack && numDots.length) {
    const slides = numTrack.querySelectorAll('.numslide');
    let current = 0;
    const goTo = (i) => {
      current = Math.max(0, Math.min(slides.length - 1, i));
      slides[current].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      numDots.forEach((d, j) => d.classList.toggle('is-active', j === current));
    };
    numPrev?.addEventListener('click', () => goTo(current - 1));
    numNext?.addEventListener('click', () => goTo(current + 1));
    numDots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
    // 스크롤/스와이프 시 활성 도트 동기화
    let scrollTimer;
    numTrack.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const center = numTrack.scrollLeft + numTrack.clientWidth / 2;
        let nearest = 0, minDist = Infinity;
        slides.forEach((sl, i) => {
          const slCenter = sl.offsetLeft + sl.offsetWidth / 2;
          const dist = Math.abs(slCenter - center);
          if (dist < minDist) { minDist = dist; nearest = i; }
        });
        if (nearest !== current) {
          current = nearest;
          numDots.forEach((d, j) => d.classList.toggle('is-active', j === current));
        }
      }, 100);
    });
  }
});
