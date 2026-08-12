let state = {content:null, themes:[], git:null};
let selectedSection = "hero";
let previewReady = false;
let dragSection = null;
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const views = {
  identity:["IDENTITY","身份资料"], about:["ABOUT","主页介绍"], projects:["WORK","作品项目"],
  interest:["INTEREST","兴趣模块"], blog:["JOURNAL","Blog"], builder:["LIVE CANVAS","页面设计器"],
  design:["DESIGN SYSTEM","主题风格"], publish:["PUBLISH","预览与发布"]
};
const sectionDefaults = [
  ["hero","Hero",720,80], ["about","About",0,112], ["work","Work",0,112],
  ["interest","Interest",0,112], ["blog","Blog",0,112]
];
const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);

function notice(message, error=false) {
  const box = $("#notice");
  box.textContent = message;
  box.classList.toggle("error", error);
  box.hidden = false;
  clearTimeout(notice.timeout);
  notice.timeout = setTimeout(() => box.hidden = true, error ? 7000 : 4000);
}

async function api(url, body) {
  const response = await fetch(url, {method:body ? "POST" : "GET", headers:body ? {"Content-Type":"application/json"} : undefined, body:body ? JSON.stringify(body) : undefined});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Request failed");
  return result;
}

function ensureBuilder(data) {
  data.sectionCopy ||= {
    workEyebrow:"SELECTED WORK", workHeading:"Ideas made visible.", workDescription:"Research, software, experiments, and collaborations.",
    blogEyebrow:"NOTES / JOURNAL", blogHeading:"Thinking in public.", blogDescription:"Notes from work, life, and everything in between."
  };
  data.site.customColors ||= {primary:"",accent:"",background:""};
  data.site.builder ||= {};
  data.site.builder.background ||= {mode:"theme",color:"#f3eee4",from:"#f3eee4",to:"#dce9e6",angle:135,image:"",pattern:"grid",patternOpacity:18};
  data.site.builder.motion ||= "subtle";
  const saved = data.site.builder.sections || [];
  const existing = new Map(saved.map(item => [item.id,item]));
  const known = new Set(sectionDefaults.map(item => item[0]));
  const order = saved.map(item => item.id).filter(id => known.has(id));
  sectionDefaults.forEach(([id]) => { if (!order.includes(id)) order.push(id); });
  const defaults = new Map(sectionDefaults.map(([id,label,minHeight,padding]) => [id, {
    id,label,enabled:true,width:1180,align:"center",minHeight,padding,
    backgroundMode:"theme",backgroundColor:id === "work" || id === "blog" ? "#23364d" : "#f3eee4",
    gradientFrom:id === "work" || id === "blog" ? "#23364d" : "#f3eee4",
    gradientTo:id === "work" || id === "blog" ? "#49647c" : "#dce9e6",gradientAngle:135,
    backgroundImage:"",textColor:"",accentColor:"",radius:0
  }]));
  data.site.builder.sections = order.map(id => ({...defaults.get(id),...(existing.get(id) || {})}));
  return data;
}

function getPath(path) {
  return path.split(".").reduce((value,key) => value?.[/^\d+$/.test(key) ? Number(key) : key], state.content);
}

function setPath(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  let target = state.content;
  keys.forEach(key => target = target[/^\d+$/.test(key) ? Number(key) : key]);
  target[/^\d+$/.test(last) ? Number(last) : last] = value;
}

function selectedSettings() {
  return state.content.site.builder.sections.find(section => section.id === selectedSection) || state.content.site.builder.sections[0];
}

function sendPreview() {
  const frame = $("#builder-frame");
  if (!frame?.contentWindow || !state.content) return;
  frame.contentWindow.postMessage({type:"pss:update",content:state.content,editMode:true,selectedSection}, location.origin);
}

function queuePreview() {
  clearTimeout(queuePreview.timeout);
  queuePreview.timeout = setTimeout(sendPreview, 35);
}

function bindFields() {
  $$('[data-path]').forEach(field => {
    field.value = getPath(field.dataset.path) ?? "";
    field.oninput = () => { setPath(field.dataset.path, field.value); queuePreview(); };
  });
  $("#about-paragraphs").value = state.content.about.paragraphs.join("\n\n");
  $("#about-paragraphs").oninput = event => {
    state.content.about.paragraphs = event.target.value.split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
    queuePreview();
  };
  $("#avatar").src = `/preview/${state.content.profile.avatar}`;
}

function input(value, attributes="") { return `<input ${attributes} value="${esc(value)}">`; }
function textarea(value, attributes="") { return `<textarea ${attributes} rows="4">${esc(value)}</textarea>`; }

