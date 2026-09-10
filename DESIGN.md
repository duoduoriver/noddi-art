---
version: alpha
name: "noddi"
description: "以黑白手绘涂鸦为基础、结合荧光撞色与 AI 创意图标语言的年轻化设计系统。"

colors:
  primary: "#111111"
  secondary: "#9B7BFF"
  tertiary: "#C6FF5B"
  neutral: "#111111"
  surface: "#FFFFFF"
  surface-muted: "#F7F6F2"
  border: "#D8D6D0"
  text-primary: "#111111"
  text-secondary: "#5F5F5F"
  accent: "#FF6FC7"
  info: "#6FC1FF"
  error: "#FF3B30"

typography:
  headline-display:
    fontFamily: "Handwritten Display, Comic Sans MS, cursive"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0em
  headline-lg:
    fontFamily: "Handwritten Display, Comic Sans MS, cursive"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0em
  headline-md:
    fontFamily: "Handwritten Display, Comic Sans MS, cursive"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0em
  body-md:
    fontFamily: "Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0em
  label-md:
    fontFamily: "Handwritten Display, Comic Sans MS, cursive"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.01em
  caption:
    fontFamily: "Source Han Sans SC, Noto Sans CJK SC, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0em

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
  "3xl": 64px
  gutter: 8px
  margin: 32px

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 12px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
  button-primary-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: 12px
    height: 40px
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: 24px
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 40px
  input-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
  input-error:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
  tab-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 8px
  tab-selected:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 8px
---

# DESIGN.md

## Overview

noddi 采用黑白手绘涂鸦作为视觉基础，以荧光绿、紫色、粉色和蓝色作为局部点缀，形成具有 AI 创造力、街头手账感和年轻实验气质的界面语言。品牌视觉强调“不规则但可控”：结构保持清晰，轮廓、图标、标记和高亮则保留手绘笔触、错位和墨迹质感。

- **视觉关键词**：手绘、涂鸦、AI 创意、荧光撞色、黑白、高对比、粗线条、不规则、趣味、未来感。
- **设计风格**：编辑式网格与自由涂鸦相结合；界面骨架简洁，品牌表达集中在图标、标题、按钮边缘和局部色块。
- **情绪氛围**：年轻、友好、机灵、富有创作冲动，不追求冷峻精密的科技感。
- **信息密度**：中等偏低；每个卡片或页面围绕单一任务组织，并保留充足留白。
- **适用场景**：AI 创作工具、图标生成器、创意工作台、设计社区、作品导出流程、年轻化营销页面。
- **目标用户**：独立创作者、设计师、内容创作者以及希望快速生成视觉素材的普通用户。

品牌名称由用户明确指定为 **noddi**。页面最大宽度、具体组件尺寸及部分交互状态未在图片中明确标注，相关规则均为基于图中比例的**推断**。

## Colors

| Token | 中文名称 | HEX | 用途 |
|---|---|---:|---|
| primary | 主色／墨黑 | #111111 | 品牌图形、标题、主按钮、关键轮廓 |
| secondary | 荧光紫 | #9B7BFF | 选中态、品牌光环、局部高亮 |
| tertiary | 荧光绿 | #C6FF5B | CTA 点缀、状态提示、能量元素 |
| neutral | 中性黑 | #111111 | 图标线稿、正文强调、描边 |
| surface | 纯白表面 | #FFFFFF | 页面、卡片、输入框背景 |
| surface-muted | 暖灰表面 | #F7F6F2 | 次级区域和背景分层；数值为推断 |
| border | 暖灰边框 | #D8D6D0 | 卡片、输入框、窗口与分割线；数值为推断 |
| text-primary | 主文字 | #111111 | 标题、正文与主要信息 |
| text-secondary | 次文字 | #5F5F5F | 描述、说明与弱化信息；数值为推断 |
| accent | 荧光粉 | #FF6FC7 | 趣味装饰、AI 标签、创作状态强调 |
| info | 明亮蓝 | #6FC1FF | 信息类图标和辅助插画 |
| error | 错误红 | #FF3B30 | 错误提示与禁止标记；图片未明确给出色值，数值为推断 |

