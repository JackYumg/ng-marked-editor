import { isDarkTheme, ThemeType } from '../types/editor';

/** 从当前主题的 CSS 变量派生 mermaid 配色，保证深浅主题下都清晰可读 */
export function buildMermaidThemeVariables(scope: HTMLElement, theme: ThemeType): Record<string, string | boolean> {
  const style = getComputedStyle(scope);
  const pick = (name: string, fallback: string): string => (style.getPropertyValue(name) || '').trim() || fallback;

  const text = pick('--md-text', '#1f2328');
  const muted = pick('--md-text-muted', '#59636e');
  const bg = pick('--md-bg', '#ffffff');
  const surface = pick('--md-surface', '#f6f8fa');
  const stripe = pick('--md-table-stripe', 'rgba(129, 139, 152, .12)');
  const border = pick('--md-border', '#d1d9e0');
  const link = pick('--md-link', '#0969da');
  const isDark = isDarkTheme(theme);

  return {
    darkMode: isDark,
    background: bg,
    fontFamily: style.fontFamily || 'inherit',
    fontSize: style.fontSize || '14px',
    // 通用节点 / 连线
    primaryColor: surface,
    primaryTextColor: text,
    primaryBorderColor: border,
    secondaryColor: surface,
    secondaryTextColor: text,
    secondaryBorderColor: border,
    tertiaryColor: bg,
    tertiaryTextColor: text,
    tertiaryBorderColor: border,
    mainBkg: surface,
    nodeBorder: border,
    nodeTextColor: text,
    lineColor: muted,
    textColor: text,
    titleColor: text,
    edgeLabelBackground: bg,
    clusterBkg: bg,
    clusterBorder: border,
    // 时序图
    actorBkg: surface,
    actorBorder: border,
    actorTextColor: text,
    actorLineColor: muted,
    signalColor: muted,
    signalTextColor: text,
    labelBoxBkgColor: surface,
    labelBoxBorderColor: border,
    labelTextColor: text,
    loopTextColor: text,
    noteBkgColor: stripe,
    noteTextColor: text,
    noteBorderColor: border,
    activationBkgColor: surface,
    activationBorderColor: border,
    sequenceNumberColor: link,
    // 饼图 / 甘特图等辅助色
    pie1: link,
    pie2: '#2da44e',
    pie3: '#bf8700',
    pie4: '#cf222e',
    pieTitleTextColor: text,
    pieSectionTextColor: text,
    pieLegendTextColor: text,
    pieStrokeColor: border,
    taskBkgColor: surface,
    taskTextColor: text,
    taskBorderColor: border,
    taskTextOutsideColor: text,
    activeTaskBkgColor: stripe,
    activeTaskBorderColor: border,
    gridColor: border
  };
}
