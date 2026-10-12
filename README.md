# Zhongkai Liu · Personal Archive

个人作品与技术笔记的公开档案：实用工具、游戏原型、实时渲染与 Houdini 制作实践。

**[在线主页](https://liuzkai.github.io/)** · **[博客](https://liuzkai.github.io/blog/)** · **[RSS / Atom](https://liuzkai.github.io/feed.xml)**

## 网站内容

- **像素终端风主页**：公开项目展示、作品筛选、可搜索的项目索引、快捷导航、最新博文与可关闭的动态效果。
- **Markdown 博客**：文章列表、浏览器端全文搜索、分类、标签、归档、文章目录、代码高亮和上一篇／下一篇导航。
- **历史内容兼容**：保留旧文章 URL（含大小写）、`img/` 图片和 `/tabs/` 入口；提供 RSS / Atom 与站点地图。

联系方式：[liuzkai2012@gmail.com](mailto:liuzkai2012@gmail.com)。首页“关于”和各页页脚也提供邮箱链接。

## 技术栈与环境

- Jekyll 静态生成，Liquid 模板、Markdown / Kramdown、Rouge 代码高亮。
- 原生 HTML、CSS、JavaScript 与 Canvas；搜索使用静态 `search.json`，在浏览器内匹配关键词。
- Ruby **3.3**（与 CI 一致）；当前 `Gemfile.lock` 锁定 Jekyll **4.2.2**、Bundler **4.0.16**。
- Git、Python 3；验证脚本仅使用 Python 标准库。无需 Node.js 构建步骤或数据库。

## 本地安装、预览与验证

先安装 Ruby 3.3、Git 和 Python 3，再执行：

```sh
git clone https://github.com/Liuzkai/Liuzkai.github.io.git
cd Liuzkai.github.io
gem install bundler -v 4.0.16
bundle install
bundle exec jekyll build
python3 -m http.server 4000 --bind 127.0.0.1 --directory _site
```

打开 <http://127.0.0.1:4000>。这是构建结果的静态预览；修改源文件后重新运行 `bundle exec jekyll build` 并刷新页面。使用 `Ctrl+C` 停止预览服务。

发布前运行与 CI 对应的生产构建和检查：

```sh
bash tools/test.sh --build
```

该命令执行 `JEKYLL_ENV=production bundle exec jekyll build` 和 `python3 tools/check-site.py`，检查关键路由、生成 HTML 的本地链接、历史图片字节、搜索索引以及 feed / sitemap XML。它不检查外部网站是否可用，也不替代浏览器视觉验收。

## 写一篇博文

1. 复制 [文章模板](docs/post-template.md) 为 `_posts/YYYY-MM-DD-english-slug.md`。
2. 修改 `title`、`date`、`categories`、`tags`、`description`，用 Markdown 写正文；图片放到 `img/`，引用 `/img/文件名`。
3. 本地构建、预览并检查后，提交文章和相关图片，推送 `master`。

文章地址为 `/posts/english-slug/`，发布后应保持文件名中的 slug 和大小写稳定。未来日期默认不发布；草稿可放 `_drafts/`，使用 `bundle exec jekyll build --drafts` 构建本地预览，不要将草稿构建结果用于发布。

完整说明见 [中文写作与发布指南](docs/WRITING.zh-CN.md)。

## 发布流程

[Build and publish 工作流](.github/workflows/pages-deploy.yml) 在推送 `master` 或针对 `master` 的 Pull Request 时构建、验证网站；仅 `master` 的 push 会调用 [tools/deploy.sh](tools/deploy.sh)，将 `_site/` 以普通提交发布到 `gh-pages`，保留分支历史，不强推。

GitHub Pages 使用 **`gh-pages` 分支的根目录 `/`**。无需手工编辑 `gh-pages`；推送源码后，在 [Actions](https://github.com/Liuzkai/Liuzkai.github.io/actions) 确认构建与 Pages 部署均成功，再检查公开网址。

## 主要目录

| 路径 | 用途 |
| --- | --- |
| `index.html` | 个人主页、作品入口与最新博文 |
| `assets/terminal/` | 终端风样式、交互、公开项目数据、图片与字体 |
| `blog/`、`search.json` | 博客列表与全文搜索索引模板 |
| `_posts/`、`img/` | Markdown 文章与文章图片 |
| `_layouts/`、`_includes/` | 页面布局与共用模板 |
| `_tabs/` | 关于、分类、标签与归档入口 |
| `_config.yml` | 站点配置、文章永久链接与插件配置 |
| `docs/` | 中文写作指南与文章模板 |
| `tools/`、`.github/workflows/` | 构建检查、发布脚本与 CI |

## 许可证与来源

历史主题基于 [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy)，保留原作者 Cotes Chung 的 [MIT LICENSE](LICENSE) 与相关归属。字体许可随资源提供：[IBM Plex](assets/terminal/assets/fonts/plex-OFL.txt)、[Silkscreen](assets/terminal/assets/fonts/silkscreen-OFL.txt)。

Liuzkai 的原创站点代码及其原创配套技术文档采用 [MIT 许可](LICENSE-MIT)，允许使用、复制、修改和商业分发；分发副本或实质性部分时，须保留版权声明及完整许可声明，无需在产品界面署名。主题及其他第三方代码按原许可使用；修改主题产生的作品仍须保留原有版权与许可声明。

博客文章继续按 [`_data/rights.yml`](_data/rights.yml) 声明采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，另有注明的内容除外；不改成代码 MIT 许可。文章中的第三方摘录、图片及项目截图等仍归相应权利人，字体继续遵循随附 OFL；未确认来源的素材不因本次整理而获得新的 MIT 授权。