- 黑白是系统主体，应承担大部分背景、文字、按钮和轮廓。
- 荧光绿、紫、粉、蓝用于建立活力和识别度，建议单个视图选择一至两种作为主要点缀。
- 中性色通过纯白、暖灰表面、浅灰边框、次级文字和墨黑形成层次，不依赖大面积灰色渐变。
- 功能色应与图标或文字标签同时出现，避免仅依赖颜色表达状态。
- `primary` 与 `text-primary` 适合正文和标题；荧光绿、粉色不宜直接承载小字号正文。
- 荧光色只应小面积使用，避免同时大面积铺满多种高饱和颜色。
- 紫色可用于选中框、环形动效和焦点提示；荧光绿适合 CTA 箭头、成功标记与能量符号；粉色适合创意标签和趣味装饰。

## Typography

| Token | 字体 | 字号 | 字重 | 行高 | 用途 |
|---|---|---:|---:|---:|---|
| headline-display | Handwritten Display | 48px | 700 | 1.2 | 营销页主标题、品牌宣言 |
| headline-lg | Handwritten Display | 32px | 700 | 1.2 | 页面标题、定价标题 |
| headline-md | Handwritten Display | 24px | 600 | 1.3 | 卡片标题、模块标题 |
| body-md | Source Han Sans SC | 16px | 400 | 1.6 | 正文、表单说明 |
| label-md | Handwritten Display | 14px | 600 | 1.4 | 按钮、标签、短促强调文字 |
| caption | Source Han Sans SC | 12px | 400 | 1.4 | 辅助说明、状态和元信息 |

- 图片明确将标题字体描述为“手写风格”，但未标注具体字体名称；`Handwritten Display` 是实现时应替换的语义字体名。
- 中文正文使用图片明确标注的**思源黑体 / Source Han Sans**，保持清晰、易读和较弱的视觉噪声。
- 英文标题可使用粗笔触、略微倾斜或不规则基线的手写展示字体；英文正文沿用 Source Han Sans 或兼容无衬线字体。
- 数字在标题、价格和生成结果中可使用手写展示字体；长数字、表单数据和参数应使用正文无衬线字体。
- 标题负责表达个性，正文负责信息效率。避免在长段正文、复杂表格或密集表单中使用手写字体。
- 图片未明确给出字号、字重、行高和字距数值；YAML 中的排版比例均为**推断**，依据图中标题与正文的层级关系建立。
- 排版整体应呈现“松弛但清楚”的气质：标题可有轻微不规则感，正文必须保持稳定基线和充足行距。

## Layout

- **页面最大宽度**：建议 1200px；图片未明确标注，属于**推断**。
- **栅格**：图片明确标注采用 **12 列栅格系统**。
- **基础间距**：图片明确标注间距基数为 **8px**。所有常规间距优先使用 8px 的倍数，4px 仅用于微调。
- **Gutter**：图片展示列间距为 8px，因此桌面端以 8px 为基准；复杂产品界面可扩大至 16px，但需保持统一。
- **页面 margin**：建议桌面端 32px、平板端 24px、移动端 16px；图片未明确标注，属于**推断**。
- **模块间距**：关联内容使用 16–24px；独立模块使用 32–48px；营销页面大区块使用 64px。
- **卡片排列**：卡片保持等宽、顶部对齐，以 2–4 列矩阵组织；单卡内部优先采用图形在上、标题和说明在下的纵向结构。
- **横向排布**：适合工具栏、标签组、定价选项和图标候选；需维持明确的对齐线。
- **纵向排布**：适合登录、生成、导出等单任务流程；每屏聚焦一个主要动作。
- **响应式建议**：桌面使用 12 列，平板使用 8 列，移动端使用 4 列；移动端卡片改为单列或双列，主按钮可扩展至容器全宽。平板和移动列数为**推断**。
- 自由涂鸦装饰可以越出栅格，但正文、表单和 CTA 必须落在栅格中，避免“随意感”破坏可用性。

## Elevation & Depth

- 图片中的界面主要依靠黑色描边、浅色分割线、前后遮挡和局部色块建立层级，而非柔和的现代 SaaS 阴影。
- 默认卡片使用白色背景、1px 黑色或暖灰描边；可增加轻微错位的手绘复线，模拟纸张或速写框。
- 阴影应短、硬、低模糊，可采用 2–4px 的黑色偏移阴影；具体数值未在图片中明确标注，属于**推断**。
- 紫色环形笔触可以作为品牌图标、选中项或 AI 生成中的焦点光环，但不作为通用发光效果。
- 背景层使用纯白或极浅暖灰；卡片层使用纯白加描边；浮层使用更明确的黑色轮廓与轻微错位阴影；弹窗层可叠加半透明黑色遮罩。
- 深色背景仅用于按钮、品牌标识或局部展示区。深色表面上的文字优先使用白色，点缀使用荧光绿或紫色。
- 避免大面积柔焦阴影、玻璃拟态和连续霓虹外发光，以免削弱手绘纸面质感。

