function getContentValue(source, path) {
  return path.split('.').reduce((value, key) => value?.[key], source);
}

const richTextPaths = new Set([
  'home.intro', 'home.sectionIntro', 'home.featureOneText', 'home.featureTwoText',
  'home.featureThreeText', 'home.storyText', 'about.intro', 'about.mainText',
  'about.mainTextTwo', 'about.organiserText', 'tickets.intro',
  'tickets.eventDescription', 'contact.intro'
]);

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}

function safeLinkUrl(value) {
  const url = value.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  if (/^(?!\/\/)[a-z0-9._~!$&'()*+,;=:@%\/?#-]+$/i.test(url)) return url;
  return '#';
}

function renderRichText(value) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let output = '';
  let cursor = 0;
  let match;
  while ((match = linkPattern.exec(value)) !== null) {
    output += escapeHtml(value.slice(cursor, match.index));
    const href = safeLinkUrl(match[2]);
    output += `<a href="${escapeHtml(href)}">${escapeHtml(match[1])}</a>`;
    cursor = match.index + match[0].length;
  }
  output += escapeHtml(value.slice(cursor));
  return output.replace(/\n/g, '<br>');
}

function updateNavigation(navigation) {
  const links = [
    ['index.html', navigation.homeLabel, navigation.homeUrl],
    ['about.html', navigation.aboutLabel, navigation.aboutUrl],
    ['contact.html', navigation.contactLabel, navigation.contactUrl],
    ['tickets.html', navigation.ticketsLabel, navigation.ticketsUrl]
  ];

  links.forEach(([originalUrl, label, destination]) => {
    document.querySelectorAll(`.nav-links a[href="${originalUrl}"], .footer-links a[href="${originalUrl}"]`).forEach((link) => {
      if (label) link.textContent = label;
      if (destination) link.href = safeLinkUrl(destination);
    });
  });
}

function updateSiteImages() {
  document.querySelectorAll('.brand img, .hero-art .hero-disc img').forEach((image) => {
    image.src = 'assets/antrim-card-club-logo-square.png';
    image.alt = image.alt ? 'Antrim Card Club logo' : '';
  });

  const organiserImage = document.querySelector('.section-pink .hero-disc img');
  if (organiserImage) {
    organiserImage.src = 'assets/danny-tagg-organiser-square.png';
    organiserImage.alt = 'Danny Tagg Collects with a young collector at a card event';
  }
}

function renderGallery(about) {
  const organiserSection = document.querySelector('.section-pink');
  if (!organiserSection || !Array.isArray(about.gallery) || !about.gallery.length) return;

  const section = document.createElement('section');
  section.className = 'section gallery-section';
  const wrap = document.createElement('div');
  wrap.className = 'wrap';
  const header = document.createElement('div');
  header.className = 'section-head';
  const headingWrap = document.createElement('div');
  const eyebrow = document.createElement('span');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'From the club';
  const heading = document.createElement('h2');
  heading.textContent = about.galleryTitle || 'Club gallery';
  const intro = document.createElement('p');
  intro.textContent = about.galleryIntro || '';
  headingWrap.append(eyebrow, heading);
  header.append(headingWrap, intro);

  const grid = document.createElement('div');
  grid.className = 'gallery-grid';
  about.gallery.forEach((item) => {
    if (!item?.image) return;
    const figure = document.createElement('figure');
    figure.className = 'gallery-card';
    const image = document.createElement('img');
    image.src = safeLinkUrl(item.image);
    image.alt = item.alt || item.caption || '';
    image.loading = 'lazy';
    figure.appendChild(image);
    if (item.caption) {
      const caption = document.createElement('figcaption');
      caption.textContent = item.caption;
      figure.appendChild(caption);
    }
    grid.appendChild(figure);
  });

  wrap.append(header, grid);
  section.appendChild(wrap);
  organiserSection.after(section);
}

fetch('content/site.json')
  .then((response) => {
    if (!response.ok) throw new Error('Content file could not be loaded');
    return response.json();
  })
  .then((content) => {
    document.querySelectorAll('[data-content]').forEach((element) => {
      const value = getContentValue(content, element.dataset.content);
      if (typeof value === 'string' && value.trim()) {
        if (richTextPaths.has(element.dataset.content)) element.innerHTML = renderRichText(value);
        else element.textContent = value;
      }
    });

    document.querySelectorAll('[data-site-name]').forEach((element) => {
      element.textContent = content.site.clubName;
    });
    document.querySelectorAll('[data-site-tagline]').forEach((element) => {
      element.textContent = content.site.tagline;
    });
    if (content.site.navigation) updateNavigation(content.site.navigation);
    updateSiteImages();

    const quote = document.querySelector('.quote p');
    if (quote && content.home.quote) quote.textContent = `“${content.home.quote}”`;
    renderGallery(content.about);

    const contactEmail = document.querySelector('.contact-items .contact-item');
    if (contactEmail && content.contact.email) {
      const emailLink = document.createElement('a');
      emailLink.className = 'contact-item';
      emailLink.href = `mailto:${content.contact.email}`;
      emailLink.textContent = `✉ ${content.contact.email}`;
      contactEmail.replaceWith(emailLink);
    }

    const contactForm = document.querySelector('#contact-form');
    if (contactForm && content.contact.email) contactForm.dataset.recipient = content.contact.email;

    window.dispatchEvent(new CustomEvent('antrim-content-ready', { detail: content }));
  })
  .catch(() => {
    // Keep the text already present in the HTML if content loading is unavailable.
  });
