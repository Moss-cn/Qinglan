/* ============================================================
   青岚一中校园网 · v6 世界数据（叙事加厚 / 推理深化版）
   伪操作系统 / 硬核多层解谜。所有人物、学校均为虚构。
   设计原则：
     · 每阶都有「明确路标」（该去访问哪个文件 / 哪个 app），但不给答案
     · 到了地方，钥匙需要玩家自己「推导」
     · 套娃（官网/青岚聊/地图/时间线/推理板）本身是解谜入口并互相牵引（ARG 跨媒介）
     · 推理机制：跨媒介元谜题 / 时间线重建 / 身份视角切换 / 推理板假设验证 / 最终结论分支
   ───────────────────────────────────────────────────────────
   v6 叙事加厚要点（解决「太单薄」）：
     ① 多层悬疑：表面案「陈宇改分」只是冰山一角。深层是「教务处系统性舞弊」——
        王浩（王老师之子）的成绩早在 2022.09 就被教务处提前垫高，陈宇只是半年后
        被王老师逼着动手「灭口痕迹」的替罪羊。
     ② 证据矛盾：匿名证人X 在 web/聊天 里声称自己「体育馆外」，但登录日志显示
        王浩(=匿名X)当晚 22:05 在体育馆「内」；且他把「12.24 篡改夜」与
        「06.17 苏黎最后在线/离校夜」混为一谈，误导追查者。玩家须自己甄别证人。
     ③ 时间线加长到 12 事件，含一对需厘清的「两夜之分」。
     ④ 元谜题二阶：青岚不灭 解锁 legacy.txt 后，里面还有一层维吉尼亚密文
        （密钥=「青岚不灭」拼音 QINGLANBUMIE），解开会得到苏黎真正的自白。
     ⑤ 最终结论分支：推理板 6 组证据链全对后，出现「执行/现场包庇/幕后」三连结论。
        不同组合 → 不同结局（只看到陈宇=第一层；归错人=抓错人；
        陈宇执行+王老师现场包庇+教务处幕后=系统性真相·最优）。
   主链（保留）：guest →(照片EXIF base64)→ student →(维吉尼亚+名字倒序hex)→
         admin →(三段 root)→ root → 真相 → 最终结论
   ============================================================ */
