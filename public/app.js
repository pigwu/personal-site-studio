let content;
let themes = [];
let editMode = false;
let motionObserver;
let activeMemoryYear = new Date().getFullYear();
let activeMemoryMonth = 0;
let visibleMemoryDays = [];
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const initials = name => String(name || "PS").split(/\s+/).map(part => part[0]).join("").slice(0,2).toUpperCase();
const sectionDefaults = [
  ["hero", "Hero", 720, 80], ["about", "About", 0, 112], ["work", "Work", 0, 112],
  ["interest", "Interest", 0, 112], ["memory", "Memory Map", 0, 112], ["blog", "Blog", 0, 112], ["guestbook", "Guestbook", 0, 112]
];
const memoryStyleNames = {
  expedition:"Expedition Route", metro:"Metro Diagram", passport:"Passport Journal", constellation:"Constellation Trail",
  editorial:"Editorial Magazine", polaroid:"Polaroid Wall", brutalist:"Brutalist Board", glass:"Glass Atlas",
  terminal:"Terminal Log", orbital:"Orbital Timeline", notebook:"Research Notebook", museum:"Museum Labels"
};

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function ensureBuilder(data) {
  data.sectionCopy ||= {
    workEyebrow: "SELECTED WORK", workHeading: "Ideas made visible.", workDescription: "Research, software, experiments, and collaborations.",
    blogEyebrow: "NOTES / JOURNAL", blogHeading: "Thinking in public.", blogDescription: "Notes from work, life, and everything in between."
  };
  data.site.customColors ||= {primary:"", accent:"", background:""};
  data.memory ||= {eyebrow:"MEMORY MAP",title:"Days worth remembering.",description:"A winding route through the places, people, and ideas that shaped the journey.",style:"expedition",days:[],years:[]};
  data.engagement ||= {};
  data.engagement.guestbook = {
    enabled:true, owner:"pigwu", repo:"personal-site-studio", issue:1, eyebrow:"OPEN CHANNEL", title:"Leave a trace.",
    description:"Thoughts, hellos, and notes from people passing through this corner of the web.", buttonLabel:"Write on GitHub",
    moderationNote:"Messages are public and may be moderated by the site owner.", maxComments:6, sort:"newest",
    ...(data.engagement.guestbook || {})
  };
  data.engagement.visitor = {enabled:true,counterKey:"pigwu.github.io/personal-site-studio",...(data.engagement.visitor || {})};
  data.memory.days ||= [];
  data.memory.years ||= [];
  const yearDefault = year => ({year,title:`${year} in memories`,style:data.memory.style || "expedition",accent:"#9c4f35",background:{mode:"solid",color:"#f3eee4",from:"#f3eee4",to:"#dce9e6",angle:135,image:""}});
  data.memory.days.forEach(day => { const year=Number(String(day.date||"").slice(0,4));if(year&&!data.memory.years.some(item=>Number(item.year)===year))data.memory.years.push(yearDefault(year)); });
  if(!data.memory.years.length)data.memory.years.push(yearDefault(new Date().getFullYear()));
  data.memory.years=data.memory.years.map(item=>({...yearDefault(Number(item.year)),...item,year:Number(item.year),background:{...yearDefault(Number(item.year)).background,...(item.background||{})}})).sort((a,b)=>b.year-a.year);
  data.site.builder ||= {};
  data.site.builder.background ||= {mode:"theme", color:"#f3eee4", from:"#f3eee4", to:"#dce9e6", angle:135, image:"", pattern:"grid", patternOpacity:18};
  data.site.builder.motion ||= "subtle";
  data.site.builder.components = {
    avatarShape:"arch", avatarBorderStyle:"solid", avatarBorderWidth:1, avatarBorderColor:"#9c4f35",
    cardShape:"sharp", cardBorderStyle:"solid", cardBorderWidth:1, cardBorderColor:"#9c4f35", cardShadow:"none",
    buttonShape:"pill", lineStyle:"solid", lineWidth:1, lineColor:"#9c4f35",
    ...(data.site.builder.components || {})
  };
  const saved = data.site.builder.sections || [];
  const existing = new Map(saved.map(item => [item.id, item]));
  const known = new Set(sectionDefaults.map(item => item[0]));
  const order = saved.map(item => item.id).filter(id => known.has(id));
  sectionDefaults.forEach(([id]) => { if (!order.includes(id)) order.push(id); });
  const defaults = new Map(sectionDefaults.map(([id,label,minHeight,padding]) => [id, {
    id, label, enabled:true, width:1180, align:"center", minHeight, padding,
    backgroundMode:"theme", backgroundColor:id === "work" || id === "blog" ? "#23364d" : "#f3eee4",
    gradientFrom:id === "work" || id === "blog" ? "#23364d" : "#f3eee4",
    gradientTo:id === "work" || id === "blog" ? "#49647c" : "#dce9e6",
    gradientAngle:135, backgroundImage:"", textColor:"", accentColor:"", radius:0
  }]));
  data.site.builder.sections = order.map(id => ({...defaults.get(id), ...(existing.get(id) || {})}));
  return data;
}