function renderRepeats() {
  $("#social-list").innerHTML = state.content.profile.socials.map((item,index) => `<div class="repeat-row"><label>名称${input(item.label,`data-array="socials" data-index="${index}" data-key="label"`)}</label><label>链接${input(item.url,`data-array="socials" data-index="${index}" data-key="url"`)}</label><button class="remove" data-remove="socials:${index}">删除</button></div>`).join("");
  $("#highlight-list").innerHTML = state.content.about.highlights.map((item,index) => `<div class="repeat-row"><label>标签${input(item.label,`data-array="highlights" data-index="${index}" data-key="label"`)}</label><label>内容${input(item.value,`data-array="highlights" data-index="${index}" data-key="value"`)}</label><button class="remove" data-remove="highlights:${index}">删除</button></div>`).join("");
  $("#stat-list").innerHTML = state.content.interest.stats.map((item,index) => `<div class="repeat-row"><label>标签${input(item.label,`data-array="stats" data-index="${index}" data-key="label"`)}</label><label>数值${input(item.value,`data-array="stats" data-index="${index}" data-key="value"`)}</label><button class="remove" data-remove="stats:${index}">删除</button></div>`).join("");
  $$('[data-array]').forEach(field => field.oninput = () => {
    const map = {socials:state.content.profile.socials,highlights:state.content.about.highlights,stats:state.content.interest.stats};
    map[field.dataset.array][field.dataset.index][field.dataset.key] = field.value;
    queuePreview();
  });
}

function imageStrip(images, type, index) {
  return `<div class="image-strip">${images.map((src,imageIndex) => `<div class="image-thumb"><img src="/preview/${esc(src)}"><button data-remove-image="${type}:${index}:${imageIndex}">x</button></div>`).join("")}</div><label class="image-button">+ 上传图片<input hidden type="file" multiple accept="image/*" data-upload="${type}:${index}"></label>`;
}

function renderProjects() {
  $("#project-list").innerHTML = state.content.projects.map((project,index) => `<article class="collection-card"><div class="collection-top"><strong>${esc(project.title || "New project")}</strong><button class="remove" data-remove="projects:${index}">删除项目</button></div><div class="collection-body"><div class="fields two"><label>标题${input(project.title,`data-project="${index}:title"`)}</label><label>类型${input(project.type,`data-project="${index}:type"`)}</label><label>链接${input(project.url,`data-project="${index}:url"`)}</label><label>标签（逗号分隔）${input(project.tags.join(", "),`data-project="${index}:tags"`)}</label></div><label>描述${textarea(project.description,`data-project="${index}:description"`)}</label>${imageStrip(project.image ? [project.image] : [],"project",index)}</div></article>`).join("");
  bindCollection("project",state.content.projects);
}

function renderInterestEntries() {
  $("#interest-entry-list").innerHTML = state.content.interest.entries.map((entry,index) => `<article class="collection-card"><div class="collection-top"><strong>${esc(entry.title || "New entry")}</strong><button class="remove" data-remove="interestEntries:${index}">删除记录</button></div><div class="collection-body"><div class="fields two"><label>标题${input(entry.title,`data-entry="${index}:title"`)}</label><label>日期${input(entry.date,`data-entry="${index}:date" type="date"`)}</label></div><label>记录${textarea(entry.summary,`data-entry="${index}:summary"`)}</label><label>指标（名称=数值，每行一项）${textarea(entry.metrics.map(metric => `${metric.label}=${metric.value}`).join("\n"),`data-entry="${index}:metrics"`)}</label>${imageStrip(entry.images,"interest",index)}</div></article>`).join("");
  bindCollection("entry",state.content.interest.entries);
}

function renderPosts() {
  $("#post-editor-list").innerHTML = state.content.posts.map((post,index) => `<article class="collection-card"><div class="collection-top"><strong>${esc(post.title || "New post")}</strong><button class="remove" data-remove="posts:${index}">删除文章</button></div><div class="collection-body"><div class="fields two"><label>标题${input(post.title,`data-post="${index}:title"`)}</label><label>日期${input(post.date,`data-post="${index}:date" type="date"`)}</label><label>标签（逗号分隔）${input(post.tags.join(", "),`data-post="${index}:tags"`)}</label><label>摘要${input(post.excerpt,`data-post="${index}:excerpt"`)}</label></div><label>正文${textarea(post.body,`data-post="${index}:body" rows="10"`)}</label>${imageStrip(post.images,"post",index)}</div></article>`).join("");
  bindCollection("post",state.content.posts);
}

