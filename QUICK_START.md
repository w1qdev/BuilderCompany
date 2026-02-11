# Быстрый старт деплоя на VPS

## 🚀 Минимальная установка (Docker)

```bash
# 1. Установить Docker и Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 2. Клонировать проект
git clone <your-repo> csm-app
cd csm-app

# 3. Настроить переменные окружения
cp .env.production.example .env.production
nano .env.production  # Заполнить все переменные

# 4. Настроить домен в nginx.conf
nano nginx.conf  # Заменить your-domain.com

# 5. Создать директории
mkdir -p data uploads ssl logs backups

# 6. Запустить
chmod +x deploy.sh
./deploy.sh docker

# 7. Проверить
curl http://localhost:3000
docker-compose ps
```

## 📋 Основные команды

```bash
# Просмотр логов
docker-compose logs -f

# Перезапуск
docker-compose restart

# Остановка
docker-compose down

# Обновление
git pull && ./deploy.sh docker

# Резервная копия
./backup.sh
```

## 🔒 SSL (Let's Encrypt)

```bash
# Остановить nginx
docker-compose stop nginx

# Получить сертификат
sudo certbot certonly --standalone -d your-domain.com

# Скопировать сертификаты
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*.pem

# Включить SSL в nginx.conf (раскомментировать строки)
nano nginx.conf

# Перезапустить
docker-compose up -d
```

## 🛠️ Troubleshooting

**Приложение не работает?**
```bash
docker-compose logs app
```

**Проблемы с базой данных?**
```bash
docker-compose exec app npx prisma migrate deploy
```

**Nginx ошибки?**
```bash
docker-compose logs nginx
sudo nginx -t
```

## 📚 Подробная документация

Смотрите [DEPLOYMENT.md](./DEPLOYMENT.md) для полной инструкции.
