/**
 * @file noteExport.ts
 * @description 笔记导出工具 - 支持 Markdown, PDF, LaTeX, Word 格式
 */

import type { Note } from "@/lib/notes";

// ============ HTML 转 Markdown ============

function htmlToMarkdown(html: string): string {
  if (!html) return "";
  let md = html;
  
  // 处理标题
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n");
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n");
  
  // 处理粗体和斜体
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  
  // 处理下划线和删除线
  md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, "<u>$1</u>");
  md = md.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~");
  md = md.replace(/<strike[^>]*>(.*?)<\/strike>/gi, "~~$1~~");
  md = md.replace(/<del[^>]*>(.*?)<\/del>/gi, "~~$1~~");
  
  // 处理代码
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  md = md.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, "```\n$1\n```\n\n");
  
  // 处理引用
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, content) => {
    return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n\n';
  });
  
  // 处理链接
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  
  // 处理图片
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)");
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, "![]($1)");
  
  // 处理无序列表
  md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n") + "\n";
  });
  
  // 处理有序列表
  md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
    let index = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`) + "\n";
  });
  
  // 处理任务列表
  md = md.replace(/<li[^>]*data-checked="true"[^>]*>(.*?)<\/li>/gi, "- [x] $1\n");
  md = md.replace(/<li[^>]*data-checked="false"[^>]*>(.*?)<\/li>/gi, "- [ ] $1\n");
  
  // 处理水平线
  md = md.replace(/<hr[^>]*\/?>/gi, "\n---\n\n");
  
  // 处理段落
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  
  // 处理换行
  md = md.replace(/<br[^>]*\/?>/gi, "\n");
  
  // 清理剩余标签
  md = md.replace(/<[^>]+>/g, "");
  
  // 解码 HTML 实体
  md = md.replace(/&nbsp;/g, " ");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&quot;/g, '"');
  
  // 清理多余空行
  md = md.replace(/\n{3,}/g, "\n\n");
  
  return md.trim();
}

// ============ HTML 转 LaTeX ============

function htmlToLatex(html: string, title: string): string {
  if (!html) return "";
  let latex = html;
  
  // 处理标题
  latex = latex.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\\section{$1}\n\n");
  latex = latex.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\\subsection{$1}\n\n");
  latex = latex.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\\subsubsection{$1}\n\n");
  latex = latex.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\\paragraph{$1}\n\n");
  
  // 处理粗体和斜体
  latex = latex.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "\\textbf{$1}");
  latex = latex.replace(/<b[^>]*>(.*?)<\/b>/gi, "\\textbf{$1}");
  latex = latex.replace(/<em[^>]*>(.*?)<\/em>/gi, "\\textit{$1}");
  latex = latex.replace(/<i[^>]*>(.*?)<\/i>/gi, "\\textit{$1}");
  
  // 处理下划线和删除线
  latex = latex.replace(/<u[^>]*>(.*?)<\/u>/gi, "\\underline{$1}");
  latex = latex.replace(/<s[^>]*>(.*?)<\/s>/gi, "\\sout{$1}");
  latex = latex.replace(/<del[^>]*>(.*?)<\/del>/gi, "\\sout{$1}");
  
  // 处理代码
  latex = latex.replace(/<code[^>]*>(.*?)<\/code>/gi, "\\texttt{$1}");
  latex = latex.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, "\\begin{verbatim}\n$1\n\\end{verbatim}\n\n");
  
  // 处理引用
  latex = latex.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "\\begin{quote}\n$1\n\\end{quote}\n\n");
  
  // 处理链接
  latex = latex.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "\\href{$1}{$2}");
  
  // 处理无序列表
  latex = latex.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => {
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, "  \\item $1\n");
    return "\\begin{itemize}\n" + items + "\\end{itemize}\n\n";
  });
  
  // 处理有序列表
  latex = latex.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
    const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, "  \\item $1\n");
    return "\\begin{enumerate}\n" + items + "\\end{enumerate}\n\n";
  });
  
  // 处理水平线
  latex = latex.replace(/<hr[^>]*\/?>/gi, "\n\\hrulefill\n\n");
  
  // 处理段落
  latex = latex.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  
  // 处理换行
  latex = latex.replace(/<br[^>]*\/?>/gi, "\\\\\n");
  
  // 清理剩余标签
  latex = latex.replace(/<[^>]+>/g, "");
  
  // 解码 HTML 实体
  latex = latex.replace(/&nbsp;/g, " ");
  latex = latex.replace(/&lt;/g, "<");
  latex = latex.replace(/&gt;/g, ">");
  latex = latex.replace(/&amp;/g, "\\&");
  latex = latex.replace(/&quot;/g, '"');
  
  // 清理多余空行
  latex = latex.replace(/\n{3,}/g, "\n\n");
  
  // 构建完整 LaTeX 文档
  const document = `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{ulem}
\\usepackage{graphicx}

\\title{${title}}
\\date{\\today}

\\begin{document}

\\maketitle

${latex.trim()}

