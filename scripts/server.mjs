import next from 'next';
import { createServer } from 'http';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: process.cwd() });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(4400, '0.0.0.0', () => {
    console.log(`Hayati OS running on http://0.0.0.0:4400`);
  });
});
