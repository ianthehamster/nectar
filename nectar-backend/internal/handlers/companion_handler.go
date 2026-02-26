package handlers

import (
	"context"
	"net/http"

	"nectar-backend/internal/db"
	"nectar-backend/internal/models"

	"github.com/gin-gonic/gin"
)

func GetCompanions(c *gin.Context) {
	rows, err := db.Pool.Query(context.Background(), `
		SELECT id, name, archetype, bio, avatar_url, personality_prompt, mood_state
		FROM companions
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var companions []models.Companion

	for rows.Next() {
		var companion models.Companion
		err := rows.Scan(
			&companion.ID,
			&companion.Name,
			&companion.Archetype,
			&companion.Bio,
			&companion.AvatarURL,
			&companion.Personality,
			&companion.MoodState,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		companions = append(companions, companion)
	}

	c.JSON(http.StatusOK, companions)
}