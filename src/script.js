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

  /* 2.5) #contact 링크 클릭 시 문의 폼이 화면 중앙에 오도록 스크롤 */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    document.querySelectorAll('a[href="#contact"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        nav?.classList.remove('is-open');
        contactForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
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
      // 헤더·플로팅 고정바(.fixed)·개별 시퀀스(data-reveal-skip) 내부 요소는 제외
      .filter((el) => !el.closest('.fixed') && !el.closest('header') && !el.closest('[data-reveal-skip]'));
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

    /* 7.1) 그룹 단위 순차 등장 — 같은 부모 안의 항목을 아래→위로 하나씩 (Step 카드, 핸드폰 3분할) */
    [['.step-card', 170], ['.phone-part', 220]].forEach(([sel, step]) => {
      const groups = new Map();
      document.querySelectorAll(sel).forEach((el) => {
        const parent = el.parentElement;
        if (!groups.has(parent)) groups.set(parent, []);
        groups.get(parent).push(el);
      });
      groups.forEach((groupItems) => {
        groupItems.forEach((el, idx) => {
          el.classList.add('reveal');
          el.style.transitionDelay = `${idx * step}ms`;
        });
        const gio = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              groupItems.forEach((el) => el.classList.add('is-visible'));
              gio.disconnect();
            }
          });
        }, { rootMargin: '0px 0px -15% 0px', threshold: 0.05 });
        gio.observe(groupItems[0].parentElement);
      });
    });
  }

  /* 8.5) 강점 롤러 — 흐린 칸에서 하나씩 위로 올라오는 세로 티커 (여러 개 지원) */
  const STRENGTHS = [
    '비대면 문의 ∙ 상담 가능',
    '전국 접수 가능',
    '99% 성공률',
    '완료까지 책임 관리',
    '배우자 모르게 가능',
    '면책 이력 있어도 가능',
    '집경매 위험 없이 가능',
  ];
  document.querySelectorAll('.js-roller').forEach((roller) => {
    const front = roller.querySelector('.sr-strip-front');
    const back = roller.querySelector('.sr-strip-back');
    const N = STRENGTHS.length;
    const H = 58; // 칸 높이(px) — .sr-strip > li 와 일치
    if (!(front && back && N > 1)) return;

    // 끊김 없는 순환을 위해 목록을 두 번 이어 붙임
    const build = (strip) => {
      strip.innerHTML = '';
      STRENGTHS.concat(STRENGTHS).forEach((t) => {
        const li = document.createElement('li');
        li.textContent = t;
        strip.appendChild(li);
      });
    };
    build(front);
    build(back);

    let i = 0;
    const render = (animate) => {
      front.classList.toggle('sr-noanim', !animate);
      back.classList.toggle('sr-noanim', !animate);
      front.style.transform = `translateY(${-i * H}px)`;      // 밝은 칸: 현재 강점
      back.style.transform = `translateY(${-(i + 1) * H}px)`;  // 흐린 칸: 다음 강점(미리보기)
    };
    render(false);

    setInterval(() => {
      i += 1;
      render(true);
      if (i >= N) {
        // 클론 위치까지 올라간 뒤, 애니메이션 없이 처음으로 되돌려 무한 순환
        setTimeout(() => { i = 0; render(false); }, 650);
      }
    }, 2600);
  });

  /* 8.6) FAQ — 강점 롤러와 동일한 세로 롤링 (3개 노출, 한 칸씩 위로 순환 / hover 정지 / 클릭하면 전체 펼침) */
  const faqViewport = document.getElementById('faqViewport');
  const faqTrack = document.getElementById('faqTrack');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (faqViewport && faqTrack && !reduceMotion) {
    const VISIBLE = 3;          // 위쪽에 노출할 질문 수
    const STEP_MS = 4000;       // 한 칸 올라가는 간격
    const RESET_MS = 650;       // 마지막에서 처음으로 되돌리는 시간(강점 롤러와 동일)
    const originals = Array.from(faqTrack.querySelectorAll('.fitem'));
    const N = originals.length;

    if (N > VISIBLE) {
      // 끊김 없는 순환을 위해 목록을 한 벌 더 복제(복제본은 클릭 불가)
      const clones = originals.map((el) => {
        const c = el.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.removeAttribute('open');
        c.style.pointerEvents = 'none';
        faqTrack.appendChild(c);
        return c;
      });

      const PEEK_RATIO = 0.72;    // 다음 질문이 보이는 비율(넘어가는 중 표시)
      let H = 0;
      let peekPx = 0;
      const measure = () => {
        // 항목 간격(gap) 포함 한 칸 높이 = 다음 항목 top - 현재 항목 top
        H = originals[1].offsetTop - originals[0].offsetTop;
        const itemH = originals[0].offsetHeight;   // 접힌 질문 한 개 높이
        const gap = H - itemH;
        peekPx = gap + PEEK_RATIO * itemH;          // 다음 질문을 72%까지 노출
        // 3개 + 다음 질문(72%)이 보이도록 뷰포트 높이 설정 → 하단 페이드로 흐릿하게 처리
        const h = originals[VISIBLE - 1].offsetTop + originals[VISIBLE - 1].offsetHeight - originals[0].offsetTop;
        faqViewport.style.setProperty('--faq-h', (h + peekPx) + 'px');
        faqViewport.style.setProperty('--faq-peek', peekPx + 'px');
      };
      measure();

      let i = 0;
      let timer = null;
      let hovering = false;
      let openEl = null;          // 현재 펼쳐진 질문(없으면 null)
      const render = (animate) => {
        faqTrack.classList.toggle('faq-noanim', !animate);
        faqTrack.style.transform = `translateY(${-i * H}px)`;
      };
      render(false);

      const tick = () => {
        i += 1;
        render(true);
        if (i >= N) setTimeout(() => { i = 0; render(false); }, RESET_MS);
      };
      const start = () => { if (!openEl && !hovering && !timer) timer = setInterval(tick, STEP_MS); };
      const stop = () => { clearInterval(timer); timer = null; };
      start();

      // 마우스를 올리면 잠시 멈춤(읽고 클릭할 수 있도록)
      faqViewport.addEventListener('mouseenter', () => { hovering = true; stop(); });
      faqViewport.addEventListener('mouseleave', () => { hovering = false; start(); });

      // 펼친 질문을 맨 위로 올리고, 그 질문+답과 다음 2개만 보이도록 뷰포트 높이 조정
      const showOpen = (el) => {
        const idx = originals.indexOf(el);
        i = idx;
        render(true);
        const endIdx = Math.min(idx + VISIBLE - 1, N - 1);
        const h = originals[endIdx].offsetTop + originals[endIdx].offsetHeight - originals[idx].offsetTop;
        faqViewport.style.setProperty('--faq-h', (h + peekPx) + 'px');
      };

      // 질문 클릭 시: 롤링 정지 + 한 번에 하나만 펼침(3개 창 유지)
      originals.forEach((el) => {
        el.addEventListener('toggle', () => {
          if (el.open) {
            if (openEl && openEl !== el) openEl.open = false;  // 다른 항목은 닫기
            openEl = el;
            stop();
            requestAnimationFrame(() => showOpen(el));
          } else if (openEl === el) {
            openEl = null;
            requestAnimationFrame(() => { measure(); render(false); start(); });
          }
        });
      });

      // 반응형: 폭이 바뀌면 칸 높이 재측정(펼치기 전 상태에서만)
      let rAF = null;
      window.addEventListener('resize', () => {
        if (openEl) return;
        cancelAnimationFrame(rAF);
        rAF = requestAnimationFrame(() => { measure(); render(false); });
      }, { passive: true });
    }
  }

  /* 8) 상담신청 폼 → 구글 시트 연동 (Apps Script 웹앱으로 전송) */
  // ↓↓↓ 배포한 Apps Script 웹앱의 /exec URL 을 여기에 붙여넣으세요 ↓↓↓
  const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxgpn-EMouXWQ1A84dZi5_RNnbIYYAksyPETR5qdMJf-64K-xkKCSsxhMfVGk3RFuTHvQ/exec';
  // 유입경로(ref) 추적: ?ref= → ?utm_source= → 유입 사이트 → 직접유입
  // 최초 진입 시점의 값을 sessionStorage에 보관(폼 제출까지 유지)
  const getRef = () => {
    try {
      const KEY = 'lead_ref';
      const saved = sessionStorage.getItem(KEY);
      if (saved) return saved;
      const q = new URLSearchParams(window.location.search);
      let ref = (q.get('ref') || q.get('utm_source') || '').trim();
      if (!ref) {
        const r = document.referrer || '';
        if (r) { try { ref = new URL(r).hostname; } catch (_) { ref = r; } }
      }
      if (!ref) ref = '직접유입';
      sessionStorage.setItem(KEY, ref);
      return ref;
    } catch (_) {
      return '직접유입';
    }
  };

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
        유입경로: getRef(),
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