function setPath(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  let target = content;
  for (const key of keys) target = target[Number.isInteger(Number(key)) && String(Number(key)) === key ? Number(key) : key];
  target[last] = value;
}

function asset(path) { return path || ""; }
function backgroundValue(mode, item) {
  if (mode === "solid") return item.backgroundColor || item.color || "transparent";
  if (mode === "gradient") return `linear-gradient(${Number(item.gradientAngle ?? item.angle ?? 135)}deg, ${item.gradientFrom || item.from}, ${item.gradientTo || item.to})`;
  if (mode === "image" && (item.backgroundImage || item.image)) return `linear-gradient(rgba(5,15,22,.18),rgba(5,15,22,.18)),url("${asset(item.backgroundImage || item.image)}") center/cover no-repeat`;
  return "";
}

function applyTheme(theme) {
  const custom = content.site.customColors || {};
  const root = document.documentElement;
  root.style.setProperty("--primary", custom.primary || theme.primary);
  root.style.setProperty("--accent", custom.accent || theme.accent);
  root.style.setProperty("--bg", custom.background || theme.background);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--ink", theme.dark ? theme.primary : (custom.primary || theme.primary));
  root.style.setProperty("--display", theme.font === "sans" ? '"DM Sans",sans-serif' : theme.font === "mono" ? '"DM Mono",monospace' : '"Instrument Serif",serif');
  document.body.dataset.theme = theme.id;
}

