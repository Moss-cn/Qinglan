#!/bin/bash
# 青岚一中校园网 · macOS 启动器
# 双击即可在默认浏览器中打开游戏（纯本地运行，无需联网）
DIR="$(cd "$(dirname "$0")" && pwd)"
open "$DIR/index.html"
