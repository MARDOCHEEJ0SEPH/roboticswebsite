FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum* ./

# Download dependencies
RUN go mod download || true

# Copy source code
COPY . .

# Copy frameworks directory
COPY ../frameworks /frameworks

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o fleet-services .

# Runtime stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/fleet-services .

# Expose port
EXPOSE 8090

# Start server
CMD ["./fleet-services"]