function applyBuilder() {
  const builder = content.site.builder;
  const pageBackground = builder.background;
  const root = document.documentElement;
  const pageValue = pageBackground.mode === "solid" ? pageBackground.color : pageBackground.mode === "gradient" ? `linear-gradient(${pageBackground.angle}deg,${pageBackground.from},${pageBackground.to})` : pageBackground.mode === "image" && pageBackground.image ? `linear-gradient(rgba(5,15,22,.08),rgba(5,15,22,.08)),url("${asset(pageBackground.image)}") center/cover fixed` : "";
  document.body.style.background = pageValue || "var(--bg)";
  document.body.dataset.motion = builder.motion;
  const components = builder.components;
  Object.entries({
    avatarShape:components.avatarShape, avatarBorder:components.avatarBorderStyle, cardShape:components.cardShape,
    cardBorder:components.cardBorderStyle, cardShadow:components.cardShadow, buttonShape:components.buttonShape,
    lineStyle:components.lineStyle
  }).forEach(([key,value]) => document.body.dataset[key] = value);
  root.style.setProperty("--component-avatar-border-width", `${Number(components.avatarBorderWidth || 0)}px`);
  root.style.setProperty("--component-avatar-border-color", components.avatarBorderColor || "var(--accent)");
  root.style.setProperty("--component-card-border-width", `${Number(components.cardBorderWidth || 0)}px`);
  root.style.setProperty("--component-card-border-color", components.cardBorderColor || "var(--accent)");
  root.style.setProperty("--component-line-width", `${Number(components.lineWidth || 0)}px`);
  root.style.setProperty("--component-line-color", components.lineColor || "var(--line)");
  const grid = $(".page-grid");
  grid.dataset.pattern = pageBackground.pattern || "none";
  grid.style.opacity = Math.max(0, Math.min(100, Number(pageBackground.patternOpacity || 0))) / 100;

  const main = $("#top");
  let visibleNumber = 0;
  builder.sections.forEach((settings, order) => {
    const section = $(`[data-section="${settings.id}"]`);
    if (!section) return;
    const enabled = settings.enabled !== false && !(settings.id === "guestbook" && content.engagement.guestbook.enabled === false);
    section.hidden = !enabled;
    section.style.order = order;
    main.appendChild(section);
    const shell = section.querySelector(":scope > .shell");
    const width = Math.max(320, Math.min(1600, Number(settings.width || 1180)));
    if (shell) {
      shell.style.width = `min(${width}px,calc(100% - 3rem))`;
      shell.style.marginLeft = settings.align === "left" ? "max(1.5rem,calc((100vw - 1180px)/2))" : settings.align === "right" ? "auto" : "auto";
      shell.style.marginRight = settings.align === "right" ? "max(1.5rem,calc((100vw - 1180px)/2))" : settings.align === "left" ? "auto" : "auto";
    }
    section.style.minHeight = settings.minHeight ? `${settings.minHeight}px` : "";
    section.style.paddingBlock = `${Math.max(0, Math.min(240, Number(settings.padding ?? 112)))}px`;
    section.style.borderRadius = `${Math.max(0, Math.min(80, Number(settings.radius || 0)))}px`;
    section.style.color = settings.textColor || "";
    section.style.setProperty("--accent", settings.accentColor || getComputedStyle(root).getPropertyValue("--accent"));
    if (settings.textColor) {
      section.style.setProperty("--muted", `color-mix(in srgb,${settings.textColor} 68%,transparent)`);
      section.style.setProperty("--line", `color-mix(in srgb,${settings.textColor} 20%,transparent)`);
    } else {
      section.style.removeProperty("--muted");
      section.style.removeProperty("--line");
    }
    section.style.background = settings.backgroundMode === "theme" ? "" : backgroundValue(settings.backgroundMode, settings);
    const number = section.querySelector(".section-label > span");
    if (number && enabled) number.textContent = String(++visibleNumber).padStart(2,"0");
  });
  const settingsById = new Map(builder.sections.map((section,index) => [section.id,{...section,index}]));
  $("#site-nav").innerHTML = content.navigation
    .filter(item => settingsById.get(item.target)?.enabled !== false && !(item.target === "guestbook" && content.engagement.guestbook.enabled === false))
    .sort((a,b) => (settingsById.get(a.target)?.index ?? 99) - (settingsById.get(b.target)?.index ?? 99))
    .map(item => `<a href="#${esc(item.target)}">${esc(item.label)}</a>`).join("");
}

