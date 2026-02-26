package main

import (
	"log"
	"nectar-backend/internal/db"
	"nectar-backend/internal/handlers"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	err := db.Connect()
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}

router := gin.Default()
router.Use(cors.Default())

	router.GET("/companions", handlers.GetCompanions)

	
	router.GET("/messages", handlers.GetMessages)
	router.GET("/messages/unread", handlers.GetUnreadCount)
		router.GET("/stories/status", handlers.GetSeenStatus)
	router.POST("/stories/view", handlers.MarkStoryViewed)
	router.POST("/stories/react", handlers.ReactToStory)
		router.GET("/stories/:companion_id", handlers.GetStoriesByCompanion)
		router.POST("/messages/send", handlers.SendMessage)
		router.POST("/messages/stream", handlers.StreamMessage)


	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router.Run(":" + port)
}