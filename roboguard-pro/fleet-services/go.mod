module roboguard-pro/fleet-services

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/google/uuid v1.5.0
	go.uber.org/zap v1.26.0
	github.com/joho/godotenv v1.5.1
)

replace roboguard-pro/autonomous-framework => ../../../frameworks/go/src

require roboguard-pro/autonomous-framework v0.0.0
