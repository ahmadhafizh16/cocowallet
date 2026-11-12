(() => {
  "use strict";

  const pages = {
    files: {
      title: "Project files",
      description: "Explore the repository and understand what each file is for.",
      source: "PROJECT_STRUCTURE.md",
    },
    tests: {
      title: "Test cases",
      description: "Browse the individual Jest and Playwright cases, grouped by source file.",
      source: "TEST_CASES.md",
    },
    guide: {
      title: "How to use CocoWallet",
      description: "A practical, illustrated guide to the wallet and its everyday workflows.",
      source: "USER_GUIDE.md",
    },
  };
  const content = document.getElementById("content");
  const title = document.getElementById("page-title");
  const description = document.getElementById("page-description");
  const sourceLink = document.getElementById("source-link");
  const icons = {
    chevron: [["path", { d: "m9 5 7 7-7 7" }]],
    file: [["path", { d: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" }], ["path", { d: "M14 3v6h6" }]],
    search: [["circle", { cx: "11", cy: "11", r: "7" }], ["path", { d: "m16 16 4 4" }]],
  };
  let documents;
  let currentPage = "";

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(name, className) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    if (className) svg.setAttribute("class", className);
    for (const [tag, attributes] of icons[name]) {
      const part = document.createElementNS("http://www.w3.org/2000/svg", tag);
      for (const [key, value] of Object.entries(attributes)) part.setAttribute(key, value);
      svg.append(part);
    }
    return svg;
  }

  function appendInline(parent, text) {
    const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
    for (const token of tokens) {
      if (token.startsWith("**") && token.endsWith("**")) {
        parent.append(element("strong", "", token.slice(2, -2)));
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parent.append(element("code", "", token.slice(1, -1)));
      } else {
        const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link && !/^(?:javascript|data):/i.test(link[2])) {
          const anchor = element("a", "", link[1]);
          anchor.href = link[2];
          parent.append(anchor);
        } else {
          parent.append(document.createTextNode(token));
        }
      }
    }
  }

  function renderMarkdown(markdown, options = {}) {
    const container = element("div", options.className || "reading");
    const lines = markdown.replace(/\r\n/g, "\n").split("\n");
    let index = 0;
    let chapter = 0;
    const chapters = [];
    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) { index += 1; continue; }
      if (line.startsWith("# ")) { index += 1; continue; }
      if (line.startsWith("```")) {
        const codeLines = [];
        index += 1;
        while (index < lines.length && !lines[index].startsWith("```")) codeLines.push(lines[index++]);
        index += 1;
        const pre = element("pre");
        pre.append(element("code", "", codeLines.join("\n")));
        container.append(pre);
        continue;
      }
      const heading = line.match(/^(#{2,3})\s+(.+)$/);
      if (heading) {
        const node = element(heading[1].length === 2 ? "h2" : "h3");
        appendInline(node, heading[2]);
        if (heading[1].length === 2 && options.chapters) {
          node.id = `chapter-${++chapter}`;
          chapters.push({ id: node.id, name: heading[2] });
        }
        container.append(node);
        index += 1;
        continue;
      }
      const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (image && !/^(?:javascript|data):/i.test(image[2])) {
        const figure = element("figure");
        const img = element("img");
        img.src = image[2];
        img.alt = image[1];
        img.loading = "lazy";
        figure.append(img, element("figcaption", "", image[1]));
        container.append(figure);
        index += 1;
        continue;
      }
      const listItem = line.match(/^(\d+\.|-)\s+(.+)$/);
      if (listItem) {
        const ordered = listItem[1] !== "-";
        const list = element(ordered ? "ol" : "ul");
        while (index < lines.length) {
          const item = lines[index].match(/^(\d+\.|-)\s+(.+)$/);
          if (!item || (item[1] !== "-") !== ordered) break;
          const li = element("li");
          appendInline(li, item[2]);
          list.append(li);
          index += 1;
        }
        container.append(list);
        continue;
      }
      const paragraph = [line.trim()];
      index += 1;
      while (index < lines.length && lines[index].trim() && !/^(#{1,3}\s|```|!\[|(?:\d+\.|-)\s)/.test(lines[index])) {
        paragraph.push(lines[index++].trim());
      }
      const p = element("p");
      appendInline(p, paragraph.join(" "));
      container.append(p);
    }
    return { container, chapters };
  }

  function toolbar(placeholder, label, onSearch, target) {
    const wrapper = element("div", "toolbar");
    const search = element("div", "search");
    const input = element("input");
    input.type = "search";
    input.placeholder = placeholder;
    input.setAttribute("aria-label", label);
    search.append(icon("search"), input);
    const actions = element("div", "toolbar-actions");
    const expand = element("button", "text-button", "Expand all");
    const collapse = element("button", "text-button", "Collapse all");
    expand.type = collapse.type = "button";
    expand.addEventListener("click", () => target.querySelectorAll("details").forEach((detail) => { detail.open = true; }));
    collapse.addEventListener("click", () => target.querySelectorAll("details").forEach((detail) => { detail.open = false; }));
    actions.append(expand, collapse);
    wrapper.append(search, actions);
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => onSearch(input.value.trim().toLowerCase()), 100);
    });
    return wrapper;
  }

  function parseTree(markdown) {
    const root = { children: [], path: "" };
    const stack = [root];
    for (const line of markdown.split("\n")) {
      const match = line.match(/^(\s*)- `([^`]+)` — (.+)$/);
      if (!match) continue;
      const depth = match[1].length / 2;
      const parent = stack[depth];
      if (!parent) continue;
      const folder = match[2].endsWith("/");
      const name = folder ? match[2].slice(0, -1) : match[2];
      const node = { name, folder, description: match[3], path: parent.path ? `${parent.path}/${name}` : name, children: [] };
      parent.children.push(node);
      stack[depth + 1] = node;
      stack.length = depth + 2;
    }
    return root;
  }

  function fileLink(path) {
    return `../${path.split("/").map(encodeURIComponent).join("/")}`;
  }

  function renderFiles(markdown) {
    const intro = markdown.split("## File tree")[0];
    content.append(renderMarkdown(intro, { className: "intro" }).container);
    const root = parseTree(markdown);
    const tree = element("div", "tree");
    const meta = element("p", "results-meta");
    const count = (node) => node.folder ? node.children.reduce((sum, child) => sum + count(child), 0) : 1;
    const total = root.children.reduce((sum, child) => sum + count(child), 0);

    function matches(node, query) {
      return !query || `${node.path} ${node.description}`.toLowerCase().includes(query) || node.children.some((child) => matches(child, query));
    }
    function renderNodes(nodes, depth, query) {
      const list = element("ul");
      for (const node of nodes.filter((item) => matches(item, query))) {
        const li = element("li");
        const row = element(node.folder ? "summary" : "div", "tree-row");
        row.style.setProperty("--depth", depth);
        const name = element("span", "tree-name");
        name.append(icon(node.folder ? "chevron" : "file", node.folder ? "disclosure" : "file-glyph"));
        if (node.folder) {
          name.append(document.createTextNode(`${node.name}/`));
        } else {
          const link = element("a", "", node.name);
          link.href = fileLink(node.path);
          link.title = `Open ${node.path}`;
          name.append(link);
        }
        row.append(name, element("span", "tree-description", node.description));
        if (node.folder) {
          const detail = element("details");
          detail.open = Boolean(query) || (depth === 0 && node.name === "src");
          detail.append(row, renderNodes(node.children, depth + 1, query));
          li.append(detail);
        } else li.append(row);
        list.append(li);
      }
      return list;
    }
    function update(query) {
      tree.replaceChildren();
      const found = (node) => node.folder ? node.children.reduce((sum, child) => sum + found(child), 0) : Number(matches(node, query));
      const matching = root.children.reduce((sum, child) => sum + found(child), 0);
      meta.textContent = query ? `${matching} matching file${matching === 1 ? "" : "s"} · ${total} in the inventory` : `${total} files in the inventory · select a folder to explore`;
      if (matching) tree.append(renderNodes(root.children, 0, query));
      else tree.append(element("p", "empty", "No files match your search. Try a filename, folder, or description."));
    }
    content.append(toolbar("Search files and descriptions", "Search project files", update, tree), meta, tree);
    update("");
  }

  function parseTests(markdown) {
    const sections = [];
    let section;
    let group;
    for (const line of markdown.split("\n")) {
      const category = line.match(/^## (Jest cases|Playwright cases)$/);
      if (category) {
        section = { name: category[1], groups: [] };
        sections.push(section);
        group = null;
      } else if (line.startsWith("## ")) {
        section = null;
        group = null;
      } else if (section && line.startsWith("### `")) {
        group = { file: line.slice(5).replace(/`$/, ""), cases: [] };
        section.groups.push(group);
      } else if (group && line.startsWith("- ")) {
        group.cases.push(line.slice(2));
      }
    }
    return sections;
  }

  function renderTests(markdown) {
    content.append(renderMarkdown(markdown.split("## Jest cases")[0], { className: "intro" }).container);
    const sections = parseTests(markdown);
    const results = element("div");
    const meta = element("p", "results-meta");
    const total = sections.reduce((sum, section) => sum + section.groups.reduce((n, group) => n + group.cases.length, 0), 0);
    const filters = element("div", "engine-filters");
    filters.setAttribute("role", "group");
    filters.setAttribute("aria-label", "Test runner");
    let selected = "All tests";
    let currentQuery = "";
    const choices = ["All tests", ...sections.map((section) => section.name)];
    for (const choice of choices) {
      const button = element("button", "engine-filter", choice);
      button.type = "button";
      button.setAttribute("aria-pressed", String(choice === selected));
      button.addEventListener("click", () => {
        selected = choice;
        filters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        update(currentQuery);
      });
      filters.append(button);
    }
    function update(query) {
      currentQuery = query;
      results.replaceChildren();
      let matching = 0;
      for (const section of sections) {
        if (selected !== "All tests" && section.name !== selected) continue;
        const groupContainer = element("div", "test-groups");
        let groups = 0;
        for (const group of section.groups) {
          const fileMatches = group.file.toLowerCase().includes(query);
          const cases = group.cases.filter((name) => !query || fileMatches || name.toLowerCase().includes(query));
          if (!cases.length) continue;
          matching += cases.length;
          groups += 1;
          const detail = element("details");
          detail.open = Boolean(query);
          const summary = element("summary");
          summary.append(icon("chevron", "disclosure"), element("span", "suite-name", group.file), element("span", "suite-count", `${cases.length} case${cases.length === 1 ? "" : "s"}`));
          const list = element("ul");
          for (const name of cases) {
            const item = element("li");
            const status = name.match(/^\[([^\]]+)\]\s+(.*)$/);
            if (status) item.append(element("span", `test-status ${status[1]}`, status[1]), document.createTextNode(status[2]));
            else item.textContent = name;
            list.append(item);
          }
          detail.append(summary, list);
          groupContainer.append(detail);
        }
        if (groups) results.append(element("h2", "test-section-title", section.name), groupContainer);
      }
      meta.textContent = query || selected !== "All tests" ? `${matching} matching case${matching === 1 ? "" : "s"} · ${total} in the catalogue` : `${total} cases in the catalogue · select a suite to see its cases`;
      if (!matching) results.append(element("p", "empty", "No test cases match your search. Try a feature, filename, or test name."));
    }
    content.append(toolbar("Search test names and files", "Search test cases", update, results), filters, meta, results);
    update("");
  }

  function renderGuide(markdown) {
    const { container, chapters } = renderMarkdown(markdown, { chapters: true });
    if (chapters.length) {
      const nav = element("nav", "reading guide-contents");
      nav.setAttribute("aria-label", "Guide chapters");
      const heading = element("h2", "", "In this guide");
      const list = element("ul");
      for (const chapter of chapters) {
        const item = element("li");
        const link = element("a", "", chapter.name);
        link.href = `#guide/${chapter.id}`;
        item.append(link);
        list.append(item);
      }
      nav.append(heading, list);
      content.append(nav);
    }
    content.append(container);
  }

  function route() {
    if (!documents) return;
    const [requested, anchor] = location.hash.slice(1).split("/");
    const page = pages[requested] ? requested : "guide";
    if (page !== currentPage) {
      currentPage = page;
      const details = pages[page];
      title.textContent = details.title;
      description.textContent = details.description;
      document.title = `${details.title} · CocoWallet guide`;
      sourceLink.href = details.source;
      document.querySelectorAll("[data-page]").forEach((link) => {
        if (link.dataset.page === page) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      content.replaceChildren();
      const markdown = documents[details.source];
      if (page === "files") renderFiles(markdown);
      else if (page === "tests") renderTests(markdown);
      else renderGuide(markdown);
      if (!anchor) window.scrollTo(0, 0);
    }
    if (anchor) document.getElementById(anchor)?.scrollIntoView();
  }

  async function loadDocuments() {
    const fallback = window.COCO_GUIDE_DATA || {};
    const names = Object.values(pages).map((page) => page.source);
    const entries = await Promise.all(names.map(async (name) => {
      if (location.protocol !== "file:") {
        try {
          const response = await fetch(name, { cache: "no-cache" });
          if (response.ok) return [name, await response.text()];
        } catch { /* The bundled snapshot also works without a server. */ }
      }
      if (typeof fallback[name] === "string") return [name, fallback[name]];
      throw new Error(`Could not load ${name}.`);
    }));
    documents = Object.fromEntries(entries);
    route();
  }

  window.addEventListener("hashchange", route);
  loadDocuments().catch((error) => {
    content.replaceChildren(element("p", "empty", `${error.message} Open the Markdown source files directly, or regenerate the offline bundle with node scripts/update-project-guide.mjs.`));
  });
})();
