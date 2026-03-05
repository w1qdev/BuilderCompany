# Обновление проекта на VPS

## Быстрый способ (через deploy.sh)

```bash
ssh root@<IP-вашего-VPS>
cd /usr/csm-center.ru/
git pull origin master
./deploy.sh
```

## Ручной способ

```bash
# 1. Подключиться к серверу
ssh root@<IP-вашего-VPS>

# 2. Перейти в папку проекта
cd /usr/csm-center.ru/

# 3. Подтянуть изменения
git pull origin master

# 4. Остановить и удалить старый контейнер
docker compose down

# 5. Пересобрать и запустить новый контейнер
docker compose up -d --build

# 6. Проверить что контейнер запустился
docker compose ps

# 7. Восстановить права на папки (если нужно)
chown -R 1001:1001 /usr/csm-center.ru/uploads/ /usr/csm-center.ru/data/
```
