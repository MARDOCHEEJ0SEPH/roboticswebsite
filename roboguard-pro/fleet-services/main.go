/**
 * RoboGuard Pro - Fleet Services
 * Concurrent robot fleet management and coordination
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
	"go.uber.org/zap"

	framework "roboguard-pro/autonomous-framework"
)

// FleetService manages robot fleet operations
type FleetService struct {
	framework  *framework.AutonomousFramework
	robots     map[string]*Robot
	mu         sync.RWMutex
	logger     *zap.Logger
	ctx        context.Context
	cancelFunc context.CancelFunc
	wg         sync.WaitGroup
}

// Robot represents a robot in the fleet
type Robot struct {
	ID           string             `json:"id"`
	Name         string             `json:"name"`
	Status       string             `json:"status"`
	BatteryLevel float64            `json:"battery_level"`
	Location     *Location          `json:"location"`
	CurrentTask  string             `json:"current_task"`
	LastUpdate   time.Time          `json:"last_update"`
	Capabilities []string           `json:"capabilities"`
}

// Location represents GPS coordinates
type Location struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

// FleetStats represents fleet statistics
type FleetStats struct {
	TotalRobots   int     `json:"total_robots"`
	OnlineRobots  int     `json:"online_robots"`
	OfflineRobots int     `json:"offline_robots"`
	AvgBattery    float64 `json:"avg_battery"`
}

// TaskAssignment represents a task assignment request
type TaskAssignment struct {
	TaskType string    `json:"task_type"`
	Location *Location `json:"location"`
	Priority string    `json:"priority"`
}

// NewFleetService creates a new fleet service
func NewFleetService(fw *framework.AutonomousFramework, logger *zap.Logger) *FleetService {
	ctx, cancel := context.WithCancel(context.Background())

	fs := &FleetService{
		framework:  fw,
		robots:     make(map[string]*Robot),
		logger:     logger,
		ctx:        ctx,
		cancelFunc: cancel,
	}

	// Initialize with some demo robots
	fs.initializeDemoRobots()

	return fs
}

// Start starts the fleet service background operations
func (fs *FleetService) Start() {
	fs.logger.Info("🚀 Starting Fleet Service operations...")

	// Start fleet monitoring goroutine
	fs.wg.Add(1)
	go fs.monitorFleet()

	// Start resource allocation goroutine
	fs.wg.Add(1)
	go fs.optimizeResourceAllocation()

	fs.logger.Info("✅ Fleet Service started")
}

// Stop stops the fleet service
func (fs *FleetService) Stop() {
	fs.logger.Info("🛑 Stopping Fleet Service...")
	fs.cancelFunc()
	fs.wg.Wait()
	fs.logger.Info("✅ Fleet Service stopped")
}

// Monitor fleet health
func (fs *FleetService) monitorFleet() {
	defer fs.wg.Done()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-fs.ctx.Done():
			return
		case <-ticker.C:
			fs.mu.RLock()
			fs.logger.Info("📊 Fleet health check",
				zap.Int("total_robots", len(fs.robots)),
				zap.Int("online", fs.countByStatus("online")),
			)
			fs.mu.RUnlock()
		}
	}
}

// Optimize resource allocation
func (fs *FleetService) optimizeResourceAllocation() {
	defer fs.wg.Done()

	ticker := time.NewTicker(2 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-fs.ctx.Done():
			return
		case <-ticker.C:
			fs.logger.Info("🔄 Optimizing resource allocation...")
			// Use autonomous framework for optimization
			// In production, this would use actual optimization algorithms
		}
	}
}

// GetFleetStats returns fleet statistics
func (fs *FleetService) GetFleetStats() FleetStats {
	fs.mu.RLock()
	defer fs.mu.RUnlock()

	total := len(fs.robots)
	online := fs.countByStatus("online")
	offline := fs.countByStatus("offline")

	var totalBattery float64
	for _, robot := range fs.robots {
		totalBattery += robot.BatteryLevel
	}

	avgBattery := 0.0
	if total > 0 {
		avgBattery = totalBattery / float64(total)
	}

	return FleetStats{
		TotalRobots:   total,
		OnlineRobots:  online,
		OfflineRobots: offline,
		AvgBattery:    avgBattery,
	}
}

// GetAllRobots returns all robots
func (fs *FleetService) GetAllRobots() []*Robot {
	fs.mu.RLock()
	defer fs.mu.RUnlock()

	robots := make([]*Robot, 0, len(fs.robots))
	for _, robot := range fs.robots {
		robots = append(robots, robot)
	}

	return robots
}

// GetRobotByID returns a robot by ID
func (fs *FleetService) GetRobotByID(id string) (*Robot, bool) {
	fs.mu.RLock()
	defer fs.mu.RUnlock()

	robot, exists := fs.robots[id]
	return robot, exists
}

// AssignTask assigns a task to the best available robot
func (fs *FleetService) AssignTask(task TaskAssignment) (*Robot, error) {
	fs.logger.Info("🎯 Assigning task", zap.String("type", task.TaskType))

	// Find best robot for task
	fs.mu.RLock()
	var bestRobot *Robot
	bestScore := -1.0

	for _, robot := range fs.robots {
		if robot.Status == "online" && robot.BatteryLevel > 30 {
			// Calculate score based on battery, distance, capabilities
			score := robot.BatteryLevel
			if score > bestScore {
				bestScore = score
				bestRobot = robot
			}
		}
	}
	fs.mu.RUnlock()

	if bestRobot == nil {
		return nil, fmt.Errorf("no available robots for task")
	}

	// Assign task
	fs.mu.Lock()
	bestRobot.CurrentTask = task.TaskType
	bestRobot.LastUpdate = time.Now()
	fs.mu.Unlock()

	fs.logger.Info("✅ Task assigned",
		zap.String("robot_id", bestRobot.ID),
		zap.String("task", task.TaskType),
	)

	return bestRobot, nil
}

// countByStatus counts robots by status (must be called with lock held)
func (fs *FleetService) countByStatus(status string) int {
	count := 0
	for _, robot := range fs.robots {
		if robot.Status == status {
			count++
		}
	}
	return count
}

// Initialize demo robots
func (fs *FleetService) initializeDemoRobots() {
	demoRobots := []Robot{
		{
			ID:           uuid.New().String(),
			Name:         "Guardian-01",
			Status:       "online",
			BatteryLevel: 95.0,
			Location:     &Location{Lat: 37.7749, Lng: -122.4194},
			CurrentTask:  "patrol",
			LastUpdate:   time.Now(),
			Capabilities: []string{"patrol", "surveillance", "threat_detection"},
		},
		{
			ID:           uuid.New().String(),
			Name:         "Sentinel-02",
			Status:       "online",
			BatteryLevel: 87.0,
			Location:     &Location{Lat: 37.7750, Lng: -122.4195},
			CurrentTask:  "idle",
			LastUpdate:   time.Now(),
			Capabilities: []string{"patrol", "perimeter_check"},
		},
		{
			ID:           uuid.New().String(),
			Name:         "Watcher-03",
			Status:       "charging",
			BatteryLevel: 45.0,
			Location:     &Location{Lat: 37.7748, Lng: -122.4193},
			CurrentTask:  "charging",
			LastUpdate:   time.Now(),
			Capabilities: []string{"patrol", "surveillance"},
		},
	}

	for _, robot := range demoRobots {
		r := robot
		fs.robots[robot.ID] = &r
	}

	fs.logger.Info("✅ Initialized demo robots", zap.Int("count", len(demoRobots)))
}

// API Handlers
func setupRoutes(router *gin.Engine, fleetService *FleetService, fw *framework.AutonomousFramework) {
	// Health check
	router.GET("/health", func(c *gin.Context) {
		status := fw.GetStatus()

		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "fleet-services",
			"autonomous_framework": gin.H{
				"initialized": true,
				"mode":        status.Mode,
			},
		})
	})

	// Fleet stats
	router.GET("/api/fleet/stats", func(c *gin.Context) {
		stats := fleetService.GetFleetStats()
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    stats,
		})
	})

	// Get all robots
	router.GET("/api/fleet/robots", func(c *gin.Context) {
		robots := fleetService.GetAllRobots()
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"count":   len(robots),
			"data":    robots,
		})
	})

	// Get robot by ID
	router.GET("/api/fleet/robots/:id", func(c *gin.Context) {
		id := c.Param("id")
		robot, exists := fleetService.GetRobotByID(id)

		if !exists {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"error":   "Robot not found",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    robot,
		})
	})

	// Assign task
	router.POST("/api/fleet/assign-task", func(c *gin.Context) {
		var task TaskAssignment
		if err := c.ShouldBindJSON(&task); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		robot, err := fleetService.AssignTask(task)
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"success": false,
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    robot,
		})
	})

	// Framework status
	router.GET("/api/status", func(c *gin.Context) {
		status := fw.GetStatus()
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    status,
		})
	})
}

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	logger.Info("🤖 Starting RoboGuard Pro Fleet Services...")

	// Initialize autonomous framework
	logger.Info("🧠 Initializing Autonomous Framework...")

	config := &framework.FrameworkConfig{
		Mode:           "autonomous",
		EvolutionRate:  "aggressive",
		LearningEnabled: true,
		AutoDeployment: true,
	}

	fw, err := framework.NewAutonomousFramework(config, logger)
	if err != nil {
		log.Fatalf("Failed to initialize framework: %v", err)
	}

	if err := fw.Start(); err != nil {
		log.Fatalf("Failed to start framework: %v", err)
	}

	logger.Info("✅ Autonomous Framework initialized")

	// Initialize fleet service
	fleetService := NewFleetService(fw, logger)
	fleetService.Start()

	// Setup Gin
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()

	// CORS middleware
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

	// Setup routes
	setupRoutes(router, fleetService, fw)

	// Start server
	srv := &http.Server{
		Addr:    ":8090",
		Handler: router,
	}

	// Start server in goroutine
	go func() {
		fmt.Println(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║      🤖 RoboGuard Pro Fleet Services 🤖            ║
║                                                       ║
║  Port:       8090                                    ║
║  Framework:  Go SDK                                  ║
║  Features:   Fleet Management, Resource Allocation   ║
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

	fleetService.Stop()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	if err := fw.Stop(); err != nil {
		logger.Error("Error stopping framework", zap.Error(err))
	}

	logger.Info("✅ Server exited")
}
