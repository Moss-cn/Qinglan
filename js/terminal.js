/* 终端：命令解析与执行。依赖 window.STATE / UI / GHOST / FS / CRYPTO / GAME */
window.TERM = (function () {
  const esc = s => (s || "").replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));

  function run(raw) {
    const line = (raw || "").trim();
    if (!line) return;
    const tokens = line.split(/\s+/);
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);
    try {
      switch (cmd) {
        case "help":    return cmdHelp();
        case "login":
        case "su":      return cmdLogin(args);
        case "logout":  return cmdLogout();
        case "whoami":  return UI.print("当前身份：" + STATE.user + " （level " + STATE.level + "）");
        case "pwd":     return UI.print(STATE.cwd);
        case "ls":      return cmdLs(args);
        case "cd":      return cmdCd(args);
        case "cat":     return cmdCat(args);
        case "grep":    return cmdGrep(args);
        case "decode":  return cmdDecode(args);
      case "encode":  return cmdEncode(args);
      case "open":    return cmdOpen(args);
      case "submit":  return cmdSubmit(args);
      case "conclude":
      case "accuse":  return ENDINGS.menu();
      case "objective": return cmdObjective();
      case "talk": {
        const t = args.join(" ").trim();
        if (!t) { GHOST.say("greet"); UI.openApp("chat"); return; }
        if (window.GHOST) GHOST.ask(t); else UI.openApp("chat");
        return;
      }
        case "hint":    return cmdHint();
        case "clear":   return UI.clearTerm();
        case "echo":    return UI.print(esc(args.join(" ")));
        default:        return UI.print("未知命令：" + esc(cmd) + "  （输入 help 查看）", "err");
      }
    } catch (e) {
      UI.print("命令执行出错：" + esc(e.message), "err");
    }
  }

  function cmdHelp() {
    UI.print(
      "════ 青岚校园网 · 命令手册 ════\n" +
      "【身份】\n" +
      "  login <用户> [口令]   切换账号（guest 免口令；拿到更高权限解锁更多内容）\n" +
      "  logout / whoami / pwd\n" +
      "【文件系统】\n" +
      "  ls [-a] [路径]        列目录（-a 显示隐藏文件，如 .secrets）\n" +
      "  cd <路径>             切换目录（~ 表示你的主目录）\n" +
      "  cat <文件>            查看文件（会顺手收集 lore 碎片）\n" +
      "  grep <词> [路径]      在文件中搜关键词（不填路径则全盘搜）\n" +
      "【解密】\n" +
      "  decode b64|hex|rot13|reverse [文本]   单项解码\n" +
      "  encode hex|rev|b64 <文本>             单项编码（便签里说『hex-encode』就用它）\n" +
      "  decode vig <密钥> <文本>              维吉尼亚解码\n" +
      "【界面 / 对话】\n" +
      "  open bbs|mail|photos|chat|footage|web|im|map|timeline|board   打开图形界面（等价于点顶部按钮）\n" +
      "  submit <密语>        提交守门人密语（集齐官网/聊天/图片/地图四处『印记』后可用；答案例：青岚不灭）\n" +
      "  conclude             打开结局菜单（完成『最终结论』后，这里会出现按你判断生成的结局）\n" +
      "  talk [问题]           与残响『岚』对话（可直接问：下一步怎么走？/ 王浩是谁？/ 教务处怎么回事？）\n" +
      "  objective            查看当前阶段目标与线索路标\n" +
      "  hint                  卡住时给一条线索（只给当前阶段，不剧透全流程）\n" +
      "  clear                 清屏\n" +
      "────────────────────────────\n" +
      "起手建议：login guest → cat notice.txt → open photos（看第一张带 base64 的相片）。\n" +
      "更多玩法点顶部 ？帮助。", "ok"
    );
  }

  function cmdLogin(args) {
    const user = (args[0] || "").toLowerCase();
    const acc = GAME.accounts[user];
    if (!acc) return UI.print("无此账号：" + esc(user), "err");
    if (acc.pass && args[1] !== acc.pass) {
      UI.print("口令错误。", "err");
      if (user === "root") {
        STATE.rootFails++;
        if (STATE.rootFails >= 3) return ENDINGS.lockout();
        GHOST.say("onWrongRoot");
      }
      return;
    }
    STATE.user = user; STATE.level = acc.level; STATE.cwd = acc.home;
    STATE.objective = GAME.objectives[acc.level] || "";
    UI.print("登录成功：" + user + "（level " + acc.level + "）", "ok");
    UI.print("（输入 objective 查看当前目标与线索路标）", "ok");
    if (window.revealFootage) window.revealFootage(); // 解到对应权限，自动放出对应影像
    if (user === "guest") return;
    if (user === "suli")  GHOST.say("onStudent");
    if (user === "admin") { GHOST.say("onAdmin"); UI.openApp("bbs"); }
    if (user === "root")  { GHOST.say("onRoot"); ENDINGS.menu(); }
  }

  function cmdLogout() {
    STATE.user = "guest"; STATE.level = 0; STATE.cwd = "/home/guest";
    UI.print("已登出，当前为访客。", "ok");
  }

  function cmdLs(args) {
    const showHidden = args.includes("-a");
    const target = args.find(a => !a.startsWith("-")) || STATE.cwd;
    const path = FS.resolve(STATE.cwd, target, GAME.accounts[STATE.user].home);
    const r = FS.list(path, STATE.level, showHidden);
    if (r.error) return UI.print(r.error, "err");
    if (!r.items.length) return UI.print("（空）");
    r.items.forEach(it => {
      const tag = it.deleted ? " [已删]" : it.hidden ? " [隐]" : "";
      const cls = it.type === "dir" ? "dir" : "file";
      UI.print(`<span class="${cls}">${esc(it.name)}/</span>${tag}`, cls);
    });
  }

  function cmdCd(args) {
    const target = args[0] || "~";
    const path = FS.resolve(STATE.cwd, target, GAME.accounts[STATE.user].home);
    const node = FS.getNode(path);
    if (!node) return UI.print("路径不存在：" + esc(path), "err");
    if (node.type !== "dir") return UI.print("不是目录：" + esc(path), "err");
    if (node.level > STATE.level) return UI.print("权限不足（需 level " + node.level + "）", "err");
    STATE.cwd = path;
    UI.print(STATE.cwd);
  }

  function cmdCat(args) {
    if (!args[0]) return UI.print("用法：cat <文件>", "err");
    const path = FS.resolve(STATE.cwd, args[0], GAME.accounts[STATE.user].home);
    const node = FS.getNode(path);
    if (node && node.lore && STATE.level >= node.level) window.collectLore(node.lore);
    const r = FS.read(path, STATE.level);
    if (r.error) return UI.print(r.error, "err");
    UI.print(esc(r.content));
    if (!STATE.readFiles) STATE.readFiles = new Set();
    STATE.readFiles.add(path);
    if (window.recordDiscovery) window.recordDiscovery("文件", path, "读取文件");
    if (window.revealFootage) window.revealFootage(); // 读到关键文件，自动放出相关影像
  }

  function cmdGrep(args) {
    if (!args[0]) return UI.print("用法：grep <词> [路径]", "err");
    const pattern = args[0];
    const start = args[1] ? FS.resolve(STATE.cwd, args[1], GAME.accounts[STATE.user].home) : "/";
    const res = FS.search(pattern, start, STATE.level);
    if (!res.length) return UI.print("未找到：" + esc(pattern), "err");
    res.forEach(m => UI.print(`${esc(m.file)}:${m.line}  ${esc(m.text)}`, "match"));
  }

  function cmdDecode(args) {
    const method = (args[0] || "").toLowerCase();
    if (method === "vig") {
      const key = args[1]; const text = args.slice(2).join(" ");
      const dec = CRYPTO.vigenere(text, key, true);
      UI.print(esc(dec));
      // 元谜题二阶：用『青岚不灭』拼音 QINGLANBUMIE 解密 legacy.txt 隐藏自白
      const s2 = GAME.metapuzzle.stage2;
      if (s2 && key && key.toUpperCase().replace(/[^A-Z]/g, "") === s2.key && dec === s2.plain && !STATE.deepUnlocked) {
        STATE.deepUnlocked = true;
        UI.print("★ 你解开了守门人真章的第二层——苏黎真正的自白已显形。", "ok");
        if (window.GHOST) GHOST.say("onDeep");
        if (window.revealFootage) window.revealFootage();
      }
      return;
    }
    const text = args.slice(1).join(" ");
    switch (method) {
      case "b64":    return UI.print(esc(CRYPTO.b64dec(text)));
      case "hex":    return UI.print(esc(CRYPTO.hexDec(text)));
      case "rot13":  return UI.print(esc(CRYPTO.rot13(text)));
      case "reverse":return UI.print(esc(text.split("").reverse().join("")));
      default:       return UI.print("用法：decode b64|hex|rot13|reverse|vig <密钥> <文本>", "err");
    }
  }

  function cmdEncode(args) {
    const method = (args[0] || "").toLowerCase();
    const text = args.slice(1).join(" ");
    if (!text) return UI.print("用法：encode hex|rev|b64 <文本>   （把文本『编码』成对应形式）", "err");
    switch (method) {
      case "hex": return UI.print(esc(CRYPTO.hexEnc(text)));
      case "rev": return UI.print(esc(text.split("").reverse().join("")));
      case "b64": return UI.print(esc(CRYPTO.b64enc(text)));
      default:    return UI.print("用法：encode hex|rev|b64 <文本>", "err");
    }
  }

  function cmdOpen(args) {
    const name = (args[0] || "").toLowerCase();
    if (["bbs", "mail", "photos", "chat", "footage", "web", "im", "map", "timeline", "board", "ledger"].includes(name)) return UI.openApp(name);
    return UI.print("可打开：bbs / mail / photos / chat / footage / web / im / map / timeline / board / ledger", "err");
  }

  function cmdSubmit(args) {
    const phrase = (args.join(" ") || "").trim();
    if (!phrase) return UI.print("用法：submit <守门人密语>  （如：submit 青岚不灭）", "err");
    if (phrase === GAME.metapuzzle.answer) {
      if (STATE.metaUnlocked) return UI.print("『" + GAME.metapuzzle.answer + "』已经解锁过了。守门人真章在 /root/truth/legacy.txt。", "ok");
      STATE.metaUnlocked = true;
      UI.print("★ 『" + GAME.metapuzzle.answer + "』—— 守门人真章已解锁：/root/truth/legacy.txt", "ok");
      if (window.GHOST) GHOST.say("onMeta");
      if (window.revealFootage) window.revealFootage();
    } else {
      UI.print("『" + esc(phrase) + "』不是正确的密语。四印记按 网→聊→图→地 顺序连读。", "err");
    }
  }

  function cmdObjective() {
    if (!STATE.objective) return UI.print("暂无目标提示。输入 help 查看命令。", "ok");
    UI.print(STATE.objective, "ok");
  }

  /* 渐进式 hint：只给「当前阶段」的详细引导，不一次剧透全流程 */
  function cmdHint() {
    const lv = STATE.level;
    if (lv === 0) {
      UI.print(
        "卡住了？这一阶该做的事：\n" +
        "① cat notice.txt —— 公告里提到苏黎的测试账号，口令藏在『她拍的照片』里。\n" +
        "② open photos —— 逐张看 EXIF 元数据，找带可疑编码串的那张（不是每张都有）。\n" +
        "③ 拿到那串字符后：decode b64 <串> 解开，得到账号 suli 和对应口令。", "ok");
    } else if (lv === 1) {
      UI.print(
        "卡住了？这一阶该做的事：\n" +
        "① cat note.enc 是一封加密便签（维吉尼亚密文）。\n" +
        "② 解密密钥在密码学社旧帖——open bbs 去找（提示：和『校名』有关，不是随便一个词）。\n" +
        "③ decode vig <密钥> <note内容> 解开后，按便签提示去 diary_1 找她的『名字』，\n" +
        "   用『倒序 + hex』推导出 admin 口令（别急，先想清楚她名字怎么写）。", "ok");
    } else if (lv === 2) {
      UI.print(
        "卡住了？这一阶该做的事：\n" +
        "① /trash 回收站：第一片是 base64（decode b64）。\n" +
        "② admin 邮件草稿：第二片是一种简单替换（decode rot13）。\n" +
        "③ open bbs 切到管理员「管理板」：第三片 + 组合规则；年份要去 /var/log/auth.log 找苏黎最后在线那年。\n" +
        "④ 三片按管理板说的顺序拼成 root。⚠ 旧密钥 QL_ROOT_1997 是陷阱，别用。", "ok");
    } else {
      UI.print(
        "你已站在最高权限。先别急着定案：\n" +
        "① 读 /root/truth/evidence.txt、witness.md，并和 /var/log/auth.log 交叉，证明 12.24 谁在场、谁动了系统。\n" +
        "② 再读 /var/log/jiaowu_op.log，把更早日期的系统操作放进同一条时间线。\n" +
        "③ 打开 open ledger 看『案情逻辑链』，缺哪条证据就回哪处补；最后再去 open board 定案和对质。", "ok");
    }
  }

  return { run };
})();
