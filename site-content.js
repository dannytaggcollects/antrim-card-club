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
