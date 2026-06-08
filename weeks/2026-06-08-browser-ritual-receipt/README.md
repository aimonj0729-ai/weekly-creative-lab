# 🧾 Browser Ritual Receipt

<div align="center">

**把一个公开页面的“能不能拿出去见人”检查，做成一张可读、可存档、可分享的发布单据。**

`landing page` → `launch signals` → `receipt markdown` → `glossy HTML proof`

![Browser Ritual](https://img.shields.io/badge/browser-ritual-191919?style=flat-square)
![Launch QA](https://img.shields.io/badge/launch-qa-d46a2e?style=flat-square)
![Weekly Lab](https://img.shields.io/badge/weekly-creative%20lab-0f8479?style=flat-square)

</div>

> **一句话介绍**
> Browser Ritual Receipt 是一个零依赖 Node 小工具：输入一个公开 URL 或本地 HTML 快照，它会抽取标题、H1、CTA、分享卡、移动端和信任信号，输出一份 Markdown receipt 和一页式 HTML 检查卡。

## 本周为什么做它

到 **2026-06-08** 为止，GitHub 上几条相关信号已经很清楚：

- [`ChromeDevTools/chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp) 已到 **43,105 stars**，并在 **2026-06-08** 继续更新，说明“让 agent 真的看浏览器”已经进入主航道。
- [`wshobson/agents`](https://github.com/wshobson/agents) 已到 **36,503 stars**，并在 **2026-06-08** 更新，说明 agent skills / workflow packaging 仍在扩张。
- [`millionco/expect`](https://github.com/millionco/expect) 已到 **3,494 stars**，最近更新时间 **2026-06-07**，说明 “agent 写的东西，需要真实浏览器验证” 已经有明确需求。
- [`cloudflare/telescope`](https://github.com/cloudflare/telescope) 在 **2026-06-06** 仍有更新，把“浏览器里的性能/体验检查”继续往 agent 工具链里拉。
- Microsoft 在 **2026-04-22** 发布 [Securing MCP: A Control Plane for Agent Tool Execution](https://developer.microsoft.com/blog/securing-mcp-a-control-plane-for-agent-tool-execution)，核心判断之一是：在 agent 决定执行和真实执行之间，需要更明确的治理、审批和审计层。

这些信号汇总后，很容易得出一个小而实用的空白：**很多人开始让 agent 帮自己做站点、做页面、做工作流，但仍然缺一张“发布前看过什么、缺了什么”的轻量单据。**

## 本周候选方向

| Candidate | Why now | Solo ship | Taste | Score / 10 |
| --- | --- | ---: | ---: | ---: |
| Browser Ritual Receipt | 浏览器验证需求明确，且适合做成独立 receipt | 9 | 8 | 9.0 |
| Approval Surface Sheet | MCP 审批/治理正在变热，但实现边界更大 | 7 | 9 | 8.4 |
| Generative UI Launch Lens | `OpenUI` / `Tambo` / `CopilotKit` 都很热，但要做得好需要更重前端 | 6 | 10 | 7.9 |
| Workflow Wedge Mapper | 自动化平台继续增长，但更像报告，不像本周要发的小产品 | 8 | 6 | 7.2 |

## 为什么选 Browser Ritual Receipt

这个方向的优点很直接：

- **小**：一个脚本就能产出完整结果，不依赖外部服务。
- **真需求**：页面和工作流越来越多，但“launch receipt”仍然缺少好看的轻量版本。
- **能复用**：以后这个仓库里的 demo、README-driven product、landing page 都能先过一遍它。

## 它会检查什么

- 页面是否能正常读取出 `title`、`h1`、状态码
- 是否有 `meta description`、`viewport`、`og:*`、`canonical`、`favicon`
- 是否能识别明确的 CTA 文案
- 是否存在 `pricing`、`privacy`、`terms`、`docs`、`contact` 这类信任信号
- 是否可以输出一张适合归档或分享的 launch receipt

## 目录结构

```text
weeks/2026-06-08-browser-ritual-receipt/
├── README.md
├── package.json
├── sample/
│   └── velvet-arcade.html
├── scripts/
│   └── run-browser-ritual.mjs
├── src/
│   └── browser-ritual.mjs
├── tests/
│   └── browser-ritual.test.mjs
└── dist/
    ├── index.html
    ├── receipt.md
    └── summary.json
```

## 安装与使用

不需要安装依赖，Node.js 22+ 即可。

```bash
cd weeks/2026-06-08-browser-ritual-receipt

# 跑测试
npm test

# 基于内置 fixture 生成样例 receipt
npm run build

# 用自己的页面 URL 生成
node scripts/run-browser-ritual.mjs https://your-site.example ./dist-live
```

如果你已经有本地 HTML 快照，也可以直接传文件路径：

```bash
node scripts/run-browser-ritual.mjs ./sample/velvet-arcade.html ./dist-local
```

## 输出示例

默认会生成三份产物：

- `dist/receipt.md`：适合贴到 issue、PR、发布日志的文字版单据
- `dist/index.html`：更像“公开 launch proof”的视觉卡片
- `dist/summary.json`：方便后续自动化继续消费

内置示例页 `velvet-arcade.html` 会得到一个 **A / 100** 的 receipt，用来演示理想状态下的页面信号面板。

## 自检

```bash
npm test
npm run test:coverage
npm run build
```

当前验证覆盖：

- 核心信号抽取
- CTA / trust cue 识别
- Markdown receipt 输出
- HTML receipt 输出
- 本地 fixture 读取
- 产物写入

`node --test --experimental-test-coverage` 当前结果：

- Line coverage: **96.98%**
- Function coverage: **100%**

## 数据来源

本周选题参考了以下公开信号：

- [GitHub Trending](https://github.com/trending)
- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [agents marketplace](https://github.com/wshobson/agents)
- [Expect](https://github.com/millionco/expect)
- [Cloudflare Telescope](https://github.com/cloudflare/telescope)
- [Tambo](https://github.com/tambo-ai/tambo)
- [OpenUI](https://github.com/thesysdev/openui)
- [Securing MCP: A Control Plane for Agent Tool Execution](https://developer.microsoft.com/blog/securing-mcp-a-control-plane-for-agent-tool-execution)

## 附录：更新记录

### 2026-06-08

- 发布 Browser Ritual Receipt v0.1。
- 本周决定：不做更大的 agent QA 平台，先做一张“可执行、可留档、可继续接自动化”的轻量发布单据。
- 后续可扩展方向：接入真实浏览器截图、console error、network failure、LCP/CLS 等更强校验。
