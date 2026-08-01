/* 图形界面：论坛 / 邮件 / 照片 / 影像 / 岚 / 套娃(官网·青岚聊·地图·时间线·推理板) */
window.APPS = (function () {
  const esc = s => (s || "").replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));

  function renderBBS(body) {
    body.innerHTML = "";
    body.appendChild(h("📌 校园论坛"));
    const boards = GAME.bbs.public.concat(GAME.bbs.admin);
    boards.filter(b => b.level <= STATE.level).forEach(b => {
      body.appendChild(h("▸ " + b.board));
      b.posts.filter(p => (p.level || 0) <= STATE.level).forEach(p => {
        const t = el("div", "thread");
        t.innerHTML = `<div class="th-title">${esc(p.title)}</div><div class="th-meta">${esc(p.author)}</div>`;
        const b2 = el("div", "th-body", esc(p.body));
        b2.style.display = "none";
        t.appendChild(b2);
        // 身份视角：管理员额外可见内容
        let extra = null;
        if (p.adminExtra && STATE.level >= 2) {
          extra = el("div", "th-body", `<span class="muted">（管理员视角）</span> ${esc(p.adminExtra)}`);
          extra.style.display = "none";
          extra.style.borderLeft = "2px solid var(--warn)";
          t.appendChild(extra);
        }
        // 统一绑定一次：展开/收起正文（与额外视角），并顺手收集 lore
        t.onclick = () => {
          b2.style.display = b2.style.display === "none" ? "block" : "none";
          if (extra) extra.style.display = extra.style.display === "none" ? "block" : "none";
          if (p.lore && window.collectLore) window.collectLore(p.lore);
        };
        body.appendChild(t);
      });
      body.appendChild(el("hr"));
    });
  }

  function renderMail(body) {
    body.innerHTML = "";
    body.appendChild(h("✉️ 收件箱"));
    body.appendChild(mailCard("校务办", "关于校园网离线镜像", "服务器已裁撤，校园网转为离线只读镜像。隐私目录已加密。"));
    if (STATE.level >= 2) {
      const r = FS.read("/home/admin/mail/draft_root.txt", STATE.level);
      if (!r.error) body.appendChild(mailCard("草稿箱 · 苏黎(残留)", "ROOT KEY PART B", r.content));
    } else {
      body.appendChild(el("div", "muted", "（更高权限可见的邮件被加密）"));
    }
  }

  function renderPhotos(body) {
    body.innerHTML = "";
    body.appendChild(h("🖼️ 班级相册"));
    const grid = el("div", "photos");
    GAME.photos.filter(p => (p.level || 0) <= STATE.level).forEach(p => {
      const c = el("div", "photo");
      c.innerHTML = `<div class="pic">${p.icon}</div><div class="cap"><b>${esc(p.name)}</b>${esc(p.date)}<br>${esc(p.desc)}</div>`;
      c.onclick = () => showPhoto(p, body);
      grid.appendChild(c);
    });
    body.appendChild(grid);
  }

  /* ============ 影像档案：解到某一处，对应影像自动放出 ============ */
  // 判断某段影像是否已达解锁条件
  function footageUnlocked(f) {
    const t = f.trigger;
    if (!t) return true;
    switch (t.kind) {
      case "level":    return STATE.level >= t.level;
      case "timeline": return !!STATE.timelineDone;
      case "board":    return !!STATE.boardDone;
      case "meta":     return !!STATE.metaUnlocked;
      case "lore":     return STATE.lore.size >= 4;
      case "file":     return !!(STATE.readFiles && STATE.readFiles.has(t.path));
      case "verdict":  return !!STATE.verdict;
      case "systemic": return STATE.verdict === "systemic";
      case "deep":     return !!STATE.deepUnlocked;
      case "contradiction": return !!STATE.contradictionDone;
      default:         return false;
    }
  }
  // 解锁条件的人类可读提示
  function triggerHint(t) {
    if (!t) return "——";
    switch (t.kind) {
      case "level":    return "升至 level " + t.level + "（" + ["访客", "学生", "管理员", "root"][t.level] + "）";
      case "timeline": return "在 🕒 时间线 排出正确顺序";
      case "board":    return "在 🧩 推理板 钉对全部证据链";
      case "meta":     return "提交守门人密语『青岚不灭』";
      case "lore":     return "集齐 4 块 lore 碎片";
      case "file":     return "读取文件 " + t.path;
      case "verdict":  return "在 🧩 推理板 完成『最终结论』";
      case "systemic": return "在 🧩 推理板 把『幕后』判为教务处（系统性真相）";
      case "deep":     return "解开 legacy.txt 第二层维吉尼亚自白";
      case "contradiction": return "在 🧩 推理板 完成『矛盾指认』";
      default:         return "未知条件";
    }
  }
  // 无影像档案时的「场景还原」卡片（有意为之的氛围画面，不是 bug）
  function sceneCard(f) {
    const icon = f.icon || "🎞️";
    return `<div class="scene-card"><div class="scene-emoji">${icon}</div>` +
           `<div class="scene-tag">场景还原 · 暂无影像档案</div>` +
           `<div class="scene-cap">${esc(f.desc)}</div></div>`;
  }
  // 播放单段影像（有视频放视频；视频缺失自动降级为场景卡）
  function playFootage(f) {
    const hasVid = !!f.src;
    const player = hasVid
      ? `<video class="ft-video" controls autoplay><source src="${esc(f.src)}"></video>`
      : sceneCard(f);
    UI.modal({
      title: "🎬 " + f.period,
      body: `<div class="ft-player" id="ft-player">${player}</div><p class="ft-desc">${esc(f.desc)}</p>`,
      actions: [{ label: "关闭", primary: true }]
    });
    if (hasVid) {
      const pl = document.getElementById("ft-player");
      const vid = pl && pl.querySelector("video");
      if (vid) vid.addEventListener("error", () => { if (pl) pl.innerHTML = sceneCard(f); });
    }
  }
  // 解到某处后，自动放出「新解锁」的影像（每处只自动播一段，其余进列表可回看）
  function revealFootage() {
    STATE.seenFootage = STATE.seenFootage || new Set();
    const fresh = GAME.footage.filter(f => footageUnlocked(f) && !STATE.seenFootage.has(f.id));
    if (!fresh.length) return;
    fresh.forEach(f => STATE.seenFootage.add(f.id));
    fresh.forEach(f => { if (window.recordDiscovery) window.recordDiscovery("影像", f.period, f.desc); });
    playFootage(fresh[0]);
    if (fresh.length > 1)
      UI.print(`🎬 另有 ${fresh.length - 1} 段新影像已解锁，去 🎬影像 回看：${fresh.slice(1).map(f => f.period).join("、")}`, "ok");
    else
      UI.print(`🎬 新影像已解锁：${fresh[0].period}（影像界面可回看）`, "ok");
  }
  // 开机预标记当前已可见影像，避免开场弹窗刷屏
  function markSeenFootage() {
    STATE.seenFootage = STATE.seenFootage || new Set();
    GAME.footage.forEach(f => { if (footageUnlocked(f)) STATE.seenFootage.add(f.id); });
  }
  window.revealFootage = revealFootage;
  window.markSeenFootage = markSeenFootage;

  function renderFootage(body) {
    body.innerHTML = "";
    body.appendChild(h("🎬 影像档案"));
    body.appendChild(el("div", "muted", "这些影像由 AI 生成 / 场景还原，还原那一晚与她相关的样子。解到某一处，对应影像会<b>自动放出</b>；没解到的会显示解锁条件，供你追踪。"));
    const grid = el("div", "ft-grid");
    GAME.footage.forEach(f => {
      const ok = footageUnlocked(f);
      const card = el("div", "ft-card" + (ok ? "" : " ft-locked"));
      if (ok) {
        card.appendChild(el("div", "ft-period", f.period));
        card.appendChild(el("div", "ft-thumb", f.icon || "🎞️"));
        const play = el("button", "btn-guest ft-play", "▶ 播放");
        play.onclick = () => playFootage(f);
        card.appendChild(play);
      } else {
        card.appendChild(el("div", "ft-period", "🔒 " + f.period));
        card.appendChild(el("div", "ft-hint muted", "解锁条件：" + triggerHint(f.trigger)));
      }
      grid.appendChild(card);
    });
    body.appendChild(grid);
  }

  /* 照片查看器（增强显隐写）：点开单图，可放大/反相/增强 */
  function showPhoto(p, body) {
    body.innerHTML = "";
    body.appendChild(h("🖼️ " + p.name));
    body.appendChild(el("div", "muted", "日期：" + p.date));
    const viewer = el("div", "viewer");
    const stage = el("div", "viewer-stage", p.icon);
    viewer.appendChild(stage);
    const bar = el("div", "viewer-bar");
    const zoom = (d) => { const s = parseFloat(stage.style.fontSize || "64") + d; stage.style.fontSize = s + "px"; };
    const bZoomIn = el("button", "btn-guest", "放大 +"); bZoomIn.onclick = () => zoom(16);
    const bZoomOut = el("button", "btn-guest", "缩小 -"); bZoomOut.onclick = () => zoom(-16);
    const bInv = el("button", "btn-guest", "反相"); bInv.onclick = () => stage.classList.toggle("invert");
    bar.appendChild(bZoomIn); bar.appendChild(bZoomOut); bar.appendChild(bInv);
    if (p.hiddenWatermark) {
      const bEnh = el("button", "btn-guest", "增强");
      bEnh.onclick = () => {
        const wm = el("div", "viewer-wm", p.hiddenWatermark);
        wm.style.opacity = "1";
        stage.appendChild(wm);
        bar.appendChild(el("div", "muted", p.enhanceHint || "增强后浮现出隐藏的字。"));
      };
      bar.appendChild(bEnh);
    }
    viewer.appendChild(bar);
    body.appendChild(viewer);

    const ex = el("div", "thread");
    ex.innerHTML = `<div class="th-title">EXIF 元数据</div><div class="th-body mono">${esc(p.exif)}</div>`;
    const btn = el("button", "btn-guest", "解码 EXIF 注释");
    btn.style.marginTop = "8px";
    btn.onclick = () => {
      if (btn.dataset.done) return;   // 幂等：避免重复点击反复追加结果
      btn.dataset.done = "1";
      const m = p.exif.match(/Comment:\s*([A-Za-z0-9+/=]+)/);
      if (!m) { ex.innerHTML += `<div class="muted" style="margin-top:8px">这段 EXIF 的 Comment 字段里没有可解码的编码串。</div>`; return; }
      const raw = m[1];
      let dec = CRYPTO.b64dec(raw), how = "base64";
      if (!/^[ -~]+$/.test(dec) && /^[0-9a-fA-F]+$/.test(raw)) { dec = CRYPTO.hexDec(raw); how = "hex"; }
      ex.innerHTML += `<div class="ok" style="margin-top:8px;color:var(--ok)">解码结果（${how}）：${esc(dec)}<br>→ 账号 ${esc(dec.split(":")[0])} ／ 口令 ${esc(dec.split(":")[1] || "?")}</div>`;
    };
    ex.appendChild(btn);
    body.appendChild(ex);
    const back = el("div", "muted", "（点击返回）"); back.style.cursor = "pointer"; back.style.marginTop = "10px";
    back.onclick = renderPhotos.bind(null, body);
    body.appendChild(back);
  }

  /* ============ 套娃①：伪校园官网（Her Story 式站内搜索） ============ */
  let webLoggedIn = false;
  function renderWeb(body) {
    body.innerHTML = "";
    body.appendChild(h("🌐 青岚一中 · 校园门户"));
    const nav = el("div", "web-nav");
    [["home", "首页"], ["notice", "公告"], ["jiaowu", "教务"], ["alumni", "校友"], ["board", "匿名板"], ["internal", "内部系统"]].forEach(([k, lbl]) => {
      const b = el("button", "web-navbtn", lbl); b.onclick = () => showWebPage(body, k);
      nav.appendChild(b);
    });
    body.appendChild(nav);
    const sb = el("div", "web-search");
    const inp = document.createElement("input");
    inp.className = "web-input"; inp.placeholder = "站内搜索关键词，回车…（试：苏黎 / 成绩 / 篡改 / 12.24 / 匿名）";
    inp.onkeydown = e => { if (e.key === "Enter") doSearch(body, inp.value.trim()); };
    sb.appendChild(inp);
    body.appendChild(sb);
    const content = el("div", "web-content"); content.id = "web-content";
    body.appendChild(content);
    showWebPage(body, "home");
  }
  function showWebPage(body, key) {
    const content = body.querySelector("#web-content");
    let page;
    if (key === "home") page = { title: GAME.web.home.title, body: GAME.web.home.body };
    else page = GAME.web.pages[key];
    if (!page) { content.innerHTML = `<h3>${esc(GAME.web.notfound.title)}</h3>${GAME.web.notfound.body}`; return; } // notfound.body 是 HTML，直接插入
    if (page.level && STATE.level < page.level) {
      content.innerHTML = `<h3>${esc(page.title)}</h3><p class="muted">🔒 此页面需 level ${page.level} 权限。提升身份后才能看。</p>`;
      return;
    }
    STATE.webSeen = STATE.webSeen || new Set();
    STATE.webSeen.add(key);
    if (window.recordDiscovery && key !== "home") window.recordDiscovery("官网", page.title, "访问页面：" + key);

    if (key === "internal" && !webLoggedIn) {
      content.innerHTML = `<h3>${esc(page.title)}</h3>${page.body}`; // body 是 HTML，不转义
      const form = el("div", "web-login");
      const inp = document.createElement("input"); inp.className = "web-input"; inp.placeholder = "账号 suli / 口令";
      const btn = el("button", "btn-guest", "登录");
      btn.onclick = () => {
        if (inp.value.indexOf("QLcampus2019") >= 0) { webLoggedIn = true; showWebPage(body, "internal"); }
        else form.innerHTML += `<div class="muted">口令不对。苏黎的账号口令，在那张操场照片的 EXIF 里（base64）。</div>`;
      };
      form.appendChild(inp); form.appendChild(btn);
      content.appendChild(form);
      return;
    }
    if (key === "internal" && webLoggedIn) {
      const cmp = page.compare;
      const txt = (STATE.level >= 3) ? cmp.root : (STATE.level >= 2 ? cmp.admin : cmp.student);
      content.innerHTML = `<h3>${esc(page.title)}（已登录 · ${STATE.user}）</h3><pre class="mono">${esc(txt)}</pre>` +
        `<div class="muted">（管理员视角的页脚校验码 6Z2S，用 <code>decode b64 6Z2S</code> 解开——它是某处『印记』之一。）</div>`;
      return;
    }
    let html = `<h3>${esc(page.title)}</h3>${page.body}`; // body 是 HTML，不转义
    if (page.ghost) html += `<div class="muted">（以管理员身份重看此页，被删公告的残影会更清晰——但你目前只看到公开残影。）</div>`;
    content.innerHTML = html;
    if (key === "alumni" && page.hiddenBoard) {
      const link = el("div", "web-link", "▸ 匿名留言板（点此进入）");
      link.onclick = () => showWebPage(body, "board");
      content.appendChild(link);
    }
    if (key === "home") {
      const links = el("div", "web-links");
      [["im", "💬 青岚聊"], ["map", "🗺️ 校园地图"], ["timeline", "🕒 时间线"], ["board", "🧩 推理板"], ["ledger", "📓 线索笔记本"], ["footage", "🎬 影像"]].forEach(([app, label]) => {
        const b = el("button", "web-linkbtn", label); b.onclick = () => UI.openApp(app);
        links.appendChild(b);
      });
      content.appendChild(links);
    }
  }
  function doSearch(body, kw) {
    const content = body.querySelector("#web-content");
    const hit = GAME.web.search[kw] || GAME.web.search[(kw || "").toLowerCase()];
    if (hit) showWebPage(body, hit);
    else content.innerHTML = `<h3>搜索：『${esc(kw)}』</h3><p class="muted">没有匹配的页面。换个词试试：苏黎 / 成绩 / 篡改 / 12.24 / 匿名。</p>`;
  }

  /* ============ 套娃②：伪聊天 App「青岚聊」 ============ */
  function renderIM(body) {
    body.innerHTML = "";
    body.appendChild(h("💬 青岚聊"));
    body.appendChild(el("div", "muted", "苏黎留下的聊天残影。带 🔒 的是加密消息，需要密钥才能读。"));
    const wrap = el("div", "im");
    const list = el("div", "im-list");
    GAME.chat.contacts.forEach((c, i) => {
      const item = el("div", "im-contact", (c.online ? "🟢 " : "⚪ ") + c.name);
      item.onclick = () => { showIM(body, c); [...list.children].forEach(x => x.classList.remove("active")); item.classList.add("active"); };
      list.appendChild(item);
    });
    const view = el("div", "im-view"); view.id = "im-view";
    wrap.appendChild(list); wrap.appendChild(view);
    body.appendChild(wrap);
    showIM(body, GAME.chat.contacts[0]);
  }
  function showIM(body, c) {
    const view = body.querySelector("#im-view"); view.innerHTML = "";
    view.appendChild(el("div", "im-name", c.name));
    c.msgs.forEach(m => {
      if (m.level && STATE.level < m.level) return; // 高权限才显的隐藏消息（如匿名证人身份反转）
      const row = el("div", "im-msg");
      if (m.encrypted) {
        row.innerHTML = `<span class="im-lock">🔒 加密消息</span>`;
        const inp = document.createElement("input"); inp.className = "web-input"; inp.placeholder = "输入密钥解密（提示：校名拼音，全大写连写）";
        const btn = el("button", "btn-guest", "解密");
        btn.onclick = () => {
          if (inp.value.trim().toUpperCase() === m.key) row.innerHTML = `<b>解密：</b>${esc(m.plain)}`;
          else row.innerHTML += `<div class="muted">密钥不对。这把钥匙，论坛『密码学社』提过——『校名的完整拼音』。</div>`;
        };
        row.appendChild(inp); row.appendChild(btn);
      } else {
        row.textContent = m.text;
        if (m.fragB) row.innerHTML += `<div class="muted" style="margin-top:6px">（这条末尾附着一串编码：<code>${esc(m.fragB)}</code> —— 用 <code>decode b64 ${esc(m.fragB)}</code> 解开，是某处『印记』之一。）</div>`;
      }
      view.appendChild(row);
    });
  }

  /* ============ 套娃③：伪校园地图 ============ */
  function renderMap(body) {
    body.innerHTML = "";
    body.appendChild(h("🗺️ 青岚一中 · 平面图"));
    body.appendChild(el("div", "muted", "点击地点查看详情。部分地点需权限。" + (STATE.level >= 2 ? "（监控室已对你开放）" : "")));
    const plane = el("div", "map-plane");
    GAME.map.places.forEach(p => {
      const dot = el("div", "map-dot", p.name);
      dot.style.left = p.x + "%"; dot.style.top = p.y + "%";
      if (p.level && STATE.level < p.level) dot.classList.add("locked");
      dot.onclick = () => showPlace(body, p);
      plane.appendChild(dot);
    });
    body.appendChild(plane);
    const detail = el("div", "map-detail"); detail.id = "map-detail";
    body.appendChild(detail);
  }
  function showPlace(body, p) {
    const d = body.querySelector("#map-detail");
    if (p.level && STATE.level < p.level) { d.innerHTML = `<b>${esc(p.name)}</b><div class="muted">🔒 需管理员(level 2)及以上权限。</div>`; return; }
    if (window.recordDiscovery) window.recordDiscovery("地点", p.name, "查看地图地点");
    let html = `<b>${esc(p.name)}</b>`;
    if (p.note) html += `<div class="th-body">${esc(p.note)}</div>`;
    if (p.log) html += `<pre class="mono">${esc(p.log)}</pre><div class="muted">（日志里的 HEX e781ad，用 <code>decode hex e781ad</code> 解开——它是某处『印记』之一。）</div>`;
    const people = (p.personIds || []).map(personById).filter(Boolean);
    if (people.length) {
      html += "<div class='place-rel'><b>关联人物</b><div>";
      html += people.map(x => STATE.level >= (x.level || 0) ? esc(x.name) : "未识别人物").join(" / ");
      html += "</div></div>";
    }
    const clues = (p.clueIds || []).map(id => clueMap()[id]).filter(Boolean);
    if (clues.length) {
      html += "<div class='place-rel'><b>关联证据</b><div>";
      html += clues.map(c => clueUnlocked(c) ? "✓ " + esc(c.title) : "○ 未解锁证据").join("<br>");
      html += "</div></div>";
    }
    const footage = (p.footageIds || []).map(footageById).filter(Boolean);
    if (footage.length) {
      html += "<div class='place-rel'><b>关联影像</b><div>";
      html += footage.map(f => footageUnlocked(f) ? "✓ " + esc(f.period) : "○ 未解锁影像").join("<br>");
      html += "</div></div>";
    }
    d.innerHTML = html;
  }
  function personById(id) { return (GAME.people || []).find(p => p.id === id); }
  function footageById(id) { return (GAME.footage || []).find(f => f.id === id); }

  /* ============ 推理机制①：时间线重建 ============ */
  let tlSeq = [];
  function renderTimeline(body) {
    body.innerHTML = "";
    tlSeq = [];
    body.appendChild(h("🕒 时间线重建"));
    if (STATE.level < 3) {
      body.appendChild(el("div", "muted", "🔒 时间线重建需要 root 后结合 /root/truth 与系统日志使用。现在先收集线索，避免被深层事件提前剧透。"));
      return;
    }
    body.appendChild(el("div", "muted", "把下面 12 件事，按时间先后点成一条线。排对会显现『转折那一晚』。\n⚠ 注意：『12.24 篡改夜』与『06.17 最后在线/离校夜』是两回事——别被混为一谈。"));
    const seq = el("div", "tl-seq"); seq.id = "tl-seq";
    body.appendChild(seq);
    const pool = el("div", "tl-pool");
    const shuffled = [...GAME.timeline.events].sort(() => Math.random() - 0.5);
    shuffled.forEach(ev => {
      const card = el("div", "tl-card", ev.date + " · " + ev.text);
      card.dataset.id = ev.id;
      card.onclick = () => addToSeq(body, ev, card);
      pool.appendChild(card);
    });
    body.appendChild(pool);
  }
  function addToSeq(body, ev, card) {
    if (tlSeq.find(x => x.id === ev.id)) return;
    tlSeq.push(ev); card.classList.add("used");
    const seq = body.querySelector("#tl-seq");
    seq.appendChild(el("div", "tl-item", ev.date + " · " + ev.text));
    if (tlSeq.length === GAME.timeline.events.length) checkTimeline(body);
  }
  function checkTimeline(body) {
    const ok = tlSeq.every((ev, i) => ev.id === GAME.timeline.correctOrder[i]);
    const seq = body.querySelector("#tl-seq");
    if (ok) {
      seq.innerHTML += `<div class="ok" style="color:var(--ok)">✓ 时间线正确。转折 = <b>${GAME.timeline.turningPoint}</b>（成绩在当晚被改）。<br>已证明：12.24 篡改夜 ≠ 06.17 最后在线 / 离校夜。</div>`;
      STATE.timelineDone = true;
      if (window.recordDiscovery) window.recordDiscovery("推理", "时间线重建", "证明两夜分离");
      if (window.revealFootage) window.revealFootage();
    } else {
      seq.innerHTML += `<div class="muted">顺序不对。再想想：公告在事件之后，追查在毕业前……</div>`;
      tlSeq = []; seq.innerHTML = ""; [...body.querySelectorAll(".tl-card")].forEach(c => c.classList.remove("used"));
    }
  }

  /* ============ 推理机制②+③：推理板 / 假设验证 + 元谜题提交 ============ */
  function renderBoard(body) {
    body.innerHTML = "";
    body.appendChild(h("🧩 推理板 · 假设验证"));
    if (STATE.level < 3) {
      body.appendChild(el("div", "muted", "🔒 推理板会暴露深层案情，需要 root 后再开启。先通过 admin 线索、地图监控和文件系统把证据收齐。"));
      return;
    }
    body.appendChild(el("div", "muted", "把你推出来的结论和支撑证据一起钉上去。系统不喂答案，也不提示哪题错——选完六组『结论 + 证据』，点『核对』，它只告诉你答对了几组。"));
    renderProofPrep(body);
    const sel = GAME.board.questions.map(() => ({ answer: -1, evidence: -1 }));
    const fb = el("div", "board-fb"); fb.id = "board-fb";
    GAME.board.questions.forEach((Q, qi) => {
      const block = el("div", "board-q");
      block.appendChild(el("div", "board-qtext", (qi + 1) + ". " + Q.q));
      const opts = el("div", "board-opts");
      Q.options.forEach((opt, oi) => {
        const b = el("button", "board-opt", opt);
        b.onclick = () => {
          if (STATE.boardDone) return;
          sel[qi].answer = oi;
          [...opts.children].forEach(x => x.classList.remove("sel"));
          b.classList.add("sel");
        };
        opts.appendChild(b);
      });
      block.appendChild(opts);
      if (Q.evidenceOptions && Q.evidenceOptions.length) {
        block.appendChild(el("div", "board-qtext board-evidence-title", "支撑证据"));
        const evOpts = el("div", "board-opts board-evidence-opts");
        Q.evidenceOptions.forEach((opt, oi) => {
          const b = el("button", "board-opt board-evidence", opt);
          b.onclick = () => {
            if (STATE.boardDone) return;
            sel[qi].evidence = oi;
            [...evOpts.children].forEach(x => x.classList.remove("sel"));
            b.classList.add("sel");
          };
          evOpts.appendChild(b);
        });
        block.appendChild(evOpts);
      }
      body.appendChild(block);
    });
    body.appendChild(fb);
    // 核对（不剧透式：只报答对题数，不指哪题错）
    const checkBtn = el("button", "btn-guest board-check", "核对（看钉对几组）");
    checkBtn.onclick = () => {
      if (STATE.boardDone) return;
      const missing = sel.some((s, i) => s.answer < 0 || ((GAME.board.questions[i].evidenceOptions || []).length && s.evidence < 0));
      if (missing) {
        fb.textContent = "每一题都要同时选择『结论』和『支撑证据』。";
        fb.style.color = "var(--warn)";
        return;
      }
      const correctCount = GAME.board.questions.reduce((n, Q, i) => {
        const answerOk = sel[i].answer === Q.answer;
        const evidenceOk = !Q.evidenceOptions || sel[i].evidence === Q.evidenceAnswer;
        return n + (answerOk && evidenceOk ? 1 : 0);
      }, 0);
      if (correctCount === GAME.board.questions.length) {
        STATE.boardDone = true;
        if (window.recordDiscovery) window.recordDiscovery("推理", "推理板", "六组证据链全对");
        fb.innerHTML = `<div class="ok" style="color:var(--ok)">✓ 六组证据链全对。侦探报告已解锁：/root/truth/board_report.txt</div>`;
        if (window.revealFootage) window.revealFootage();
        checkBtn.disabled = true;
        renderVerdict(body);
        renderContradictions(body);
      } else {
        const gap = currentGap();
        fb.textContent = `你钉对了 ${correctCount} / ${GAME.board.questions.length} 组证据链。系统不提示哪组错——回去交叉看证据，自己推翻自己。` +
          (gap ? " 当前最可能缺口：" + gap.chain.title + "；下一步：" + gap.hint : "");
        fb.style.color = "var(--warn)";
      }
    };
    body.appendChild(checkBtn);
    // 元谜题提交
    const meta = el("div", "board-meta");
    meta.appendChild(el("div", "muted", "集齐四处『印记』（官网 / 聊天 / 图片 / 地图）后，在此提交『守门人密语』："));
    const inp = document.createElement("input"); inp.className = "web-input"; inp.placeholder = "守门人密语（四印记 网→聊→图→地 连读）";
    const btn = el("button", "btn-guest", "提交");
    btn.onclick = () => {
      if (inp.value.trim() === GAME.metapuzzle.answer) {
        STATE.metaUnlocked = true;
        meta.innerHTML = `<div class="ok" style="color:var(--ok)">✓ 『${GAME.metapuzzle.answer}』——守门人真章已解锁：/root/truth/legacy.txt\n（真章里还有第二层：把『青岚不灭』当密钥，拼音 QINGLANBUMIE，去终端 decode vig 解开那串维吉尼亚密文。）</div>`;
        if (window.GHOST) GHOST.say("onMeta");
        if (window.revealFootage) window.revealFootage();
      } else {
        meta.innerHTML += `<div class="muted">不是这个。四印记按 网→聊→图→地 顺序读。</div>`;
      }
    };
    meta.appendChild(inp); meta.appendChild(btn);
    body.appendChild(meta);

    // 最终结论（六组证据链全对后才出现）
    if (STATE.boardDone) { checkBtn.disabled = true; renderVerdict(body); }
    // 矛盾指认（六组证据链全对后、最终结论之下才出现）
    if (STATE.boardDone) renderContradictions(body);
  }

  function renderVerdict(body) {
    const V = GAME.board.verdict;
    const wrap = el("div", "board-verdict");
    wrap.appendChild(el("div", "h", "⚖️ 最终结论"));
    wrap.appendChild(el("div", "muted", V.prompt));
    const sel = {};
    V.steps.forEach(step => {
      const block = el("div", "board-q");
      block.appendChild(el("div", "board-qtext", step.label));
      const opts = el("div", "board-opts");
      step.options.forEach((opt, oi) => {
        const b = el("button", "board-opt", opt);
        b.onclick = () => {
          sel[step.key] = oi;
          [...opts.children].forEach(x => x.classList.remove("sel"));
          b.classList.add("sel");
        };
        opts.appendChild(b);
      });
      block.appendChild(opts);
      wrap.appendChild(block);
    });
    const fb = el("div", "board-fb");
    const btn = el("button", "btn-guest board-submit", "定案");
    btn.onclick = () => {
      if (Object.keys(sel).length < V.steps.length) { fb.textContent = "三环都要填。"; fb.style.color = "var(--warn)"; return; }
      const r = judgeVerdict(sel);
      if (r === "hint") {
        fb.textContent = "✗ 这个组合站不住。回去交叉看证据：陈宇执行、王老师现场施压/包庇、源头在教务处，还是别的？";
        fb.style.color = "var(--warn)";
        return;
      }
      // 设结论 + 触发对应结局（不直接跳结局，由 ENDINGS 菜单去选，但给出引导）
      STATE.verdict = r;
      if (window.recordDiscovery) window.recordDiscovery("定案", "最终结论", r);
      if (r === "systemic") { if (window.GHOST) GHOST.say("onSystemic"); }
      else { if (window.GHOST) GHOST.say("onVerdict"); }
      if (window.revealFootage) window.revealFootage();
      fb.innerHTML = `<div class="ok" style="color:var(--ok)">✓ 已定案（${r}）。\n` +
        (r === "systemic" ? "你看见了整条链：陈宇执行，王老师现场施压/包庇，教务处是系统性源头。\n" :
         r === "surface"  ? "你把『幕后』归给了王老师个人——漏了总表：王浩九月就被垫高，源头在教务处。你只看到第一层。\n" :
         r === "wrong"    ? "你把罪名安在了苏黎自己头上——她才是追真相的人。你抓错了人。\n" : "") +
        `去 💬岚 / 结局 查看对应结局。</div>`;
      btn.disabled = true;
    };
    wrap.appendChild(btn); wrap.appendChild(fb);
    body.appendChild(wrap);
  }

  // 结论判定：三环组合 → 结局类型
  function judgeVerdict(sel) {
    const c = GAME.board.verdict.correct, s = GAME.board.verdict.surfaceIf, w = GAME.board.verdict.wrongIf;
    if (sel.exec === c.exec && sel.cover === c.cover && sel.master === c.master) return "systemic";
    if (sel.exec === w.exec) return "wrong";
    if (sel.master === s.master) return "surface";
    return "hint";
  }
  function setFb(fb, txt, ok) { fb.textContent = txt; fb.style.color = ok ? "var(--ok)" : "var(--warn)"; }

  /* ---------------- 矛盾指认：把证词指认给戳穿它的证据（Danganronpa 真相子弹 + Obra Dinn 言证 vs 物证） ---------------- */
  function renderContradictions(body) {
    const C = GAME.contradictions;
    const wrap = el("div", "board-contra");
    wrap.appendChild(el("div", "h", "🔫 矛盾指认"));
    wrap.appendChild(el("div", "muted", C.prompt.replace(/\n/g, " ")));
    if (STATE.contradictionDone) {
      wrap.appendChild(el("div", "ok", "✓ 三句证词全部被戳穿。谎言塌了，真相站住了。"));
      body.appendChild(wrap);
      return;
    }
    const sel = {};
    const fb = el("div", "board-fb");
    C.items.forEach((it, idx) => {
      const block = el("div", "board-q");
      block.appendChild(el("div", "board-qtext", (idx + 1) + ". 「" + it.speaker + "」：" + it.statement));
      const opts = el("div", "board-opts");
      it.options.forEach((opt, oi) => {
        const b = el("button", "board-opt", opt);
        b.onclick = () => {
          sel[it.id] = oi;
          [...opts.children].forEach(x => x.classList.remove("sel"));
          b.classList.add("sel");
        };
        opts.appendChild(b);
      });
      block.appendChild(opts);
      wrap.appendChild(block);
    });
    const btn = el("button", "btn-guest board-submit", "对质核对");
    btn.onclick = () => {
      if (C.items.some(it => sel[it.id] == null)) {
        fb.textContent = "三句证词都要先选一条能戳穿它的记录。";
        fb.style.color = "var(--warn)";
        return;
      }
      const broken = C.items.reduce((n, it) => n + (sel[it.id] === it.answer ? 1 : 0), 0);
      if (broken === C.items.length) {
        STATE.contradictionDone = true;
        STATE.contradictionsBroken = {};
        C.items.forEach(it => { STATE.contradictionsBroken[it.id] = true; });
        if (window.recordDiscovery) window.recordDiscovery("对质", "矛盾指认", "三句证词全部击穿");
        if (window.GHOST) GHOST.say("onContra");
        if (window.revealFootage) window.revealFootage();
        fb.innerHTML = "<div class='ok'>✓ 三句全部戳穿。谎言塌了，真相站住了。</div>" +
          C.items.map(it => "<div class='contra-explain'>" + esc(it.explain) + "</div>").join("");
        fb.style.color = "var(--ok)";
        btn.disabled = true;
        wrap.querySelectorAll(".board-opt").forEach(b => b.disabled = true);
      } else {
        fb.textContent = "你击穿了 " + broken + " / " + C.items.length + " 句。系统不指出哪句错——回去比对证词、日志和聊天记录。";
        fb.style.color = "var(--warn)";
      }
    };
    wrap.appendChild(btn);
    wrap.appendChild(fb);
    body.appendChild(wrap);
  }

  /* ---------------- 线索笔记本（Blue Prince / Obra Dinn ledger：聚合所有发现的碎片，方便交叉比对） ---------------- */
  function catClass(cat) { return ({ "物证": "wu", "言证": "yan", "系统记录": "sys", "元叙事": "meta" })[cat] || "sys"; }
  function clueUnlocked(c) {
    const u = c.unlock || {};
    if (u.file)    return !!(STATE.readFiles && STATE.readFiles.has(u.file));
    if (u.level != null) return STATE.level >= u.level;
    if (u.meta)    return !!STATE.metaUnlocked;
    if (u.verdict) return !!STATE.verdict;
    if (u.contra)  return !!STATE.contradictionDone;
    if (u.timeline) return !!STATE.timelineDone;
    if (u.deep)    return !!STATE.deepUnlocked;
    if (u.web)     return !!(STATE.webSeen && STATE.webSeen.has(u.web));
    return false;
  }
  function clueMap() {
    const map = {};
    (GAME.clues || []).forEach(c => { map[c.id] = c; });
    return map;
  }
  function logicStatus(chain, map) {
    const missing = [];
    (chain.requires || []).forEach(id => {
      const c = map[id];
      if (!c || !clueUnlocked(c)) missing.push(c || { id, title: id, hint: "继续探索相关线索" });
    });
    (chain.flags || []).forEach(flag => {
      if (!STATE[flag]) missing.push({
        id: flag,
        title: flag === "deepUnlocked" ? "第二层自白" : flag === "contradictionDone" ? "矛盾指认" : flag,
        hint: flag === "deepUnlocked" ? "解开 legacy.txt 的中文维吉尼亚密文" : flag === "contradictionDone" ? "在 🧩推理板 完成三句矛盾指认" : "继续推进"
      });
    });
    return { done: missing.length === 0, missing };
  }
  function currentGap() {
    const map = clueMap();
    const chains = GAME.logicChains || [];
    for (const ch of chains) {
      const st = logicStatus(ch, map);
      if (!st.done) {
        const first = st.missing[0] || {};
        return { chain: ch, missing: st.missing, hint: first.hint || "继续补齐相关证据" };
      }
    }
    return null;
  }
  function provenChainTitles() {
    const map = clueMap();
    return (GAME.logicChains || []).filter(ch => logicStatus(ch, map).done).map(ch => ch.title);
  }
  function renderProofPrep(body) {
    const chains = GAME.logicChains || [];
    if (!chains.length) return;
    const map = clueMap();
    const proven = chains.filter(ch => logicStatus(ch, map).done).length;
    const wrap = el("div", "proof-prep");
    wrap.appendChild(el("div", "proof-head", "证明准备度 " + proven + " / " + chains.length));
    chains.forEach(ch => {
      const st = logicStatus(ch, map);
      const row = el("div", "proof-row" + (st.done ? " proof-done" : ""));
      row.innerHTML = `<span>${st.done ? "✓" : "○"}</span><b>${esc(ch.title)}</b><small>${st.done ? "已可证明" : "还缺证"}</small>`;
      wrap.appendChild(row);
    });
    body.appendChild(wrap);
  }
  function renderLogicChains(body, clues) {
    const chains = GAME.logicChains || [];
    if (!chains.length) return;
    if (STATE.level < 3) {
      body.appendChild(el("div", "logic-chain muted", "🧭 案情逻辑链会在 root 后展开。现在先把材料收进笔记本，别让深层标题提前污染你的判断。"));
      return;
    }
    const map = clueMap();
    const wrap = el("div", "logic-chain");
    wrap.appendChild(el("div", "h", "🧭 案情逻辑链"));
    wrap.appendChild(el("div", "muted", "这里不是答案页，而是证明进度：每条推论都要由多份线索互相支撑。未证明时只显示缺口，不剧透结论。"));
    chains.forEach(ch => {
      const st = logicStatus(ch, map);
      const card = el("div", "logic-card" + (st.done ? " logic-done" : ""));
      card.appendChild(el("div", "logic-title", (st.done ? "✓ " : "○ ") + ch.title));
      card.appendChild(el("div", "logic-question", ch.question));
      if (st.done) {
        card.appendChild(el("div", "logic-proof", ch.proof));
        card.appendChild(el("div", "logic-matter", ch.whyItMatters));
      } else {
        const miss = el("div", "logic-missing");
        miss.appendChild(el("div", "muted", "还缺："));
        st.missing.forEach(m => miss.appendChild(el("div", "logic-miss-item", (m.title || m.id) + " — " + (m.hint || "继续探索"))));
        card.appendChild(miss);
      }
      wrap.appendChild(card);
    });
    body.appendChild(wrap);
  }
  function renderPeopleDossier(body) {
    const people = GAME.people || [];
    if (!people.length) return;
    const map = clueMap();
    const wrap = el("div", "people-dossier");
    wrap.appendChild(el("div", "h", "👥 人物档案"));
    wrap.appendChild(el("div", "muted", "人物档案只整理已到权限层的信息；它记录矛盾行为，不替你判罪。"));
    people.forEach(p => {
      const known = STATE.level >= (p.level || 0);
      const card = el("div", "person-card" + (known ? "" : " ledger-locked"));
      if (!known) {
        card.appendChild(el("div", "ledger-title", "未识别人物"));
        card.appendChild(el("div", "ledger-sum muted", "继续提升权限并阅读相关材料。"));
      } else {
        card.appendChild(el("div", "ledger-title", p.name));
        card.appendChild(el("div", "ledger-src muted", p.role));
        card.appendChild(el("div", "ledger-sum", p.public));
        if (STATE.level >= 3 && p.deeper) card.appendChild(el("div", "person-deeper", p.deeper));
        const related = (p.relatedClues || []).map(id => map[id]).filter(Boolean);
        if (related.length) {
          const rel = related.filter(clueUnlocked).map(c => "✓ " + c.title);
          card.appendChild(el("div", "person-related muted", rel.length ? rel.join("<br>") : "相关证据尚未收进笔记本。"));
        }
      }
      wrap.appendChild(card);
    });
    body.appendChild(wrap);
  }
  function renderDiscoveryLog(body) {
    const log = STATE.discoveryLog || [];
    const wrap = el("div", "discovery-log");
    wrap.appendChild(el("div", "h", "🕯 发现历史"));
    if (!log.length) {
      wrap.appendChild(el("div", "muted", "还没有记录。读文件、访问官网页面、查看地点或解锁影像后，这里会留下回看线索。"));
      body.appendChild(wrap);
      return;
    }
    log.slice(0, 12).forEach(x => {
      wrap.appendChild(el("div", "discovery-item", `<b>${esc(x.kind)}</b> ${esc(x.title)} <span>${esc(x.at)}</span><br><small>${esc(x.detail)}</small>`));
    });
    body.appendChild(wrap);
  }
  function renderLedger(body) {
    body.innerHTML = "";
    body.appendChild(h("📓 线索笔记本"));
    body.appendChild(el("div", "muted", "你读到的、看到的、对质过的，都收在这里——像侦探的笔记本。系统不替你下结论，但帮你把碎片聚到一起，方便交叉比对（参考 Blue Prince / Obra Dinn 的『游戏内线索本』）。"));
    if (window.GHOST) GHOST.say("onLedger");
    const clues = GAME.clues || [];
    const got = clues.filter(clueUnlocked);
    body.appendChild(el("div", "muted", `已掌握 ${got.length} / 共 ${clues.length} 条线索`));
    renderLogicChains(body, clues);
    const grid = el("div", "ledger-grid");
    clues.forEach(c => {
      const ok = clueUnlocked(c);
      const card = el("div", "ledger-card" + (ok ? "" : " ledger-locked"));
      if (ok) {
        card.appendChild(el("div", "ledger-cat cat-" + catClass(c.cat), c.cat));
        card.appendChild(el("div", "ledger-title", c.title));
        card.appendChild(el("div", "ledger-src muted", "来源：" + c.src));
        card.appendChild(el("div", "ledger-sum", c.summary));
        if (c.tags && c.tags.length) card.appendChild(el("div", "ledger-tags", c.tags.map(t => "<span>" + esc(t) + "</span>").join("")));
      } else {
        card.appendChild(el("div", "ledger-cat cat-locked", "❓ 未解锁"));
        card.appendChild(el("div", "ledger-title", "？？？（还差一步）"));
        card.appendChild(el("div", "ledger-sum muted", c.hint || ("去「" + c.src + "」找")));
      }
      grid.appendChild(card);
    });
    body.appendChild(grid);
    renderPeopleDossier(body);
    renderDiscoveryLog(body);
    // 矛盾指认进度
    const C = GAME.contradictions;
    if (C) {
      const cb = el("div", "ledger-contra");
      cb.appendChild(el("div", "h", "🔫 矛盾指认进度"));
      C.items.forEach(it => {
        cb.appendChild(el("div", "ledger-pair", (STATE.contradictionDone ? "✓ " : "○ ") + "「" + it.speaker + "」：" + it.statement));
      });
      cb.appendChild(el("div", "muted", STATE.contradictionDone ? "三句全破。" : "去 🧩推理板 做完『矛盾指认』。"));
      body.appendChild(cb);
    }
  }

  /* ---------------- 幽灵：岚（v9 智能升级：上下文感知 + 双向对话 + 进度路由） ----------------
     玩家可在岚窗口输入框或终端 talk 直接问她；她按真实进度路由回应，而非播罐头话。 */
  const GHOST = {
    log: [],            // 元素：{who:"lan", text} 或 {who:"you", text}
    said: new Set(),    // 事件广播去重（onLore/onWrongRoot 除外）
    /* 玩家当前进度的快照，喂给所有上下文相关台词与对话 */
    ctx() {
      const S = STATE, has = p => !!(S.readFiles && S.readFiles.has(p));
      return {
        level: S.level || 0,
        readAuth: has("/var/log/auth.log"),
        readJiaowu: has("/var/log/jiaowu_op.log"),
        readEvidence: has("/root/truth/evidence.txt"),
        readWitness: has("/root/truth/witness.md"),
        readExport: has("/home/suli/export_scores.csv"),
        readWall: has("/home/admin/score_wall_archive.txt"),
        readDiary3: has("/home/suli/diary_3.txt"),
        readNote2: has("/home/admin/notes2.txt"),
        readMeta: has("/root/truth/legacy.txt"),
        meta: !!S.metaUnlocked, deep: !!S.deepUnlocked, contra: !!S.contradictionDone,
        verdict: S.verdict || null, lore: S.lore ? S.lore.size : 0
      };
    },
    /* 事件广播：支持 string / 数组(随机) / function(ctx) */
    say(stage) {
      const entry = GAME.ghost[stage];
      if (!entry) return;
      let line = entry;
      if (typeof entry === "function") line = entry(this.ctx());
      else if (Array.isArray(entry)) line = entry[Math.floor(Math.random() * entry.length)];
      if (typeof line !== "string") return;
      if (stage !== "onLore" && stage !== "onWrongRoot") {
        const key = stage + "|" + line.slice(0, 16);
        if (this.said.has(key)) return;
        this.said.add(key);
      }
      this.log.push({ who: "lan", text: line });
      const w = document.getElementById("win-chat");
      if (w) this.render(w.querySelector(".win-body"));
      else UI.openApp("chat");
    },
    /* 进度感知「下一步」指路：找出玩家最近一个未探索的关键缺口 */
    nudgeReply(c) {
      if (c.level < 1)
        return "你还是访客。破开苏黎相册里那张带 base64 的相片——decode b64 那串字符，就是她的账号口令。";
      if (c.level >= 1 && !c.readExport)
        return "先别急着找凶手。用 suli 账号读 /home/suli/score_note.txt 和 /home/suli/export_scores.csv，把『公示版』和『导出表』的差异圈出来。";
      if (c.level < 2)
        return "升到管理员：admin 口令藏在加密便签里（倒序 + hex 推导）。然后读 /home/admin/notes2.txt——王浩是王老师之子。";
      if (c.level >= 2 && !c.readWall)
        return "管理员层还有公示墙缓存：读 /home/admin/score_wall_archive.txt；再去官网搜『撤回』或『修订』，看公告版本怎么变过。";
      if (c.level < 3)
        return "root 的钥匙碎成三片（/trash、邮件草稿、BBS 管理板），每片解码拼起来。年份是苏黎『最后在线』那年，不是出事那年。";
      if (!c.readJiaowu)
        return "你看过 auth.log 里王浩 12.24 在馆内——现在缺一条更早日期的系统记录。root 下读 /var/log/jiaowu_op.log，把两个日期放在一起比。";
      const gap = currentGap();
      if (gap) {
        const proven = provenChainTitles();
        return "你已经证明了：" + (proven.length ? proven.join("、") : "还没有完整闭合的案情链") +
          "。\n现在缺：" + gap.chain.title + "。\n下一步：" + gap.hint + "。";
      }
      return "线索你基本都拿到了。现在站在 /root/truth，决定怎么收场：交出去、让它睡着，还是成为守门人。";
    },
    /* 对话路由：玩家问一句话，岚挑最贴切的回应 */
    respond(input) {
      const text = (input || "").toLowerCase();
      const D = GAME.ghostDialog || [];
      for (const h of D) {
        const hit = (h.test instanceof RegExp) ? h.test.test(text)
                  : (Array.isArray(h.test) ? h.test.some(t => text.includes(t)) : false);
        if (!hit) continue;
        const out = typeof h.reply === "function" ? h.reply(this.ctx()) : h.reply;
        const arr = Array.isArray(out) ? out : [out];
        if (arr.length) return arr[Math.floor(Math.random() * arr.length)];
      }
      if (/下一步|怎么走|卡住|接下来|线索|提示|怎么办|该去|哪里|还差|收场/.test(text))
        return this.nudgeReply(this.ctx());
      const fb = [
        "你这句话我接不住。但我能帮你查线索——试试问我：『陈宇是谁？』『王浩是谁？』『下一步怎么走？』『教务处怎么回事？』",
        "我没听清。问具体的吧：某个人（陈宇／王浩／李老师），或者『下一步怎么走』。"
      ];
      return fb[Math.floor(Math.random() * fb.length)];
    },
    /* 玩家发一句话：记入双向日志并回显 */
    ask(input) {
      const v = (input || "").trim();
      if (!v) return;
      this.log.push({ who: "you", text: v });
      this.log.push({ who: "lan", text: this.respond(v) });
      const w = document.getElementById("win-chat");
      if (w) this.render(w.querySelector(".win-body"));
      else UI.openApp("chat");
    },
    render(body) {
      body.innerHTML = "";
      body.appendChild(h("👁 岚"));
      body.appendChild(el("div", "muted", "苏黎留在系统里的最后一缕回声。直接问她——陈宇、王浩、教务处，或『下一步怎么走』。"));
      const log = el("div", "ghost-log");
      this.log.forEach(e => {
        if (e.who === "you") {
          const y = el("div", "ghost-you"); y.textContent = "你：" + e.text;
          log.appendChild(y);
        } else {
          const b = el("div", "ghost-lan"); b.textContent = e.text;
          log.appendChild(b);
        }
      });
      body.appendChild(log);
      const bar = el("div", "ghost-input");
      const inp = document.createElement("input");
      inp.className = "web-input";
      inp.placeholder = "问岚点什么…（例：下一步怎么走？/ 王浩是谁？）";
      const btn = el("button", "btn-guest", "说");
      const send = () => { const v = inp.value.trim(); if (!v) return; inp.value = ""; this.ask(v); };
      btn.onclick = send;
      inp.onkeydown = e => { if (e.key === "Enter") send(); };
      bar.appendChild(inp); bar.appendChild(btn);
      body.appendChild(bar);
    }
  };

  /* ---------------- 结局 ---------------- */
  const ENDINGS = {
    menu() {
      const { win, body } = UI.createWindow("📜 结局", "ending");
      body.innerHTML = "";
      body.appendChild(el("div", "h", "你站在了苏黎站过的位置。"));
      body.appendChild(el("div", "th-body", "真相在 /root/truth。现在，由你决定。"));
      const choice = el("div", "choice");
      choice.appendChild(endBtn("📤 把证据交出去", () => this.finish("report", body)));
      choice.appendChild(endBtn("🌙 让它继续睡着", () => this.finish("silence", body)));
      if (STATE.lore.size >= GAME.meta.loreTotal)
        choice.appendChild(endBtn("🔑 成为守门人", () => this.finish("keeper", body)));
      if (STATE.metaUnlocked)
        choice.appendChild(endBtn("🔥 真·守门人（青岚不灭）", () => this.finish("keeper_true", body)));
      // v6 结论分支结局
      if (STATE.verdict === "systemic")
        choice.appendChild(endBtn("⛓️ 系统性真相", () => this.finish("systemic", body)));
      if (STATE.verdict === "surface")
        choice.appendChild(endBtn("🪜 你只看到了第一层", () => this.finish("surface", body)));
      if (STATE.verdict === "wrong")
        choice.appendChild(endBtn("💢 你抓错了人", () => this.finish("wrong", body)));
      if (STATE.deepUnlocked && STATE.contradictionDone)
        choice.appendChild(endBtn("🌌 真相之下（终极）", () => this.finish("deep", body)));
      else if (STATE.deepUnlocked)
        choice.appendChild(endBtn("🌌 真相之下（还差矛盾指认）", () => this.finish("deep_locked", body)));
      body.appendChild(choice);
      GHOST.say("done");
    },
    finish(kind, body) {
      const e = GAME.endings[kind];
      body.innerHTML = `<h2 style="color:var(--accent)">${esc(e.title)}</h2><p class="th-body">${esc(e.body).replace(/\n/g, "<br>")}</p>` +
        `<hr><div class="muted" style="font-size:12px">—— 感谢游玩。重开页面可再来一次，试试不同的选择。</div>`;
    },
    lockout() {
      const { win, body } = UI.createWindow("🔒 系统锁定", "ending");
      const e = GAME.endings.lockout;
      body.innerHTML = `<h2 style="color:var(--warn)">${esc(e.title)}</h2><p class="th-body">${esc(e.body).replace(/\n/g, "<br>")}</p>`;
      STATE.ended = true;
    }
  };
  function endBtn(label, fn) {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = fn;
    return b;
  }

  function h(t) { return el("div", "h", t); }
  function el(t, c, html) { const e = document.createElement(t); if (c) e.className = c; if (html != null) e.innerHTML = html; return e; }
  function mailCard(from, sub, bodytext) {
    const c = el("div", "mail");
    c.innerHTML = `<div class="m-from">${esc(from)}</div><div class="m-sub">${esc(sub)}</div><div class="th-body" style="margin-top:6px">${esc(bodytext)}</div>`;
    return c;
  }

  return {
    render: { bbs: renderBBS, mail: renderMail, photos: renderPhotos, footage: renderFootage, web: renderWeb, im: renderIM, map: renderMap, timeline: renderTimeline, board: renderBoard, ledger: renderLedger },
    GHOST, ENDINGS
  };
})();
