let content;
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);
const initials = name => String(name || "PS").split(/\s+/).map(part => part[0]).join("").slice(0,2).toUpperCase();

async function loadJson(path) { const response = await fetch(path); if (!response.ok) throw new Error(`Could not load ${path}`); return response.json(); }
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
function render() {
  document.title = content.site.title;
  $("#identity-mark").textContent = initials(content.profile.name); $("#identity-name").textContent = content.profile.name;
  $("#hero-name").textContent = content.profile.name; $("#hero-role").textContent = content.profile.role.toUpperCase(); $("#hero-tagline").textContent = content.site.tagline;
  $("#profile-avatar").src = content.profile.avatar; $("#profile-institution").textContent = `${content.profile.institution} / ${content.profile.location}`;
  $("#email-link").href = `mailto:${content.profile.email}`;
  $("#site-nav").innerHTML = content.navigation.map(item => `<a href="#${esc(item.target)}">${esc(item.label)}</a>`).join("");
  $("#hero-links").innerHTML = content.profile.socials.filter(item=>item.url).map(item=>`<a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.label)} ↗</a>`).join("") + (content.profile.resumeUrl ? `<a href="${esc(content.profile.resumeUrl)}">Resume ↗</a>` : "");
  $("#about-eyebrow").textContent = content.about.eyebrow; $("#about-heading").textContent = content.about.heading;
  $("#about-paragraphs").innerHTML = content.about.paragraphs.map(p=>`<p>${esc(p)}</p>`).join("");
  $("#about-highlights").innerHTML = content.about.highlights.map(item=>`<div><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`).join("");
  $("#project-grid").innerHTML = content.projects.map(project=>`<article class="project-card"><img src="${esc(project.image)}" alt="${esc(project.title)}"><div class="project-body"><div class="project-meta"><span>${esc(project.type)}</span><span>PROJECT</span></div><h3>${esc(project.title)}</h3><p>${esc(project.description)}</p><div class="tags">${project.tags.map(tag=>`<span>${esc(tag)}</span>`).join("")}</div>${project.url?`<p><a href="${esc(project.url)}" target="_blank" rel="noopener">View project ↗</a></p>`:""}</div></article>`).join("");
  $("#interest-kicker").textContent = content.interest.kicker; $("#interest-name").textContent = content.interest.name; $("#interest-headline").textContent = content.interest.headline; $("#interest-description").textContent = content.interest.description;
  $("#interest-stats").innerHTML = content.interest.stats.map(item=>`<div><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`).join("");
  $("#interest-grid").innerHTML = content.interest.entries.map(entry=>`<article class="interest-card"><div class="interest-gallery">${entry.images.map(image=>`<img src="${esc(image)}" alt="${esc(entry.title)}">`).join("")}</div><div class="interest-body"><time>${esc(entry.date)}</time><h3>${esc(entry.title)}</h3><p>${esc(entry.summary)}</p><div class="metrics">${entry.metrics.map(metric=>`<span>${esc(metric.label)} · ${esc(metric.value)}</span>`).join("")}</div></div></article>`).join("");
  $("#post-list").innerHTML = content.posts.map((post,index)=>`<button class="post-row" data-post="${index}"><time>${esc(post.date)}</time><div><h3>${esc(post.title)}</h3><p>${esc(post.excerpt)}</p></div><span>↗</span></button>`).join("");
  $("#footer-name").textContent = content.profile.name; $("#footer-tagline").textContent = content.site.tagline; $("#year").textContent = new Date().getFullYear();
}
function openPost(index){const post=content.posts[index];$("#post-detail").innerHTML=`<p class="eyebrow">${esc(post.date)} · ${post.tags.map(esc).join(" / ")}</p><h2>${esc(post.title)}</h2>${post.images.map(image=>`<img src="${esc(image)}" alt="${esc(post.title)}">`).join("")}<div>${post.body.split(/\n\n+/).map(p=>`<p>${esc(p).replace(/\n/g,"<br>")}</p>`).join("")}</div>`;$("#post-dialog").showModal()}
document.addEventListener("click",event=>{const row=event.target.closest("[data-post]");if(row)openPost(Number(row.dataset.post));if(event.target.closest(".dialog-close"))$("#post-dialog").close()});
Promise.all([loadJson("data/content.json"),loadJson("data/themes.json")]).then(([data,themes])=>{content=data;applyTheme(themes.find(theme=>theme.id===content.site.theme)||themes[0]);render()}).catch(error=>{document.body.innerHTML=`<main style="padding:3rem;font-family:sans-serif"><h1>Site data could not be loaded</h1><p>${esc(error.message)}</p></main>`});
