# 🪄 Relay Baton

<div align="center">

**把 agent / workflow / 小团队项目里的“交接瞬间”，整理成一份可发、可审、可继续接力的一页式 handoff pack。**

`trend signal` → `handoff manifest` → `baton summary` → `glossy HTML handoff`

![Relay Baton](https://img.shields.io/badge/relay-baton-191919?style=flat-square)
![Handoff Pack](https://img.shields.io/badge/handoff-pack-d97a43?style=flat-square)
![Weekly Lab](https://img.shields.io/badge/weekly-creative%20lab-79d0c3?style=flat-square)

</div>

> **一句话介绍**
> Relay Baton 是一个零依赖 Node 小工具。输入一份 handoff manifest，它会输出一份 Markdown 交接摘要、一张一页式 HTML baton board 和一份机器可读 summary，让多角色协作在交给下一个人之前，不再只靠零散聊天记录。

## 本周为什么做它

到 **2026-07-13** 为止，几个公开项目的信号已经很一致了：

- [`OpenHands/OpenHands`](https://github.com/OpenHands/OpenHands) 在 **2026-07-12** 仍有更新，且已达到 **80,576 stars**，核心方向已经从单次代码生成扩展到持续的 agent-driven development。
- [`browser-use/browser-use`](https://github.com/browser-use/browser-use) 在 **2026-07-12** 更新到 **104,411 stars**，说明浏览器代理已经从 demo 进入高频实战面。
- [`mastra-ai/mastra`](https://github.com/mastra-ai/mastra) 在 **2026-07-13** 更新到 **26,116 stars**，继续把 agents、workflows 和 app packaging 收束到一套现代 TS 框架里。
- [`n8n-io/n8n`](https://github.com/n8n-io/n8n) 在 **2026-07-13** 更新到 **196,209 stars**，说明 workflow automation 正在和 AI agent 能力深度合流。

这些项目都在让“做事的 agent / workflow”越来越强，但一个很现实的小缺口还在：

**真正容易掉链子的，往往不是生成本身，而是从 scout 到 builder、从 verifier 到 publisher 的交接。**

于是本周不做新的 agent 平台，而做一个更小、更可直接发布的交接输出层。

## 本周候选方向

| Candidate | Why now | Solo ship | Taste | Score / 10 |
| --- | --- | ---: | ---: | ---: |
| Relay Baton | agent canvas、browser agents、workflow automation 都在涨，但“交接面”仍很零散 | 9 | 9 | 9.2 |
| Workflow Switchboard | 可以把 workflow lane 做得更清楚，但更偏流程图工具 | 8 | 8 | 8.1 |
| Browser Session Ledger | 浏览器代理很热，但和 `Browser Ritual Receipt` 的邻接太强 | 8 | 7 | 7.6 |
| Repo Signal Postcard | 能把热 repo 压成一页产品观察卡，但复用价值略弱 | 7 | 8 | 7.3 |

## 为什么选 Relay Baton

- **方向够准**：它踩在 agent workflows、browser automation、review gates 和实际发布流程的交叉点上。
- **体量够小**：不做 orchestration 平台，只做 handoff pack。
- **设计感强**：handoff 本身适合做成一张门面明确的 baton board，而不只是任务清单。
- **独立可发**：它既能服务个人每周发布，也适合团队异步交接、agent playbook 或 demo review。

## 它会输出什么

- `dist/handoff.md`：适合贴进 issue、PR、交接说明或周报里的 handoff 摘要
- `dist/index.html`：一页式 HTML baton board，适合分享、归档或截图
- `dist/summary.json`：给自动化脚本继续消费的轻量 summary

默认样例 `studio-weave.baton.json` 会输出一个 **In motion** 的交接状态：

- `4` 个 stages
- `2` 个待过 gate 的节点
- `1` 个 watch check
- `0` 个 failing checks

## 目录结构

```text
weeks/2026-07-13-relay-baton/
├── README.md
├── package.json
├── sample/
│   └── studio-weave.baton.json
├── scripts/
│   └── run-relay-baton.mjs
├── src/
│   └── relay-baton.mjs
├── tests/
│   └── relay-baton.test.mjs
└── dist/
    ├── handoff.md
    ├── index.html
    └── summary.json
```

## 安装与使用

不需要安装依赖，Node.js 22+ 即可。

```bash
cd weeks/2026-07-13-relay-baton

# 跑测试
npm test

# 生成内置样例 handoff pack
npm run build
```

也可以直接用自己的 manifest：

```bash
node scripts/run-relay-baton.mjs ./your-baton.json ./dist-live
```

manifest 的核心字段只有五层：

- `project`: 名称、tagline、objective、operator
- `baton`: 当前 holder、下一位、handoff window、promise
- `stages`: 每个 stage 的 `lane`、`status`、`approval`、`risk`、`owner`
- `checks`: 自检项，例如 tests、coverage、README lead、smoke check
- `handoff`: 当前要交给谁、要带哪些 packet、下一条建议消息

样例里的 stage 结构：

```json
{
  "name": "publish-main",
  "label": "Publish to Main",
  "lane": "ship",
  "owner": "Publisher",
  "status": "queued",
  "goal": "Commit the weekly drop and push origin/main.",
  "output": "Live GitHub update",
  "tools": ["git commit", "git push"],
  "approval": "required",
  "risk": "high",
  "note": "Only after verification is green."
}
```

## 输出示例

生成后的 baton pack 会给出四层信息：

- **Snapshot**：holder、next、active stage、pending approvals、failing checks
- **Route Map**：按 `capture / build / verify / ship` 排列的接力路径
- **Pressure Points**：当前最值得先看一眼的 stages
- **Handoff Packet**：下一位接手时不该丢失的关键文件和消息

内置样例当前会把 `Publish to Main` 标成最高 pressure stage，因为它同时具备 `queued + high risk + approval required`。

## 自检

```bash
npm test
npm run test:coverage
npm run build
```

当前验证覆盖：

- manifest 读取与校验
- baton summary 生成
- route / hotspot 排序
- Markdown / HTML render
- 产物写入

`node --test --experimental-test-coverage` 当前结果应保持：

- Line coverage: **80%+**
- Function coverage: **80%+**

## 数据来源

- [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands)
- [browser-use/browser-use](https://github.com/browser-use/browser-use)
- [mastra-ai/mastra](https://github.com/mastra-ai/mastra)
- [n8n-io/n8n](https://github.com/n8n-io/n8n)

## 附录：更新记录

### 2026-07-13

- 发布 `Relay Baton` v0.1。
- 本周决定：不做更大的 agent orchestration，而是做交接层，把“下一位如何接手”明确输出出来。
- 后续可扩展方向：接入真实 task logs、自动生成 review comment packet、按角色生成不同 handoff 视图。
