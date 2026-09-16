const { spawn } = require('child_process');
const WebSocket = require('ws');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9227',
  '--disable-gpu',
  'http://localhost:3000'
]);

setTimeout(async () => {
  try {
    const list = await fetch('http://localhost:9227/json').then(r => r.json());
    const target = list.find(t => t.title && t.title.includes('StreamForge'));
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    ws.onopen = async () => {
      ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

      ws.on('message', (msg) => {
        const data = JSON.parse(msg);
        if (data.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
        }
        if (data.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', data.params.exceptionDetails.text, data.params.exceptionDetails.exception?.description);
        }
      });

      setTimeout(async () => {
        // Evaluate clicking navTabDiscover
        const expr = "document.getElementById('navTabDiscover').click()";
        ws.send(JSON.stringify({ id: 3, method: 'Runtime.evaluate', params: { expression: expr } }));

        setTimeout(async () => {
          const checkExpr = `JSON.stringify({
            cards: document.querySelectorAll('.media-card').length,
            error: document.querySelector('.discover-error')?.textContent,
            gridHidden: document.getElementById('discoverGrid').classList.contains('hidden'),
            loadingHidden: document.getElementById('discoverLoading').classList.contains('hidden')
          })`;
          const checkId = 99;
          ws.send(JSON.stringify({ id: checkId, method: 'Runtime.evaluate', params: { expression: checkExpr, returnByValue: true } }));
          ws.on('message', (m) => {
            const d = JSON.parse(m);
            if (d.id === checkId) {
              console.log('[DISCOVER GRID CHECK]', d.result?.result?.value);
              chrome.kill();
              process.exit(0);
            }
          });
        }, 2000);
      }, 1000);
    };
  } catch (e) {
    console.error(e);
    chrome.kill();
  }
}, 2000);
