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
    const originals = Array.from(numTrack.querySelectorAll('.numslide'));
    const realCount = originals.length;
    // 앞뒤로 클론을 붙여 끊김 없는 무한 루프 구성: [클론들][원본들][클론들]
    if (realCount > 1) {
      const headClones = originals.map((sl) => sl.cloneNode(true));
      const tailClones = originals.map((sl) => sl.cloneNode(true));
      headClones.forEach((c) => { c.setAttribute('aria-hidden', 'true'); numTrack.insertBefore(c, originals[0]); });
      tailClones.forEach((c) => { c.setAttribute('aria-hidden', 'true'); numTrack.appendChild(c); });
    }
    const slides = numTrack.querySelectorAll('.numslide');
    let current = realCount; // 첫 원본 슬라이드(클론 다음)에서 시작
    let resetTimer, pendingNorm = null;
    const centerOf = (i) => slides[i].offsetLeft + slides[i].offsetWidth / 2 - numTrack.clientWidth / 2;
    // 클론에 해당하면 동일한 원본 인덱스로 환산
    const normalize = (i) => (i < realCount ? i + realCount : (i >= realCount * 2 ? i - realCount : i));
    // 스크롤 애니메이션이 끝난 순간 클론 → 원본 위치로 조용히 점프 (되감기처럼 보이지 않게)
    const applyNorm = () => {
      clearTimeout(resetTimer);
      if (pendingNorm === null) return;
      const n = pendingNorm; pendingNorm = null;
      current = n;
      numTrack.scrollTo({ left: centerOf(n), behavior: 'instant' });
    };
    numTrack.addEventListener('scrollend', applyNorm);
    const goTo = (i, smooth = true) => {
      clearTimeout(resetTimer);
      current = i;
      const norm = normalize(i);
      pendingNorm = norm !== i ? norm : null;
      numTrack.scrollTo({ left: centerOf(i), behavior: smooth ? 'smooth' : 'instant' });
      // scrollend 미지원 브라우저용 안전장치 (애니메이션 종료 후 충분히 늦게)
      if (pendingNorm !== null) resetTimer = setTimeout(applyNorm, 900);
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
    // 초기 위치를 첫 원본으로 (클론은 가려짐)
    requestAnimationFrame(() => numTrack.scrollTo({ left: centerOf(current), behavior: 'instant' }));

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
        // 클론에 머물러 있으면 동일한 원본 위치로 조용히 점프
        const norm = normalize(nearest);
        current = norm;
        if (norm !== nearest) numTrack.scrollTo({ left: centerOf(norm), behavior: 'instant' });
      }, 120);
    });
  }

  /* 7) 스크롤 진입 시 아래→위 등장 (같은 가로줄은 왼쪽→오른쪽 순차) */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // 등장시킬 콘텐츠 블록 후보 (제목·문단·버튼·이미지는 개별로, 그리드/행은 칸 단위로)
    const selector = [
      'section h1', 'section h2', 'section h3',
      'section > div > p',
      'section a.inline-flex',
      'section img',
      '[class*="grid-cols"] > *',   // 그리드의 각 칸(카드 등)을 한 덩어리로
      '.flex.items-stretch > *'     // 가로 카드 행(3스텝 등)
    ].join(',');

    let items = Array.from(document.querySelectorAll(selector))
      // 헤더·플로팅 고정바(.fixed) 내부 요소는 제외
      .filter((el) => !el.closest('.fixed') && !el.closest('header'));
    // 가장 바깥 요소만 유지 → 카드는 통째로 등장(내부 텍스트는 따로 움직이지 않음)
    items = items.filter((el) => !items.some((o) => o !== el && o.contains(el)));

    // 문서 기준 top 위치로 같은 가로줄끼리 묶어 왼쪽→오른쪽 지연 부여
    const STEP = 90; // ms, 줄 안에서 항목 간 간격
    const rows = new Map();
    items.forEach((el) => {
      el.classList.add('reveal');
      const top = Math.round((el.getBoundingClientRect().top + window.scrollY) / 24);
      if (!rows.has(top)) rows.set(top, []);
      rows.get(top).push(el);
    });
    rows.forEach((row) => {
      row.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
      row.forEach((el, i) => { el.style.transitionDelay = `${i * STEP}ms`; });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    items.forEach((el) => io.observe(el));
  }

  /* 8) 상담신청 폼 → 구글 시트 연동 (Apps Script 웹앱으로 전송) */
  // ↓↓↓ 배포한 Apps Script 웹앱의 /exec URL 을 여기에 붙여넣으세요 ↓↓↓
  const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxgpn-EMouXWQ1A84dZi5_RNnbIYYAksyPETR5qdMJf-64K-xkKCSsxhMfVGk3RFuTHvQ/exec';
  // 전화번호를 010-0000-0000 형태로 정규화 (하이픈/공백 입력도 허용)
  const formatPhone = (raw) => {
    const d = (raw || '').replace(/\D/g, '');
    if (d.length === 11) return d.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    if (d.length === 10) {
      if (d.startsWith('02')) return d.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
      return d.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    if (d.length === 9 && d.startsWith('02')) return d.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    return (raw || '').trim();
  };
  document.querySelectorAll('form.lead-form').forEach((form) => {
    // 제출 버튼이 폼 안에 있을 수도(신청서), 폼 밖 형제일 수도(하단 플로팅) 있음
    const btn = form.querySelector('button') ||
      form.parentElement?.querySelector('.quickbar__submit, button');
    if (!btn) return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const selects = form.querySelectorAll('select');
      const payload = {
        상담분야: selects[0] ? selects[0].value : '',
        신용채무액: selects[1] ? selects[1].value : '',
        세전연봉: selects[2] ? selects[2].value : '',
        이름: (form.querySelector('input[type="text"]')?.value || '').trim(),
        연락처: formatPhone(form.querySelector('input[type="tel"]')?.value),
        개인정보동의: form.querySelector('input[type="checkbox"]')?.checked ? 'Y' : 'N',
      };
      // 간단 검증
      if (!payload.이름 || !payload.연락처) { alert('이름과 연락처를 입력해 주세요.'); return; }
      if (payload.개인정보동의 !== 'Y') { alert('개인정보 수집 및 활용에 동의해 주세요.'); return; }
      if (!SHEETS_ENDPOINT) { alert('상담 신청이 접수되었습니다. 빠르게 연락드리겠습니다.'); form.reset(); return; }

      btn.disabled = true;
      btn.style.opacity = '0.6';
      try {
        await fetch(SHEETS_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors', // Apps Script 응답 CORS 회피 (전송만)
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
        alert('상담 신청이 접수되었습니다. 빠르게 연락드리겠습니다.');
        form.reset();
      } catch (err) {
        alert('전송 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 전화로 문의해 주세요.');
      } finally {
        btn.disabled = false;
        btn.style.opacity = '';
      }
    });
  });
});