function render() {
  document.title = content.site.title;
  $("#identity-mark").textContent = initials(content.profile.name);
  $("#identity-name").textContent = content.profile.name;
  $("#hero-name").textContent = content.profile.name;
  $("#hero-role").textContent = content.profile.role.toUpperCase();
  $("#hero-tagline").textContent = content.site.tagline;
  $("#profile-avatar").src = asset(content.profile.avatar);
  $("#profile-institution").textContent = content.profile.institution;
  $("#profile-location").textContent = content.profile.location;
  $("#email-link").href = `mailto:${content.profile.email}`;
  $("#hero-links").innerHTML = content.profile.socials.filter(item => item.url).map(item => `<a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.label)} &nearr;</a>`).join("") + (content.profile.resumeUrl ? `<a href="${esc(content.profile.resumeUrl)}">Resume &nearr;</a>` : "");
  $("#about-eyebrow").textContent = content.about.eyebrow;
  $("#about-heading").textContent = content.about.heading;
  $("#about-paragraphs").innerHTML = content.about.paragraphs.map((paragraph,index) => `<p data-edit-path="about.paragraphs.${index}">${esc(paragraph)}</p>`).join("");
  $("#about-highlights").innerHTML = content.about.highlights.map((item,index) => `<div><span data-edit-path="about.highlights.${index}.label">${esc(item.label)}</span><strong data-edit-path="about.highlights.${index}.value">${esc(item.value)}</strong></div>`).join("");
  $("#work-eyebrow").textContent = content.sectionCopy.workEyebrow;
  $("#work-heading").textContent = content.sectionCopy.workHeading;
  $("#work-description").textContent = content.sectionCopy.workDescription;
  $("#project-grid").innerHTML = content.projects.map((project,index) => `<article class="project-card"><img src="${esc(asset(project.image))}" alt="${esc(project.title)}"><div class="project-body"><div class="project-meta"><span data-edit-path="projects.${index}.type">${esc(project.type)}</span><span>PROJECT</span></div><h3 data-edit-path="projects.${index}.title">${esc(project.title)}</h3><p data-edit-path="projects.${index}.description">${esc(project.description)}</p><div class="tags">${project.tags.map((tag,tagIndex) => `<span data-edit-path="projects.${index}.tags.${tagIndex}">${esc(tag)}</span>`).join("")}</div>${project.url ? `<p><a href="${esc(project.url)}" target="_blank" rel="noopener">View project &nearr;</a></p>` : ""}</div></article>`).join("");
  $("#interest-kicker").textContent = content.interest.kicker;
  $("#interest-name").textContent = content.interest.name;
  $("#interest-headline").textContent = content.interest.headline;
  $("#interest-description").textContent = content.interest.description;
  $("#interest-stats").innerHTML = content.interest.stats.map((item,index) => `<div><span data-edit-path="interest.stats.${index}.label">${esc(item.label)}</span><strong data-edit-path="interest.stats.${index}.value">${esc(item.value)}</strong></div>`).join("");
  $("#interest-grid").innerHTML = content.interest.entries.map((entry,index) => `<article class="interest-card"><div class="interest-gallery">${entry.images.map(image => `<img src="${esc(asset(image))}" alt="${esc(entry.title)}">`).join("")}</div><div class="interest-body"><time data-edit-path="interest.entries.${index}.date">${esc(entry.date)}</time><h3 data-edit-path="interest.entries.${index}.title">${esc(entry.title)}</h3><p data-edit-path="interest.entries.${index}.summary">${esc(entry.summary)}</p><div class="metrics">${entry.metrics.map((metric,metricIndex) => `<span><i data-edit-path="interest.entries.${index}.metrics.${metricIndex}.label">${esc(metric.label)}</i> · <b data-edit-path="interest.entries.${index}.metrics.${metricIndex}.value">${esc(metric.value)}</b></span>`).join("")}</div></div></article>`).join("");
  renderMemory();
  $("#blog-eyebrow").textContent = content.sectionCopy.blogEyebrow;
  $("#blog-heading").textContent = content.sectionCopy.blogHeading;
  $("#blog-description").textContent = content.sectionCopy.blogDescription;
  const postTag = editMode ? "article" : "button";
  $("#post-list").innerHTML = content.posts.map((post,index) => `<${postTag} class="post-row" data-post="${index}"${editMode ? ' role="group"' : ' type="button"'}><time data-edit-path="posts.${index}.date">${esc(post.date)}</time><div><h3 data-edit-path="posts.${index}.title">${esc(post.title)}</h3><p data-edit-path="posts.${index}.excerpt">${esc(post.excerpt)}</p></div><span>&nearr;</span></${postTag}>`).join("");
  renderGuestbook();
  $("#footer-name").textContent = content.profile.name;
  $("#footer-tagline").textContent = content.site.tagline;
  $("#year").textContent = new Date().getFullYear();
  renderVisitorCount();
  applyBuilder();
  configureEditing();
  configureMotion();
}

function guestbookIssueUrl() {
  const guestbook = content.engagement.guestbook;
  return `https://github.com/${encodeURIComponent(guestbook.owner)}/${encodeURIComponent(guestbook.repo)}/issues/${encodeURIComponent(guestbook.issue)}`;
}

function guestbookState(message) {
  $("#guestbook-messages").innerHTML = `<div class="guestbook-state"><p>${esc(message)}</p><a href="${esc(guestbookIssueUrl())}" target="_blank" rel="noopener">Open on GitHub &nearr;</a></div>`;
}

function renderGuestbookComments(comments) {
  const settings = content.engagement.guestbook;
  const visible = comments.filter(comment => comment.user?.type !== "Bot");
  if (settings.sort !== "oldest") visible.reverse();
  const selected = visible.slice(0,Math.max(1,Number(settings.maxComments)||6));
  if (!selected.length) { guestbookState("No messages yet. You could leave the first one."); return; }
  $("#guestbook-messages").innerHTML = selected.map((comment,index) => `<article class="guestbook-card" style="--guestbook-index:${index}"><header><a href="${esc(comment.user.html_url)}" target="_blank" rel="noopener"><img src="${esc(comment.user.avatar_url)}&s=72" alt=""><strong>@${esc(comment.user.login)}</strong></a><time>${esc(new Intl.DateTimeFormat("en",{year:"numeric",month:"short",day:"numeric"}).format(new Date(comment.created_at)))}</time></header><p>${esc(comment.body).replace(/\r?\n/g,"<br>")}</p></article>`).join("");
}

