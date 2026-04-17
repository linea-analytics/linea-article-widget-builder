// blog-single.js
function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(); // Already loaded
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function loadWidgets() {
  const widgetDivs = document.querySelectorAll('div[id$="-widget"]');

  await Promise.all([...widgetDivs].map(async (div) => {
    const widgetId = div.id;
    try {
      const response = await fetch(`/widgets/${widgetId}.html`);
      const widgetHtml = await response.text();

      const widgetContainer = document.createElement('div');
      widgetContainer.innerHTML = widgetHtml;

      while (widgetContainer.firstChild) {
        const node = widgetContainer.firstChild;
        if (node.tagName === 'SCRIPT') {
          const newScript = document.createElement('script');
          if (node.src) {
            await loadScriptOnce(node.src);
          } else {
            newScript.textContent = node.textContent;
            document.body.appendChild(newScript); // Run inline script
          }
          widgetContainer.removeChild(node);
        } else {
          div.appendChild(node);
          div.classList.add('blog-widget');
        }
      }
    } catch (err) {
      console.warn(`Could not load widget: ${widgetId}`, err);
      div.innerHTML = `<p style="color: red;">[Missing widget: ${widgetId}]</p>`;
    }
  }));
}
function insertLatest() {
  const contactUs = document.getElementById('contactUs');
  if (!contactUs) return console.warn('Element with id="contactUs" not found');

  const featuredContainer = document.createElement('section');
  featuredContainer.id = 'featured-articles';
  featuredContainer.className = 'my-5 container';

  const featuredArticles = [
    {
      title: 'First step to measuring the long-term impact of Marketing: Adstock',
      thumbnail: '/articles/adstocks/thumbnail.jpg',
      url: '/articles/adstocks/article.html'
    },
    {
      title: 'If we keep scaling media spend, will my CAC always increase?',
      thumbnail: '/articles/cac-increase/thumbnail.jpg',
      url: '/articles/cac-increase/article.html'
    },
    {
      title: 'Demystifying building an MMM model',
      thumbnail: '/articles/demistify-mmm/thumbnail.jpg',
      url: '/articles/demistify-mmm/article.html'
    },
    {
      title: 'Measuring the long-term impact of media',
      thumbnail: '/articles/measuring-long-term/thumbnail.jpg',
      url: '/articles/measuring-long-term/article.html'
    },
    {
      title: 'Choosing The Best Marketing Measurement Tools',
      thumbnail: '/articles/choosing-right-tool/thumbnail.jpg',
      url: '/articles/choosing-right-tool/article.html'
    },
    {
      title: 'Optimising future media budget',
      thumbnail: '/articles/optimising-media/thumbnail.jpg',
      url: '/articles/optimising-media/article.html'
    }
  ];

  featuredContainer.innerHTML = `
    <h4 class="mb-4 text-center fw-semibold">Most Popular Articles</h4>
    <div class="row g-4">
      ${featuredArticles.map(a => `
        <div class="col-12 col-sm-6 col-md-4">
          <div class="card h-100 border-0 shadow-sm">
            <img src="${a.thumbnail}" 
                 alt="${a.title}" 
                 class="card-img-top" 
                 style="height:180px;object-fit:cover;">
            <div class="card-body d-flex flex-column">
              <h6 class="card-title fw-semibold mb-2">
                <a href="${a.url}" class="stretched-link text-decoration-none text-dark">
                  ${a.title}
                </a>
              </h6>
              <p class="text-muted small mt-auto mb-0">Read more →</p>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  contactUs.parentNode.insertBefore(featuredContainer, contactUs);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("pre > code").forEach(codeBlock => {

    // wrap <pre> in a container
    const pre = codeBlock.parentElement;
    const wrapper = document.createElement("div");
    wrapper.className = "pre-wrapper";
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    // create the copy button
    const button = document.createElement("button");
    button.className = "copy-btn";
    button.innerText = "Copy";

    // click action
    button.addEventListener("click", () => {
      const text = codeBlock.innerText;
      navigator.clipboard.writeText(text).then(() => {
        button.innerText = "Copied!";
        setTimeout(() => (button.innerText = "Copy"), 1500);
      });
    });

    wrapper.appendChild(button);
  });
});


