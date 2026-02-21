FROM node:20-slim

RUN apt-get update && apt-get install -y \
    git \
    curl \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

EXPOSE 3000 5173 8080

CMD ["sleep", "infinity"]
