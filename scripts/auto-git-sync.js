import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Debounce delay in milliseconds (waits for edits to settle before committing)
const DEBOUNCE_MS = 6000;

// Directories and patterns to ignore
const IGNORED_PREFIXES = [
  '.git',
  'node_modules',
  'dist',
  '.venv',
  '.idea',
  '.vscode',
  '.DS_Store',
];

function shouldIgnore(relativePath) {
  if (!relativePath) return true;
  const normalized = relativePath.replace(/\\/g, '/');
  return IGNORED_PREFIXES.some(prefix => 
    normalized === prefix || normalized.startsWith(prefix + '/') || normalized.includes('/' + prefix + '/')
  );
}

function runCommand(cmd, options = {}) {
  return execSync(cmd, { cwd: ROOT_DIR, stdio: 'pipe', encoding: 'utf-8', ...options }).trim();
}

function getCurrentBranch() {
  try {
    return runCommand('git rev-parse --abbrev-ref HEAD') || 'main';
  } catch {
    return 'main';
  }
}

let syncTimeout = null;
let changedFilesSet = new Set();
let isSyncing = false;

function syncToGit() {
  if (isSyncing) {
    // If already syncing, schedule another pass
    syncTimeout = setTimeout(syncToGit, 2000);
    return;
  }

  isSyncing = true;
  try {
    const status = runCommand('git status --porcelain');
    if (!status) {
      // Nothing to commit
      changedFilesSet.clear();
      isSyncing = false;
      return;
    }

    const branch = getCurrentBranch();
    const changedList = Array.from(changedFilesSet);
    changedFilesSet.clear();

    const shortFileList = changedList.length > 0
      ? changedList.slice(0, 3).map(f => path.basename(f)).join(', ') + (changedList.length > 3 ? ` (+${changedList.length - 3} more)` : '')
      : 'workspace files';

    const timestamp = new Date().toLocaleString('en-US', { hour12: false });
    const commitMessage = `Auto-update: ${shortFileList} [${timestamp}]`;

    console.log(`\n[Auto-Sync ${new Date().toLocaleTimeString()}] 📦 Changes detected. Preparing commit...`);
    
    // Stage all changes
    runCommand('git add -A');

    // Commit
    runCommand(`git commit -m ${JSON.stringify(commitMessage)}`);
    console.log(`[Auto-Sync ${new Date().toLocaleTimeString()}] 💾 Committed: "${commitMessage}"`);

    // Push
    console.log(`[Auto-Sync ${new Date().toLocaleTimeString()}] 🚀 Pushing to origin/${branch}...`);
    runCommand(`git push origin ${branch}`);
    console.log(`[Auto-Sync ${new Date().toLocaleTimeString()}] ✅ Successfully synced to GitHub!\n`);

  } catch (err) {
    console.error(`[Auto-Sync ${new Date().toLocaleTimeString()}] ⚠️ Sync warning/error:`, err.message || err);
  } finally {
    isSyncing = false;
  }
}

function scheduleSync(filePath) {
  if (filePath) {
    changedFilesSet.add(filePath);
  }

  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  console.log(`[Auto-Sync ${new Date().toLocaleTimeString()}] ✏️ Change in: ${filePath || 'files'} (syncing in ${DEBOUNCE_MS / 1000}s...)`);
  syncTimeout = setTimeout(syncToGit, DEBOUNCE_MS);
}

// Initial check on startup
console.log('='.repeat(60));
console.log('🔄 Git Auto-Sync Watcher is active');
console.log(`📁 Watching directory: ${ROOT_DIR}`);
console.log(`⏱️  Debounce interval: ${DEBOUNCE_MS / 1000}s`);
console.log('='.repeat(60));

try {
  const initialStatus = runCommand('git status --porcelain');
  if (initialStatus) {
    console.log('[Auto-Sync] Pending uncommitted changes detected. Starting initial sync...');
    scheduleSync('initial-check');
  } else {
    console.log('[Auto-Sync] Working tree is clean. Waiting for changes...');
  }
} catch (e) {
  console.log('[Auto-Sync] Git ready.');
}

// Setup recursive watch
fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  if (shouldIgnore(filename)) return;

  scheduleSync(filename);
});