function bindCollection(kind, array) {
  $$(`[data-${kind}]`).forEach(field => field.oninput = () => {
    const [index,key] = field.dataset[kind].split(":");
    let value = field.value;
    if (key === "tags") value = value.split(",").map(item => item.trim()).filter(Boolean);
    if (key === "metrics") value = value.split(/\n/).map(line => { const [label,...rest] = line.split("="); return {label:label.trim(),value:rest.join("=").trim()}; }).filter(item => item.label);
    array[index][key] = value;
    queuePreview();
  });
}

function renderThemes() {
  $("#theme-grid").innerHTML = state.themes.map(theme => `<button class="theme ${state.content.site.theme === theme.id ? "active" : ""}" data-theme="${theme.id}"><span class="swatch"><i style="background:${theme.background}"></i><i style="background:${theme.primary}"></i><i style="background:${theme.accent}"></i></span><div><strong>${esc(theme.name)}</strong><small>${esc(theme.description)}</small></div></button>`).join("");
  const current = state.themes.find(theme => theme.id === state.content.site.theme) || state.themes[0];
  $$('[data-color]').forEach(field => {
    const key = field.dataset.color;
    field.value = state.content.site.customColors[key] || current[key];
    field.oninput = () => { state.content.site.customColors[key] = field.value; queuePreview(); };
  });
}

function renderGit(git) {
  state.git = git;
  $("#branch").textContent = git.branch;
  $("#last").textContent = git.last;
  $("#git-files").innerHTML = git.files.length ? git.files.map(file => `<div class="git-file">${esc(file)}</div>`).join("") : "<div class='git-file'>No local changes</div>";
}

function renderLayers() {
  $("#section-layers").innerHTML = state.content.site.builder.sections.map((section,index) => `<div class="layer ${section.id === selectedSection ? "active" : ""} ${section.enabled === false ? "disabled" : ""}" draggable="true" data-layer="${section.id}" data-index="${index}" tabindex="0" role="button"><span class="drag-handle" title="拖动排序">⠿</span><span><strong>${esc(section.label)}</strong><small>${section.width}px · ${section.align}</small></span><span class="layer-actions"><button data-move="up" aria-label="上移 ${esc(section.label)}" ${index === 0 ? "disabled" : ""}>↑</button><button data-move="down" aria-label="下移 ${esc(section.label)}" ${index === state.content.site.builder.sections.length - 1 ? "disabled" : ""}>↓</button></span><i>${section.enabled === false ? "Hidden" : String(index + 1).padStart(2,"0")}</i></div>`).join("");
  $$('[data-layer]').forEach(layer => {
    layer.onclick = event => {
      const move = event.target.closest("[data-move]");
      if (move) {
        event.stopPropagation();
        const sections = state.content.site.builder.sections;
        const from = sections.findIndex(item => item.id === layer.dataset.layer);
        const to = move.dataset.move === "up" ? from - 1 : from + 1;
        if (to < 0 || to >= sections.length) return;
        [sections[from],sections[to]] = [sections[to],sections[from]];
        renderLayers(); sendPreview();
        return;
      }
      selectedSection = layer.dataset.layer; renderLayers(); renderInspector(); sendPreview();
    };
    layer.onkeydown = event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); layer.click(); } };
    layer.ondragstart = () => { dragSection = layer.dataset.layer; layer.classList.add("dragging"); };
    layer.ondragend = () => { dragSection = null; layer.classList.remove("dragging"); $$('.layer').forEach(item => item.classList.remove("drag-over")); };
    layer.ondragover = event => { event.preventDefault(); layer.classList.add("drag-over"); };
    layer.ondragleave = () => layer.classList.remove("drag-over");
    layer.ondrop = event => {
      event.preventDefault();
      const sections = state.content.site.builder.sections;
      const from = sections.findIndex(item => item.id === dragSection);
      const to = sections.findIndex(item => item.id === layer.dataset.layer);
      if (from < 0 || to < 0 || from === to) return;
      const [moved] = sections.splice(from,1);
      sections.splice(to,0,moved);
      renderLayers();
      sendPreview();
    };
  });
}