## Shapes

- 圆角系统以 4px、8px、12px、16px 和胶囊圆角构成；具体阶梯未在图片中明确标注，属于**推断**。
- 主按钮为横向胶囊形，边缘可带轻微刷痕、粗糙遮罩或不完全平直的轮廓。
- 次按钮使用白色填充、黑色细描边和胶囊轮廓，可附加少量荧光绿手绘点缀。
- 卡片整体接近矩形，仅使用轻微圆角；保持像纸张、软件窗口或速写框，而不是大圆角软胶卡片。
- 输入框采用小圆角矩形和细描边，形状应比按钮更克制。
- 图标容器可使用圆形、椭圆、圆角方形或不规则爆炸形；品牌头像采用不规则黑色椭圆。
- 装饰边框应模拟铅笔、马克笔或毛刷笔触，允许轻微断线、重叠和偏移。
- 线条以黑色中粗线为主，轮廓不要求机械一致，但必须保持主体辨识度。

## Components

### Button

- **Primary button**：黑色胶囊背景、白色手写标签、右侧荧光绿箭头；高度建议 40px，水平内边距建议 20–24px，数值为**推断**。
- **Secondary button**：白色背景、黑色描边和黑色文字，可使用荧光绿的箭头或局部手绘轮廓作为强调。
- **Hover**：主按钮可切换为紫色背景，或保留黑色背景并增强绿色箭头；动效控制在 150–200ms，时长为**推断**。
- **Active**：恢复墨黑背景，标签或箭头切换为荧光绿，并产生 1–2px 的按压位移；位移值为**推断**。
- **Disabled**：暖灰背景、次级灰文字，移除荧光装饰和阴影，不使用高饱和颜色。
- 按钮标签优先使用 `label-md`，短文本、首字母大小写清晰，不在按钮内放置长句。
- 笔刷纹理应限制在边缘，不能影响文字识别和点击区域。

### Card

- 背景使用纯白，文字使用墨黑，边框使用暖灰或黑色手绘细线。
- 默认圆角建议 4px，内边距建议 24px；数值为**推断**。
- 图标类卡片优先使用接近 1:1 的图片区；营销卡片可使用 4:3。图片比例未在设计图中明确标注，属于**推断**。
- 标题使用 `headline-md` 或较小的手写标签，说明文字使用 `body-md` 或 `caption`。
- 默认不使用大面积柔和阴影；如需悬浮，可增加硬边偏移阴影或加深描边。
- 卡片中的荧光色应围绕一个焦点出现，例如图标、标签或状态，不同时竞争标题层级。

### Input

- **默认态**：白色背景、浅灰细描边、墨黑输入文字，小圆角矩形。
- **聚焦态**：使用紫色描边或紫色手绘外环，并保持足够对比度；图片未明确展示完整聚焦态，该规则为**推断**。
- **错误态**：边框和辅助文字使用错误红，并配合图标或文字说明，不仅依赖颜色。
- **禁用态**：暖灰背景、灰色文字、低对比描边，移除装饰性笔触。
- Placeholder 使用 `text-secondary`，但需确保可读性，不使用过浅灰色。
- 表单内保持稳定、规整的输入框结构，手绘风格应集中于焦点环、图标或说明标签，避免破坏输入边界。

### Tabs

- **默认态**：白色或透明背景、次级文字、小圆角，保持轻量。
- **选中态**：使用紫色手绘底纹、紫色描边或浅紫填充，文字切换为墨黑并提高字重。
- **Hover 态**：增加浅紫背景或荧光绿短下划线；图片未明确展示 hover，属于**推断**。
- 标签组可置于横向工具栏或卡片顶部，间距遵循 8px 基数。
- 标签文字使用 `label-md`；数量较多时允许横向滚动，不压缩至难以点击。

### Icon

- 图标采用手绘涂鸦风，主要类型包括多色涂鸦、品牌 IP、能量元素、趣味手绘和线稿涂鸦。
- 线条以不规则黑色中粗轮廓为主，搭配少量墨迹、飞白、星点和速度线。
- 常用 UI 图标建议 20–24px；展示型生成图标可使用 48–96px。尺寸未在图片中明确标注，属于**推断**。
- 容器可使用圆角方形、圆形或不规则几何形，选中时增加紫色描边或手绘光环。
- 同一组图标应统一轮廓粗细、黑色占比和荧光色数量，但允许轻微形状差异。
- 图标用于导航时必须优先保证识别；复杂涂鸦图标更适合作为生成结果、功能插画或品牌装饰。

