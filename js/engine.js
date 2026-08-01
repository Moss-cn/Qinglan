/* 主引擎：开机 / 终端 / 窗口管理 / 全局接线 */
window.STATE = { user: "guest", level: 0, cwd: "/home/guest", lore: new Set(), rootFails: 0, ended: false, objective: "",
  metaUnlocked: false, boardDone: false, timelineDone: false,
  verdict: null, deepUnlocked: false, contradictionDone: false,
  readFiles: new Set(), webSeen: new Set(), seenFootage: new Set(), contradictionsBroken: {}, discoveryLog: [] };

window.UI = (function () {
  let z = 10;
  function print(html, cls) {
    const out = document.getElementById("term-out");
    const d = document.createElement("div");
    d.className = "term-line" + (cls ? " " + cls : "");
    d.innerHTML = html == null ? "" : html;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
  }
  function clearTerm() { document.getElementById("term-out").innerHTML = ""; }

  function openApp(name) {
    if (name === "chat") {
      const { body } = createWindow("👁 岚", "chat");
      APPS.GHOST.render(body);
      return;
    }
    if (APPS.render[name]) {
      const { body } = createWindow(appTitle(name), "app-" + name);
      APPS.render[name](body);
      return;
    }
  }
  function appTitle(n) { return {
    bbs: "💬 论坛", mail: "✉️ 邮件", photos: "🖼️ 相册", footage: "🎬 影像",
    web: "🌐 官网", im: "💬 青岚聊", map: "🗺️ 地图", timeline: "🕒 时间线", board: "🧩 推理板", ledger: "📓 线索笔记本"
  }[n] || n; }

  function createWindow(title, id) {
    const exist = document.getElementById("win-" + id);
    if (exist) { focus(exist); return { win: exist, body: exist.querySelector(".win-body") }; }
    const win = document.createElement("div");
    win.className = "win focus"; win.id = "win-" + id;
    win.style.left = (80 + z * 12) + "px";
    win.style.top = (40 + z * 10) + "px";
    win.style.width = "min(620px, 92vw)";
    const bar = document.createElement("div");
    bar.className = "win-bar";
    bar.innerHTML = `<div class="wdot"></div><div class="wtitle">${title}</div><button class="wclose">✕</button>`;
    const body = document.createElement("div");
    body.className = "win-body";
    bar.querySelector(".wclose").onclick = () => { win.remove(); };
    bar.onmousedown = e => drag(win, e);
    win.appendChild(bar); win.appendChild(body);
    document.getElementById("windows").appendChild(win);
    focus(win);
    clampWin(win);
    return { win, body };
  }
  function focus(win) { win.style.zIndex = ++z; document.querySelectorAll(".win").forEach(w => w.classList.remove("focus")); win.classList.add("focus"); }
  /* 把窗口约束在容器内：无论窗口多大，标题栏(含关闭按钮)始终至少露出 GRAB 像素可抓取，
     从根本上防止整窗漂出视口导致无法关闭/移动 */
  const GRAB = 64, BAR = 36;
  function clampWin(win) {
    const area = win.parentElement;
    if (!area) return;
    const aw = area.clientWidth, ah = area.clientHeight;
    const ww = win.offsetWidth || 320;
    let minL = -(ww - GRAB), maxL = aw - GRAB;   // 左右各至少露 GRAB 宽
    if (minL > maxL) { const m = (minL + maxL) / 2; minL = maxL = m; }
    let minT = 0, maxT = ah - BAR;               // 标题栏始终在容器内竖向可见
    if (minT > maxT) minT = maxT = 0;
    let l = win.offsetLeft, t = win.offsetTop;
    if (l < minL) l = minL; else if (l > maxL) l = maxL;
    if (t < minT) t = minT; else if (t > maxT) t = maxT;
    win.style.left = l + "px"; win.style.top = t + "px";
  }
  function drag(win, e) {
    if (e.target.classList.contains("wclose")) return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY, ox = win.offsetLeft, oy = win.offsetTop;
    const mv = ev => {
      win.style.left = ox + ev.clientX - sx + "px";
      win.style.top = oy + ev.clientY - sy + "px";
      clampWin(win);
    };
    const up = () => {
      document.removeEventListener("mousemove", mv);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("mouseleave", up);
    };
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
    document.addEventListener("mouseleave", up);   // 指针移出文档也立即结束拖拽，避免“粘住跟随”
  }
  /* 视口变化时把屏外窗口拉回，防止浏览器缩放把窗口甩出 */
  window.addEventListener("resize", () => document.querySelectorAll(".win").forEach(clampWin));

  /* 居中弹窗（使用说明 / 提示） */
  function modal(opts) {
    const back = document.createElement("div");
    back.className = "modal-back";
    const card = document.createElement("div");
    card.className = "modal-card";
    const title = document.createElement("div");
    title.className = "modal-title";
    title.textContent = opts.title || "";
    const bodyEl = document.createElement("div");
    bodyEl.className = "modal-body";
    bodyEl.innerHTML = opts.body || "";
    const actions = document.createElement("div");
    actions.className = "modal-actions";
    (opts.actions || [{ label: "知道了", primary: true }]).forEach(a => {
      const b = document.createElement("button");
      b.className = "btn-" + (a.primary ? "primary" : "ghost");
      b.textContent = a.label;
      b.onclick = () => { if (a.onClick) a.onClick(); if (a.close !== false) back.remove(); };
      actions.appendChild(b);
    });
    card.appendChild(title); card.appendChild(bodyEl); card.appendChild(actions);
    back.appendChild(card);
    back.onclick = e => { if (e.target === back) back.remove(); };
    document.getElementById("main").appendChild(back);
    return back;
  }
  return { print, clearTerm, openApp, createWindow, modal };
})();

