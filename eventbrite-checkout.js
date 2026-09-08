(() => {
  const mounts = [...document.querySelectorAll('[data-eventbrite-checkout]')];
  if (!mounts.length) return;

  let initialized = false;

  function createCheckouts(eventId) {
    if (initialized || !eventId || !window.EBWidgets) return;
    initialized = true;

    mounts.forEach((mount, index) => {
      if (!mount.id) mount.id = `eventbrite-widget-container-${eventId}-${index}`;
      window.EBWidgets.createWidget({
        widgetType: 'checkout',
        eventId: String(eventId),
        iframeContainerId: mount.id,
        iframeContainerHeight: 425,
        onOrderComplete: () => console.log('Order complete!')
      });
    });
  }

  function loadWidget(eventId) {
    if (window.EBWidgets) {
      createCheckouts(eventId);
      return;
    }

    let script = document.querySelector('script[data-eventbrite-widget-script]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.eventbrite.co.uk/static/widgets/eb_widgets.js';
      script.dataset.eventbriteWidgetScript = '';
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => createCheckouts(eventId), { once: true });
  }

  window.addEventListener('antrim-content-ready', (event) => {
    const tickets = event.detail?.tickets;
    if (tickets?.eventbriteUrl) {
      document.querySelectorAll('[data-eventbrite-external-link]').forEach((link) => {
        link.href = tickets.eventbriteUrl;
      });
    }
    loadWidget(tickets?.eventbriteEventId || '1999298554797');
  });

  setTimeout(() => loadWidget('1999298554797'), 1500);
})();