function renderGuestbook() {
  const settings = content.engagement.guestbook;
  $("#guestbook-eyebrow").textContent = settings.eyebrow;
  $("#guestbook-heading").textContent = settings.title;
  $("#guestbook-description").textContent = settings.description;
  $("#guestbook-note").textContent = settings.moderationNote;
  const write = $("#guestbook-write");
  write.textContent = settings.buttonLabel;
  write.href = `${guestbookIssueUrl()}#new_comment_field`;
  if (editMode) {
    $("#guestbook-messages").innerHTML = [["@future-colleague","A thoughtful note from a visitor will appear here."],["@trail-friend","The live site loads public comments from your GitHub guestbook issue."]].map((item,index)=>`<article class="guestbook-card" style="--guestbook-index:${index}"><header><strong>${item[0]}</strong><time>LIVE PREVIEW</time></header><p>${item[1]}</p></article>`).join("");
    return;
  }
  guestbookState("Tuning into the guestbook...");
  const api = `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}/issues/${encodeURIComponent(settings.issue)}/comments?per_page=100`;
  fetch(api,{headers:{Accept:"application/vnd.github+json"}}).then(response=>{if(!response.ok)throw new Error("GitHub API");return response.json()}).then(renderGuestbookComments).catch(()=>guestbookState("Messages could not be loaded right now."));
}

function renderVisitorCount() {
  const settings = content.engagement.visitor, image = $("#visitor-count");
  image.hidden = settings.enabled === false;
  if (image.hidden) return;
  if (editMode) { image.removeAttribute("src"); image.alt = "Visitor count appears here"; return; }
  image.src = `https://hits.sh/${encodeURI(settings.counterKey)}.svg?style=flat&label=views&color=64c1b2&labelColor=173047`;
}

function formatMemoryDate(value) {
  if (!value) return "DATE TO BE CHOSEN";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", {month:"short",day:"2-digit",year:"numeric"}).format(date);
}

function memoryDateParts(value) { const match=String(value||"").match(/^(\d{4})-(\d{2})/);return match?{year:Number(match[1]),month:Number(match[2])}:null; }
function memoryBackground(background) { if(background.mode==="gradient")return `linear-gradient(${background.angle||135}deg,${background.from},${background.to})`;if(background.mode==="image"&&background.image)return `linear-gradient(#06101833,#06101833),url("${asset(background.image)}") center/cover no-repeat`;return background.color||"#f3eee4"; }

