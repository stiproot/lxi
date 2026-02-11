FROM node:22.15.1-alpine AS build
  COPY ["/trusted_certs.crt", "/usr/local/share/ca-certificates/trusted_certs.pem"]
  RUN npm config set cafile /usr/local/share/ca-certificates/trusted_certs.pem
  ENV NODE_EXTRA_CA_CERTS="/usr/local/share/ca-certificates/trusted_certs.pem"

  WORKDIR /app

  # Enable Corepack and set Yarn version
  RUN corepack enable
  RUN corepack prepare yarn@stable --activate

  # Copy yarn config first
  COPY .yarnrc.yml ./
  COPY package.json yarn.lock ./

  # Install with proper node_modules linking
  RUN yarn install

  COPY . .

  # Build the application
  RUN yarn build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  COPY --from=build /app/dist /usr/share/nginx/html
  EXPOSE 8080
  CMD ["nginx", "-g", "daemon off;"]
