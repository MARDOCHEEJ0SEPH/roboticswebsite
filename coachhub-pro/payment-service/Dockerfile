FROM rust:1.75-slim as builder

WORKDIR /app

COPY Cargo.toml ./
COPY src ./src
COPY ../frameworks /frameworks

RUN cargo build --release

FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/coachhub-payment-service .

EXPOSE 8080

CMD ["./coachhub-payment-service"]