function renderMemory() {
  const memory = content.memory;
  $("#memory-eyebrow").textContent = memory.eyebrow;
  $("#memory-heading").textContent = memory.title;
  $("#memory-description").textContent = memory.description;
  const currentYear=new Date().getFullYear();
  if(!memory.years.some(item=>item.year===activeMemoryYear))activeMemoryYear=memory.years.some(item=>item.year===currentYear)?currentYear:memory.years[0].year;
  const year=memory.years.find(item=>item.year===activeMemoryYear)||memory.years[0], yearDays=memory.days.filter(day=>memoryDateParts(day.date)?.year===activeMemoryYear);
  visibleMemoryDays=activeMemoryMonth?yearDays.filter(day=>memoryDateParts(day.date)?.month===activeMemoryMonth):yearDays;
  $("#memory-style-name").textContent = memoryStyleNames[year.style] || memoryStyleNames.expedition;
  const map = $("#memory-map");
  map.dataset.memoryStyle = year.style || "expedition";map.style.setProperty("--accent",year.accent);map.style.background=memoryBackground(year.background);
  const yearIndex=memory.years.indexOf(year);
  $("#memory-year-number").textContent=year.year;$("#memory-year-title").textContent=year.title||`${year.year} in memories`;$("#memory-year-title").dataset.editPath=`memory.years.${yearIndex}.title`;
  $("#memory-year-tabs").innerHTML=memory.years.map(item=>`<button type="button" class="${item.year===activeMemoryYear?"is-active":""}" data-memory-year="${item.year}">${item.year}</button>`).join("");
  const available=new Set(yearDays.map(day=>memoryDateParts(day.date)?.month));
  $("#memory-month-tabs").innerHTML=["All","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((name,index)=>`<button type="button" class="${index===activeMemoryMonth?"is-active":""}" data-memory-month="${index}" ${index&&!available.has(index)?"disabled":""}>${name}</button>`).join("");
  $("#memory-year-prev").disabled=yearIndex===memory.years.length-1;$("#memory-year-next").disabled=yearIndex===0;
  $("#memory-days").innerHTML = visibleMemoryDays.length ? visibleMemoryDays.map((day,index) => {
    const cover = day.images?.[0], dayIndex=memory.days.indexOf(day), dayTag=editMode ? "article" : "button";
    return `<${dayTag} class="memory-day" data-memory-day="${index}" style="--day:${index}"${editMode ? ' role="group"' : ` type="button" aria-label="Open ${esc(day.title)}"`}>
      <span class="memory-node"><i></i><b>${String(index + 1).padStart(2,"0")}</b></span>
      <span class="memory-card">${cover ? `<img src="${esc(asset(cover))}" alt="">` : `<span class="memory-placeholder">${String(index + 1).padStart(2,"0")}</span>`}<span class="memory-copy"><time data-edit-path="memory.days.${dayIndex}.date">${esc(editMode ? day.date : formatMemoryDate(day.date))}</time><strong data-edit-path="memory.days.${dayIndex}.title">${esc(day.title)}</strong><small data-edit-path="memory.days.${dayIndex}.location">${esc(day.location || "")}</small><span data-edit-path="memory.days.${dayIndex}.summary">${esc(day.summary || "")}</span></span></span>
    </${dayTag}>`;
  }).join("") : `<div class="memory-empty"><span>ROUTE 00</span><strong>Your next memory starts here.</strong><p>Add or remove dates in the local Studio. Every stop can hold text and a photo gallery.</p></div>`;
  requestAnimationFrame(drawMemoryRoute);
}

function drawMemoryRoute() {
  const map = $("#memory-map");
  const svg = map?.querySelector(".memory-route");
  const nodes = map ? $$(".memory-node", map) : [];
  if (!svg || nodes.length < 2) { if (svg) svg.querySelector("path").setAttribute("d", ""); return; }
  const bounds = map.getBoundingClientRect();
  const points = nodes.map(node => { const box = node.getBoundingClientRect(); return {x:box.left + box.width/2 - bounds.left,y:box.top + box.height/2 - bounds.top}; });
  const d = points.slice(1).reduce((path,point,index) => { const prev=points[index], bend=Math.max(28,Math.abs(point.y-prev.y)*.35); return `${path} C ${prev.x},${prev.y+bend} ${point.x},${point.y-bend} ${point.x},${point.y}`; }, `M ${points[0].x},${points[0].y}`);
  svg.setAttribute("viewBox", `0 0 ${Math.max(1,bounds.width)} ${Math.max(1,map.scrollHeight)}`);
  svg.querySelector("path").setAttribute("d", d);
}

function openMemory(index) {
  if (editMode) return;
  const day = visibleMemoryDays[index];
  if (!day) return;
  $("#memory-detail").innerHTML = `<header><p>${esc(formatMemoryDate(day.date))}${day.location ? ` / ${esc(day.location)}` : ""}</p><span>${String(index + 1).padStart(2,"0")}</span><h2>${esc(day.title)}</h2><div class="memory-detail-tags">${(day.tags || []).map(tag => `<i>${esc(tag)}</i>`).join("")}</div></header><div class="memory-detail-gallery">${(day.images || []).map(image => `<img src="${esc(asset(image))}" alt="${esc(day.title)}">`).join("")}</div><div class="memory-detail-body">${esc(day.body || day.summary || "").split(/\n\n+/).map(paragraph => `<p>${paragraph.replace(/\n/g,"<br>")}</p>`).join("")}</div>`;
  $("#memory-dialog").showModal();
}

function configureEditing() {
  document.body.classList.toggle("studio-editing", editMode);
  $$('[data-edit-path]').forEach(element => {
    element.contentEditable = editMode ? "plaintext-only" : "false";
    element.spellcheck = editMode;
    element.dataset.editPlaceholder = "Click to edit";
    element.title = editMode ? "Click and type to edit" : "";
    element.oninput = editMode ? () => {
      const value = element.innerText.replace(/\n+$/g, "");
      setPath(element.dataset.editPath, value);
      $$(`[data-edit-path="${element.dataset.editPath}"]`).forEach(copy => {
        if (copy !== element && document.activeElement !== copy) copy.textContent = value;
      });
      if (element.dataset.editPath === "profile.name") $("#identity-mark").textContent = initials(value);
      window.parent.postMessage({type:"pss:inline-edit", path:element.dataset.editPath, value}, location.origin);
    } : null;
  });
}

function configureMotion() {
  motionObserver?.disconnect();
  if (editMode || content.site.builder.motion === "none") {
    $$('.section-canvas').forEach(section => section.classList.add("is-visible"));
    return;
  }
  motionObserver = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle("is-visible", entry.isIntersecting)), {threshold:.12});
  $$('.section-canvas').forEach(section => motionObserver.observe(section));
}