function renderInspector() {
  const background = state.content.site.builder.background;
  $$('[data-page-bg]').forEach(field => {
    const key = field.dataset.pageBg;
    field.value = background[key] ?? "";
    field.oninput = () => {
      background[key] = field.type === "range" ? Number(field.value) : field.value;
      renderOutputs();
      queuePreview();
    };
  });
  $('[data-builder-motion]').value = state.content.site.builder.motion;
  $('[data-builder-motion]').onchange = event => { state.content.site.builder.motion = event.target.value; sendPreview(); };
  $("#page-bg-name").textContent = background.image ? background.image.split("/").pop() : "未选择背景图";

  const section = selectedSettings();
  $("#selected-section-name").textContent = `${section.label} 模块`;
  $$('[data-section-prop]').forEach(field => {
    const key = field.dataset.sectionProp;
    if (field.type === "checkbox") field.checked = section[key] !== false;
    else field.value = section[key] ?? "";
    field.oninput = () => {
      section[key] = field.type === "checkbox" ? field.checked : field.type === "range" ? Number(field.value) : field.value;
      renderOutputs();
      renderLayers();
      queuePreview();
    };
  });
  $$('[data-section-color]').forEach(field => {
    const key = field.dataset.sectionColor;
    field.value = section[key] || (key === "textColor" ? "#23364d" : "#9c4f35");
    field.oninput = () => { section[key] = field.value; queuePreview(); };
  });
  $("#section-bg-name").textContent = section.backgroundImage ? section.backgroundImage.split("/").pop() : "未选择背景图";
  renderOutputs();
}

function renderOutputs() {
  const section = selectedSettings();
  const values = {width:`${section.width}px`,minHeight:section.minHeight ? `${section.minHeight}px` : "Auto",padding:`${section.padding}px`,radius:`${section.radius}px`,gradientAngle:`${section.gradientAngle}°`,"page-angle":`${state.content.site.builder.background.angle}°`};
  $$('[data-output]').forEach(output => output.textContent = values[output.dataset.output] ?? "");
}

function renderBuilder() {
  renderLayers();
  renderInspector();
  queuePreview();
}

function renderAll() {
  bindFields();
  renderRepeats();
  renderProjects();
  renderInterestEntries();
  renderPosts();
  renderThemes();
  renderBuilder();
  renderGit(state.git);
}