\\end{document}
`;
  
  return document;
}

// ============ 导出函数 ============

/**
 * 导出为 Markdown 格式
 */
export async function exportToMarkdown(note: Note): Promise<string> {
  if (!note.content) {
    throw new Error("笔记内容为空");
  }
  const markdown = htmlToMarkdown(note.content);
  const title = extractTitle(note.content) || "Untitled";
  const filename = `${title}.md`;
  
  downloadFile(filename, markdown, "text/markdown");
  return filename;
}

/**
 * 导出为 PDF 格式（使用 html2pdf.js 直接生成 PDF）
 */
export async function exportToPDF(note: Note, _isDark?: boolean): Promise<string> {
  if (!note.content) {
    throw new Error("笔记内容为空");
  }
  const title = extractTitle(note.content) || "Untitled";
  const filename = `${title}.pdf`;
  
  // 动态导入 html2pdf.js
  const html2pdf = (await import("html2pdf.js")).default;
  
  // 创建临时容器
  const container = document.createElement("div");
  container.innerHTML = `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    ">
      <style>
        h1, h2, h3, h4, h5, h6 { margin-top: 1em; margin-bottom: 0.5em; font-weight: 600; }
        h1 { font-size: 1.8em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
        h2 { font-size: 1.4em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        p { margin: 0.8em 0; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
        pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 4px solid #ddd; margin: 1em 0; padding-left: 1em; color: #666; }
        ul, ol { margin: 0.8em 0; padding-left: 2em; }
        li { margin: 0.3em 0; }
        a { color: #0066cc; }
        img { max-width: 100%; height: auto; }
        hr { border: none; border-top: 1px solid #eee; margin: 1.5em 0; }
      </style>
      ${note.content}
    </div>
  `;
  
  // 临时添加到文档以便渲染
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);
  
  // 配置 PDF 选项
  const options = {
    margin: 10,
    filename: filename,
    image: { type: "jpeg" as const, quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: { 
      unit: "mm" as const, 
      format: "a4" as const, 
      orientation: "portrait" as const
    }
  };
  
  try {
    await html2pdf().set(options).from(container).save();
  } finally {
    // 清理临时容器
    document.body.removeChild(container);
  }
  
  return filename;
}

/**
 * 导出为 LaTeX 格式
 */
export async function exportToLatex(note: Note): Promise<string> {
  if (!note.content) {
    throw new Error("笔记内容为空");
  }
  const title = extractTitle(note.content) || "Untitled";
  const latex = htmlToLatex(note.content, title);
  const filename = `${title}.tex`;
  
  downloadFile(filename, latex, "text/x-latex");
  return filename;
}

/**
 * 导出为 Word 格式（使用 HTML 转 Word 的方式）
 */
export async function exportToWord(note: Note): Promise<string> {
  if (!note.content) {
    throw new Error("笔记内容为空");
  }
  const title = extractTitle(note.content) || "Untitled";
  const filename = `${title}.doc`;
  
  // 使用 HTML 格式创建 Word 文档
  // Word 可以直接打开包含特定头部的 HTML 文件
  const wordContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.5;
    }
    h1 { font-size: 24pt; font-weight: bold; }
    h2 { font-size: 18pt; font-weight: bold; }
    h3 { font-size: 14pt; font-weight: bold; }
    p { margin: 12pt 0; }
    ul, ol { margin: 12pt 0; }
    li { margin: 6pt 0; }
    code { font-family: "Courier New", monospace; background: #f0f0f0; padding: 2pt 4pt; }
    pre { font-family: "Courier New", monospace; background: #f0f0f0; padding: 12pt; }
    blockquote { margin-left: 24pt; padding-left: 12pt; border-left: 3pt solid #ccc; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${note.content}
</body>
</html>
`;
  
  // 创建 Blob 并下载
  const blob = new Blob([wordContent], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}

// ============ 辅助函数 ============

function extractTitle(html: string): string {
  if (!html) return "Untitled";
  
  // 尝试从 H1 标签提取标题
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].replace(/<[^>]+>/g, "").trim();
  }
  
  // 尝试从第一行文本提取
  const textMatch = html.replace(/<[^>]+>/g, "").trim();
  const firstLine = textMatch.split("\n")[0];
  return firstLine.substring(0, 50) || "Untitled";
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============ 导出类型 ============

export type ExportFormat = "markdown" | "pdf" | "latex" | "word";

export const exportFormats: { value: ExportFormat; label: string; icon: string; ext: string }[] = [
  { value: "markdown", label: "Markdown", icon: "📝", ext: ".md" },
  { value: "pdf", label: "PDF", icon: "📄", ext: ".pdf" },
  { value: "latex", label: "LaTeX", icon: "📐", ext: ".tex" },
  { value: "word", label: "Word", icon: "📃", ext: ".doc" },
];

/**
 * 统一导出接口
 * @returns 导出的文件名
 */
export async function exportNote(note: Note, format: ExportFormat, isDark = false): Promise<string> {
  if (!note) {
    throw new Error("没有选中的笔记");
  }
  
  try {
    switch (format) {
      case "markdown":
        return await exportToMarkdown(note);
      case "pdf":
        return await exportToPDF(note, isDark);
      case "latex":
        return await exportToLatex(note);
      case "word":
        return await exportToWord(note);
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`导出失败: ${String(error)}`);
  }
}
