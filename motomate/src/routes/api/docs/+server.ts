import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return new Response(null, { status: 302, headers: { Location: '/login' } });
	}

	const theme = (locals.user as any)?.settings?.theme ?? 'system';
	const scalarTheme = theme === 'dark' ? 'saturn' : 'default';

	const config = JSON.stringify({
		theme: scalarTheme,
		hideModels: true,
		defaultOpenAllTags: true,
		hideDownloadButton: false,
		defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' }
	});

	const html = `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MotoMate API</title>
  <style>
    :root { color-scheme: ${theme === 'dark' ? 'dark' : 'light'}; }
    body { margin: 0; font-family: Inter, system-ui, sans-serif; }
  </style>
  <script>
    (function () {
      var GITHUB_URL = 'https://github.com/hawkinslabdev/motomate';

      function inject() {
        if (document.getElementById('mm-api-overlay')) return;

        var tooltip = document.createElement('div');
        tooltip.textContent = 'View on GitHub';
        tooltip.style.cssText = [
          'position:absolute',
          'top:50%',
          'right:calc(100% + 8px)',
          'transform:translateY(-50%)',
          'background:rgba(0,0,0,0.85)',
          'color:#fff',
          'padding:4px 8px',
          'border-radius:4px',
          'font-size:12px',
          'font-family:Inter,system-ui,sans-serif',
          'white-space:nowrap',
          'pointer-events:none',
          'opacity:0',
          'transition:opacity 0.15s'
        ].join(';');

        var link = document.createElement('a');
        link.href = GITHUB_URL;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        // CSS Auto-Contrast Magic
        link.style.cssText = [
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'text-decoration:none',
          'color: #fff !important',
          'mix-blend-mode: difference',
          'opacity: 0.5',
          'transition: opacity 0.15s'
        ].join(';');

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '20');
        svg.setAttribute('height', '20');
        svg.setAttribute('fill', 'currentColor');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z');
        svg.appendChild(path);
        link.appendChild(svg);

        var wrap = document.createElement('div');
        wrap.style.position = 'relative';
        wrap.appendChild(link);
        wrap.appendChild(tooltip);

        // Hover effects handle opacity instead of swapping hardcoded colors
        wrap.addEventListener('mouseenter', function () {
          link.style.opacity = '1';
          tooltip.style.opacity = '1';
        });
        wrap.addEventListener('mouseleave', function () {
          link.style.opacity = '0.5';
          tooltip.style.opacity = '0';
        });

        var container = document.createElement('div');
        container.id = 'mm-api-overlay';
        container.style.cssText = [
          'position:fixed',
          'bottom:20px',
          'right:20px',
          'z-index:2147483647',
          'display:flex',
          'flex-direction:column',
          'gap:10px',
          'align-items:center'
        ].join(';');
        container.appendChild(wrap);

        document.body.appendChild(container);
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
      } else {
        inject();
      }
    })();
  </script>
</head>
<body>
  <script id="api-reference" data-url="/api/spec" data-configuration='${config}'></script>
  <script src="/scalar.js"></script>
</body>
</html>`;

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'no-store'
		}
	});
};
