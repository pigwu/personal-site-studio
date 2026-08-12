# Personal Site Studio

一个面向学生、研究者、开发者和创作者的开源个人网站模板。你不需要掌握 HTML、CSS 或 Git：在本地可视化工作台里填写文字、选择照片、切换风格，然后点击按钮即可提交到 GitHub 并自动部署到 GitHub Pages。

> 核心理念：网站属于你，内容保存在你的 GitHub 仓库，本地编辑器只运行在你的电脑上。

## 你可以用它做什么

- 创建个人主页、学术主页或作品集
- 编辑姓名、头像、学校、职位、联系方式和个人介绍
- 展示研究、项目、软件、设计作品或社团经历
- 写 Blog，支持文字、标签和多张图片
- 创建一个完全自由的兴趣模块
- 把 Running 改成 Badminton、Photography、Music、Travel、Reading 等任意主题
- 从 12 套视觉风格中选择模板
- 自定义主色、强调色和背景色
- 在本地预览网站
- 一键 Commit 并 Push 到 GitHub `main`
- 每次 Push 后通过 GitHub Actions 自动部署到 GitHub Pages

## 12 套内置风格

| 风格 | 适合场景 | 视觉特点 |
| --- | --- | --- |
| Classic Scholar | 学术主页、研究者 | 暖色纸张、衬线字体、克制稳重 |
| Modern Laboratory | AI、计算机、工程 | 技术网格、冷色、实验室感 |
| Young Campus | 本科生、社团、年轻作品集 | 明快、活泼、校园感 |
| Editorial Journal | 写作者、摄影、Blog | 杂志排版、强调叙事 |
| Midnight Research | 技术项目、深色偏好 | 深色背景、电光蓝信号 |
| Forest Fieldnotes | 户外、环境、生命科学 | 自然绿、田野笔记感 |
| Monochrome Minimal | 极简作品集 | 黑白、高对比、精确 |
| Coral Creative | 设计师、创作者 | 珊瑚色、友好、有活力 |
| Ocean Blue | 通用专业主页 | 开放、平静、可靠 |
| Retro Computing | 开发者、黑客文化 | 终端字体、复古计算机感 |
| Soft Lavender | 艺术、人文、柔和表达 | 淡紫、细腻、舒缓 |
| Signal Red | 年轻、强个性主页 | 高对比红色、醒目大胆 |

所有主题都支持自定义颜色，不需要修改 CSS。

## 最快开始：使用 GitHub Template

### 1. 复制到自己的 GitHub

1. 登录 GitHub。
2. 打开本仓库。
3. 点击右上角 **Use this template**。
4. 选择 **Create a new repository**。
5. 如果想使用 `你的用户名.github.io` 作为网址，将仓库命名为：

   ```text
   你的GitHub用户名.github.io
   ```

6. 如果想使用普通项目网址，也可以命名为 `my-personal-site`。
7. 建议选择 **Public**，GitHub 免费账户的 Pages 部署最直接。

### 2. 下载到本地

你可以使用 GitHub Desktop：

1. 在仓库页面点击 **Code**。
2. 点击 **Open with GitHub Desktop**。
3. 选择电脑上的保存位置。
4. 点击 **Clone**。

也可以使用命令行：

```bash
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名
```

### 3. 安装 Node.js

打开 <https://nodejs.org/>，安装 LTS 版本。安装完成后不需要运行 `npm install`，本项目没有第三方运行依赖。

检查安装：

```bash
node --version
```

看到版本号即可。

### 4. 打开本地工作台

Windows 用户直接双击：

```text
start-studio.cmd
```

也可以在终端运行：

```bash
npm run studio
```

浏览器会打开：

```text
http://127.0.0.1:4174
```

请保持命令行窗口开启。关闭窗口后，本地工作台会停止，但已保存的内容不会丢失。

## 工作台使用教程

### 01 身份资料

填写以下信息：

- 姓名
- 身份或职位
- 学校、实验室、公司或组织
- 所在地
- 邮箱
- 个人简介
- 头像
- GitHub、Google Scholar、LinkedIn 等链接

链接留空时不会显示在公开网站上。

上传的图片会在浏览器端自动缩放并转换为 WebP，减少网页加载时间。

### 02 主页介绍

这里控制网站首页：

- 网站标题
- 一句话介绍
- About 主标题
- 多段详细介绍
- Focus、Location、Status 等信息亮点

详细介绍中每两个段落之间空一行，网站会自动生成独立段落。

### 03 作品项目

点击 **新项目**，可以添加：

- 项目标题
- 项目类型
- 项目介绍
- GitHub、论文或产品链接
- 标签
- 项目封面图

它既可以展示研究项目，也可以展示课程作业、开源软件、设计作品或实习成果。

### 04 兴趣模块

这个模块不是固定的跑步模块。

你可以修改：

