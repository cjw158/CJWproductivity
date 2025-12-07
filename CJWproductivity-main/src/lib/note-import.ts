/**
 * 笔记导入工具
 * 支持格式: Markdown (.md), HTML (.html, .htm), 纯文本 (.txt), Word (.docx)
 */

import { marked } from "marked";
import mammoth from "mammoth";
import DOMPurify from "dompurify";

export type ImportFormat = "md" | "html" | "txt" | "docx";

export interface ImportResult {
  success: boolean;
  title: string;
  content: string;
  error?: string;
}

// 支持的文件扩展名
export const SUPPORTED_EXTENSIONS = [".md", ".markdown", ".html", ".htm", ".txt", ".docx"];

export const ACCEPT_FILE_TYPES = SUPPORTED_EXTENSIONS.map(ext => {
  switch (ext) {
    case ".md":
    case ".markdown":
      return ".md,.markdown,text/markdown";
    case ".html":
    case ".htm":
      return ".html,.htm,text/html";
    case ".txt":
      return ".txt,text/plain";
    case ".docx":
      return ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "";
  }
}).join(",");

/**
 * 从文件名获取格式类型
 */
export function getFormatFromFilename(filename: string): ImportFormat | null {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "md":
    case "markdown":
      return "md";
    case "html":
    case "htm":
      return "html";
    case "txt":
      return "txt";
    case "docx":
      return "docx";
    default:
      return null;
  }
}

/**
 * 从文件名提取标题（去除扩展名）
 */
function extractTitleFromFilename(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

/**
 * 从 HTML 内容中提取标题（第一个 h1 或前几个字）
 */
function extractTitleFromHtml(html: string): string {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    // 移除 HTML 标签
    return h1Match[1].replace(/<[^>]*>/g, "").trim();
  }
  
  // 从纯文本中提取前30个字符
  const textContent = html.replace(/<[^>]*>/g, "").trim();
  if (textContent.length > 0) {
    return textContent.slice(0, 30) + (textContent.length > 30 ? "..." : "");
  }
  
  return "导入的笔记";
}

/**
 * 处理目录/锚点链接，将外部链接转换为内部锚点
 * 例如: href="https://blog.csdn.net/xxx#section1" -> href="#section1"
 * 同时确保对应的标题有正确的 id 属性
 */
function fixAnchorLinks(html: string): string {
  let fixed = html;
  
  // 1. 将带锚点的外部链接转换为纯锚点链接
  // 匹配 href="https://...#anchor" 或 href="http://...#anchor"
  fixed = fixed.replace(/href=["']https?:\/\/[^"']*#([^"']+)["']/gi, 
    (_match, anchor) => `href="#${anchor}"`
  );
  
  // 2. 确保标题元素有对应的 id 属性（用于锚点跳转）
  // 处理 h1-h6 标签，如果有 id 属性就保留，没有就根据内容生成
  fixed = fixed.replace(/<(h[1-6])([^>]*)>([\s\S]*?)<\/\1>/gi, 
    (match, tag, attrs, content) => {
      // 如果已有 id 属性，保持不变
      if (/\bid=["'][^"']+["']/i.test(attrs)) {
        return match;
      }
      // 提取纯文本作为 id
      const textContent = content.replace(/<[^>]*>/g, '').trim();
      if (textContent) {
        // 生成 URL 友好的 id
        const id = encodeURIComponent(textContent).replace(/%20/g, '-');
        return `<${tag} id="${id}"${attrs}>${content}</${tag}>`;
      }
      return match;
    }
  );
  
  return fixed;
}

/**
 * 处理 HTML 中的防盗链问题
 * 1. 添加 referrerpolicy="no-referrer" 到所有 img 标签
 * 2. 处理懒加载：将 data-src 移动到 src
 * 3. 移除 lazyload 类
 */
