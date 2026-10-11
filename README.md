# Zhongkai Liu · Personal Archive

像素终端风个人主页 + Jekyll 博客，发布于 https://liuzkai.github.io/。

- 首页：公开作品、项目索引、最新博文、快捷导航与可关闭的动态效果。
- 博客：`/blog/`，支持全文搜索、分类、标签、目录、代码高亮与 RSS。
- 保留 `_posts/` 和 `img/` 的历史内容、文章 URL 及 `/tabs/` 系列入口。

## 写文章

复制 `docs/post-template.md` 到 `_posts/YYYY-MM-DD-slug.md`，编辑后提交到 `master`。
完整中文说明见 [写作与发布指南](docs/WRITING.zh-CN.md)。

## 开发

使用 Ruby 3.3、Bundler 和 Jekyll 4.2：

```sh
bundle install
bundle exec jekyll serve
# 发布前检查
bash tools/test.sh --build
```

GitHub Actions 验证站点后，以普通提交更新 `gh-pages`，不重写历史。Pages 来源保留 `gh-pages /`。

新视觉资源在 `assets/terminal/`；字体许可证随字体保存在 `assets/terminal/assets/fonts/`。
历史主题基于 MIT 许可的 [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy)，原 LICENSE 保留。
