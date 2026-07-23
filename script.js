const menuButton = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

menuButton?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.nav-links a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const contactForm = document.querySelector('#contact-form');
const requestedTopic = new URLSearchParams(window.location.search).get('topic');
if (contactForm && requestedTopic) {
  const topicSelect = contactForm.querySelector('[name="topic"]');
  const matchingOption = [...topicSelect.options].find((option) => option.value === requestedTopic);
  if (matchingOption) topicSelect.value = requestedTopic;
}

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const submitButton = contactForm.querySelector('[type="submit"]');
  const status = contactForm.querySelector('.form-status');
  const recipient = contactForm.dataset.recipient || 'danny@antrimcardclub.com';
  const data = new FormData(contactForm);

  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';
  status.textContent = '';

  fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: data
  })
    .then((response) => {
      if (!response.ok) throw new Error('Submission failed');
      contactForm.reset();
      status.className = 'form-status is-success';
      status.textContent = 'Thanks — your message has been sent to Danny.';
    })
    .catch(() => {
      status.className = 'form-status is-error';
      status.textContent = 'Sorry, the message could not be sent. Please try again or email Danny directly.';
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = 'Send message →';
    });
});

document.querySelectorAll('[data-year]').forEach((node) => node.textContent = new Date().getFullYear());

const ticketMount = document.querySelector('#ticket-mount');

function renderTickets(ticketConfig) {
  if (!ticketConfig || !ticketMount) return;
  const eventName = escapeHtml(ticketConfig.eventName || 'Antrim Card Club Meet');
  const eventDescription = renderRichText(ticketConfig.eventDescription || 'Event details are being finalised.');
  const ticketUrl = escapeHtml(safeLinkUrl(ticketConfig.eventbriteUrl || ''));
  const embedUrl = escapeHtml(safeLinkUrl(ticketConfig.embedUrl || ''));

  if (ticketConfig.mode === 'coming-soon') {
    ticketMount.innerHTML = `
      <article class="ticket-card">
        <div>
          <span class="ticket-status">Next event coming soon</span>
          <h2 style="margin-top:18px">${eventName}</h2>
          <p class="lead">${eventDescription}</p>
        </div>
        <div class="ticket-price">
          <strong>Details TBA</strong>
          <a class="btn btn-primary" href="contact.html?topic=Tickets">Register interest</a>
        </div>
      </article>`;
  }

  if (ticketConfig.mode === 'direct' && ticketConfig.eventbriteUrl) {
    ticketMount.innerHTML = `
      <article class="ticket-card">
        <div>
          <span class="ticket-status">Booking now</span>
          <h2 style="margin-top:18px">${eventName}</h2>
          <p class="lead">${eventDescription}</p>
        </div>
        <div class="ticket-price">
          <strong>Eventbrite</strong>
          <a class="btn btn-primary" href="${ticketUrl}" target="_blank" rel="noopener">Book tickets ↗</a>
        </div>
      </article>`;
  }

  if (ticketConfig.mode === 'embed' && ticketConfig.embedUrl) {
    ticketMount.innerHTML = `
      <div class="ticket-embed">
        <div class="ticket-embed-head">
          <div><span class="ticket-status">Booking now</span><h2>${eventName}</h2></div>
          <a href="${ticketUrl === '#' ? embedUrl : ticketUrl}" target="_blank" rel="noopener">Open on Eventbrite ↗</a>
        </div>
        <iframe src="${embedUrl}" title="Book Antrim Card Club tickets on Eventbrite" loading="lazy" allow="payment"></iframe>
      </div>`;
  }
}

renderTickets(window.ANTRIM_TICKETS);
window.addEventListener('antrim-content-ready', (event) => renderTickets(event.detail.tickets));