function fixHotlinkProtection(html: string): string {
  let fixed = html;
  
  // 1. 处理懒加载：将 data-src 或 data-original-src 的值移到 src
  fixed = fixed.replace(/<img([^>]*?)data-(?:original-)?src=["']([^"']+)["']([^>]*)>/gi, 
    (_match, before, dataSrc, after) => {
      // 如果已有 src，替换它；否则添加 src
      const combined = before + after;
      if (/\ssrc=["'][^"']*["']/i.test(combined)) {
        // 替换现有的 src（可能是占位图）
        const newAttrs = combined.replace(/\ssrc=["'][^"']*["']/i, ` src="${dataSrc}"`);
        return `<img${newAttrs}>`;
      } else {
        return `<img src="${dataSrc}"${combined}>`;
      }
    }
  );
  
  // 2. 给所有 img 标签添加 referrerpolicy="no-referrer"（如果没有的话）
  fixed = fixed.replace(/<img(?![^>]*referrerpolicy)([^>]*)>/gi, 
    (_match, attrs) => `<img referrerpolicy="no-referrer"${attrs}>`
  );
  
  // 3. 移除 lazyload 类
  fixed = fixed.replace(/\bclass=["']([^"']*)\blazyload\b([^"']*)["']/gi, 
    (_match, before, after) => `class="${before}${after}"`
  );
  
  // 4. 处理 CSDN 特有的图片格式（有时图片在 data-src 但没有 data- 前缀的懒加载标记）
  fixed = fixed.replace(/<img([^>]*?)src=["']([^"']*(?:csdnimg|csdn)[^"']*)["']([^>]*)>/gi,
    (match, before, src, after) => {
      // 确保 CSDN 图片有 referrerpolicy
      if (!match.includes('referrerpolicy')) {
        return `<img referrerpolicy="no-referrer"${before}src="${src}"${after}>`;
      }
      return match;
    }
  );
  
  return fixed;
}

/**
 * 将纯文本转换为 HTML
 */
function textToHtml(text: string): string {
  // 分段处理
  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map(p => {
      // 处理单行换行
      const lines = p.split(/\n/).map(line => line.trim()).filter(Boolean);
      return `<p>${lines.join("<br>")}</p>`;
    })
    .join("\n");
}

/**
 * 导入 Markdown 文件
 */
