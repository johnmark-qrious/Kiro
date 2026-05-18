import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { chromium } from "playwright";

const server = new McpServer({ name: "design-extractor", version: "1.0.0" });

server.tool(
  "extract_design",
  "Navigate to a URL and extract all design tokens: Tailwind classes, computed styles, interactive elements, and component structure. Returns a structured translation spec.",
  {
    url: z.string().url().describe("URL of the prototype to extract from"),
    viewport_width: z.number().optional().default(1440).describe("Viewport width (default 1440)"),
  },
  async ({ url, viewport_width }) => {
    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage({ viewport: { width: viewport_width, height: 900 } });
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      const extraction = await page.evaluate(() => {
        const results: {
          elements: Array<{
            tag: string;
            role: string | null;
            classes: string;
            text: string;
            computed: { color: string; fontSize: string; fontWeight: string; padding: string; margin: string; borderRadius: string; backgroundColor: string; gap: string };
            interactive: boolean;
            interactiveType: string | null;
          }>;
          allClasses: string[];
          colors: string[];
          fontSizes: string[];
        } = { elements: [], allClasses: [], colors: new Set() as any, fontSizes: new Set() as any };

        const classSet = new Set<string>();
        const colorSet = new Set<string>();
        const fontSizeSet = new Set<string>();

        const interactiveTags = new Set(["button", "input", "select", "textarea", "a"]);
        const interactiveRoles = new Set(["button", "combobox", "listbox", "menuitem", "tab", "switch", "checkbox", "radio"]);

        const elements = document.querySelectorAll("*");
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const classes = htmlEl.className?.toString() || "";
          if (classes) classes.split(/\s+/).forEach((c) => classSet.add(c));

          const style = window.getComputedStyle(htmlEl);
          const isInteractive = interactiveTags.has(htmlEl.tagName.toLowerCase()) ||
            interactiveRoles.has(htmlEl.getAttribute("role") || "") ||
            htmlEl.getAttribute("tabindex") !== null;

          colorSet.add(style.color);
          colorSet.add(style.backgroundColor);
          fontSizeSet.add(style.fontSize);

          // Only capture meaningful elements (not wrappers with no content)
          const text = htmlEl.innerText?.trim().slice(0, 80) || "";
          if (isInteractive || (text && htmlEl.children.length < 3)) {
            results.elements.push({
              tag: htmlEl.tagName.toLowerCase(),
              role: htmlEl.getAttribute("role"),
              classes,
              text,
              computed: {
                color: style.color,
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                padding: style.padding,
                margin: style.margin,
                borderRadius: style.borderRadius,
                backgroundColor: style.backgroundColor,
                gap: style.gap,
              },
              interactive: isInteractive,
              interactiveType: isInteractive
                ? htmlEl.getAttribute("role") || htmlEl.tagName.toLowerCase()
                : null,
            });
          }
        });

        results.allClasses = [...classSet].filter((c) => c.length > 0).sort();
        results.colors = [...colorSet] as any;
        results.fontSizes = [...fontSizeSet] as any;
        return results;
      });

      // Extract Tailwind classes (filter for tw-like patterns)
      const twPattern = /^(text-|bg-|p-|px-|py-|m-|mx-|my-|flex|grid|gap-|rounded|border|shadow|font-|w-|h-|min-|max-|space-|items-|justify-|overflow|relative|absolute|fixed|hidden|block|inline|opacity|transition|duration|ease|hover:|focus:|dark:)/;
      const tailwindClasses = extraction.allClasses.filter((c: string) => twPattern.test(c));

      const interactiveElements = extraction.elements.filter((e: any) => e.interactive);

      const spec = {
        url,
        viewport: viewport_width,
        tailwindClasses,
        interactiveElements: interactiveElements.map((e: any) => ({
          type: e.interactiveType,
          text: e.text,
          classes: e.classes,
          suggestedComponent: mapToShadcn(e.interactiveType),
        })),
        colors: extraction.colors,
        fontSizes: extraction.fontSizes,
        totalElements: extraction.elements.length,
      };

      await browser.close();
      return { content: [{ type: "text", text: JSON.stringify(spec, null, 2) }] };
    } catch (e: any) {
      if (browser) await browser.close();
      return { content: [{ type: "text", text: `Extraction failed: ${e.message}` }], isError: true };
    }
  }
);

function mapToShadcn(type: string | null): string {
  const map: Record<string, string> = {
    button: "Button",
    select: "Select",
    combobox: "Combobox",
    listbox: "Select",
    input: "Input",
    textarea: "Textarea",
    checkbox: "Checkbox",
    radio: "RadioGroup",
    switch: "Switch",
    tab: "Tabs",
    menuitem: "DropdownMenu",
    a: "Link or Button (check context)",
  };
  return map[type || ""] || "UNKNOWN - needs manual mapping";
}

const transport = new StdioServerTransport();
await server.connect(transport);
