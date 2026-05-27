# 🕳️ Side-Alley Radar

<div align="center">

**别挤主街。去小巷里找能先开张的 AI 工具机会。**

`hot repo signal` → `underserved niche` → `entry wedge` → `one-week MVP`

![Radar](https://img.shields.io/badge/radar-side--alley-191919?style=flat-square)
![Agent Skills](https://img.shields.io/badge/agent-skills-c86b3c?style=flat-square)
![Market Wedge](https://img.shields.io/badge/market-wedge-0f766e?style=flat-square)

</div>

> **一句话介绍**
> Side-Alley Radar 是一个 Claude/Codex 可用的机会雷达 skill：它从热门 GitHub 项目里识别大趋势，再反向寻找竞争更小、能用一个小作品进入的垂直切口。

## 🧠 今天的信号

2026-05-27 的 GitHub 搜索快照显示，AI agent、MCP server、Claude/Codex skills、浏览器自动化、agent memory、设计/内容生成 skill 都在高热区。但头部通用平台已经非常拥挤，适合小团队进入的不是“再做一个 Dify / LangChain / Browser-use”，而是做更窄、更好看、更可安装的工作流。

**本周最适合切入的方向：把热门趋势变成可执行的“小市场入口判断器”。**

## 🔥 热门项目给出的趋势证据

| Signal | Example repos observed | What it proves |
| --- | --- | --- |
| Agent platforms are crowded | [langgenius/dify](https://github.com/langgenius/dify), [langchain-ai/langchain](https://github.com/langchain-ai/langchain), [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands), [browser-use/browser-use](https://github.com/browser-use/browser-use) | 通用 agent 平台需求强，但直接竞争很重。 |
| Skills are becoming products | [affaan-m/ECC](https://github.com/affaan-m/ECC), [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman), [nexu-io/open-design](https://github.com/nexu-io/open-design), [santifer/career-ops](https://github.com/santifer/career-ops) | Skill 不只是提示词，正在变成可安装产品形态。 |
| MCP is turning into plumbing | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp), [github/github-mcp-server](https://github.com/github/github-mcp-server), [PrefectHQ/fastmcp](https://github.com/PrefectHQ/fastmcp), [modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry) | MCP 工具层机会多，但需要垂直场景避免同质化。 |
| Browser QA is still oddly tiny | [totigm/humanjs](https://github.com/totigm/humanjs) 8 stars, [AishwaryShrivastav/vibe-testing](https://github.com/AishwaryShrivastav/vibe-testing) 3 stars, [b0ir/visual-lens](https://github.com/b0ir/visual-lens) 1 star, [forjd/runtrail](https://github.com/forjd/runtrail) 2 stars | 大趋势热，小众子市场还没被完全占领。 |
| Design/creative agent tools have taste premium | [nexu-io/open-design](https://github.com/nexu-io/open-design), [Nutlope/hallmark](https://github.com/Nutlope/hallmark), [Manavarya09/design-extract](https://github.com/Manavarya09/design-extract), [alchaincyf/huashu-design](https://github.com/alchaincyf/huashu-design) | 审美和包装本身能形成差异化。 |

## 🧺 本周候选机会

| Candidate | Pain | Competition | Entry Wedge | Score |
| --- | ---: | ---: | --- | ---: |
| Side-Alley Radar for weekly idea selection | 8 | 2 | 从热点 repo 反推小众市场切口 | 89.2 |
| Browser QA Receipt for vibe-coded apps | 9 | 3 | 跑一次浏览器，生成“真的打开过”的证据报告 | 85.1 |
| Design Taste Patch for GitHub READMEs | 7 | 5 | 把普通 README 改成产品门面 | 81.0 |
| MCP Fit Check for small teams | 7 | 4 | 判断一个 MCP idea 是否值得做 | 75.9 |
| Vertical Skill Forge for boring industries | 8 | 5 | 为牙科、留学、地产、教培等生成专用 skill | 74.7 |

## 🏆 本周选择：Side-Alley Radar

我选择先做 Side-Alley Radar，而不是直接做 Browser QA Receipt，原因很简单：它会成为这个仓库之后每周选题的“发动机”。先把选题能力产品化，后续每周就能更稳定地产出一个有市场切口的小作品。

## 🚪 可以直接进入的小市场

| 小市场 | 为什么现在能进 | 第一版可以做什么 |
| --- | --- | --- |
| Vibe-coded app launch QA | 浏览器 QA 相关新 repo 星标很低，但需求被 `browser-use` 和 `Playwright MCP` 证明存在 | 一个 CLI/skill：打开页面、截图、查 console、生成 launch receipt |
| README trust repair | 大量 agent 项目 README 好看但不可安装，`readme-install-audit` 类能力缺口明显 | 一个 README 审计 + 重写 workflow |
| Vertical MCP idea vetting | MCP 很热，但大多数人不知道自己要不要做 MCP | 一个 MCP-fit checklist + score script |
| Skill packaging for niche services | Skills 越来越产品化，但垂直服务业还少 | 面向“留学申请/本地商家/教培/电商运营”的 skill 模板 |
| Design-system extraction for indie products | 设计提取工具热，但很多 indie 只需要小补丁 | 一个 “paste URL → repo style guide” 工作流 |

## 🧰 这个目录里有什么

```text
weeks/2026-05-27-side-alley-radar/
├── README.md                    # 本周报告和项目介绍
├── SKILL.md                     # 可安装/可复制的机会雷达 skill
├── opportunities.json           # 本周候选机会数据
├── examples/
│   └── input-brief.md           # 示例输入
├── scripts/
│   └── score_opportunities.py   # 简单评分脚本
└── templates/
    └── radar-report.md          # 下周可复用报告模板
```

## 🚀 快速使用

```bash
python3 scripts/score_opportunities.py opportunities.json
```

输出会按机会分数排序，并给出推荐切入点。

也可以把 `SKILL.md` 复制到你的 agent skills 目录里，让 Claude/Codex 每周按这个方法做选题。

## 📡 数据来源

本期快照来自 2026-05-27 通过 GitHub CLI 搜索到的公开仓库信号，重点查询方向包括：

- `ai agent pushed:>2026-05-01 stars:>500`
- `claude code skill created:>2026-04-01 stars:50..5000`
- `agent workflow created:>2026-04-01 stars:50..5000`
- `mcp server created:>2026-04-01 stars:50..5000`
- `browser agent qa created:>2026-04-01 stars:20..5000`

这些信号只用于判断趋势和机会，不代表复制任何项目的代码或品牌。

## 附录：更新记录

### 2026-05-27

- 发布 Side-Alley Radar v0.1。
- 选题结论：先做“市场缝隙雷达”作为每周 GitHub 创意更新的选题引擎。
- 下一步建议：把评分最高的 `Browser QA Receipt for vibe-coded apps` 做成下一周的可运行 CLI/skill。
