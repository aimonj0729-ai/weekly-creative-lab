# 🗺️ Approval Atlas

<div align="center">

**把 agent / MCP 的能力面从“工具列表”翻译成一张可审、可发、可留档的审批地图。**

`tool surface` → `risk hotspots` → `lane map` → `glossy HTML atlas`

![Approval Atlas](https://img.shields.io/badge/approval-atlas-191919?style=flat-square)
![MCP Surface](https://img.shields.io/badge/mcp-surface%20review-cf6d3c?style=flat-square)
![Weekly Lab](https://img.shields.io/badge/weekly-creative%20lab-5c7b73?style=flat-square)

</div>

> **一句话介绍**
> Approval Atlas 是一个零依赖 Node 小工具。输入一个 agent / MCP surface manifest，它会输出一份 Markdown 审批摘要、一张一页式 HTML atlas 和一份机器可读 summary，帮助你在发布前看清楚哪些能力是只读、哪些需要审批、哪些带有 destructive friction。

## 本周为什么做它

到 **2026-07-06** 为止，几个公开信号已经拼到了一起：

- [`mcp-use/inspector`](https://github.com/mcp-use/inspector) 在 **2026-07-05** 仍有更新，仓库描述已经直接指向 “remote MCP servers with support for Apps SDK”，说明 inspector / tooling surface 正在被快速产品化。
- [`CopilotKit/CopilotKit`](https://github.com/CopilotKit/CopilotKit) 到 **2026-07-06** 已有 **35,798 stars**，定位是 “The Frontend Stack for Agents & Generative UI”，说明 agent frontends 和 capability packaging 仍在加速。
- [`thesysdev/openui`](https://github.com/thesysdev/openui) 到 **2026-07-06** 已有 **7,774 stars**，并继续更新，说明 “生成式 UI 标准化” 已经不是边角话题。
- GitHub 在 **2026-06-09** 发布 [June '26 enterprise roundup](https://github.com/resources/insights/enterprise-content-roundup-june-26)，其中把重点概括成从 AI-assisted coding 走向 **governed agentic software delivery**。
- Microsoft 在 **2026-04-14** 发布 [Securing MCP: A Control Plane for Agent Tool Execution](https://developer.microsoft.com/blog/securing-mcp-a-control-plane-for-agent-tool-execution)，核心问题非常直接：agent 说要调工具，和“这个调用是否该被允许”之间，还缺一层明确控制面。

这些信号放在一起，会出现一个很具体的小缺口：

**大家已经在做 inspector、agent app、generative UI 和 workflow surface 了，但还缺一种轻量、好看、适合发布和审批的“能力面地图”。**

## 本周候选方向

| Candidate | Why now | Solo ship | Taste | Score / 10 |
| --- | --- | ---: | ---: | ---: |
| Approval Atlas | MCP / governance / inspector 信号正在升温，且适合做成轻量 review artifact | 9 | 9 | 9.2 |
| OpenUI State Postcard | `OpenUI` / `CopilotKit` 很热，但要做得好需要更重的前端状态设计 | 6 | 10 | 8.1 |
| Workflow Lane Receipt | agent workflow automation 继续升温，但更像流程报告，不够“可独立发布” | 8 | 7 | 7.6 |
| Skill Window Billboard | 插件 / skill 分发在增长，但容易和之前的 `Skillloom` 重叠 | 8 | 7 | 7.2 |

## 为什么选 Approval Atlas

- **方向准**：它踩在 `MCP inspector`、`governed delivery`、`agent tooling` 的交集上。
- **体量小**：不做完整平台，只做一个可直接生成的 review surface。
- **可复用**：以后任何 agent skill、workflow、tool bundle、MCP app，都能先出一张 atlas 再发布。
- **门面强**：它天然适合做出一张设计感明确的 HTML 单页，而不是只给一份 JSON。

## 它会输出什么

- `dist/atlas.md`：适合贴到 issue、PR、审查记录里的审批摘要
- `dist/index.html`：一页式视觉 atlas，适合分享、归档或作为 README 配图素材
- `dist/summary.json`：方便后续自动化消费的轻量摘要

默认 sample `northstar-desk.surface.json` 会生成一个 **Guarded** posture：

- `4` 个 surfaces
- `3` 个已加 gate
- `1` 个 destructive surface
- `0` 个未加 gate 的高风险 surface

## 目录结构

```text
weeks/2026-07-06-approval-atlas/
├── README.md
├── package.json
├── sample/
│   └── northstar-desk.surface.json
├── scripts/
│   └── run-approval-atlas.mjs
├── src/
│   └── approval-atlas.mjs
├── tests/
│   └── approval-atlas.test.mjs
└── dist/
    ├── atlas.md
    ├── index.html
    └── summary.json
```

## 安装与使用

不需要安装依赖，Node.js 22+ 即可。

```bash
cd weeks/2026-07-06-approval-atlas

# 跑测试
npm test

# 生成内置样例 atlas
npm run build
```

用自己的 manifest 也可以直接生成：

```bash
node scripts/run-approval-atlas.mjs ./your-surface.json ./dist-live
```

manifest 只需要有两层核心信息：

- `product`: 名称、tagline、operator
- `surfaces`: 每个 surface 的 `stage`、`permissions`、`approval`、`touches`、`intent`

示例里的 surface 结构：

```json
{
  "name": "publishWeek",
  "label": "Publish Weekly Drop",
  "kind": "tool",
  "stage": "ship",
  "permissions": ["write", "network"],
  "approval": "required",
  "touches": ["github", "workspace"],
  "intent": "Commit changes and push the new weekly artifact."
}
```

## 输出示例

生成后的 atlas 会给出三个层次：

- **Snapshot**：整体 posture、gated 数、destructive 数、最高风险 surface
- **Lane Map**：按 `discover / compose / ship / cleanup` 排列的能力面
- **Risk Hotspots**：最值得在发版前被人类多看一眼的 surfaces

内置示例当前会把 `Cleanup Draft Files` 标成最高风险 surface，因为它同时具备 `write + exec + destructive`。

## 自检

```bash
npm test
npm run test:coverage
npm run build
```

当前验证覆盖：

- manifest 读取
- risk scoring 与 posture 判断
- lane / hotspot 生成
- Markdown / HTML render
- 产物写入

`node --test --experimental-test-coverage` 当前结果：

- Line coverage: **98.19%**
- Function coverage: **95.56%**

## 数据来源

- [mcp-use/inspector](https://github.com/mcp-use/inspector)
- [CopilotKit](https://github.com/CopilotKit/CopilotKit)
- [OpenUI](https://github.com/thesysdev/openui)
- [June '26 enterprise roundup](https://github.com/resources/insights/enterprise-content-roundup-june-26)
- [Securing MCP: A Control Plane for Agent Tool Execution](https://developer.microsoft.com/blog/securing-mcp-a-control-plane-for-agent-tool-execution)

## 附录：更新记录

### 2026-07-06

- 发布 `Approval Atlas` v0.1。
- 本周决定：不做新的 inspector，而是做一个更轻、更适合审批和归档的能力面输出层。
- 后续可扩展方向：接入真实 MCP server schema、参数级 risk cue、approval policy diff、多人 review comments。