/**
 * From a path like /articles/multicolinearity/article.html
 * returns "multicolinearity".
 */
function getArticleFolderFromPath(pathname) {
  const parts = pathname.split('/').filter(Boolean); // remove empty strings
  const idx = parts.indexOf('articles');
  if (idx === -1 || idx === parts.length - 1) return null;
  return parts[idx + 1];
}

/**
 * Format ISO date (YYYY-MM-DD) as something readable, eg. "9 March 2025".
 */
function formatArticleDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr; // fallback to raw string

  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Very small helper to avoid injecting raw HTML from JSON.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Load the JSON once the DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // Adjust this path depending on where articles-meta.json lives
  // If the JSON is at /articles/articles-meta.json and your page is /articles/folder/article.html
  // then a safer relative path is '../articles-meta.json'
  fetch('../articles-meta.json')
    .then(res => {
      if (!res.ok) {
        throw new Error('Failed to load articles-meta.json: ' + res.status);
      }
      return res.json();
    })
    .then(data => {
      window.ARTICLES_HEAD = data;
      insertArticleMeta();
    })
    .catch(err => console.error('Error loading articles head JSON:', err));
});

function insertArticleMeta() {
  try {
    // 1. Get article folder from URL, e.g. /articles/multicolinearity/article.html
    const folder = getArticleFolderFromPath(window.location.pathname);
    if (!folder) {
      console.warn('Could not determine article folder from path:', window.location.pathname);
      return;
    }

    // 2. Look up meta info for this article from your JSON head
    if (!Array.isArray(window.ARTICLES_HEAD)) {
      console.warn('ARTICLES_HEAD not found or not an array');
      return;
    }

    const meta = window.ARTICLES_HEAD.find(item => item.folder === folder);
    if (!meta) {
      console.warn('No meta found in ARTICLES_HEAD for folder:', folder);
      return;
    }

    // 3. Find the first thumbnail image (may appear multiple times on page)
    const thumbImg = document.querySelector('img[alt="thumbnail"]');
    if (!thumbImg) {
      console.warn('No thumbnail image found with alt="thumbnail"');
      return;
    }

    const thumbWrapper = thumbImg.parentElement;
    if (!thumbWrapper) return;

    // 4. Create the author + date element
    const metaDiv = document.createElement('div');
    // Using Bootstrap utility classes for simple styling
    metaDiv.className = 'mt-2 text-muted small mb-3 text-right';

    const formattedDate = formatArticleDate(meta.date);

    metaDiv.innerHTML = `
      <span>By ${escapeHtml(meta.author || '')}</span>
      <span class="mx-2">•</span>
      <span>${escapeHtml(formattedDate)}</span>
    `;

    // 5. Insert it immediately after the thumbnail container
    thumbWrapper.insertAdjacentElement('afterend', metaDiv);

  } catch (err) {
    console.error('Error inserting article meta:', err);
  }
}


window.addEventListener('DOMContentLoaded', () => {
  loadWidgets();
  insertLatest();
});

function applyTableStyling() {
  const tables = document.querySelectorAll('table');

  tables.forEach(table => {
    // Wrap the table in a scroll container if it is not already wrapped
    if (!table.parentElement.classList.contains('table-scroll-x')) {
      const wrapper = document.createElement('div');
      wrapper.classList.add('table-responsive');
      table.parentElement.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }

    // Add table classes
    table.classList.add('table', 'table-sm', 'align-middle');

    // Find or create THEAD
    let thead = table.querySelector('thead');
    if (thead) {
      thead.classList.add('table-light', 'bg-green', 'text-white', 'text-center');
    }
  });
}


document.addEventListener('DOMContentLoaded', function () {
  applyTableStyling();
});
