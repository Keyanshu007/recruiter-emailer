import { execSync } from 'child_process';

try {
  console.log('Running Python script...');
  execSync('python Email_Tailor.py', { stdio: 'inherit' });
  
  console.log('Python script completed, starting frontend...');
  execSync('concurrently "cd Frontend && vite" "cd Frontend && node server.js"', { 
    stdio: 'inherit',
    shell: true 
  });
} catch (e) {
  console.error('Error:', e);
  process.exit(1);
}