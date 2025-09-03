up:
	docker compose -f=./apps/server/compose.local.yml up -d

down:
	docker compose -f=./apps/server/compose.local.yml down

clean:
	rm -rf ~/.container/jigu

dev:
	bun run dev

build:
	bun run build

lint:
	bun run lint
