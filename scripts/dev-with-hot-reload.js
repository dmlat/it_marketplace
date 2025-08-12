#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск ITM Marketplace в режиме разработки с Hot Reload...\n');

// Функция для запуска процесса с цветным выводом
function runCommand(command, args, options = {}) {
  const process = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options
  });
  
  return process;
}

// Функция для показа URL-адресов
function showUrls() {
  console.log('\n🌐 Доступные сервисы:');
  console.log('   Frontend (React):     http://localhost:3000');
  console.log('   Users API:            http://localhost:8001');
  console.log('   Companies API:        http://localhost:8003');
  console.log('   Operator API:         http://localhost:8002');
  console.log('   PostgreSQL DB:        localhost:5500');
  console.log('\n✨ Hot Reload включен для фронтенда!\n');
}

async function main() {
  try {
    console.log('📦 Запуск микросервисов в Docker...');
    
    // Запускаем только микросервисы в Docker (без фронтенда)
    const dockerProcess = spawn('docker-compose', [
      '-f', 'docker-compose.dev.yml',
      'up', '-d'
    ], {
      stdio: 'pipe',
      shell: true
    });

    dockerProcess.stdout.on('data', (data) => {
      process.stdout.write(`[Docker] ${data}`);
    });

    dockerProcess.stderr.on('data', (data) => {
      process.stderr.write(`[Docker] ${data}`);
    });

    // Ждем запуска Docker сервисов
    await new Promise((resolve, reject) => {
      dockerProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Микросервисы запущены успешно');
          resolve();
        } else {
          reject(new Error(`Docker завершился с кодом ${code}`));
        }
      });
    });

    // Показываем URL-адреса
    showUrls();

    // Небольшая задержка для стабилизации сервисов
    console.log('⏳ Ожидание стабилизации сервисов...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🎨 Запуск React фронтенда с Hot Reload...');
    
    // Запускаем фронтенд локально для Hot Reload
    const frontendProcess = runCommand('npm', ['start'], {
      cwd: path.join(__dirname, '../frontend'),
      env: {
        ...process.env,
        BROWSER: 'none', // Не открывать браузер автоматически
        PORT: '3000'
      }
    });

    // Обработка сигналов завершения
    process.on('SIGINT', () => {
      console.log('\n🛑 Завершение работы...');
      frontendProcess.kill();
      runCommand('docker-compose', ['-f', 'docker-compose.dev.yml', 'down']);
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Завершение работы...');
      frontendProcess.kill();
      runCommand('docker-compose', ['-f', 'docker-compose.dev.yml', 'down']);
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Ошибка при запуске:', error.message);
    process.exit(1);
  }
}

main();
