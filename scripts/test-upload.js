// scripts/test-upload.js
// Usage: node scripts/test-upload.js <path-to-file> [folder]

const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/test-upload.js <path-to-file> [folder]');
    process.exit(1);
  }
  const filePath = path.resolve(args[0]);
  const folder = args[1] || '';

  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  // Leer archivo a Buffer y crear un Blob compatible con fetch/FormData nativo (Node 18+)
  const buf = fs.readFileSync(filePath);
  const blob = new Blob([buf]);

  const form = new FormData();
  form.append('file', blob, path.basename(filePath));
  if (folder) form.append('folder', folder);

  const url = process.env.UPLOAD_URL || 'http://localhost:3000/api/upload';
  console.log('Uploading to', url, 'folder:', folder);

  const res = await fetch(url, { method: 'POST', body: form });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
