# 🎞️ Skillloom

<div align="center">

**把 agent skill、工作流或微型工具说明，织成一张有门面的 README hero 和一页式产品卡片。**

`skill manifest` → `tasteful hero` → `launch-ready HTML` → `copyable README block`

![Skillloom](https://img.shields.io/badge/weekly-lab-191919?style=flat-square)
![Generative UI](https://img.shields.io/badge/generative-ui-d56a33?style=flat-square)
![Agent Skills](https://img.shields.io/badge/agent-skills-0f7f76?style=flat-square)

</div>

> **一句话介绍**
> Skillloom 是一个零依赖的小型 generator：给它一个 skill/workflow 的 JSON manifest，它会产出一段可直接贴进 README 的 hero，以及一张适合独立发布的一页式 HTML 产品卡。

## 本周为什么做它

本周观察到的 GitHub 公开信号，集中落在四个方向：

- [`steel-dev/awesome-web-agents`](https://github.com/steel-dev/awesome-web-agents) 最近仍在快速更新，说明 browser/agent workflows 继续扩张。
- [`wanxingai/LightAgent`](https://github.com/wanxingai/LightAgent) 最近更新到 2026-06-07，`skill + memory + MCP` 的轻量框架形态正在变热。
- [`CopilotKit/OpenGenerativeUI`](https://github.com/CopilotKit/OpenGenerativeUI) 最近更新到 2026-06-07，说明 “agent 不只回文本，而是直接回界面” 的表达方式越来越强。
- [`ZSeven-W/openpencil`](https://github.com/ZSeven-W/openpencil) 最近更新到 2026-06-07，AI-native design tool 对“把能力包装成有记忆点的界面”这件事在持续加码。

这些趋势有一个交叉空白：**很多 skill 和 workflow 已经很好用，但还没有一个足够轻、足够好看、足够容易复制的发布门面。**

## 本周候选方向

| Candidate | Heat | Taste | Scope | Solo Ship | Score / 10 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Browser QA Receipt | 9 | 8 | 6 | 7 | 7.8 |
| Skillloom | 8 | 10 | 9 | 9 | 9.0 |
| MCP Fit Scorecard | 8 | 6 | 9 | 9 | 8.0 |
| README Facelift Kit | 7 | 7 | 7 | 8 | 7.3 |

## 为什么选 Skillloom

它不是“再做一个平台”，而是给现有 skill / workflow 一个更体面的发布层。这个切口有三个优点：

- 小：一个 manifest 就能跑起来，不需要外部服务。
- 新：同时踩中 agent skills、generative UI、AI-native design 这三条近期信号。
- 可复用：未来这个仓库里的每周作品，也可以反过来用 Skillloom 做自己的展示页。

## 目录结构

```text
weeks/2026-06-08-skillloom/
├── README.md
├── package.json
├── sample/
│   └── browser-ritual.json
├── scripts/
│   └── render-skillloom.mjs
├── src/
│   └── skillloom.mjs
└── tests/
    └── skillloom.test.mjs
```

## 安装与使用

不需要安装依赖，Node.js 22+ 即可。

```bash
cd weeks/2026-06-08-skillloom
npm test
npm run build
open dist/index.html
```

默认会读取示例 manifest：`sample/browser-ritual.json`。

如果要换成自己的内容，照着这个结构写一个 JSON 文件，再运行：

```bash
node scripts/render-skillloom.mjs ./your-manifest.json ./dist
```

## 示例输出

Skillloom 会生成三个文件：

- `dist/index.html`：可直接打开的一页式产品卡
- `dist/README-hero.md`：可复制到仓库首页的介绍区
- `dist/summary.json`：供其他自动化步骤复用的简短摘要

示例场景是一个叫 **Browser Ritual Receipt** 的 launch card，用来演示“把 browser QA 能力包装成更像产品发布页”的样子。

## 自检方式

```bash
npm test
npm run build
```

当前测试覆盖的重点：

- manifest 校验
- README hero 生成
- HTML 输出关键区块
- summary 元数据生成

## 后续可以怎么扩展

- 加一个 `--theme` 参数，切换不同视觉气质
- 输出 Open Graph 图片模板
- 生成适配 GitHub README 的更紧凑 hero 版本
- 接到 skill 目录自动扫描，批量出卡片

## 附录：更新记录

### 2026-06-08

- 发布 Skillloom v0.1。
- 本周判断：`skill/workflow packaging` 比“再造一个新平台”更适合单人一周内独立发布。
- 用 `Browser Ritual Receipt` 作为示例 manifest，方便后续继续接回上周的 Browser QA 方向。
