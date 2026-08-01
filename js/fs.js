/* 虚拟文件系统：路径解析 / 列目录 / 读取 / 搜索，按账号 level 过滤 */
window.FS = (function () {
  const TREE = window.GAME.fs;

  function join(dir, name) {
    if (dir === "/") return "/" + name;
    return dir + "/" + name;
  }
  function normalize(parts) {
    const out = [];
    for (const p of parts) {
      if (p === "" || p === ".") continue;
      if (p === "..") { out.pop(); continue; }
      out.push(p);
    }
    return "/" + out.join("/");
  }
  function resolve(cwd, arg, home) {
    if (!arg || arg === ".") return cwd;
    if (arg === "~" || arg.startsWith("~/")) return normalize((home + arg.slice(1)).split("/"));
    if (arg.startsWith("/")) return normalize(arg.split("/"));
    return normalize((cwd + "/" + arg).split("/"));
  }
  function getNode(path) {
    // 允许末尾多余斜杠
    path = path.replace(/\/+$/, "") || "/";
    return TREE[path] || null;
  }
  function visible(node, level, showHidden) {
    if (!node) return false;
    if (node.level > level) return false;
    if (node.hidden && !showHidden) return false;
    return true;
  }
  function list(dirPath, level, showHidden) {
    const node = getNode(dirPath);
    if (!node || node.type !== "dir") return { error: "不是目录：" + dirPath };
    if (node.level > level) return { error: "权限不足（需 level " + node.level + "）" };
    const items = [];
    (node.children || []).forEach(name => {
      const child = getNode(join(dirPath, name));
      if (visible(child, level, showHidden)) {
        items.push({ name, type: child.type, hidden: !!child.hidden, deleted: !!child.deleted, level: child.level });
      }
    });
    return { items };
  }
  function read(filePath, level) {
    const node = getNode(filePath);
    if (!node) return { error: "文件不存在：" + filePath };
    if (node.type !== "file") return { error: "这不是文件：" + filePath };
    if (node.level > level) return { error: "权限不足（需 level " + node.level + "）" };
    if (node.locked) {
      const flag = node.locked === "meta" ? "metaUnlocked" : node.locked === "board" ? "boardDone" : "verdict";
      if (!window.STATE[flag]) {
        const hint = node.locked === "meta" ? "青岚不灭" : node.locked === "board" ? "侦探报告（推理板全对）" : "最终结论（推理板完成定案）";
        return { error: "权限不足（需先解锁：" + hint + "）" };
      }
    }
    return { content: node.content || "" };
  }
  function lockSatisfied(node) {
    if (!node || !node.locked) return true;
    const flag = node.locked === "meta" ? "metaUnlocked" : node.locked === "board" ? "boardDone" : "verdict";
    return !!window.STATE[flag];
  }
  function search(pattern, startPath, level) {
    const res = [];
    const lower = (pattern || "").toLowerCase();
    Object.keys(TREE).forEach(p => {
      const n = TREE[p];
      if (n.type !== "file" || n.level > level) return;
      if (!lockSatisfied(n)) return;
      if (startPath && !p.startsWith(startPath)) return;
      const lines = (n.content || "").split("\n");
      lines.forEach((ln, i) => {
        if (ln.toLowerCase().includes(lower)) res.push({ file: p, line: i + 1, text: ln });
      });
    });
    return res;
  }
  return { resolve, getNode, list, read, search, normalize };
})();