## Do's and Don'ts

### Do

- Do 保持充足留白，让黑色主体和荧光点缀形成清晰焦点。
- Do 正确使用黑白品牌主色，并以紫、绿、粉、蓝进行小面积强调。
- Do 保留手绘线条、墨迹、涂抹和轻微错位，增强亲和力与趣味性。
- Do 使用 12 列栅格与 8px 间距基数约束界面结构。
- Do 将手写字体用于标题和短标签，将思源黑体用于正文与表单。
- Do 让同一组图标保持一致的轮廓粗细、色彩比例和视觉重量。
- Do 为交互状态同时提供颜色、文字或图标反馈。

### Don't

- Don't 随意改变品牌 IP 的黑色主体、叉形眼睛、微笑嘴形和紫色光环等核心特征。
- Don't 将品牌 IP 改成橙色或其他未经定义的大面积主色。
- Don't 同屏大面积使用全部荧光色，造成视觉竞争。
- Don't 使用过度规整、完全机械化的矢量线条替代手绘质感。
- Don't 在长正文和密集数据中使用手写字体。
- Don't 使用低对比文字、过浅边框或仅靠颜色传达错误和成功状态。
- Don't 引入玻璃拟态、厚重拟物阴影或无规则渐变，破坏纸面涂鸦风格。

## AI Generation Guidelines

### Visual Keywords

- 黑白手绘涂鸦
- AI 创意工具
- 荧光紫
- 荧光绿
- 荧光粉
- 明亮蓝
- 不规则粗线条
- 纸张与墨迹质感
- 12 列编辑式网格
- 高对比留白
- 趣味品牌 IP
- 胶囊形 CTA
- 手绘软件窗口
- 年轻实验感
- 可控的不完美

### Positive Prompt

为 **noddi** 生成一套年轻化 AI 创作工具界面：以纯白或轻微暖白纸张背景为基础，使用高对比墨黑手绘轮廓、充足留白和清晰的 12 列编辑式网格；标题和按钮标签采用粗笔触手写字体，正文采用清晰的思源黑体；主按钮为带毛刷边缘的黑色胶囊按钮，并加入荧光绿箭头；用荧光紫、荧光绿、荧光粉和明亮蓝进行克制的小面积撞色；图标采用不规则粗线、墨迹、星点、速度线和轻微错位的手绘涂鸦风；卡片像白色纸片或简洁软件窗口，使用细描边、小圆角和短硬阴影；品牌 IP 为黑色不规则椭圆头部、叉形眼睛、微笑嘴形和紫色环形光带。整体感觉友好、机灵、创意、未来而不冰冷，保留可控的不完美，同时确保表单、导航和主要任务流程清晰可用。

### Negative Prompt

- modern generic SaaS
- corporate blue dashboard
- flat cartoon
- childish clip art
- excessive neon
- full-screen saturated color fields
- random gradients
- glassmorphism
- glossy 3D rendering
- soft oversized shadows
- perfectly geometric vector lines
- inconsistent typography
- handwritten long-form body text
- crowded composition
- low contrast text
- tiny click targets
- multiple competing accent colors
- altered brand mascot facial features
- orange brand mascot

## Implementation Notes

```css
:root {
  --color-primary: #111111;
  --color-secondary: #9b7bff;
  --color-tertiary: #c6ff5b;
  --color-surface: #ffffff;
  --color-surface-muted: #f7f6f2;
  --color-border: #d8d6d0;
  --color-text-primary: #111111;
  --color-text-secondary: #5f5f5f;
  --color-accent: #ff6fc7;
  --color-info: #6fc1ff;
  --color-error: #ff3b30;

  --font-headline: "Handwritten Display", "Comic Sans MS", cursive;
  --font-body: "Source Han Sans SC", "Noto Sans CJK SC", sans-serif;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
  --grid-gutter: 8px;

  --rounded-sm: 4px;
  --rounded-md: 8px;
  --rounded-lg: 12px;
  --rounded-xl: 16px;
  --rounded-full: 9999px;
}
```

实现时应优先保留三项核心特征：黑白高对比骨架、手绘线条质感、克制的荧光撞色。手写展示字体在图片中未明确命名，正式开发前应选择具有中文授权和 Web 字体授权的具体字体，并以实际字形重新校准字号、行高和按钮宽度。组件交互必须满足键盘焦点可见性、文本对比度和最小点击区域要求；手绘装饰不得覆盖交互内容或降低信息可读性。
