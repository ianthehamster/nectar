FROM golang:1.25-alpine

WORKDIR /app

# Copy go mod files from nectar-backend
COPY nectar-backend/go.mod nectar-backend/go.sum ./
RUN go mod download

# Copy backend source
COPY nectar-backend/ .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app ./cmd

EXPOSE 8080

CMD ["./app"]