# 博客写作与发布

网站保留 Jekyll，首页、博客、分类、标签、RSS 和搜索均从 `_posts` 自动生成，无需账号或第三方服务。

构建环境使用 Ruby 3.3（CI 会自动安装）。

## 发布一篇文章

1. 将 `docs/post-template.md` 复制为 `_posts/YYYY-MM-DD-english-slug.md`。文件名的日期和 slug 要明确；slug 直接决定 `/posts/english-slug/`，发布后不要随意改名或大小写。
2. 修改 front matter 中的 `title`、`date`（时区为 `+0800`）、`categories`、`tags`、`description`。`toc: false` 可关闭目录。未来日期默认不发布。
3. 用 Markdown 写正文，使用 `##` / `###` 小标题和带语言标记的代码块（如 python、cpp、glsl）。图片放入 `img/`，以 `/img/文件名` 引用并填写替代文本。
4. 本地预览和检查后，将修改正常提交并推送到 `master`。GitHub Actions 构建并将静态站提交到 `gh-pages`。等待 Actions 和 Pages 部署都成功，再检查公开文章网址。

```sh
bundle install
bundle exec jekyll serve
# 访问 http://127.0.0.1:4000
JEKYLL_ENV=production bundle exec jekyll build
python3 tools/check-site.py
```

也可先在 `_drafts/english-slug.md` 写草稿；`bundle exec jekyll serve --drafts` 可预览，发布时移入 `_posts` 并加日期前缀。不要在草稿或仓库提交密码、令牌或不准备公开的资料。

## 自动功能

- 首页列出最新三篇文章；`/blog/` 显示完整列表与浏览器端全文搜索。
- `/tabs/categories/`、`/tabs/tags/`、`/tabs/archives/` 保留历史入口；分类及标签页自动生成。
- 文章自动提供目录、代码高亮、上一篇/下一篇和分类/标签链接。
- `/feed.xml` 为 Atom RSS 订阅源，`/sitemap.xml` 为站点地图。
- 搜索索引为公开 `search.json`，只在浏览器中匹配，不发送查询、不收集数据。

## 兼容与回退

保留两篇历史文章和所有 `img/` 原路径。`/posts/how_to_use_unreal_python/` 与 `/posts/HoutoUsingOpenCLInHoudini/`（大小写敏感）不变。旧 `sw.js` 会清除 `chirpy-` 缓存、注销自己并刷新受控页面；不再安装离线缓存。

发布脚本仅使用普通提交和 push，保留 `gh-pages` 历史。不更改仓库 Pages source 或权限。若发布权限不足或 Pages 未指向正确来源，查看 Actions 失败信息并由仓库管理员确认配置，不能把仅构建成功当作上线。

回退源代码：对迁移提交执行 `git revert <commit>` 并推送 `master`，保留审计历史。回退后旧主题可能重新注册缓存；排查时请清除浏览器站点缓存。
