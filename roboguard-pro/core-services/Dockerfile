FROM rust:1.75-slim as builder

WORKDIR /app

# Copy Cargo files
COPY Cargo.toml ./
COPY src ./src

# Copy frameworks directory
COPY ../frameworks /frameworks

# Build release binary
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/roboguard-core-services .

# Expose port
EXPOSE 8080

# Start server
CMD ["./roboguard-core-services"]