function openPost(index) {
  if (editMode) return;
  const post = content.posts[index];
  $("#post-detail").innerHTML = `<p class="eyebrow">${esc(post.date)} · ${post.tags.map(esc).join(" / ")}</p><h2>${esc(post.title)}</h2>${post.images.map(image => `<img src="${esc(asset(image))}" alt="${esc(post.title)}">`).join("")}<div>${post.body.split(/\n\n+/).map(paragraph => `<p>${esc(paragraph).replace(/\n/g,"<br>")}</p>`).join("")}</div>`;
  $("#post-dialog").showModal();
}

document.addEventListener("click", event => {
  if (editMode) {
    const editable = event.target.closest("[data-edit-path]");
    const section = event.target.closest("[data-section]");
    if (section) {
      $$('.section-canvas').forEach(item => item.classList.toggle("studio-selected", item === section));
      window.parent.postMessage({type:"pss:select-section", id:section.dataset.section}, location.origin);
    }
    if (event.target.closest("a,button")) event.preventDefault();
    return;
  }
  const row = event.target.closest("[data-post]");
  if (row) openPost(Number(row.dataset.post));
  const memoryDay = event.target.closest("[data-memory-day]");
  if (memoryDay) openMemory(Number(memoryDay.dataset.memoryDay));
  const memoryYear=event.target.closest("[data-memory-year]"),memoryMonth=event.target.closest("[data-memory-month]");
  if(memoryYear){activeMemoryYear=Number(memoryYear.dataset.memoryYear);activeMemoryMonth=0;renderMemory();}
  if(memoryMonth){activeMemoryMonth=Number(memoryMonth.dataset.memoryMonth);renderMemory();}
  const yearIndex=content.memory.years.findIndex(item=>item.year===activeMemoryYear);
  if(event.target.closest("#memory-year-prev")&&yearIndex<content.memory.years.length-1){activeMemoryYear=content.memory.years[yearIndex+1].year;activeMemoryMonth=0;renderMemory();}
  if(event.target.closest("#memory-year-next")&&yearIndex>0){activeMemoryYear=content.memory.years[yearIndex-1].year;activeMemoryMonth=0;renderMemory();}
  if (event.target.closest(".memory-dialog-close")) $("#memory-dialog").close();
  else if (event.target.closest(".dialog-close")) $("#post-dialog").close();
});

window.addEventListener("resize", () => { clearTimeout(drawMemoryRoute.timer); drawMemoryRoute.timer=setTimeout(drawMemoryRoute,80); });

window.addEventListener("message", event => {
  if (event.origin !== location.origin || event.source !== window.parent) return;
  if (event.data?.type !== "pss:update" || !event.data.content) return;
  content = ensureBuilder(structuredClone(event.data.content));
  editMode = Boolean(event.data.editMode);
  if (event.data.memoryYear) { activeMemoryYear=Number(event.data.memoryYear);activeMemoryMonth=0; }
  const theme = themes.find(item => item.id === content.site.theme) || themes[0];
  applyTheme(theme);
  render();
  $$('.section-canvas').forEach(section => section.classList.remove("studio-selected"));
  if (event.data.selectedSection) $(`[data-section="${event.data.selectedSection}"]`)?.classList.add("studio-selected");
});

Promise.all([loadJson("data/content.json"), loadJson("data/themes.json")]).then(([data, loadedThemes]) => {
  content = ensureBuilder(data);
  themes = loadedThemes;
  applyTheme(themes.find(theme => theme.id === content.site.theme) || themes[0]);
  render();
  if (window.parent !== window) window.parent.postMessage({type:"pss:ready"}, location.origin);
}).catch(error => {
  document.body.innerHTML = `<main style="padding:3rem;font-family:sans-serif"><h1>Site data could not be loaded</h1><p>${esc(error.message)}</p></main>`;
});
