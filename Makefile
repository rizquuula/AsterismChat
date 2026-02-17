.PHONY: install build dev dev-fe dev-be preview lint clean help migrate

# Default target
help:
	@echo "AsterismChat - Available Commands:"
	@echo "  make install   - Install npm dependencies for frontend and backend"
	@echo "  make build     - Build the production project"
	@echo "  make dev       - Start both frontend and backend development servers"
	@echo "  make dev-fe    - Start only frontend development server"
	@echo "  make dev-be    - Start only backend development server"
	@echo "  make preview   - Preview the production build"
	@echo "  make lint      - Run ESLint"
	@echo "  make clean     - Remove build artifacts"
	@echo "  make migrate   - Push Prisma schema to database (preserves data)"

install:
	npm install
	cd server && npm install

build:
	npm run build

dev:
	@echo "Starting frontend and backend..."
	@cd server && npm run dev & \
	npm run dev
	@echo "Frontend: http://localhost:5173"
	@echo "Backend: http://localhost:3001"

dev-fe:
	npm run dev

dev-be:
	cd server && npm run dev

preview:
	npm run preview

lint:
	npm run lint

clean:
	rm -rf dist node_modules/.vite

migrate:
	cd server && npm run db:push
