FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Используем --legacy-peer-deps для совместимости с react-scripts
RUN npm install --legacy-peer-deps

COPY . .

# React-скрипты автоматически используют этот порт
EXPOSE 3000

CMD ["npm", "start"]