- 兴趣名称
- 模块标题
- 模块介绍
- 数据亮点
- 每一条活动或经历
- 多张图片
- 每条记录的指标

#### 示例：把 Running 改成 Badminton

1. 打开 **兴趣模块**。
2. 将兴趣名称改为 `Badminton`。
3. 将主标题改为：

   ```text
   Speed, strategy, and the joy of every rally.
   ```

4. 把数据亮点改成：

   ```text
   Weekly Training = 3 sessions
   Favorite Event = Men's Doubles
   Club = University Badminton Club
   ```

5. 新建记录，例如 `Campus Badminton Tournament`。
6. 上传比赛照片。
7. 指标可以填写：

   ```text
   Result=Quarterfinal
   Format=Men's Doubles
   Matches=4
   ```

8. 保存并打开实时预览。

同样的方法可以创建摄影作品记录、音乐演出、旅行日记、读书清单或志愿活动。

### 05 Blog

点击 **新文章**，填写：

- 标题
- 日期
- 标签
- 摘要
- 正文
- 多张图片

文章保存在 `public/data/content.json`，图片保存在 `public/assets/uploads/`。

### 06 风格设计

点击任意主题卡片即可选择主题。你还可以修改：

- 主色：文字、深色区域和按钮
- 强调色：标签、编号和视觉信号
- 背景色：页面整体氛围

点击“使用默认”可以恢复当前主题原本的配色。

### 07 预览与发布

1. 点击右上角 **打开实时预览**。
2. 刷新预览页面查看最新内容。
3. 回到工作台的 **预览与发布**。
4. 填写 Commit 信息。
5. 点击 **Commit + Push 到 main**。

工作台只会提交以下内容：

- `public/data/content.json`
- `public/assets/uploads/`

它不会自动提交你手动修改的程序代码，降低误操作风险。

## 第一次启用 GitHub Pages

创建仓库后需要设置一次：

1. 打开 GitHub 仓库。
2. 进入 **Settings**。
3. 左侧选择 **Pages**。
4. 在 **Build and deployment** 中，将 Source 设为 **GitHub Actions**。
5. Push 一次代码到 `main`。
6. 打开仓库顶部的 **Actions**，等待 `Deploy Personal Site` 变成绿色。

部署完成后的地址：

- 用户主页仓库：`https://你的用户名.github.io/`
- 普通项目仓库：`https://你的用户名.github.io/仓库名/`

本网站使用相对路径，因此两种地址都支持。

## 文件结构

```text
personal-site-studio/
├─ public/                    # 唯一会部署到 GitHub Pages 的目录
│  ├─ index.html             # 公开网站结构
│  ├─ styles.css             # 12 套风格和响应式样式
│  ├─ app.js                 # 网站内容渲染
│  ├─ data/
│  │  ├─ content.json        # 你的全部网站内容
│  │  └─ themes.json         # 主题定义
│  └─ assets/uploads/        # 工作台上传的图片
├─ studio/                   # 仅本地使用的内容工作台
│  ├─ server.js
│  └─ public/
├─ .github/workflows/        # GitHub Pages 自动部署
├─ start-studio.cmd          # Windows 双击启动
└─ README.md
```

## 安全与隐私

- Studio 只监听 `127.0.0.1`，同一网络中的其他设备无法直接访问。
- `studio/` 不会被 GitHub Pages 部署。
- 不需要数据库。
- 不需要将 GitHub Token 写入文件。
- 发布使用你电脑现有的 Git 凭据。
- 所有内容和照片都存储在你自己的仓库中。

不要把身份证、住址、私人电话号码或不希望公开的照片上传到公开仓库。

## 常见问题

### 双击后没有自动打开浏览器

保持命令行窗口开启，手动打开：

```text
http://127.0.0.1:4174
```

### 提示 Node.js was not found

安装 <https://nodejs.org/> 的 LTS 版本，然后重新打开命令行或重启电脑。

### 发布时提示不是 main 分支

运行：

```bash
git switch main
```

然后重启 Studio。

### Push 需要登录 GitHub

推荐安装并登录 GitHub Desktop，或安装 GitHub CLI 后运行：

```bash
gh auth login
```

### Actions 成功但网页没有变化

1. 等待 1–3 分钟。
2. 强制刷新浏览器：Windows 使用 `Ctrl + F5`。
3. 检查 Settings → Pages 是否选择 GitHub Actions。

### 端口 4174 已经被使用

通常表示 Studio 已经启动。直接打开 `http://127.0.0.1:4174`。

也可以使用其他端口：

```powershell
$env:SITE_STUDIO_PORT=5000
npm run studio
```

## 进一步开发

项目只使用原生 HTML、CSS、JavaScript 和 Node.js，方便学习和二次开发。

运行语法检查：

```bash
npm run check
```

欢迎提交 Issue 或 Pull Request，新增主题、模块或可访问性改进。

## License

[MIT](LICENSE) © 2026 Yunzhi WU
