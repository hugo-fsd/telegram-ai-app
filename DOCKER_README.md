# Docker Setup Guide

This guide will help you run the Telegram AI app using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) installed

## Quick Start

### 1. Configure Environment Variables

Copy the example environment file and fill in your actual values:

```bash
cp .env.example .env
```

Edit `.env` and set all required values:
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `TAVILY_API_KEY` - Your Tavily API key
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `TELEGRAM_WEBHOOK_URL` - Your public webhook URL (e.g., https://yourdomain.com/webhook)
- `MONGO_ROOT_PASSWORD` - Change the default MongoDB password

### 2. Start the Application

Run the entire stack (app + MongoDB) with:

```bash
docker-compose up -d
```

This will:
- Pull the MongoDB image
- Build your application image
- Start both containers in the background
- Create a persistent volume for MongoDB data

### 3. View Logs

To see the application logs:

```bash
docker-compose logs -f app
```

To see MongoDB logs:

```bash
docker-compose logs -f mongodb
```

### 4. Stop the Application

To stop all containers:

```bash
docker-compose down
```

To stop and remove volumes (⚠️ this will delete your database):

```bash
docker-compose down -v
```

## Building Only the App (without MongoDB)

If you already have a MongoDB instance running elsewhere:

```bash
docker build -t telegram-ai-app .
docker run -p 8080:8080 --env-file .env telegram-ai-app
```

Make sure your `.env` file has the correct `MONGODB_URI` pointing to your MongoDB instance.

## Development Mode

For development, you might want to mount your source code as a volume:

```bash
docker-compose -f docker-compose.dev.yml up
```

Or run locally with:

```bash
bun install
bun run dev
```

## Deployment Considerations

### Webhook URL

Your `TELEGRAM_WEBHOOK_URL` must be publicly accessible. For production:
- Use a domain with HTTPS (Telegram requires HTTPS for webhooks)
- Consider using a reverse proxy (nginx, Caddy, Traefik)
- Or deploy to a cloud platform (Railway, Fly.io, AWS, GCP, etc.)

### Security

- Change default MongoDB credentials in `.env`
- Never commit `.env` file to version control
- Use secrets management in production (AWS Secrets Manager, etc.)
- Consider using Docker secrets for sensitive data

### Scaling

To run multiple instances of the app:

```bash
docker-compose up -d --scale app=3
```

Note: You'll need to configure a load balancer for this setup.

## Troubleshooting

### Connection Issues

If the app can't connect to MongoDB:
1. Check that MongoDB is healthy: `docker-compose ps`
2. Verify environment variables: `docker-compose config`
3. Check logs: `docker-compose logs mongodb`

### Port Conflicts

If port 8080 or 27017 is already in use, change it in `.env`:

```
PORT=3000
MONGO_PORT=27018
```

### Rebuilding the Image

After code changes, rebuild the image:

```bash
docker-compose up -d --build
```

## Useful Commands

```bash
# View running containers
docker-compose ps

# Access app container shell
docker-compose exec app sh

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p changeme123

# Remove all containers and volumes
docker-compose down -v

# View resource usage
docker stats
```

## Production Deployment Examples

### Using Railway

1. Push your code to GitHub
2. Connect Railway to your repository
3. Add environment variables in Railway dashboard
4. Railway will automatically detect and build your Dockerfile

### Using Fly.io

```bash
fly launch
fly secrets set OPENROUTER_API_KEY=xxx TELEGRAM_BOT_TOKEN=xxx ...
fly deploy
```

### Using AWS ECS

Use the Dockerfile with AWS ECS or EKS, configuring environment variables through AWS Systems Manager Parameter Store or Secrets Manager.