window.ENGINE = (function () {
  const BOOT = [
    "> CampusOS v2.3 离线镜像",
    "> 校验本地数据完整性 ... OK",
    "> 挂载公开分区 / ........ OK",
    "> 受限分区 /home /var /trash /root 已加密 [需密钥]",
    "> 连接完成。欢迎回来。"
  ];
  function boot() {
    const log = document.getElementById("boot-log");
    let i = 0;
    const tick = () => {
      if (i < BOOT.length) { log.textContent += BOOT[i] + "\n"; i++; setTimeout(tick, 300); }
      else document.getElementById("boot-enter").hidden = false;
    };
    tick();
  }
  function bootEnter() {
    document.getElementById("boot").hidden = true;
    document.getElementById("main").hidden = false;
    STATE.objective = GAME.objectives[STATE.level] || "";
    if (window.markSeenFootage) window.markSeenFootage(); // 预标记开机时已可见的影像，避免开场弹窗刷屏
    UI.print("已接入 <span class='dir'>青岚校园网离线镜像</span>（CampusOS v2.3）。", "ok");
    UI.print("下面是一份使用说明——随时可点顶部 <span class='dir'>？帮助</span> 重看。");
    UI.print("随时输入 <span class='dir'>objective</span> 查看你当前阶段的目标，以及该去访问哪些文件 / 界面。");
    updatePrompt();
    document.getElementById("term-in").focus();
    showHelp();
  }

  const HELP_HTML =
    "<p>你闯入了一所已停办中学的<b>校园网离线镜像</b>。这里曾有个学生叫 <b>苏黎</b>，她留下了一些不该被忘掉的东西。你的目标：探索这个系统，拼出她留下的真相。</p>" +
    "<h4>① 终端（下方黑底窗口）—— 与系统对话</h4>" +
    "<p>在输入框敲命令、回车执行。先试试 <code>help</code> 看全部命令。最常见几招：</p>" +
    "<ul>" +
    "<li><code>login guest</code> 以访客进入（免口令），先 <code>cat notice.txt</code> 找第一条线索</li>" +
    "<li><code>ls</code> / <code>cd &lt;目录&gt;</code> / <code>cat &lt;文件&gt;</code> 浏览文件系统</li>" +
    "<li><code>decode b64|hex|rot13|vig &lt;密钥&gt; &lt;文本&gt;</code> 解密密文</li>" +
    "<li><code>grep &lt;词&gt;</code> 在全盘搜关键词</li>" +
    "<li><code>open bbs|mail|photos|chat|footage</code> 打开图形界面（等价于点顶部按钮）</li>" +
    "<li><code>talk [问题]</code> 与残响「岚」对话——可直接问她：下一步怎么走？/ 王浩是谁？/ 教务处怎么回事？</li>" +
    "</ul>" +
    "<h4>② 顶部按钮 —— 图形界面</h4>" +
    "<p>💬 论坛 / ✉️ 邮件 / 🖼️ 相册 / 🎬 影像 / 👁 岚，点一下就开对应窗口，和终端读的是<b>同一套数据</b>。相册里每张照片都能「解码 EXIF」，线索常藏在那儿；🎬 影像 里是 AI 生成的苏黎与各角色片段——<b>解到某一处，对应影像会自己弹出来播放</b>，没解到的会显示解锁条件。</p>" +
    "<p><b>多层悬疑：</b>这不是单纯找一个密码或一个嫌疑人。你会看到公示成绩、导出表、聊天残影、登录日志彼此对不上；真正要做的是分清事实、证词和推论，尤其别把不同日期的事件混成一晚。</p>" +
    "<p><b>游戏内套娃：</b>🌐 官网（带站内搜索的伪校园门户，内部教务系统需登录，root 可见「教务处通告」）、💬 青岚聊（带加密消息的伪聊天 App，高权限会浮现匿名证人身份反转）、🗺️ 地图（点地点看监控日志）、🕒 时间线（root 后排出 <b>12 件事</b> 顺序找转折）、🧩 推理板（root 后六组证据链假设验证 + 提交守门人密语 + <b>最终结论</b>分支）。它们<b>本身就是解谜入口</b>，且互相牵引——官网、聊天、相册、地图各藏一枚「印记」，集齐拼成『青岚不灭』。</p>" +
    "<p><b>元谜题有两层：</b>① 四印记拼成『青岚不灭』，解锁守门人真章 legacy.txt；② 真章里还有一段维吉尼亚密文，密钥＝『青岚不灭』拼音 QINGLANBUMIE，在终端 <code>decode vig QINGLANBUMIE &lt;那串&gt;</code> 解开，是苏黎真正的自白。</p>" +
    "<p><b>最终结论决定结局：</b>推理板六组证据链全对后，出现「执行 / 现场包庇 / 幕后」三连结论。不同结论通向不同结局；推理不只是收集，更在于你能否证明自己的判断。</p>" +
    "<p><b>更丰富的调查：</b>📓线索笔记本会整理线索标签、人物档案、地点关联和发现历史；🌐官网可以搜『撤回 / 修订 / 处分』挖到公告版本差异。</p>" +
    "<h4>③ 切换身份 —— 权限即进度</h4>" +
    "<p>不同账号能看到不同内容：访客只看公开区；拿到更高权限（学生 / 管理员 / root）才能解锁隐藏目录与最终结局。线索会告诉你每个账号的口令藏在哪。</p>" +
    "<h4>④ 别只看命令</h4>" +
    "<p>关键线索常在照片的 EXIF、被删掉的文件、以及那个会突然说话的「岚」里。集齐 4 块 lore 碎片有隐藏结局。</p>" +
    "<p class='muted'>建议起手：<code>login guest</code> → <code>cat notice.txt</code> → <code>open photos</code> 看第一张有 base64 的相片。</p>";

  function showHelp() {
    UI.modal({
      title: "青岚校园网 · 使用说明",
      body: HELP_HTML,
      actions: [
        { label: "查看命令列表", primary: true, onClick: () => { const i = document.getElementById("term-in"); i.focus(); TERM.run("help"); } },
        { label: "开始探索", onClick: () => document.getElementById("term-in").focus() }
      ]
    });
  }

  function updatePrompt() {
    document.getElementById("term-prompt").textContent = STATE.user + "@qinglan:" + STATE.cwd + "$";
  }

  function init() {
    // 暴露 GAOST / ENDINGS 供 terminal 调用
    window.GHOST = APPS.GHOST;
    window.ENDINGS = APPS.ENDINGS;
    boot();

    // 顶栏按钮
    document.querySelectorAll(".tb-app").forEach(b => b.onclick = () => UI.openApp(b.dataset.app));

    // 终端输入
    const input = document.getElementById("term-in");
    const history = []; let hi = -1;
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const v = input.value;
        if (v.trim()) { history.push(v); hi = history.length; }
        UI.print(`<span class="term-prompt">${STATE.user}@qinglan:${STATE.cwd}$</span> ${escapeHtml(v)}`);
        TERM.run(v);
        input.value = "";
        updatePrompt();
      } else if (e.key === "ArrowUp") {
        if (hi > 0) { hi--; input.value = history[hi]; e.preventDefault(); }
      } else if (e.key === "ArrowDown") {
        if (hi < history.length - 1) { hi++; input.value = history[hi]; }
        else { hi = history.length; input.value = ""; }
      }
    });

    // 点击终端区聚焦输入
    document.getElementById("terminal").addEventListener("click", () => input.focus());
  }
  function escapeHtml(s) { return (s || "").replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m])); }

  // 全局：收集 lore 碎片（终端 cat 与论坛点击共用）
  window.collectLore = function (n) {
    if (STATE.lore.has(n)) return;
    STATE.lore.add(n);
    UI.print("★ 收集到 lore 碎片 " + n + "/" + GAME.meta.loreTotal, "ok");
    if (window.GHOST) GHOST.say("onLore");
    if (window.revealFootage) window.revealFootage();
    if (STATE.lore.size >= GAME.meta.loreTotal) {
      const marks = GAME.meta.loreMarks || {};
      const phrase = [1, 2, 3, 4].map(k => marks[k] || "?").join("");
      UI.print("四块碎片已集齐——隐藏结局已解锁。", "ok");
      UI.print("四字真言（按碎片 1→4 的印记）：<span class='dir'>" + phrase + "</span> —— 守门人密语。", "ok");
    }
  };
  window.recordDiscovery = function (kind, title, detail) {
    STATE.discoveryLog = STATE.discoveryLog || [];
    const key = [kind, title, detail || ""].join("|");
    if (STATE.discoveryLog.some(x => x.key === key)) return;
    STATE.discoveryLog.unshift({
      key,
      kind,
      title,
      detail: detail || "",
      at: STATE.user + " / level " + STATE.level
    });
    if (STATE.discoveryLog.length > 40) STATE.discoveryLog.length = 40;
  };

  document.addEventListener("DOMContentLoaded", init);
  return { bootEnter, init, showHelp };
})();