window.GAME = {
  meta: {
    title: "青岚OS · 校园网离线镜像",
    rootKey: "q1nglan_2023",    // root 密码 = A(q1ng) + B(lan_) + C(2023)
    loreTotal: 4,
    // 四碎片组字元谜题：每块末尾藏一个字，集齐按 1→4 读成一句话
    loreMarks: { 1: "记", 2: "得", 3: "真", 4: "相" }
  },

  /* 分阶段「目标 / 路标」：只告诉去哪看，不告诉答案；并提示「下一步要推理什么」 */
  objectives: {
    0: "【当前目标】拿到学生账号 suli。\n" +
       "① cat notice.txt —— 校务办公告里的第一条线索\n" +
       "② open photos —— 翻她拍过的照片，逐张看 EXIF 元数据\n" +
       "③ 拿到一串编码后，用 decode b64 <串> 解开，得到账号与口令\n" +
       "④ 想看她本人？顶部 🎬 影像 → 入学那段已对你开放。\n" +
       "⑤ 想钻进『她活过的世界』？顶部 🌐 官网 进去逛逛——站内可以搜关键词。",
    1: "【当前目标】拿到管理员 admin。\n" +
       "① cat note.enc —— 苏黎的加密便签（维吉尼亚密文）\n" +
       "② open bbs —— 去「密码学社」旧帖找这封便签的密钥（提示：和『校名』有关，得自己拼出来）\n" +
       "③ 解密后按便签里的提示，去 diary_1 找她的『名字』，自己推导出 admin 口令\n" +
       "   （便签说 reverse + hex-encode —— 用 encode hex <倒序名> 直接算）\n" +
       "④ 拿到 student 后，读 score_note.txt / export_scores.csv，再去 🌐 官网 用口令登录『内部教务系统』，对照成绩——会看见不一样的东西。",
    2: "【当前目标】拼出 root 口令。\n" +
       "① /trash 回收站 —— 第一片（base64）\n" +
       "② admin 邮件草稿 —— 第二片（rot13）\n" +
       "③ open bbs 切到管理员「管理板」—— 第三片 + 组合规则；年份去 /var/log/auth.log 推理『最后在线』那年\n" +
       "④ 三片分别解码、按规则拼成 root。⚠ 旧密钥 QL_ROOT_1997 是陷阱，别用。\n" +
       "⑤ 升到 admin 后，读 score_wall_archive.txt；也可以在 🌐官网 搜『撤回 / 修订 / 处分』找公告版本差异。\n" +
       "⑥ 🗺️地图 里『监控室』解锁，📓 线索笔记本会开始记录你的证据缺口。",
    3: "【当前目标】真相在 /root/truth，但别停在主链——先证明，再定案。\n" +
       "① 读 evidence.txt / witness.md / auth.log：用物证、言证、登录记录交叉，先钉住 12.24 谁在场、谁动了系统。\n" +
       "② 再读 /var/log/jiaowu_op.log：把 12.24 的改分，和更早的系统操作放在同一张时间表里比较。\n" +
       "   /root/truth/ledger.txt 是定案后的总表确认；定案前先靠日志、证词、时间线自己推。\n" +
       "③ 集齐四处『印记』：🌐官网内部系统页脚 / 💬青岚聊匿名X / 🖼️相册天台照增强 / 🗺️地图监控室 → 拼成『青岚不灭』，提交解锁守门人真章 legacy.txt。\n" +
       "④ legacy.txt 里还有一层维吉尼亚密文：用密钥『青岚不灭』的拼音 QINGLANBUMIE 解（decode vig QINGLANBUMIE <那串密文>），得到苏黎真正的自白。\n" +
       "⑤ 🕒时间线 排出 12 件事的顺序，厘清『12.24 篡改夜』与『06.17 离校夜』是两回事。\n" +
       "⑥ 🧩推理板 6 组证据链全对后，会出现『最终结论』，判断执行/现场包庇/幕后分别是谁——不同结论通向不同结局。"
  },

  /* 账号：level 决定能访问的文件层级 */
  accounts: {
    guest: { level: 0, home: "/home/guest", pass: null,           desc: "访客（只读公开内容）" },
    suli:  { level: 1, home: "/home/suli",  pass: "QLcampus2019", desc: "学生 suki / 苏黎" },
    admin: { level: 2, home: "/home/admin", pass: "696c7573",     desc: "系统管理员（口令 = 名字倒序的 hex）" },
    root:  { level: 3, home: "/root",       pass: "q1nglan_2023", desc: "超级用户（全部权限）" }
  },

  /* ---------------- 虚拟文件系统（扁平路径表） ---------------- */
  fs: {
    "/":                              { type: "dir", level: 0, children: ["home", "var", "trash", "root"] },
    "/home":                          { type: "dir", level: 0, children: ["guest", "suli", "admin"] },
    "/home/guest":                    { type: "dir", level: 0, children: ["welcome.txt", "notice.txt", "readme.txt"] },
    "/home/guest/welcome.txt":        { type: "file", level: 0, content:
      "欢迎接入青岚校园网离线镜像（CampusOS v2.3）。\n" +
      "本系统已于 2024 年停止维护，仅保留只读副本。\n" +
      "公开内容可自由浏览；涉及个人隐私的目录已加密。\n" +
      "输入 help 查看可用命令。输入 login guest 以访客身份进入。" },
    "/home/guest/notice.txt":         { type: "file", level: 0, content:
      "【校务办·离线公告】\n" +
      "高三(7)班 苏黎 同学已于 2023 年毕业季后办理转学，档案已移交。\n" +
      "（附注：早期系统曾为新生开通测试账号 'suli'，权限高于访客。\n" +
      " 据传她把自己设的口令，藏在了『她拍过的某张照片』里——\n" +
      " 具体哪张、以什么方式藏，外人猜不透。\n" +
      " 提示：照片的「元数据」里，往往藏着主人不想明说的事。）" },
    "/home/guest/readme.txt":         { type: "file", level: 0, content:
      "终端速查：\n" +
      "  ls / cd / cat / pwd      浏览文件系统\n" +
      "  grep <词> [路径]         在文件中搜索关键词\n" +
      "  decode b64|hex|rot13|vig <密钥> <文本>   解码\n" +
      "  encode hex|rev|b64 <文本>                 编码（便签里说『hex-encode』就用它）\n" +
      "  open bbs|mail|photos|chat|footage|web|map|timeline|board   打开图形界面\n" +
      "  login <用户> [口令]      切换账号\n" +
      "  talk / objective / hint   与『岚』对话 / 查看当前目标 / 卡住时给线索\n" +
      "提示：很多线索不在命令里，而在照片的元数据、被删掉的文件中——\n" +
      "     也别小看论坛上那些『旧帖』，苏黎的痕迹无处不在。" },

    "/home/suli":                     { type: "dir", level: 1, children: ["diary_1.txt", "diary_2.txt", "diary_3.txt", "note.enc", "score_note.txt", "export_scores.csv", ".secrets"] },
    "/home/suli/diary_1.txt":         { type: "file", level: 1, content:
      "2022.09.01  开学\n" +
      "分到高三(7)班。班主任姓陈，挺严肃。\n" +
      "校园网还能登，老账号 suli 没被注销，挺好。\n" +
      "（附注：我叫苏黎，拼音 suli。有人问起我的账号口令怎么设，我就说——\n" +
      " 『把自己的名字玩出花来呗』。\n" +
      " 提醒后来人：别用中文直接 hex，那会是一堆乱码；用拼音。）" },
    "/home/suli/diary_2.txt":         { type: "file", level: 1, content:
      "2023.05.20\n" +
      "我开始怀疑一件事：去年 12 月体育馆那晚，不该没人记得。\n" +
      "成绩系统里有人被悄悄改过分。我把能查的都查了，证据链也藏好了。\n" +
      "如果有一天我不在了，证据在我留下的地方——但得用对钥匙。\n" +
      "（钥匙不在明处。密码学社那套，我玩得比谁都熟；\n" +
      " 而管理员那道门，我给自己留了道只有『懂我名字』才进得去的关卡。）" },
    "/home/suli/diary_3.txt":         { type: "file", level: 1, content:
      "2023.06.10\n" +
      "我可能盯错了方向。\n" +
      "我一直盯着『谁在 12 月改了那 7 个人的分』，可导出表里有个名字从一开始就不对劲。\n" +
      "王浩那一行，我见过更早的痕迹。不是 12 月那种大面积覆盖，而像是一笔很早就被写进去的东西。\n" +
      "陈宇当然有问题，可他的问题也许只是表面那层。真正让我害怕的是：有人很早就知道该遮哪一笔。\n" +
      "（原始成绩总表还在档案室。谁动了它，谁就慌——盯着总表，别盯着单个人。）\n" +
      "还有那个『匿名X』。他说自己在体育馆外。等我拿到完整登录日志，再看他到底站在哪。" },
    "/home/suli/score_note.txt":      { type: "file", level: 1, content:
      "（苏黎的私人便签·需学生及以上可见）\n" +
      "我用自己的测试账号登进教务系统，导出了一份成绩。\n" +
      "和班主任贴在墙上的『公示版』一对——7 个人的分不对。\n" +
      "导出的片段我另存了一份：cat export_scores.csv。它只说明『数字对不上』，不说明是谁动的。\n" +
      "但我登不进『内部教务系统』的深层，密码被人改过。\n" +
      "（视角提示：以管理员身份再登官网，能看见『原始分 vs 改后分』的对比；\n" +
      " 以 root 身份，能看见是谁、在哪天动的键盘。）" },
    "/home/suli/export_scores.csv":   { type: "file", level: 1, content:
      "name,public_score,exported_score,note\n" +
      "陈宇,78,73,公示版高 5\n" +
      "李雯,84,80,公示版高 4\n" +
      "王浩,82,61,差异最大；苏黎标了两个问号\n" +
      "张可,76,72,公示版高 4\n" +
      "赵磊,81,77,公示版高 4\n" +
      "周敏,88,83,公示版高 5\n" +
      "孙倩,79,75,公示版高 4\n" +
      "苏黎,91,91,无差异\n" +
      "备注：这不是结论，只是一张对照表。真正要问的是：这些差异何时出现、由哪个权限写入。" },
    "/home/suli/note.enc":            { type: "file", level: 1, content:
      "QLZOY PNIAJUCD: v xqq oe ia q kvvsee en ze zwa. jixk xy aqur lcoz tqnxj_1, rrlmeyp tuu trzeeei, prd-pnpelr zse euahre. tuqb vy ehr qlzoy pniajucd. -- fk tv" },
    "/home/suli/.secrets":            { type: "dir", level: 1, hidden: true, children: ["lore_1.txt"] },
    "/home/suli/.secrets/lore_1.txt": { type: "file", level: 1, hidden: true, lore: 1, content:
      "[碎片 1/4·印记〔记〕] 苏黎的便签：『他们以为删掉就不存在。可日志从不撒谎。』" },

    "/home/admin":                    { type: "dir", level: 2, children: ["mail", "notes.txt", "notes2.txt", "score_wall_archive.txt"] },
    "/home/admin/notes.txt":          { type: "file", level: 2, content:
      "管理员备忘：\n" +
      "- 回收站 /trash 仅管理员及以上可见，存放被用户删除的文件。\n" +
      "- root 密钥已分片存储于三处（详见各碎片）。\n" +
      "- ⚠ 旧 root 密钥 QL_ROOT_1997 已于 2024 作废，是陷阱，勿用。" },
    "/home/admin/notes2.txt":         { type: "file", level: 2, content:
      "管理员备忘 · 密（仅管理员）\n" +
      "关于高三(7)班的『分数异动』，我多说一句外人不知道的：\n" +
      "王浩，就是王老师（体育组）的儿子。他的名字出现在那 7 人里，\n" +
      "但据我所知，他『被垫高』的时间点比 12 月那次篡改早得多——\n" +
      "有人在他入学后不久就动过了。这件事，往上查会查到『教务处』。\n" +
      "（root 视角的 /var/log/jiaowu_op.log 里，有更直接的记录。）" },
    "/home/admin/score_wall_archive.txt": { type: "file", level: 2, content:
      "【高三(7)班 公示成绩墙残影 · 管理员缓存】\n" +
      "缓存来源：官网公告附件缩略图 / 拍摄时间：2022-12-25 08:12\n" +
      "名单：陈宇、李雯、王浩、张可、赵磊、周敏、孙倩、苏黎……\n" +
      "旁注：苏黎用红笔把 7 个名字圈在一起，王浩旁边另写『为什么九月也有痕迹？』\n" +
      "这份墙照只能证明『公示版』存在差异；谁改的、什么时候改的，要回到日志。" },
    "/home/admin/mail":               { type: "dir", level: 2, children: ["draft_root.txt"] },
    "/home/admin/mail/draft_root.txt":{ type: "file", level: 2, content:
      "（未发送）ROOT KEY · PART B\n" +
      "我把中间那段做成了只有懂 rot13 的人才读得出来的样子：yna_\n" +
      "—— 前半段在回收站（base64），后半段在管理板。\n" +
      "组合顺序：A + B + C，中间无分隔。\n" +
      "C 是哪一年？去 /var/log/auth.log 看我『最后在线』那天——别和体育馆事件那年混了。" },

    "/var":                           { type: "dir", level: 0, children: ["log"] },
    "/var/log":                       { type: "dir", level: 2, children: ["auth.log", "jiaowu_op.log"] },
    "/var/log/auth.log":              { type: "file", level: 2, content:
      "== auth.log (节选) ==\n" +
      "2022-12-24 21:12  chenyu   login  (体育馆)\n" +
      "2022-12-24 21:40  liewen   login  (体育馆)\n" +
      "2022-12-24 22:05  wanghao  login  (体育馆)   ← 匿名X 自称在『馆外』，但日志记的是『馆内』\n" +
      "2022-12-24 23:59  system   event  [体育馆监控片段已生成]\n" +
      "2023-06-17 23:51  suli     logout  (最后在线：苏黎)\n" +
      "2024-01-02 10:00  admin    login   [镜像化启动]\n" +
      "2026-07-15 03:xx  ???      login   (就是你——来源：本机终端)\n" +
      "提示：root 密钥分三片——A 在回收站 vault_fragment，B 见 admin 邮件草稿，C 见管理板。\n" +
      "碎片 C 的值 = 苏黎『最后在线』的年份（见上方 2023-06-17），不是 2022 体育馆事件那年。\n" +
      "[DEPRECATED] 旧 root 密钥 QL_ROOT_1997 已于 2024 作废，是陷阱。" },
    "/var/log/jiaowu_op.log":         { type: "file", level: 3, content:
      "== 内部教务系统 · 操作日志（仅 root 可见）==\n" +
      "2022-09-12 09:03  jiaowu  改分  王浩  期中总评：原始 61 → 改后 82  （备注：体优生加分·未公示）\n" +
      "2022-09-12 09:05  jiaowu  改分  王浩  平时分：  原始 70 → 改后 88\n" +
      "2022-12-24 22:14  chenyu 改分  7 人成绩   （覆盖痕迹，动机存疑）\n" +
      "2022-12-25 00:30  wanghao 撤回  3 份处分记录\n" +
      "—— 看清楚时间线：王浩那次在九月，比陈宇那次早三个多月。\n" +
      "   谁先把水搅浑，一目了然。王浩 = 王老师之子，这不是巧合。" },

    "/trash":                         { type: "dir", level: 2, children: ["vault_fragment.txt", "lore_2.txt"] },
    "/trash/vault_fragment.txt":      { type: "file", level: 2, deleted: true, content:
      "[已删除文件·可恢复] ROOT KEY PART A (base64): cTFuZw==\n" +
      "—— 解码后接 B、再接 C，即 root 口令。" },
    "/trash/lore_2.txt":              { type: "file", level: 2, deleted: true, lore: 2, content:
      "[碎片 2/4·印记〔得〕] 苏黎：『我拍的最后一张照片，日期就是某把钥匙。』" },

    "/root":                          { type: "dir", level: 3, children: ["truth", "lore_3.txt"] },
    "/root/truth":                    { type: "dir", level: 3, children: ["evidence.txt", "witness.md", "verdict.txt", "su_li_final.txt", "legacy.txt", "board_report.txt", "ledger.txt"] },
    "/root/truth/evidence.txt":       { type: "file", level: 3, content:
      "==== 证据索引 ====\n" +
      "[01] 成绩修改日志_2022秋.csv\n" +
      "  7 人分数被改，集中在体育馆事件（2022.12.24）前后：\n" +
      "  陈宇、李雯、王浩、张可、赵磊、周敏、孙倩\n" +
      "[02] 处分记录_被撤回_3份.pdf （改分者中，有人恰好那晚在场）\n" +
      "[03] 监控片段_2022.12.24_体育馆.mp4\n" +
      "[04] 证人证言_整理稿.docx\n" +
      "[05] 原始成绩总表_ledger.csv （王浩 9 月即被垫高，见 /var/log/jiaowu_op.log）\n" +
      "原始数据随服务器裁撤已毁，但『知道它存在过』本身，就是一种证据。\n" +
      "苏黎没想当英雄。她只是不想让那一晚，被所有人默契地忘掉。" },
    "/root/truth/witness.md":         { type: "file", level: 3, content:
      "【证人证言 · 整理稿】\n" +
      "那晚（2022.12.24）体育馆，我躲在看台底下，看见改分的人又回来了。\n" +
      "他穿着高三(7)班校服，左袖口有一大块蓝墨水渍，走路有点跛。\n" +
      "我认得他——是陈宇。\n" +
      "（注：系统登录日志里，当晚在线的人不止他一个，得交叉着看。\n" +
      " 另：匿名X 自称『在馆外』，但王浩当晚 22:05 的登录记录是『在馆内』——\n" +
      " 一个连自己站哪儿都说不清的证人，他的话要打折扣。）" },
    "/root/truth/verdict.txt":        { type: "file", level: 3, content:
      "【裁决 · 苏黎的推演（表面案）】\n" +
      "证据链：7 个被改分的人里，当晚（2022.12.24）在体育馆登录的只有 3 个——\n" +
      "  chenyu / liewen / wanghao。\n" +
      "证人证言锁定『左袖口蓝墨渍、走路微跛』的那一个 = 陈宇 = chenyu。\n" +
      "三者交叉，唯一重合的就是他——表面看，陈宇是改分者。\n" +
      "但苏黎在 diary_3 写得更深：陈宇只是替罪羊，真正的手在更上层。\n" +
      "（试试：grep chenyu，再 cat witness.md；然后把 auth.log 和 jiaowu_op.log 放到同一条时间线上。）" },
    "/root/truth/su_li_final.txt":    { type: "file", level: 3, content:
      "读到这里，你已经拿到了全部钥匙，也把那一晚钉死了。\n" +
      "我把真相留在这，不是为了报复谁，是为了让那一晚被人记得。\n" +
      "现在你来决定：把这一切交出去，还是让它继续睡着。\n" +
      "（在对话里选择你的结局——选之前，先想清楚你要对谁负责。）" },
    "/root/truth/legacy.txt":         { type: "file", level: 3, locked: "meta", content:
      "[守门人真章 · 需集齐『青岚不灭』四印记解锁]\n" +
      "如果你看到这行字，说明你拼出了『青岚不灭』。\n" +
      "我没想当英雄。我只是不想让那一晚，被所有人默契地忘掉。\n" +
      "你比他们更想看见真相——所以这份真章，留给下一个守门人。\n" +
      "记住：记得，也是一种回答。但不是唯一的回答。\n" +
      "\n" +
      "[第二层 · 隐藏自白]\n" +
      "青岚不灭，不只是四个字。把它当成密钥——『青岚不灭』的拼音 QINGLANBUMIE。\n" +
      "下面这串，是用它做的维吉尼亚密文。在终端里解：\n" +
      "  decode vig QINGLANBUMIE <下面这串>\n" +
      "苟黖沮朏涓失。妆抋眳眄京绝亖专不丰宓门仇。眠歷覍宐皈丝昷不丰吘字，耙昰2022.12.24邷丌晢皈眯眀——宐皊扖在敦劢夘，丙地陌宗丈丷什躶上。\n" +
      "（解出来，是我想对下一个守门人说的话。）" },
    "/root/truth/board_report.txt":   { type: "file", level: 3, locked: "board", content:
      "[侦探报告 · 需推理板 6 组证据链全对解锁]\n" +
      "表面案：篡改者陈宇（证据/证人/登录日志三者交叉钉死）。\n" +
      "包庇者：王老师（体育馆外拦人、把苏黎带入办公楼后再无音讯）。\n" +
      "但更深处：王浩（王老师之子）的分数早在 2022.09 就被教务处提前垫高，\n" +
      "  陈宇 12.24 的篡改，是把『痕迹』搅浑、替人顶罪。\n" +
      "真凶不是某一个人，是一条链：教务处（系统性舞弊）→ 王老师（施压与包庇）→ 陈宇（执行）。\n" +
      "苏黎结局：以『转学』之名被校方安排离校，实则是被请离——她追查到了总表。\n" +
      "—— 你写的，和苏黎留下的，对上了；但别停在『陈宇』这一层。" },
    "/root/truth/ledger.txt":         { type: "file", level: 3, locked: "verdict", content:
      "[原始成绩总表 · ledger（需先完成『最终结论』解锁）]\n" +
      "这就是苏黎拼了命要护住的东西。它证明：\n" +
      "  王浩 的原始分只有 61/70，却被人悄悄垫到 82/88——时间是 2022.09，远早于 12 月那次篡改。\n" +
      "  动它的人，是『教务处』，不是陈宇。\n" +
      "陈宇 12.24 改的是另外 7 个人的分，像是在『盖』什么，其实是在帮人把水搅浑。\n" +
      "—— 读到这里，你才算真正看懂了那一晚。下一个守门人，你合格了。" },
    "/root/lore_3.txt":               { type: "file", level: 3, hidden: true, lore: 3, content:
      "[碎片 3/4·印记〔真〕] 系统残响：『下一个读到这里的，会代替我成为守门人吗？』" }
  },

  /* ---------------- 论坛（图形界面，按 level 过滤） ---------------- */
  bbs: {
    public: [
      {
        board: "密码学社", level: 0,
        posts: [
          { title: "【招新】暗号规则与「招牌密钥」", author: "社长·阿楷", level: 0,
            body: "本社规矩：明文每个字母后移 4 位得密文（凯撒+4）。\n维吉尼亚同理，但密钥是一句话。\n我们的『招牌密钥』永远是——本校校名的完整拼音，全大写、连写、无空格。\n苏黎那封加密便签，用的就是这把钥匙。想解它，先把自己校名的拼音拼出来。",
            adminExtra: "（管理员可见）附：当年社费名单里，『陈宇』那一栏被红笔圈过，旁边写着『已退社·原因不明』。和成绩的事，是不是巧合，你自己判断。" },
          { title: "Re: 招牌密钥到底是啥", author: "社员·阿树", level: 0,
            body: "提示：校名两个字。\n第一个字『青』，拼音首字母 Q，全拼 QING；\n第二个字『岚』，拼音首字母 L，全拼 LAN。\n把俩全拼连起来——自己写出来，别偷懒问我要现成的。苏黎比谁都较真，她设的题不会白给。" }
        ]
      },
      {
        board: "树洞", level: 0,
        posts: [
          { title: "有人……还记得苏黎吗", author: "匿名", level: 0,
            body: "毕业一年了。她最后一条动态停在 6 月 17 号。\n学校说转学了，可没人拿到过她联系方式。\n（她拍的最后一张照片，日期好像有点意思；\n 还有，她总说『名字倒着写，谁也猜不到』——不知道在说啥。\n 对了，她好像还留了段『影像』在系统里，不知道谁看得见。）" }
        ]
      },
      {
        board: "公告栏", level: 0,
        posts: [
          { title: "关于校园网离线镜像", author: "校务办", level: 0,
            body: "服务器已裁撤，校园网转为离线镜像。公开内容可自由浏览，隐私目录已加密。" }
        ]
      }
    ],
    admin: [
      {
        board: "管理板（仅管理员）", level: 2,
        posts: [
          { title: "ROOT 密钥碎片 C", author: "system", level: 2,
            body: "ROOT KEY PART C: 2023\n（A 在回收站，base64；B 在 admin 邮件草稿，rot13。组合：A+B+C，中间无分隔。\n 注：C 不是随便写的——去 /var/log/auth.log 看苏黎『最后在线』那天，年份就是 C。\n ⚠ 别和『体育馆事件』那年（2022）搞混：『最后在线』是她毕业前夕，不是出事那晚。）" },
          { title: "碎片 4", author: "system", level: 2, lore: 4,
            body: "[碎片 4/4·印记〔相〕] 苏黎留在管理板的最后一行：『如果你集齐了四块碎片，说明你比他们更想看见真相。』" }
        ]
      }
    ]
  },

  /* ---------------- 照片（含 EXIF 线索 + 增强隐写） ---------------- */
  photos: [
    { id: 1, name: "校门_晨.jpg",   icon: "🏫", date: "2023.06.15", exif: "Camera: CampusCam / Location: 校门",
      desc: "毕业典礼前一天的迎宾拱门。" },
    { id: 2, name: "礼堂_拨穗.jpg", icon: "🎓", date: "2023.06.16", exif: "Camera: CampusCam / Faces: 33 (前排左三空位)",
      desc: "高三(7)班合影，前排左三空着一个位置。" },
    { id: 3, name: "操场_黄昏.jpg", icon: "🌇", date: "2023.06.16",
      exif: "Camera: CampusCam / Comment: c3VsaTpRTGNhbXB1czIwMTk=",
      desc: "散场后的操场。这张 EXIF 的 Comment 字段里有一串可疑的 base64 编码字符。" },
    { id: 4, name: "天台_夜.jpg",   icon: "🌃", date: "2023.06.17", exif: "Camera: CampusCam / Note: 苏黎拍的最后一张",
      desc: "毕业最后一晚。日期 2023.06.17，记住它——有人说过这串日期是某把钥匙。",
      hiddenWatermark: "不",
      enhanceHint: "这张照片背面，像被人用荧光笔写过一行字。点『增强』试试——但别指望它直说出来，得你自己拼。" },
    { id: 5, name: "未命名_加密.jpg", icon: "🛰️", date: "??", level: 1,
      exif: "Camera: CampusCam / Comment: 494c5553",
      desc: "一张没有日期的相片。EXIF 的 Comment 是一串十六进制 494c5553——这串 hex 解码后，再反过来读，像是某个名字……（需 level 1 可见）" }
  ],

  /* ---------------- 苏黎各时期影像（AI 生成，按权限解锁） ---------------- */
  /* 影像档案：解到某一处，对应影像自动放出（trigger 决定解锁条件）。
     有 src 的是 AI 生成视频；src 为空的是「场景还原」卡（氛围画面，非 bug）。 */
  footage: [
    /* —— 苏黎 · 人生阶段（按权限进度自动放出） —— */
    { id: "suli_2019", period: "2019 · 入学", trigger: { kind: "level", level: 0 }, icon: "🎒",
      desc: "高一开学。她穿着校服走过校门，有点紧张，却还带着光。",
      src: "assets/videos/suli_2019.mp4" },
    { id: "suli_2021", period: "2021 · 社团", trigger: { kind: "level", level: 1 }, icon: "🔐",
      desc: "密码学社最热闹的一年。她在黑板上写满密码，笑得没心没肺。",
      src: "assets/videos/suli_2021.mp4" },
    { id: "suli_2023", period: "2023 · 消失前", trigger: { kind: "level", level: 2 }, icon: "🌧️",
      desc: "毕业最后一晚的天台。雨里，她望着城市的灯，已经不像从前那样笑了。",
      src: "assets/videos/suli_2023.mp4" },
    { id: "suli_echo", period: "残响 · 岚", trigger: { kind: "level", level: 3 }, icon: "💠",
      desc: "你站在 root 之后，才会看见的——她化作青色数据流，留在系统里的最后一缕回声。",
      src: "assets/videos/suli_echo.mp4" },

    /* —— 其他角色 —— */
    { id: "chenyu_edit", period: "监控 · 篡改成绩", trigger: { kind: "file", path: "/var/log/auth.log" }, icon: "🖥️",
      desc: "2022.12.24 22:14 的教务系统操作录屏残影：陈宇的账号在悄悄修改 7 个人的成绩。",
      src: "assets/videos/chenyu_edit.mp4" },
    { id: "chenyu_solo", period: "陈宇 · 独白", trigger: { kind: "meta" }, icon: "🎙️",
      desc: "真相大白之后，陈宇对着空教室说完的那段话——他改分，是因为王老师逼他去搅浑痕迹。",
      src: "assets/videos/chenyu_solo.mp4" },
    { id: "chenyu_club", period: "陈宇 · 退社", trigger: { kind: "level", level: 2 }, icon: "📋",
      desc: "密码学社旧名册里，『陈宇』那一栏被红笔圈过，旁边写着『已退社·原因不明』。",
      src: "" },
    { id: "wang_door", period: "王老师 · 体育馆拦人", trigger: { kind: "file", path: "/root/truth/evidence.txt" }, icon: "🚪",
      desc: "12.24 当晚，王老师（王浩之父）在体育馆门口拦人，把苏黎叫去了办公室，再没回来上课。",
      src: "assets/videos/wang_door.mp4" },
    { id: "li_post", period: "李老师 · 公示成绩", trigger: { kind: "level", level: 2 }, icon: "📊",
      desc: "班主任李老师把改过的分数贴上了公示墙，谁都没多看一眼那 7 个名字。",
      src: "" },
    { id: "witness_gym", period: "匿名证人 · 体育馆内", trigger: { kind: "file", path: "/root/truth/witness.md" }, icon: "🕵️",
      desc: "匿名用户X的证词残影：他声称在体育馆外，但更高权限与日志会把这句话反过来。",
      src: "assets/videos/witness_gym.mp4" },

    /* —— 地点 / 场景 —— */
    { id: "playground_night", period: "操场 · 夜", trigger: { kind: "level", level: 1 }, icon: "🌃",
      desc: "你解码出苏黎照片 EXIF 的那片操场，深夜空无一人，却亮着一盏灯。",
      src: "" },
    { id: "rooftop_rain", period: "天台 · 雨夜", trigger: { kind: "level", level: 2 }, icon: "🌧️",
      desc: "毕业前最后一晚的天台。雨里，她望着城市的灯，已经不像从前那样笑了。",
      src: "assets/videos/rooftop_rain.mp4" },
    { id: "monitor_room", period: "监控室 · 全景", trigger: { kind: "level", level: 2 }, icon: "📹",
      desc: "监控室里六块屏同时亮着，记录着 12.24 当晚每一个人进出体育馆的时间。",
      src: "" },
    { id: "jiaowu_screen", period: "教务处 · 操作录屏", trigger: { kind: "level", level: 3 }, icon: "💻",
      desc: "root 视角下，教务系统的操作日志完整回放：谁改的分、谁撤的处分，一目了然。",
      src: "assets/videos/jiaowu_screen.mp4" },
    { id: "classroom_empty", period: "教室 · 空", trigger: { kind: "level", level: 3 }, icon: "🪑",
      desc: "高三(7)班的教室空了。黑板上还留着半截没擦掉的板书，和她的名字。",
      src: "" },
    { id: "gym_1224", period: "体育馆 · 12.24", trigger: { kind: "board" }, icon: "🏟️",
      desc: "推理板拼齐之后，那一晚在体育馆里发生的事，第一次有了清楚的轮廓。",
      src: "" },

    /* —— 元叙事 / 收束 —— */
    { id: "timeline_turn", period: "时间线 · 转折", trigger: { kind: "timeline" }, icon: "⏳",
      desc: "当你把十二件事排成线，2022.12.24 像一道伤口——之前是日常，之后一切都变了。",
      src: "" },
    { id: "board_report", period: "推理板 · 报告", trigger: { kind: "board" }, icon: "🧩",
      desc: "六问全对后生成的侦探报告：谁改的分、谁灭的口、谁在那一晚消失了。",
      src: "" },
    { id: "suli_lastpost", period: "苏黎 · 最后一条动态", trigger: { kind: "lore" }, icon: "📝",
      desc: "她停在 6 月 17 号的那条动态：『如果有一天我不在了，记得替我看一眼操场。』",
      src: "" },
    { id: "meta_truth", period: "守门人 · 真章", trigger: { kind: "meta" }, icon: "🔥",
      desc: "『青岚不灭』——你读到了守门人真章，也接过了她没说完的话。",
      src: "" },

    /* —— v6 深层叙事 —— */
    { id: "diary3_read", period: "苏黎 · 第三本日记", trigger: { kind: "file", path: "/home/suli/diary_3.txt" }, icon: "📓",
      desc: "她写：陈宇只是替罪羊，真正的手在更上层；并提醒你——匿名X 连自己站在哪都说不清。",
      src: "" },
    { id: "ledger_reveal", period: "总表 · 档案室", trigger: { kind: "verdict" }, icon: "🗂️",
      desc: "你读完了原始成绩总表：王浩九月就被垫高，比 12 月那次篡改早三个月。系统性舞弊，坐实了。",
      src: "" },
    { id: "systemic_truth", period: "结局 · 系统性真相", trigger: { kind: "systemic" }, icon: "⛓️",
      desc: "陈宇执行、王老师现场施压/包庇、教务处是系统性源头——整条链在你眼前浮现。这是苏黎想让人看见的真相。",
      src: "" },
    { id: "deep_truth", period: "守门人 · 真相之下", trigger: { kind: "deep" }, icon: "🌌",
      desc: "你拼出『青岚不灭』，又解开第二层自白，还看穿了整条链。苏黎没有消失，她把真相交给了你。",
      src: "" },
    { id: "contra_break", period: "矛盾 · 崩塌", trigger: { kind: "contradiction" }, icon: "🔫",
      desc: "三句证词被一句句对质击穿的瞬间：陈宇的『独自一人』、匿名X的『从没碰过系统』、通报的『跟老师无关』，在同一块屏幕上同时碎掉。谎言塌了，那一晚第一次站直了。",
      src: "" }
  ],

  /* ---------------- 套娃①：伪校园官网（Her Story 式站内搜索） ---------------- */
  web: {
    home: {
      title: "青岚一中 · 校园门户",
      body: "<p>欢迎来到青岚一中校园门户（离线镜像）。</p>" +
            "<p>本站为只读副本。部分栏目需权限，『内部教务系统』需登录。</p>" +
            "<p class='muted'>站内搜索：试试搜 『苏黎』『成绩』『篡改』『12.24』『匿名』。</p>"
    },
    pages: {
      notice: {
        title: "公告栏",
        ghost: true,
        body: "<p>【2022.12.25 成绩复核公告】</p>" +
              "<p class='ghost-text'>（此公告已被部分删除，仅剩残影——以管理员身份查看，能看清被划掉的那句。）</p>" +
              "<p class='ghost-text'>『……经复核，高三(7)班共 7 名同学成绩存在异常波动，已启动内部调查。详情见内部教务系统。』</p>" +
              "<p class='muted'>残影里反复出现一个词：12.24。这晚发生了什么？</p>"
      },
      jiaowu: {
        title: "教务系统（公开入口）",
        body: "<p>成绩查询、课表、学籍异动，请登录『内部教务系统』。</p>" +
              "<p class='muted'>公开入口看不到深层数据。苏黎的测试账号口令，你应当在照片里已经拿到了。</p>"
      },
      alumni: {
        title: "校友墙",
        hiddenBoard: true,
        body: "<p>历届校友留言板。</p>" +
              "<p>苏黎（2023 届）：『有些人想让那一晚被忘掉。我不答应。』</p>" +
              "<p class='muted'>（页面底部有一行极小的链接：『匿名留言板』——点它。）</p>"
      },
      board: {
        title: "匿名留言板",
        body: "<p>这里谁都可以说，谁都不必负责。</p>" +
              "<p>匿名X：『12.24 晚我在体育馆外，看见陈宇进去，王老师在门口拦人。苏黎后来被王老师叫去办公室，再没回来上课。』</p>" +
              "<p class='muted'>（这段话，在 💬青岚聊 里那位『匿名用户X』也说过了——两处对照着看。）</p>"
      },
      revisions: {
        title: "公告修订记录（管理员缓存）",
        level: 2,
        body: "<p>【2022.12.25 成绩复核公告 · 修订记录】</p>" +
              "<pre class='mono'>08:01 初稿：7 人成绩异常，暂缓公示。\n08:17 修订：改为『成绩复核无误』。\n08:23 删除附件：处分记录_被撤回_3份.pdf。\n08:31 备注：按要求保留公开口径，内部处理。</pre>" +
              "<p class='muted'>机器缓存只记录版本差异，不解释谁要求修订。要判断因果，得回到聊天、日志和时间线。</p>"
      },
      internal: {
        title: "内部教务系统",
        login: true,
        body: "<p>请输入账号口令登录。（提示：苏黎的测试账号 suli，口令在那张操场照片的 EXIF 里。）</p>",
        compare: {
          student: "【以 学生(suli) 身份】\n我的成绩，和班主任公示版对不上。\n有 7 个人，分都被悄悄动过。但我登不进更深层。",
          admin:   "【以 管理员 身份】原始分 vs 改后分 对比表：\n陈宇、李雯、王浩、张可、赵磊、周敏、孙倩 —— 7 人，集中在 2022.12.24 前后。\n页脚校验码：6Z2S（这串 base64 解出来，是一个字——它也是某处『印记』之一）。",
          root:    "【以 root 身份】操作记录：\n2022.12.24 22:14  chenyu 于 内部教务系统 修改 7 人成绩。\n2022.12.25 00:30 wanghao 于 内部教务系统 撤回 3 份处分记录。\n—— 谁改的、谁灭的口，一目了然。\n（但 root 日志还藏着更早的一笔：2022.09 王浩的分数被提前垫高。查 /var/log/jiaowu_op.log。）"
        }
      },
      system: {
        title: "教务处 · 内部通告（仅 root）",
        level: 3,
        body: "<p>【教务处内部通告 · 系统归档】</p>" +
              "<p>关于『体优生加分』的口径：本年度起，相关名额由教务处在系统端直接核定，<b>不另行公示</b>。</p>" +
              "<p class='ghost-text'>（这行字底下，还有一行被划掉的：『王浩 之事，勿外传。』）</p>" +
              "<p class='muted'>—— 系统性舞弊，不是一个人的事。它从『不公示』这三个字就开始了。原始总表在档案室，苏黎的 diary_3 也写过。</p>"
      }
    },
    // 站内搜索：关键词 → 页面 key
    search: {
      "苏黎": "alumni", "校友": "alumni",
      "成绩": "notice", "篡改": "notice", "复核": "notice", "公告": "notice",
      "撤回": "revisions", "处分": "revisions", "修订": "revisions", "修订记录": "revisions",
      "12.24": "internal", "体育馆": "internal", "内部": "internal", "教务": "jiaowu",
      "匿名": "board", "留言": "board", "门户": "home", "首页": "home",
      "教务处": "system", "舞弊": "system", "总表": "system", "加分": "system"
    },
    notfound: {
      title: "404 / 权限不足",
      body: "<p>这个页面不存在，或者你的权限还看不到它。</p><p class='muted'>（有些入口，得先拿到对应的身份。）</p>"
    }
  },

  /* ---------------- 套娃②：伪聊天 App「青岚聊」 ---------------- */
  chat: {
    contacts: [
      { id: "suli", name: "苏黎", online: false,
        msgs: [
          { from: "suli", text: "最近教务系统怪怪的，我那个测试账号还能登。" },
          { from: "suli", text: "我导出了自己的成绩，和墙上公示的对不上。7 个人。" },
          { from: "suli", text: "但内部系统的深层密码被人改过，我进不去了。改分的人，比我想的在行。" }
        ] },
      { id: "chenyu", name: "陈宇", online: false,
        msgs: [
          { from: "chenyu", text: "你最好别多事。" },
          { from: "chenyu", text: "有些事查清楚了对谁都没好处。", encrypted: true, key: "QINGLAN",
            plain: "别查了。再查，你就和你姐一个下场。【密令：PROJECT QINGLAN】" }
        ] },
      { id: "wanglaoshi", name: "王老师", online: false,
        msgs: [
          { from: "wanglaoshi", text: "苏黎啊，有些事别深究，对你不好。" },
          { from: "wanglaoshi", text: "12 月那晚你没看见什么，对吧？忘了它。" }
        ] },
      { id: "lilaoshi", name: "李老师", online: false,
        msgs: [
          { from: "lilaoshi", text: "公示成绩那天，我只是照系统贴出来。可系统里的数字，不是从天上掉下来的。", level: 1 },
          { from: "lilaoshi", text: "（高权限残影）是我让王老师去拦人的。教务处说『先稳住学生』，他说他能处理。后来我才明白，所谓处理，就是让她离开这所学校。", level: 2 }
        ] },
      { id: "anon", name: "匿名用户X", online: true,
        msgs: [
          { from: "anon", text: "12.24 晚我在体育馆外，看见陈宇进去，王老师在门口拦人。" },
          { from: "anon", text: "苏黎后来被王老师叫去办公室，再没回来上课。", fragB: "5bKa" },
          { from: "anon", text: "（……其实那晚我在体育馆『里面』，不是外面。我是王浩。陈宇替我爸顶了罪，我不想让他一个人扛——可我也怕说出来，因为垫高的就是我。所以前面那句『在馆外』，是我撒的。你别全信我说的，也别全信陈宇的。总表在档案室，自己去看。）", level: 2, reveal: true }
        ] }
    ]
  },

  /* ---------------- 套娃③：伪校园地图（空间探索 + 监控日志） ---------------- */
  map: {
    places: [
      { id: "gate",    name: "校门",   x: 50, y: 92 },
      { id: "dorm",    name: "宿舍",   x: 16, y: 78 },
      { id: "gym",     name: "体育馆", x: 30, y: 52, note: "2022.12.24 事件中心——这里有多份互相矛盾的证词。注意：这一晚不等于苏黎消失的那晚。",
        personIds: ["chenyu", "wanghao", "wanglaoshi"], clueIds: ["c_auth", "c_witness"], footageIds: ["gym_1224", "witness_gym"] },
      { id: "office",  name: "办公楼", x: 72, y: 38, note: "苏黎被王老师带进去『谈话』后，直到来年 6 月才以『转学』离校——两件事隔了半年，别混为一谈。",
        personIds: ["suli", "wanglaoshi", "lilaoshi"], clueIds: ["c_li", "c_timeline"], footageIds: ["wang_door"] },
      { id: "roof",    name: "天台",   x: 56, y: 16, note: "苏黎拍最后一张照片的地方。",
        personIds: ["suli"], clueIds: ["c_timeline"], footageIds: ["rooftop_rain"] },
      { id: "archive", name: "档案室", x: 82, y: 70, note: "原始成绩总表的备份曾在这里。这里更像答案确认，不是第一手推理入口。",
        personIds: ["suli", "wanghao"], clueIds: ["c_ledger", "c_scorewall"], footageIds: ["ledger_reveal"] },
      { id: "monitor", name: "监控室", x: 44, y: 44, level: 2,
        personIds: ["chenyu", "wanghao", "suli"], clueIds: ["c_auth"], footageIds: ["monitor_room", "chenyu_edit"],
        log: "监控日志（需管理员及以上可见）：\n2022.12.24 22:14  chenyu 刷卡进入体育馆。\n2022.12.24 22:40  苏黎被王老师带入办公楼。\n日志附注字段 HEX: e781ad（这串 hex 解出来，是某处『印记』之一）。" }
    ]
  },

  /* ---------------- 推理机制①：时间线重建 ---------------- */
  timeline: {
    turningPoint: "2022.12.24",
    note: "关键陷阱：『12.24 篡改夜』与『06.17 最后在线 / 离校夜』是两回事。误导性叙事常把两夜混为一谈，让人以为苏黎当晚就消失了——其实她又追查了半年。",
    events: [
      { id: "e1", date: "2021.03",    text: "密码学社成立，苏黎加入，成了社里最较真的人。" },
      { id: "e2", date: "2022.09.01", text: "开学分班高三(7)。陈宇已被王老师（王浩之父）拉拢成『贴心帮手』。" },
      { id: "e3", date: "2022.09.12", text: "王浩（王老师之子）的成绩被教务处提前垫高——系统性舞弊的第一步，比 12 月早三个月（root 日志可见）。" },
      { id: "e4", date: "2022.11",    text: "苏黎导出成绩，发现 7 人分数异常，开始起疑。" },
      { id: "e5", date: "2022.12.24", text: "体育馆之夜：苏黎找到原始成绩总表；当晚陈宇被王老师逼着改分，搅浑痕迹（本案转折）。" },
      { id: "e6", date: "2022.12.25", text: "成绩复核公告发出，次日即被部分删除。" },
      { id: "e7", date: "2023.01",    text: "苏黎复查受阻：内部教务系统密码被人改过，进不去深层。" },
      { id: "e8", date: "2023.03",    text: "守门人线索浮现——苏黎开始把证据『留给下一个会破解的人』。" },
      { id: "e9", date: "2023.05.20", text: "苏黎继续追查，藏好证据链；并意识到陈宇是替罪羊。" },
      { id: "e10", date: "2023.06.17", text: "苏黎最后在线（登录日志为证）。" },
      { id: "e11", date: "2023.06.20", text: "苏黎以『转学』之名离校——是被请离，不是消失。" },
      { id: "e12", date: "2024.01.02", text: "系统镜像化，校园网转为离线只读。" }
    ],
    correctOrder: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12"]
  },

  /* ---------------- 推理机制②：跨媒介元谜题（二阶） ---------------- */
  metapuzzle: {
    frags: {
      A: { from: "🌐官网 · 内部教务系统（管理员视角页脚校验码）", cipher: "decode b64 6Z2S", value: "青" },
      B: { from: "💬青岚聊 · 匿名用户X 第二条消息", cipher: "decode b64 5bKa", value: "岚" },
      C: { from: "🖼️相册 · 天台_夜.jpg 增强后浮现的水印", cipher: "图片增强", value: "不" },
      D: { from: "🗺️地图 · 监控室日志附注 HEX", cipher: "decode hex e781ad", value: "灭" }
    },
    order: ["A", "B", "C", "D"],
    answer: "青岚不灭",
    rule: "集齐 官网 / 聊天 / 图片 / 地图 四处印记，按 网→聊→图→地 顺序连读，即为『守门人密语』。在推理板里提交，或在终端 submit 青岚不灭。",
    stage2: {
      key: "QINGLANBUMIE",
      keyHint: "密钥＝『青岚不灭』的拼音（全大写连写）",
      cipher: "苟黖沮朏涓失。妆抋眳眄京绝亖专不丰宓门仇。眠歷覍宐皈丝昷不丰吘字，耙昰2022.12.24邷丌晢皈眯眀——宐皊扖在敦劢夘，丙地陌宗丈丷什躶上。",
      plain: "苏黎没有消失。她把真相交给了下一个守门人。真正要守的不是一个名字，而是2022.12.24那一晚的真相——它的手在教务处，不在陈宇一个人身上。"
    }
  },

  /* ---------------- 推理机制③：推理板 / 假设验证 + 最终结论 ---------------- */
  board: {
    questions: [
      { q: "谁篡改了那 7 个人的成绩（12.24 当晚）？", options: ["陈宇", "李雯", "王浩", "苏黎"], answer: 0,
        evidenceOptions: ["witness.md 的蓝墨渍/跛脚，与 auth.log 当晚在线名单交叉", "diary_1.txt 里苏黎写了自己的名字", "匿名X 说他在馆外，所以陈宇必然独自行动", "照片 EXIF 解出 suli 账号"],
        evidenceAnswer: 0 },
      { q: "篡改发生在哪一天？", options: ["2022.09 开学", "2022.12.24", "2023.01", "2023.06 毕业"], answer: 1,
        evidenceOptions: ["auth.log 与内部教务记录都指向 2022.12.24 的改分操作", "最后在线日期是 2023.06.17，所以改分也在那晚", "王浩九月被垫高，说明所有改分都发生在九月", "2024 镜像化启动就是案发时间"],
        evidenceAnswer: 0 },
      { q: "谁执行拦截，并把苏黎带离现场？", options: ["王老师", "校长", "陈宇自作", "无人"], answer: 0,
        evidenceOptions: ["匿名板写王老师拦人；青岚聊李老师高权限自白证实教师层让他出面", "密码学社旧帖圈出陈宇退社", "天台照片日期是 06.17", "回收站 root 碎片 A 能解出 q1ng"],
        evidenceAnswer: 0 },
      { q: "苏黎最后怎样了？", options: ["转学（校方安排）", "主动退学", "留级", "仍在读"], answer: 0,
        evidenceOptions: ["校务公告写转学，auth.log 记录她 2023.06.17 最后在线，时间线显示 06.20 离校", "匿名X 说她 12.24 当晚就消失", "未命名照片 EXIF 是 ILUS", "管理员草稿说 root 密钥有三片"],
        evidenceAnswer: 0 },
      { q: "谁在 2022.09（比 12 月早三个月）就把王浩的分数垫高了？", options: ["教务处", "陈宇", "王老师", "苏黎"], answer: 0,
        evidenceOptions: ["jiaowu_op.log 记录 2022.09.12 jiaowu 操作王浩分数", "auth.log 只有 12.24 的体育馆登录", "witness.md 只描述蓝墨渍与跛脚", "论坛树洞提到 6 月 17 号"],
        evidenceAnswer: 0 },
      { q: "匿名证人X 自称在体育馆『外』，但登录日志显示王浩当晚在馆『内』。这说明？", options: ["X 在隐瞒 / 说谎", "X 记错无关紧要", "日志是伪造的", "苏黎当晚不在场"], answer: 0,
        evidenceOptions: ["青岚聊高权限坦白『我是王浩』，与 auth.log 的馆内登录互相印证", "官网页脚校验码能解出『青』", "成绩复核公告被删除", "王老师让苏黎忘掉 12 月那晚"],
        evidenceAnswer: 0 }
    ],
    /* 最终结论：三环都填对，才通向『系统性真相』最优结局；
       把幕后归给王老师个人＝只看到第一层；归罪苏黎＝抓错人。 */
    verdict: {
      prompt: "六组证据链全对后，这里才会出现『最终结论』。把三环都填上，再点『定案』——不同的结论，通向不同的结局。",
      steps: [
        { key: "exec",   label: "① 谁执行了 12.24 的改分？",   options: ["陈宇", "李雯", "王浩", "苏黎"] },
        { key: "cover",  label: "② 谁直接施压 / 包庇现场？", options: ["王老师", "校长", "陈宇自作", "无人"] },
        { key: "master", label: "③ 真正的幕后是谁？",           options: ["教务处（系统）", "王老师", "陈宇（独狼）", "王浩"] }
      ],
      correct: { exec: 0, cover: 0, master: 0 },
      surfaceIf: { master: 1 },
      wrongIf: { exec: 3 }
    }
  },

  /* ---------------- 矛盾指认（参考 Danganronpa「真相子弹」+ Obra Dinn「言证 vs 物证」+ Her Story 证词交叉） ----------------
     三句有人信的证词，分别来自三个不同「视角/界面」。玩家要把每句，指认给能戳穿它的那条系统记录——
     系统从不说哪条是证据，得玩家自己从各界面交叉比对、自己判断（Obra Dinn 核心：证据不自明）。 */
  contradictions: {
    prompt: "📣 三句证词，句句都有人信。但系统留下的『记录』不会撒谎。\n把每句证词，指认给能戳穿它的那条证据——像把『真相子弹』打在矛盾点上。三句全破，谎言就塌了。",
    items: [
      {
        id: "c1",
        speaker: "陈宇（监控独白）",
        statement: "那晚就我一个人进了体育馆，这事没人知道。",
        options: [
          "auth.log：王浩 2022.12.24 22:05 体育馆内登录",
          "苏黎日记：陈宇只是替罪羊",
          "照片 EXIF：SULI",
          "公告：成绩已复核无误"
        ],
        answer: 0,
        explain: "auth.log 显示同一晚王浩也在馆内——陈宇『只有我一个人』不成立。"
      },
      {
        id: "c2",
        speaker: "匿名X（对外宣称）",
        statement: "我的分数跟这事无关，都是陈宇 12.24 之后才乱起来的。",
        options: [
          "陈宇独白：我一个人改的",
          "jiaowu_op.log：王浩 2022.09.12 被提前垫高（早于陈宇 12.24）",
          "地图：体育馆在北区",
          "李老师：这事与学生无关"
        ],
        answer: 1,
        explain: "jiaowu_op.log 证明王浩（即匿名X）的分数九月已被提前垫高，比陈宇 12.24 早三个月——『跟这事无关』站不住。"
      },
      {
        id: "c3",
        speaker: "某官方通报 / 王老师口径",
        statement: "就是个学生一时糊涂，跟老师、跟学校制度没关系。",
        options: [
          "时间线：06.17 离校夜",
          "李老师聊天自白：是我让王老师去拦人的",
          "元谜题：青岚不灭",
          "相册：未命名_加密.jpg"
        ],
        answer: 1,
        explain: "李老师聊天记录证实教师层参与了拦截安排——『跟老师无关』被当事记录戳穿。"
      }
    ]
  },

  /* ---------------- 线索笔记本（参考 Blue Prince / Obra Dinn ledger：把所有发现的碎片聚到一处，方便交叉比对） ----------------
     每条线索带 unlock 条件；未解锁时只给「去哪找」的提示，不剧透内容。 */
  clues: [
    { id: "c_auth",    cat: "系统记录", title: "auth.log：当晚登录", src: "/var/log/auth.log",
      summary: "王浩 2022.12.24 22:05 体育馆内登录；陈宇在改分终端操作。", unlock: { file: "/var/log/auth.log" }, hint: "终端 cat /var/log/auth.log", tags: ["日期:12.24", "地点:体育馆", "人物:王浩", "人物:陈宇"] },
    { id: "c_jiaowu",  cat: "系统记录", title: "jiaowu_op.log：九月垫高", src: "/var/log/jiaowu_op.log",
      summary: "王浩 2022.09.12 被提前垫高，比陈宇 12.24 早三个月——系统性舞弊的起点。", unlock: { file: "/var/log/jiaowu_op.log" }, hint: "root 下读 /var/log/jiaowu_op.log", tags: ["日期:09.12", "人物:王浩", "系统:教务"] },
    { id: "c_evidence",cat: "物证",     title: "evidence.txt：操作账号 admin 级", src: "/root/truth/evidence.txt",
      summary: "改分用的是 admin 级账号，学生拿不到——说明有校内权限者参与。", unlock: { file: "/root/truth/evidence.txt" }, hint: "root 下读 /root/truth/evidence.txt", tags: ["系统:权限", "日期:12.24"] },
    { id: "c_witness", cat: "言证",     title: "witness.md：匿名X 亲历", src: "/root/truth/witness.md",
      summary: "匿名X 称在馆外，看见陈宇进去、苏黎后来被叫走。", unlock: { file: "/root/truth/witness.md" }, hint: "root 下读 /root/truth/witness.md", tags: ["人物:匿名X", "地点:体育馆", "言证"] },
    { id: "c_export",  cat: "物证",     title: "苏黎导出成绩片段", src: "/home/suli/export_scores.csv",
      summary: "苏黎导出的成绩与公示版对不上，7 个名字被她圈出；这只证明异常，不证明责任。", unlock: { file: "/home/suli/export_scores.csv" }, hint: "学生账号读 /home/suli/export_scores.csv", tags: ["成绩", "人物:苏黎", "人物:王浩"] },
    { id: "c_scorewall",cat: "物证",    title: "公示成绩墙残影", src: "/home/admin/score_wall_archive.txt",
      summary: "管理员缓存里保留了公示墙残影，王浩旁边有苏黎的『九月痕迹』标注。", unlock: { file: "/home/admin/score_wall_archive.txt" }, hint: "管理员读 /home/admin/score_wall_archive.txt", tags: ["成绩", "公示墙", "人物:王浩"] },
    { id: "c_revisions",cat: "系统记录",title: "公告修订记录", src: "官网搜索：撤回 / 处分 / 修订",
      summary: "公告从『暂缓公示』被改成『复核无误』，并删除了 3 份处分记录附件。", unlock: { web: "revisions" }, hint: "管理员权限下在 🌐官网 搜『撤回』或『修订』", tags: ["官网", "处分", "日期:12.25"] },
    { id: "c_diary3",  cat: "言证",     title: "苏黎第三本日记", src: "/home/suli/diary_3.txt",
      summary: "苏黎开始怀疑 12 月改分不是全部真相，并提醒要用完整日志核对匿名X的位置。", unlock: { file: "/home/suli/diary_3.txt" }, hint: "学生账号读 /home/suli/diary_3.txt", tags: ["人物:苏黎", "人物:陈宇", "人物:匿名X"] },
    { id: "c_note2",   cat: "物证",     title: "notes2.txt：王老师之子", src: "/home/admin/notes2.txt",
      summary: "王浩＝王老师之子；舞弊是教务处系统性的，不是一人。", unlock: { file: "/home/admin/notes2.txt" }, hint: "管理员读 /home/admin/notes2.txt" },
    { id: "c_ledger",  cat: "物证",     title: "成绩总表 ledger.txt", src: "/root/truth/ledger.txt",
      summary: "原始分 vs 改后分，系统性舞弊的核心账本。", unlock: { verdict: true }, hint: "在 🧩推理板 完成『最终结论』定案后解锁" },
    { id: "c_anon",    cat: "言证",     title: "匿名X 高权限坦白", src: "青岚聊",
      summary: "『我是王浩……前面那句在馆外是我撒的。』", unlock: { level: 2 }, hint: "升到管理员(level2)后看青岚聊匿名X" },
    { id: "c_li",      cat: "言证",     title: "李老师聊天自白", src: "青岚聊",
      summary: "『是我让王老师去拦人的。』", unlock: { level: 2 }, hint: "升到管理员(level2)后看青岚聊" },
    { id: "c_timeline",cat: "系统记录", title: "时间线：两夜分离", src: "🕒 时间线",
      summary: "12.24 是篡改夜；06.17 是苏黎最后在线；06.20 才是离校。", unlock: { timeline: true }, hint: "在 🕒时间线 排出 12 件事的正确顺序" },
    { id: "c_meta",    cat: "元叙事",   title: "守门人真章 legacy.txt", src: "/root/truth/legacy.txt",
      summary: "青岚不灭 + 第二层维吉尼亚自白。", unlock: { meta: true }, hint: "提交守门人密语『青岚不灭』解锁" }
  ],

  people: [
    { id: "suli", name: "苏黎", role: "学生 / 留下线索的人", level: 0,
      public: "她的账号、照片和便签构成了进入系统的第一层入口。",
      deeper: "她不是结论本身；她留下的是一套让后来者自行证明的证据路径。",
      relatedClues: ["c_export", "c_diary3", "c_timeline", "c_meta"] },
    { id: "chenyu", name: "陈宇", role: "高三(7)班学生", level: 1,
      public: "多份材料都把 12.24 的操作痕迹引向他，但单一证据不足以解释动机。",
      deeper: "他更像执行层的人。要区分“按键的人”和“让他按键的人”。",
      relatedClues: ["c_auth", "c_witness", "c_evidence"] },
    { id: "wanghao", name: "王浩 / 匿名X", role: "学生 / 王老师之子", level: 2,
      public: "他出现在成绩异常名单、匿名证词和登录记录里，位置与说法并不总一致。",
      deeper: "他的九月成绩异动早于 12.24，是判断幕后层级的关键。",
      relatedClues: ["c_auth", "c_jiaowu", "c_anon", "c_scorewall"] },
    { id: "wanglaoshi", name: "王老师", role: "体育组教师 / 王浩之父", level: 2,
      public: "证词与聊天残影都提到他在体育馆门口拦人。",
      deeper: "他是现场施压与包庇的人，但不能把系统性源头简化成他个人。",
      relatedClues: ["c_li", "c_witness", "c_note2"] },
    { id: "lilaoshi", name: "李老师", role: "班主任 / 公示者", level: 2,
      public: "她留下的聊天残影能证明教师层参与了“稳住学生”的安排。",
      deeper: "她不是最终答案，但她的证词能戳穿“跟老师无关”的公开口径。",
      relatedClues: ["c_li", "c_revisions"] }
  ],

  /* ---------------- 案情逻辑链（参考 Golden Idol / Obra Dinn：不是列答案，而是列“哪些推论已经被证据支撑”） ---------------- */
  logicChains: [
    {
      id: "score_gap",
      title: "前置层：公示分与导出分",
      question: "苏黎最初到底发现了什么异常？",
      requires: ["c_export", "c_scorewall", "c_revisions"],
      proof: "导出表、公示墙残影和公告修订记录彼此对上：7 个名字在公开成绩、缓存附件和修订痕迹中反复出现。",
      whyItMatters: "这一步只证明“有异常且被改口”，还不能证明幕后是谁。"
    },
    {
      id: "surface",
      title: "第一层：12.24 的执行者",
      question: "谁实际操作了 7 人改分？",
      requires: ["c_auth", "c_witness", "c_evidence"],
      proof: "登录日志限定当晚在场账号，证言描述蓝墨渍与跛脚，证据索引指向 admin 级改分记录；三者交叉，执行者才能被钉住。",
      whyItMatters: "这只能证明“谁按了键”，还不能证明“谁让他按”。"
    },
    {
      id: "two_nights",
      title: "第二层：两夜不能混",
      question: "12.24 篡改夜，和 06.17 最后在线是不是同一件事？",
      requires: ["c_auth", "c_timeline", "c_diary3"],
      proof: "auth.log 把苏黎最后在线钉在 2023.06.17，时间线显示她在 12.24 后仍继续追查；12.24 是改分夜，不是离校夜。",
      whyItMatters: "如果把两夜混成一晚，匿名X的误导就会变得像真相。"
    },
    {
      id: "anon_x",
      title: "第三层：匿名X 的位置谎言",
      question: "匿名X 到底站在体育馆外，还是馆内？",
      requires: ["c_auth", "c_anon", "c_jiaowu"],
      proof: "匿名X 高权限下承认自己是王浩；auth.log 记王浩在馆内；jiaowu_op.log 又显示王浩九月已被提前垫高。",
      whyItMatters: "他说的每句话都要打折扣，但他的谎言反而把更早的舞弊引了出来。"
    },
    {
      id: "systemic",
      title: "第四层：源头不是一个学生",
      question: "幕后是个人冲动，还是教务处系统性舞弊？",
      requires: ["c_jiaowu", "c_note2", "c_li"],
      proof: "notes2.txt 点出王浩与王老师关系；jiaowu_op.log 显示九月的教务处操作早于陈宇；李老师自白补上教师层参与的执行链。",
      whyItMatters: "这一步把案件从“找凶手”，推进到“看见制度”。"
    },
    {
      id: "final_gate",
      title: "第五层：守门人的资格",
      question: "只是知道答案，还是能把谎言逐条对质？",
      requires: ["c_meta"],
      flags: ["deepUnlocked", "contradictionDone"],
      proof: "青岚不灭打开真章，第二层自白解释苏黎留下系统的原因；矛盾指认则要求你把三句证词同时放上桌面核对。",
      whyItMatters: "终极结局要求的不是密码，而是完整的证明动作。"
    }
  ],

  /* ---------------- 幽灵角色：岚（苏黎留下的系统残响） ----------------
     v9 智能升级：每句台词支持三种形态——
       字符串        → 原样播出
       数组 [..]     → 随机抽一条（重玩有变化，去人机感）
       函数 (ctx)=>  → 按玩家真实进度返回上下文相关的台词（ctx 见 APPS.GHOST.ctx）
     ctx 字段：level / readAuth / readJiaowu / readEvidence / readWitness / readDiary3
              / readNote2 / readMeta / meta / deep / contra / verdict / lore */
  ghost: {
    greet: (c) =>
      (c.level >= 3 ? "你都站到 root 了，还来找我聊——也好，最后那段路，有人陪着不孤单。"
        : c.level >= 1 ? "拿到 suli 的账号了？她藏东西的地方，往往在你最不会翻的角落。"
        : "我是岚，苏黎留在这系统里的最后一缕回声。")
      + "\n想看她本来的样子，顶部 🎬影像 里有。也可以直接问我——陈宇、王浩、教务处，或者『下一步怎么走』。",
    onStudent: "你拿到了 suli 的账号……她把最要紧的东西，锁在了一封『加密便签』里（note.enc）。\n密钥是两个字拼成的——去密码学社的旧帖里找，和她最在意的『名字』有关。\n（社团只肯给谜面，不肯给答案，这点她一定喜欢。）\n对了，用这账号去 🌐官网 登『内部教务系统』，你能看见不一样的成绩。",
    onAdmin: "管理员了。去 /trash 翻翻被删掉的东西，还有我的邮件草稿。\nroot 的钥匙碎成三片，每片都要解码；别被那个作废的旧密钥 QL_ROOT_1997 骗了——那是陷阱。\n年份 C 别抄错：是她『最后在线』那年，不是出事那年。\n升到 admin，🗺️地图 的『监控室』也对你开了——那晚的监控日志还在。",
    onRoot: "root。你站在了我站过的位置。\n真相在 /root/truth——但别只盯着钥匙。\nevidence、witness、还有 auth.log 里 2022.12.24 那几行，三者交叉，才钉得死那个人。\n做完主链，再去集齐四处『印记』（官网/聊天/图片/地图），拼出『青岚不灭』——那才是守门人的真章。",
    onLore: [
      "又一块碎片亮了。集齐四块，你会看见我没说出口的那句话——四个印记连起来读。",
      "碎片又亮一块。它们在等你把它们拼成一句话。",
      "记着这枚印记。四个凑齐，谜底自己会浮上来。"
    ],
    onWrongRoot: "那串密钥不对。旧的那把 QL_ROOT_1997，早被他们废了，是故意留的陷阱。",
    onFootage: "你点开了影像。看见了吗——她不是符号，是真人。这也是『记得』的一部分。",
    onMeta: (c) => c.deep
      ? "『青岚不灭』你拼出来了，第二层自白你也解开了。下一个守门人，是你。"
      : "『青岚不灭』……你拼出来了。但真章里还有一层：把『青岚不灭』当密钥，拼音 QINGLANBUMIE，去解 legacy.txt 里那串维吉尼亚密文（decode vig QINGLANBUMIE <那串>）。那是我想对下一个守门人说的话。",
    onVerdict: (c) => ({
      surface: "你把『幕后』归给了王老师个人。可总表不会撒谎：王浩九月就被垫高，源头在教务处，不在某一个人。你只看到了第一层。",
      wrong:   "你把这桩事安在了苏黎自己头上。她才是追真相的人——你抓错了人。回去重看 evidence 和 auth.log。",
      systemic: "你给这一晚定了案——而且是钉在根上。陈宇执行，王老师现场施压/包庇，教务处是系统性源头。这才是我想让人看见的真相。"
    }[c.verdict] || "你给这一晚定了案。但记住——结论不同，意义不同。你钉住的，是第几层？"),
    onSystemic: (c) => c.readJiaowu
      ? "你看见了整条链：陈宇执行，王老师现场施压/包庇，教务处是系统性源头。你还翻出了 09.12 那笔垫高——那才是起点。下一个守门人，你合格了。"
      : "你看见了整条链：陈宇执行，王老师现场施压/包庇，教务处是系统性源头。这才是我想让人看见的真相。下一个守门人，你合格了。",
    onDeep: (c) => c.contra
      ? "你解开了第二层，还把三句证词也戳穿了。我没消失——我只是把真相交给了会破解它、也敢对质的人。守门人，不是一个人，是一晚的真相。"
      : "你解开了第二层。我没消失——我只是把真相交给了会破解它的人。守门人，不是一个人，是一晚的真相。",
    onContra: (c) => c.readJiaowu
      ? "你连 09.12 那笔垫高也翻出来了。三句证词一句句戳穿，谎言塌了，真相站住了。"
      : "你把三句证词，一句句戳穿了。说谎的人最怕的，不是被发现，是被对质。这一晚的真相，再也藏不住了。",
    onLedger: (c) => c.contra
      ? "你把碎片收进笔记本，还完成了矛盾指认。好侦探不是记住答案的人，是知道去哪翻证据、也敢对质的人。这页越厚，真相离你越近。"
      : "你开始把碎片收进笔记本了。好——侦探不是记住答案的人，是知道去哪翻证据的人。这页越厚，你离真相越近。",
    done: [
      "无论你选哪条路——谢谢你，看见了。",
      "走到这儿，是你自己把光点亮的。谢什么。",
      "记得就好。记得，也是一种回答。"
    ]
  },

  /* ---------------- 岚 · 双向对话主题路由（v9） ----------------
     玩家在岚窗口输入框 / 终端 talk 问问题，岚按关键词路由到上下文相关的回应。
     test：正则 或 小写关键词数组；reply：(ctx)=> 字符串 | 字符串数组（随机抽一条）。
     「下一步」类问题委托 GHOST.nudgeReply 计算最近未探索缺口。 */
  ghostDialog: [
    { test: ["你是谁", "苏黎", "岚是谁", "谁留下", "你是什么", "echo", "你是"],
      reply: () => [
        "我是岚。这系统里，我是苏黎留下的最后一缕回声——她没说完的话，我替她记着。",
        "苏黎的回声。她走了，但真相没走。我守在这里，等一个会破解它的人。" ] },
    { test: ["陈宇", "chenyu", "篡改", "替罪"],
      reply: (c) => c.readDiary3 ? [
        "陈宇是替罪羊。苏黎日记里写得很清楚——12.24 那晚他被动了手脚，可真正的手不只在他一个人身上。",
        "陈宇？表面上是他篡改成绩。但 diary_3 告诉我：他被推出来顶罪。别急着把罪名全安在他头上。" ]
        : [ "陈宇是表面上的『凶手』——12.24 篡改成绩。但我在日记里写过：他只是被推出来的人。你还没读 /home/suli/diary_3.txt，去读，真相会不一样。",
            "陈宇的事，公告只讲了一半。想知道他是不是替罪羊，先去读苏黎的第三本日记（suli 账号下）。" ] },
    { test: ["王浩", "匿名", "证人", "wanghao", "到底是谁", "谁干的"],
      reply: (c) => {
        if (c.readJiaowu && c.readWitness) return [
          "王浩就是匿名X。auth.log 记他 12.24 当晚在馆内，他却说自己在外面；高权限下他坦白『前面那句是我撒的』。而且 jiaowu_op.log 显示他 9 月就被垫高了——比陈宇早三个月。",
          "匿名X ＝ 王浩，王老师之子。他在馆内却谎称在馆外，九月还被提前垫高。这人串起了整条线。" ];
        if (c.readJiaowu) return "王浩是王老师之子，九月就被垫高了。匿名X 是不是他？你读过高权限下 X 的自白没有？两件对上就通了。";
        if (c.readWitness) return "匿名X 自称在馆外，可 auth.log 记王浩那晚在馆内。王浩就是 X——你还没把这两件对上。";
        return "匿名证人X 说自己当晚在馆外，看见陈宇进去。但日志记的是另一个位置。王浩这个名字，你之后会反复撞上。";
      } },
    { test: ["教务处", "王老师", "李老师", "系统性", "舞弊", "总表", "源头", "制度"],
      reply: (c) => (c.readNote2 || c.readJiaowu) ? [
        "教务处是系统性源头，不是一个人。王浩九月被垫高，陈宇半年后被逼搅浑——这是一套流程，不是一次冲动。",
        "王老师是现场施压和包庇的人，但总表 led 的是制度。真要追责，得看到 jiaowu_op.log 里那笔 09.12。" ]
        : [ "表面是陈宇一人，但往深里查——分数早被提前垫高，有校内权限者参与。升到管理员、root，你才看得见教务处那一层。",
            "别只盯陈宇。『跟老师无关』这句话，是当事人自己戳穿的。教务处那一层的真相，在更高权限里。" ] },
    { test: ["下一步", "怎么走", "卡住", "接下来", "线索", "提示", "怎么办", "该去", "哪里", "还差"],
      reply: (c) => (window.GHOST ? window.GHOST.nudgeReply(c) : "先破开苏黎相册里那张带 base64 的相片。") },
    { test: ["密码", "密钥", "口令", "怎么解", "怎么进", "怎么升", "账号", "root"],
      reply: () => [
        "密码学社的旧帖给过谜面：admin 口令藏在加密便签里，用『倒序 + hex』从苏黎的名字推出来。root 钥匙碎成三片，年份是她最后在线那年。",
        "别用那个作废的旧密钥 QL_ROOT_1997——那是陷阱。真密钥在你读到的三片碎片里。" ] },
    { test: ["结局", "最后", "真相", "结束", "收场", "怎么收"],
      reply: (c) => {
        if (c.deep && c.contra) return "你已到真相之下。现在去 💬岚 / 结局，选择怎么收场——交出去、让它睡着，还是成为守门人。";
        if (c.contra) return "矛盾指认你做完了，离真相只差把守门人真章第二层也解开（decode vig QINGLANBUMIE）。";
        if (c.verdict) return "你定了案（" + c.verdict + "）。不同结论通向不同结局——去 💬岚 / 结局 看看。";
        return "真相在 /root/truth，但要先集齐证据、做完推理板和矛盾指认。急不得。";
      } },
    { test: ["青岚不灭", "印记", "守门人", "真章", "legacy", "四印记"],
      reply: (c) => c.deep ? [
        "守门人真章第二层你也解开了。青岚不灭——下一个守门人，是你。",
        "四印记拼成『青岚不灭』，真章里还有维吉尼亚自白。你都走到了。" ]
        : c.meta ? [
        "『青岚不灭』你拼出来了，但真章里还有一层：把『青岚不灭』当密钥（拼音 QINGLANBUMIE）去解 legacy.txt 的维吉尼亚密文。",
        "守门人密语对了。下一步：decode vig QINGLANBUMIE <那串密文>，解开苏黎真正的自白。" ]
        : [ "官网、聊天、相册、地图各藏一枚印记，按顺序连读是『青岚不灭』。那是守门人的密语。",
            "集齐四处印记（网→聊→图→地），拼成『青岚不灭』，解锁守门人真章。" ] },
    { test: ["谢谢", "感谢", "再见", "拜拜", "辛苦", "谢了", "多谢"],
      reply: () => [
        "不用谢。是你自己把真相翻出来的——我只是把灯递给你。",
        "记得就好。记得，也是一种回答。" ] }
  ],

  /* ---------------- 结局 ---------------- */
  endings: {
    report:  { title: "结局 · 交出去", body:
      "你把 /root/truth 的一切导出、备份、发了出去。\n（连同你钉死的那个名字：陈宇。）\n很久以后，青岚一中的名字出现在一份通报里。\n没有人知道是谁按下的发送键，但苏黎留下的那些夜晚，终于有人看见了。\n\n——『有些光，是要有人先点亮才照得进来。』" },
    silence: { title: "结局 · 让它睡着", body:
      "你关掉了窗口。目录重新锁上，照片里的夜景还亮着。\n有些真相，被一个人带走，又被另一个人放下。青岚的操场依旧安静。\n但你知道它存在过——而这，也许就够了。\n\n——『记得，也是一种回答。』" },
    keeper:  { title: "隐藏结局 · 守门人", body:
      "四块碎片在你手里拼成了完整的一句话：记得真相。\n你没有交出，也没有遗忘——你成了下一个守门人。\n青岚的终端依然亮着，等着下一个会破解它的人。\n\n——『下一个读到这里的，会代替我成为守门人吗？』" },
    keeper_true: { title: "真·守门人 · 青岚不灭", body:
      "你拼出了『青岚不灭』，读到了守门人真章。\n你既没交出，也没遗忘，更没止步于『记得真相』四个字。\n你成了下一个守门人——带着苏黎没说完的话，守着这一晚。\n\n——『下一个读到这里的，会代替我成为守门人吗？』会。是你。" },
    /* —— v6 新增：结论分支结局 —— */
    surface: { title: "结局 · 你只看到了第一层", body:
      "你钉死了陈宇，也钉死了王老师。\n可在你的结论里，『幕后』只是王老师一个人——你漏了总表：王浩的分数九月就被垫高，源头在教务处。\n你解开了案子，却没解开系统。那一晚的真相，还睡着。\n\n——『看见一个人容易，看见一整套，要更狠的眼睛。』" },
    wrong: { title: "结局 · 你抓错了人", body:
      "你把罪名安在了苏黎自己头上。\n她追了半年的真相，最后被一个连站在哪都说不清的证人带偏，又被你亲手钉死。\n体育馆的监控还亮着，可没人替她说话了。\n\n——『最可怕的，不是真相被藏起来，是真相被你亲手改写了。』（重开页面，再试一次。）" },
    systemic: { title: "隐藏结局 · 系统性真相", body:
      "陈宇执行，王老师现场施压/包庇，教务处是系统性源头——你看见了整条链。\n苏黎没死，她只是被请离；可她留下的总表，终于有人读完了。\n你没把罪名塞给一个人，你把光打在了制度上。\n\n——『守门人守的从来不是某个人，是一晚不被抹去的真相。下一个，是你。』" },
    deep: { title: "真·守门人 · 真相之下", body:
      "你既拼出了『青岚不灭』，又解开了第二层自白；\n既看穿了整条链，又读完了总表。\n苏黎没有消失——她把真相交给了会破解它的人。\n你成了下一个守门人，带着她没说完的话，守着 2022.12.24 那一晚。\n\n——『下一个读到这里的，会代替我成为守门人吗？』会。是你。而且你比我看得更深。" },
    lockout: { title: "结局 · 系统锁定", body:
      "三次错误的 root 密钥。系统判定你在暴力破解，启动自锁。\n青岚的终端暗了下去。\n有些门，敲错太多次，就永远关上了。\n\n——（重开页面，再来一次。）" },
    deep_locked: { title: "结局 · 还差一步", body:
      "你拼出了『青岚不灭』，也解开了第二层自白——可你还没把那三句证词一句句戳穿。\n守门人守的不只是密码，是『对质』本身：让谎言在记录面前塌掉。\n回到 🧩 推理板，做完『矛盾指认』，再来这里。\n\n——『看得深，也得看得硬。』" }
  }
};
