import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 4178);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' };

/** 本地预览只提供构建目录中的文件，未知路径返回真实 404，喵~ */
async function serve(request, response) {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = resolve(root, `.${pathname}`);
    if (!file.startsWith(root + sep) && file !== root) throw new Error('outside root');
    const info = await stat(file);
    if (info.isDirectory()) {
      if (!pathname.endsWith('/')) { response.writeHead(308, { Location: pathname + '/' }); response.end(); return; }
      file = resolve(file, 'index.html');
    }
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    response.end(data);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(await readFile(resolve(root, '404.html')));
  }
}

createServer((request, response) => { void serve(request, response); }).listen(port, '127.0.0.1', () => {
  console.log(`Local: http://127.0.0.1:${port}`);
});