async function importMarkdown(content: string, filename: string): Promise<ImportResult> {
  try {
    // 配置 marked
    marked.setOptions({
      breaks: true, // 支持 GFM 换行
      gfm: true,    // 启用 GFM
    });
    
    const html = await marked.parse(content);
    // 处理防盗链问题
    const fixedHtml = fixHotlinkProtection(html);
    const cleanHtml = DOMPurify.sanitize(fixedHtml, {
      ADD_TAGS: ["math", "semantics", "mrow", "mi", "mo", "mn", "msup", "msub", "mfrac", "img"],
      ADD_ATTR: ["class", "style", "href", "src", "alt", "title", "width", "height", "loading", "referrerpolicy"],
      ADD_DATA_URI_TAGS: ["img", "a"],
      ADD_URI_SAFE_ATTR: ["src", "href"],
      ALLOW_DATA_ATTR: true,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|data|blob|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
    
    // 提取标题
    let title = extractTitleFromHtml(cleanHtml);
    if (!title || title === "导入的笔记") {
      title = extractTitleFromFilename(filename);
    }
    
    return {
      success: true,
      title,
      content: cleanHtml,
    };
  } catch (error) {
    return {
      success: false,
      title: extractTitleFromFilename(filename),
      content: "",
      error: `Markdown 解析失败: ${error}`,
    };
  }
}

/**
 * 导入 HTML 文件
 */
async function importHtml(content: string, filename: string): Promise<ImportResult> {
  try {
    // 尝试提取 body 内容
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let htmlContent = bodyMatch ? bodyMatch[1] : content;
    
    // 先处理防盗链和锚点链接问题
    let fixedHtml = fixHotlinkProtection(htmlContent);
    fixedHtml = fixAnchorLinks(fixedHtml);
    
    // 清理 HTML - 允许图片和各种 URI
    const cleanHtml = DOMPurify.sanitize(fixedHtml, {
      ADD_TAGS: ["math", "semantics", "mrow", "mi", "mo", "mn", "msup", "msub", "mfrac", "img"],
      ADD_ATTR: ["class", "style", "href", "src", "alt", "title", "width", "height", "data-*", "loading", "referrerpolicy", "id"],
      ADD_DATA_URI_TAGS: ["img", "a"], // 允许 img 和 a 标签使用 data: URI
      ADD_URI_SAFE_ATTR: ["src", "href"], // 允许 src 和 href 包含 URI
      FORBID_TAGS: ["script", "iframe", "form", "input"],
      ALLOW_DATA_ATTR: true,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|data|blob|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
    
    // 提取标题
    let title = extractTitleFromHtml(cleanHtml);
    if (!title || title === "导入的笔记") {
      // 尝试从 <title> 标签获取
      const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      } else {
        title = extractTitleFromFilename(filename);
      }
    }
    
    return {
      success: true,
      title,
      content: cleanHtml,
    };
  } catch (error) {
    return {
      success: false,
      title: extractTitleFromFilename(filename),
      content: "",
      error: `HTML 解析失败: ${error}`,
    };
  }
}

/**
 * 导入纯文本文件
 */
async function importText(content: string, filename: string): Promise<ImportResult> {
  try {
    const html = textToHtml(content);
    const title = extractTitleFromFilename(filename);
    
    // 如果第一行看起来像标题，用它作为 h1
    const firstLine = content.split("\n")[0].trim();
    let finalHtml = html;
    if (firstLine && firstLine.length <= 100 && !firstLine.includes(".")) {
      finalHtml = `<h1>${firstLine}</h1>\n` + html.replace(`<p>${firstLine}</p>`, "").replace(`<p>${firstLine}<br>`, "<p>");
    }
    
    return {
      success: true,
      title: firstLine && firstLine.length <= 50 ? firstLine : title,
      content: finalHtml,
    };
  } catch (error) {
    return {
      success: false,
      title: extractTitleFromFilename(filename),
      content: "",
      error: `文本解析失败: ${error}`,
    };
  }
}

/**
 * 导入 Word 文档 (.docx)
 */
async function importDocx(arrayBuffer: ArrayBuffer, filename: string): Promise<ImportResult> {
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    // 处理防盗链问题
    const fixedHtml = fixHotlinkProtection(result.value);
    
    // 清理 HTML - 允许图片和 base64 数据
    const cleanHtml = DOMPurify.sanitize(fixedHtml, {
      ADD_TAGS: ["math", "semantics", "mrow", "mi", "mo", "mn", "msup", "msub", "mfrac", "img"],
      ADD_ATTR: ["class", "style", "href", "src", "alt", "title", "width", "height", "loading", "referrerpolicy"],
      ADD_DATA_URI_TAGS: ["img", "a"],
      ADD_URI_SAFE_ATTR: ["src", "href"],
      ALLOW_DATA_ATTR: true,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|data|blob|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
    
    // 提取标题
    let title = extractTitleFromHtml(cleanHtml);
    if (!title || title === "导入的笔记") {
      title = extractTitleFromFilename(filename);
    }
    
    // 如果有警告，可以记录
    if (result.messages.length > 0) {
      console.warn("DOCX 导入警告:", result.messages);
    }
    
    return {
      success: true,
      title,
      content: cleanHtml,
    };
  } catch (error) {
    return {
      success: false,
      title: extractTitleFromFilename(filename),
      content: "",
      error: `Word 文档解析失败: ${error}`,
    };
  }
}

/**
 * 导入文件
 */
export async function importFile(file: File): Promise<ImportResult> {
  const format = getFormatFromFilename(file.name);
  
  if (!format) {
    return {
      success: false,
      title: file.name,
      content: "",
      error: `不支持的文件格式。支持的格式: ${SUPPORTED_EXTENSIONS.join(", ")}`,
    };
  }
  
  try {
    if (format === "docx") {
      // DOCX 需要读取为 ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      return await importDocx(arrayBuffer, file.name);
    } else {
      // 其他格式读取为文本
      const content = await file.text();
      
      switch (format) {
        case "md":
          return await importMarkdown(content, file.name);
        case "html":
          return await importHtml(content, file.name);
        case "txt":
          return await importText(content, file.name);
        default:
          return {
            success: false,
            title: file.name,
            content: "",
            error: "未知格式",
          };
      }
    }
  } catch (error) {
    return {
      success: false,
      title: file.name,
      content: "",
      error: `文件读取失败: ${error}`,
    };
  }
}

/**
 * 批量导入文件
 */
export async function importFiles(files: FileList | File[]): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  
  for (const file of Array.from(files)) {
    const result = await importFile(file);
    results.push(result);
  }
  
  return results;
}
