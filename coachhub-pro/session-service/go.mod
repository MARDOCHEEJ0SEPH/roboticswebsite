module coachhub-pro/session-service

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/google/uuid v1.5.0
	go.uber.org/zap v1.26.0
	github.com/robfig/cron/v3 v3.0.1
)

replace coachhub-pro/autonomous-framework => ../../../frameworks/go/src

require coachhub-pro/autonomous-framework v0.0.0