async function fileData(file) {
  if (!file.type.startsWith("image/")) throw new Error("Only images are accepted");
  const url = URL.createObjectURL(file);
  const image = new Image();
  await new Promise((resolve,reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
  const scale = Math.min(1,2200 / Math.max(image.naturalWidth,image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
  URL.revokeObjectURL(url);
  return {dataUrl:canvas.toDataURL("image/webp",.87),name:file.name};
}

async function uploadFiles(target, files) {
  for (const file of [...files].slice(0,10)) {
    const result = await api("/api/upload",{file:await fileData(file),prefix:target.replace(/:/g,"-")});
    const [type,index] = target.split(":");
    if (type === "profile") state.content.profile.avatar = result.path;
    if (type === "project") state.content.projects[index].image = result.path;
    if (type === "interest") state.content.interest.entries[index].images.push(result.path);
    if (type === "post") state.content.posts[index].images.push(result.path);
  }
  renderAll();
  sendPreview();
  notice("图片已保存到本地");
}

async function uploadBuilderImage(target, file) {
  if (!file) return;
  const result = await api("/api/upload",{file:await fileData(file),prefix:`builder-${target}`});
  if (target === "page") {
    state.content.site.builder.background.image = result.path;
    state.content.site.builder.background.mode = "image";
  } else {
    selectedSettings().backgroundImage = result.path;
    selectedSettings().backgroundMode = "image";
  }
  renderInspector();
  sendPreview();
  notice("背景图已加入画布，保存后即可发布");
}

async function save() {
  try {
    await api("/api/save",{content:state.content});
    notice("已保存到本地，设计与预览保持一致");
    state.git = (await api("/api/state")).git;
    renderGit(state.git);
  } catch (error) { notice(error.message,true); }
}

function switchView(name) {
  $$('nav button').forEach(button => button.classList.toggle("active",button.dataset.view === name));
  $$('.view').forEach(view => view.classList.toggle("active",view.id === name));
  $("#crumb").textContent = views[name][0];
  $("#title").textContent = views[name][1];
  document.body.classList.toggle("builder-open",name === "builder");
  if (name === "builder") setTimeout(sendPreview,80);
  window.scrollTo({top:0,behavior:"smooth"});
}

document.addEventListener("click", async event => {
  const nav = event.target.closest("[data-view]");
  if (nav) switchView(nav.dataset.view);
  if (event.target.closest(".save")) save();

  const add = event.target.closest("[data-add]");
  if (add) {
    const type = add.dataset.add;
    if (type === "social") state.content.profile.socials.push({label:"New link",url:""});
    if (type === "highlight") state.content.about.highlights.push({label:"Label",value:"Value"});
    if (type === "stat") state.content.interest.stats.push({label:"New stat",value:"Value"});
    if (type === "project") state.content.projects.push({title:"New Project",type:"Project",description:"",url:"",image:"assets/project-placeholder.svg",tags:[]});
    if (type === "interest-entry") state.content.interest.entries.unshift({title:"New Entry",date:new Date().toISOString().slice(0,10),summary:"",images:[],metrics:[]});
    if (type === "post") state.content.posts.unshift({id:Date.now().toString(36),title:"New Post",date:new Date().toISOString().slice(0,10),excerpt:"",body:"",images:[],tags:[]});
    renderAll();
  }

  const remove = event.target.closest("[data-remove]");
  if (remove) {
    const [type,index] = remove.dataset.remove.split(":");
    const map = {socials:state.content.profile.socials,highlights:state.content.about.highlights,stats:state.content.interest.stats,projects:state.content.projects,interestEntries:state.content.interest.entries,posts:state.content.posts};
    map[type].splice(Number(index),1);
    renderAll();
  }

  const removeImage = event.target.closest("[data-remove-image]");
  if (removeImage) {
    const [type,index,imageIndex] = removeImage.dataset.removeImage.split(":");
    if (type === "project") state.content.projects[index].image = "assets/project-placeholder.svg";
    if (type === "interest") state.content.interest.entries[index].images.splice(imageIndex,1);
    if (type === "post") state.content.posts[index].images.splice(imageIndex,1);
    renderAll();
  }

  const theme = event.target.closest("[data-theme]");
  if (theme) { state.content.site.theme = theme.dataset.theme; renderThemes(); sendPreview(); }
  const clear = event.target.closest("[data-clear]");
  if (clear) { state.content.site.customColors[clear.dataset.clear] = ""; renderThemes(); sendPreview(); }
  const device = event.target.closest("[data-device]");
  if (device) {
    $$('[data-device]').forEach(button => button.classList.toggle("active",button === device));
    $(".builder-stage").dataset.device = device.dataset.device;
  }
  const clearBuilder = event.target.closest("[data-clear-builder-image]");
  if (clearBuilder) {
    if (clearBuilder.dataset.clearBuilderImage === "page") state.content.site.builder.background.image = "";
    else selectedSettings().backgroundImage = "";
    renderInspector(); sendPreview();
  }
  const clearSectionColor = event.target.closest("[data-clear-section-color]");
  if (clearSectionColor) { selectedSettings()[clearSectionColor.dataset.clearSectionColor] = ""; renderInspector(); sendPreview(); }
  if (event.target.closest(".reset-section")) {
    const defaults = sectionDefaults.find(item => item[0] === selectedSection);
    const currentIndex = state.content.site.builder.sections.findIndex(item => item.id === selectedSection);
    const [id,label,minHeight,padding] = defaults;
    state.content.site.builder.sections[currentIndex] = ensureBuilder({site:{customColors:{},builder:{sections:[]}},sectionCopy:{}}).site.builder.sections.find(item => item.id === id);
    state.content.site.builder.sections[currentIndex].label = label;
    state.content.site.builder.sections[currentIndex].minHeight = minHeight;
    state.content.site.builder.sections[currentIndex].padding = padding;
    renderBuilder(); sendPreview();
  }
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-image-target]")) uploadFiles(event.target.dataset.imageTarget,event.target.files);
  if (event.target.matches("[data-upload]")) uploadFiles(event.target.dataset.upload,event.target.files);
  if (event.target.matches("[data-builder-upload]")) uploadBuilderImage(event.target.dataset.builderUpload,event.target.files[0]);
});

window.addEventListener("message", event => {
  if (event.origin !== location.origin || event.source !== $("#builder-frame").contentWindow) return;
  if (event.data?.type === "pss:ready") { previewReady = true; sendPreview(); }
  if (event.data?.type === "pss:select-section") {
    selectedSection = event.data.id;
    renderLayers(); renderInspector(); sendPreview();
  }
  if (event.data?.type === "pss:inline-edit") {
    setPath(event.data.path,event.data.value);
    $$(`[data-path="${event.data.path}"]`).forEach(field => field.value = event.data.value);
  }
});

$("#builder-frame").addEventListener("load", () => { previewReady = true; sendPreview(); });
$("#publish-btn").onclick = async () => {
  if (!confirm("Commit and push Studio content to GitHub main?")) return;
  try {
    await api("/api/save",{content:state.content});
    const result = await api("/api/publish",{message:$("#commit-message").value});
    renderGit(result.git);
    notice("Published. GitHub Pages is deploying now.");
  } catch (error) { notice(error.message,true); }
};

api("/api/state").then(data => {
  state = data;
  state.content = ensureBuilder(state.content);
  renderAll();
}).catch(error => notice(error.message,true));
