# Руководство по развертыванию на VPS

## Предварительные требования

### Системные требования VPS:
- **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **RAM**: минимум 2GB (рекомендуется 4GB)
- **CPU**: минимум 1 vCPU (рекомендуется 2 vCPU)
- **Disk**: минимум 20GB свободного места
- **Network**: открытые порты 80, 443 (и 3000 для тестирования)

### Установленное ПО:
- **Node.js** 20.x или выше
- **Git**
- **Docker** и **Docker Compose** (для Docker-варианта)
- **PM2** (для PM2-варианта): `npm install -g pm2`
- **Nginx** (опционально, если не используется Docker)

---

## Вариант 1: Развертывание с Docker (рекомендуется)

### 1. Установка Docker и Docker Compose

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перелогиниться для применения изменений
exit
```

### 2. Клонирование проекта

```bash
# Создание директории проекта
mkdir -p ~/apps
cd ~/apps

# Клонирование репозитория
git clone <your-repo-url> csm-app
cd csm-app
```

### 3. Настройка переменных окружения

```bash
# Копирование примера и редактирование
cp .env.production.example .env.production
nano .env.production
```

**Важные переменные для настройки:**
- `DATABASE_URL` - оставьте как есть для Docker
- `SMTP_*` - настройки SMTP сервера
- `NOTIFY_EMAIL` - email для уведомлений
- `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` - токены Telegram
- `ADMIN_PASSWORD` - сильный пароль администратора
- `JWT_SECRET` - случайная строка минимум 32 символа

### 4. Настройка Nginx

Отредактируйте `nginx.conf` и замените `your-domain.com` на ваш домен:

```bash
nano nginx.conf
```

### 5. Создание директорий

```bash
# Создание необходимых директорий
mkdir -p data uploads ssl logs backups

# Установка правильных прав
chmod 755 data uploads
```

### 6. Запуск приложения

```bash
# Сделать скрипт исполняемым
chmod +x deploy.sh backup.sh

# Запуск деплоя
./deploy.sh docker
```

### 7. Проверка работы

```bash
# Проверка статуса контейнеров
docker-compose ps

# Просмотр логов
docker-compose logs -f app

# Проверка здоровья
curl http://localhost:3000
```

### 8. Настройка SSL (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install certbot

# Временно остановить nginx в Docker
docker-compose stop nginx

# Получение сертификата
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*.pem

# Раскомментировать SSL блок в nginx.conf
nano nginx.conf

# Перезапустить nginx
docker-compose restart nginx
```

### Управление Docker контейнерами

```bash
# Остановка
docker-compose down

# Запуск
docker-compose up -d

# Перезапуск
docker-compose restart

# Просмотр логов
docker-compose logs -f

# Обновление образа
docker-compose pull
docker-compose up -d --build
```

---

## Вариант 2: Развертывание с PM2

### 1. Установка необходимого ПО

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PM2 глобально
sudo npm install -g pm2

# Установка Nginx
sudo apt install -y nginx
```

### 2. Клонирование проекта

```bash
mkdir -p ~/apps
cd ~/apps
git clone <your-repo-url> csm-app
cd csm-app
```

### 3. Настройка переменных окружения

```bash
cp .env.production.example .env.production
nano .env.production
```

Измените `DATABASE_URL` на:
```
DATABASE_URL="file:./data/prod.db"
```

### 4. Запуск приложения

```bash
# Создание необходимых директорий
mkdir -p data uploads logs backups

# Сделать скрипты исполняемыми
chmod +x deploy.sh backup.sh

# Запуск деплоя
./deploy.sh pm2

# Настройка автозапуска PM2
pm2 startup
# Выполните команду, которую выдаст PM2
```

### 5. Настройка Nginx (без Docker)

Создайте конфигурацию Nginx:

```bash
sudo nano /etc/nginx/sites-available/csm-app
```

Вставьте следующую конфигурацию:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/csm-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Настройка SSL с Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Управление PM2

```bash
# Просмотр статуса
pm2 status

# Просмотр логов
pm2 logs csm-app

# Остановка
pm2 stop csm-app

# Запуск
pm2 start csm-app

# Перезапуск
pm2 restart csm-app

# Удаление
pm2 delete csm-app
```

---

## Обновление приложения

### Docker вариант:

```bash
cd ~/apps/csm-app
git pull origin main
./deploy.sh docker
```

### PM2 вариант:

```bash
cd ~/apps/csm-app
git pull origin main
./deploy.sh pm2
```

---

## Резервное копирование

### Создание бэкапа:

```bash
./backup.sh
```

Бэкапы сохраняются в директории `./backups/` и автоматически удаляются старые (хранятся последние 7).

### Восстановление из бэкапа:

```bash
# Остановить приложение
docker-compose down  # для Docker
# или
pm2 stop csm-app    # для PM2

# Восстановить из архива
tar -xzf backups/backup_YYYYMMDD_HHMMSS.tar.gz

# Запустить приложение
docker-compose up -d  # для Docker
# или
pm2 restart csm-app  # для PM2
```

### Автоматическое резервное копирование (cron):

```bash
# Редактирование crontab
crontab -e

# Добавить строку для ежедневного бэкапа в 3:00
0 3 * * * cd ~/apps/csm-app && ./backup.sh >> logs/backup.log 2>&1
```

---

## Мониторинг и логи

### Docker:

```bash
# Логи приложения
docker-compose logs -f app

# Логи nginx
docker-compose logs -f nginx

# Использование ресурсов
docker stats
```

### PM2:

```bash
# Логи в реальном времени
pm2 logs csm-app

# Мониторинг ресурсов
pm2 monit

# Веб-интерфейс мониторинга (опционально)
pm2 install pm2-logrotate
```

---

## Troubleshooting

### Проблема: Приложение не запускается

**Решение:**
```bash
# Проверить логи
docker-compose logs app  # Docker
pm2 logs csm-app         # PM2

# Проверить переменные окружения
cat .env.production

# Проверить базу данных
ls -la data/
```

### Проблема: Ошибки при миграции базы данных

**Решение:**
```bash
# Вручную запустить миграции
npx prisma migrate deploy

# Сгенерировать Prisma Client
npx prisma generate
```

### Проблема: Nginx не может подключиться к приложению

**Решение:**
```bash
# Проверить, что приложение запущено
curl http://localhost:3000

# Проверить конфигурацию Nginx
sudo nginx -t

# Перезапустить Nginx
sudo systemctl restart nginx
```

### Проблема: Закончилось место на диске

**Решение:**
```bash
# Очистить Docker кэш (только для Docker)
docker system prune -a

# Очистить старые логи
pm2 flush

# Удалить старые бэкапы
rm backups/backup_*.tar.gz
```

---

## Безопасность

### Рекомендации:

1. **Firewall (UFW):**
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. **Fail2Ban** (защита от брутфорса):
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

3. **Обновления системы:**
```bash
# Регулярно обновляйте систему
sudo apt update && sudo apt upgrade -y
```

4. **Сильные пароли:**
   - Используйте сильный `ADMIN_PASSWORD`
   - Используйте длинный случайный `JWT_SECRET`
   - Не храните `.env.production` в git

---

## Полезные ссылки

- [Next.js Production Checklist](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
