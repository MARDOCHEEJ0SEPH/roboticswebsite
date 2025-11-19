/**
 * CoachHub Pro - Session Management Service
 * Concurrent video session management and scheduling
 * Powered by Autonomous Robotics Go Framework
 */

package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/robfig/cron/v3"
	"go.uber.org/zap"

	framework "coachhub-pro/autonomous-framework"
)

type SessionManager struct {
	framework *framework.AutonomousFramework
	sessions  map[string]*VideoSession
	mu        sync.RWMutex
	logger    *zap.Logger
	cron      *cron.Cron
}

type VideoSession struct {
	ID          string    `json:"id"`
	CoachID     string    `json:"coach_id"`
	StudentID   string    `json:"student_id"`
	ScheduledAt time.Time `json:"scheduled_at"`
	Duration    int       `json:"duration"`
	Status      string    `json:"status"`
	MeetingLink string    `json:"meeting_link"`
	CreatedAt   time.Time `json:"created_at"`
}

type SessionRequest struct {
	CoachID     string `json:"coach_id" binding:"required"`
	StudentID   string `json:"student_id" binding:"required"`
	ScheduledAt string `json:"scheduled_at" binding:"required"`
	Duration    int    `json:"duration" binding:"required"`
}

func NewSessionManager(fw *framework.AutonomousFramework, logger *zap.Logger) *SessionManager {
	return &SessionManager{
		framework: fw,
		sessions:  make(map[string]*VideoSession),
		logger:    logger,
		cron:      cron.New(),
	}
}

func (sm *SessionManager) Start() {
	sm.logger.Info("🚀 Starting Session Manager...")

	// Schedule session reminders every 5 minutes
	sm.cron.AddFunc("*/5 * * * *", func() {
		sm.sendUpcomingReminders()
	})

	sm.cron.Start()
	sm.logger.Info("✅ Session Manager started")
}

func (sm *SessionManager) Stop() {
	sm.logger.Info("🛑 Stopping Session Manager...")
	sm.cron.Stop()
	sm.logger.Info("✅ Session Manager stopped")
}

func (sm *SessionManager) CreateSession(req SessionRequest) (*VideoSession, error) {
	sm.mu.Lock()
	defer sm.mu.Unlock()

	scheduledAt, err := time.Parse(time.RFC3339, req.ScheduledAt)
	if err != nil {
		return nil, fmt.Errorf("invalid scheduled_at format: %v", err)
	}

	session := &VideoSession{
		ID:          uuid.New().String(),
		CoachID:     req.CoachID,
		StudentID:   req.StudentID,
		ScheduledAt: scheduledAt,
		Duration:    req.Duration,
		Status:      "scheduled",
		MeetingLink: fmt.Sprintf("https://meet.coachhub.pro/%s", uuid.New().String()),
		CreatedAt:   time.Now(),
	}

	sm.sessions[session.ID] = session

	sm.logger.Info("📅 Session created",
		zap.String("id", session.ID),
		zap.String("coach", req.CoachID),
		zap.String("student", req.StudentID),
	)

	return session, nil
}

func (sm *SessionManager) GetSession(id string) (*VideoSession, bool) {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	session, exists := sm.sessions[id]
	return session, exists
}

func (sm *SessionManager) GetAllSessions() []*VideoSession {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	sessions := make([]*VideoSession, 0, len(sm.sessions))
	for _, session := range sm.sessions {
		sessions = append(sessions, session)
	}

	return sessions
}

func (sm *SessionManager) sendUpcomingReminders() {
	sm.mu.RLock()
	defer sm.mu.RUnlock()

	oneHourFromNow := time.Now().Add(time.Hour)

	for _, session := range sm.sessions {
		if session.Status == "scheduled" &&
			session.ScheduledAt.Before(oneHourFromNow) &&
			session.ScheduledAt.After(time.Now()) {

			sm.logger.Info("📧 Sending reminder for session",
				zap.String("id", session.ID),
			)

			// In production, send actual notifications via WebSocket/Email
		}
	}
}

func setupRoutes(router *gin.Engine, manager *SessionManager, fw *framework.AutonomousFramework) {
	router.GET("/health", func(c *gin.Context) {
		status := fw.GetStatus()

		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "session-service",
			"autonomous_framework": gin.H{
				"initialized": true,
				"mode":        status.Mode,
			},
		})
	})

	router.POST("/api/sessions", func(c *gin.Context) {
		var req SessionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		session, err := manager.CreateSession(req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"success": true,
			"data":    session,
		})
	})

	router.GET("/api/sessions/:id", func(c *gin.Context) {
		id := c.Param("id")
		session, exists := manager.GetSession(id)

		if !exists {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Session not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    session,
		})
	})

	router.GET("/api/sessions", func(c *gin.Context) {
		sessions := manager.GetAllSessions()

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"count":   len(sessions),
			"data":    sessions,
		})
	})
}

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	logger.Info("🤖 Starting CoachHub Pro Session Service...")

	// Initialize autonomous framework
	logger.Info("🧠 Initializing Autonomous Framework...")

	config := &framework.FrameworkConfig{
		Mode:            "autonomous",
		EvolutionRate:   "balanced",
		LearningEnabled: true,
		AutoDeployment:  true,
	}

	fw, err := framework.NewAutonomousFramework(config, logger)
	if err != nil {
		log.Fatalf("Failed to initialize framework: %v", err)
	}

	if err := fw.Start(); err != nil {
		log.Fatalf("Failed to start framework: %v", err)
	}

	logger.Info("✅ Autonomous Framework initialized")

	// Initialize session manager
	manager := NewSessionManager(fw, logger)
	manager.Start()

	// Setup Gin
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	setupRoutes(router, manager, fw)

	srv := &http.Server{
		Addr:    ":8090",
		Handler: router,
	}

	go func() {
		fmt.Println(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║      🤖 CoachHub Pro Session Service 🤖            ║
║                                                       ║
║  Port:       8090                                    ║
║  Framework:  Go SDK                                  ║
║  Features:   Session Management, Video, Scheduling   ║
║                                                       ║
║  Status:     🟢 ONLINE                               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
		`)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed", zap.Error(err))
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("🛑 Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	manager.Stop()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	if err := fw.Stop(); err != nil {
		logger.Error("Error stopping framework", zap.Error(err))
	}

	logger.Info("✅ Server exited")
}
