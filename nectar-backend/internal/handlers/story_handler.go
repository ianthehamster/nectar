package handlers

import (
	"context"
	"net/http"
	"strconv"

	"nectar-backend/internal/db"
	"nectar-backend/internal/models"

	"github.com/gin-gonic/gin"
)

func GetStoriesByCompanion(c *gin.Context) {
	companionID := c.Param("companion_id")

	id, err := strconv.Atoi(companionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid companion ID"})
		return
	}

	// Get latest non-expired story
	var story models.Story

	err = db.Pool.QueryRow(context.Background(), `
		SELECT id, companion_id
		FROM stories
		WHERE companion_id = $1
		AND (expires_at IS NULL OR expires_at > now())
		ORDER BY created_at DESC
		LIMIT 1
	`, id).Scan(&story.ID, &story.CompanionID)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active story found"})
		return
	}

	// Get story items
	rows, err := db.Pool.Query(context.Background(), `
		SELECT id, media_url, media_type, caption, order_index
		FROM story_items
		WHERE story_id = $1
		ORDER BY order_index ASC
	`, story.ID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	for rows.Next() {
		var item models.StoryItem
		err := rows.Scan(
			&item.ID,
			&item.MediaURL,
			&item.MediaType,
			&item.Caption,
			&item.OrderIndex,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		story.Items = append(story.Items, item)
	}

	c.JSON(http.StatusOK, story)
}

func ReactToStory(c *gin.Context) {
	var req models.StoryReactionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Single-user mode
	userID := 1

	_, err := db.Pool.Exec(context.Background(), `
		INSERT INTO story_reactions (story_item_id, user_id, reaction_type)
		VALUES ($1, $2, $3)
	`, req.StoryItemID, userID, req.Reaction)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "reaction recorded"})
}

func MarkStoryViewed(c *gin.Context) {
	userID := 1

	var body struct {
		StoryItemID int `json:"story_item_id"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	_, err := db.Pool.Exec(context.Background(), `
		INSERT INTO story_views (story_item_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, body.StoryItemID, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "view recorded"})
}

func GetSeenStatus(c *gin.Context) {
	userID := 1

	rows, err := db.Pool.Query(context.Background(), `
		SELECT s.companion_id, COUNT(si.id) as total,
		COUNT(sv.id) as viewed
		FROM stories s
		JOIN story_items si ON si.story_id = s.id
		LEFT JOIN story_views sv
			ON sv.story_item_id = si.id AND sv.user_id = $1
		WHERE s.expires_at > now()
		GROUP BY s.companion_id
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type Status struct {
		CompanionID int `json:"companion_id"`
		Total       int `json:"total"`
		Viewed      int `json:"viewed"`
	}

	var statuses []Status

	for rows.Next() {
		var s Status
		rows.Scan(&s.CompanionID, &s.Total, &s.Viewed)
		statuses = append(statuses, s)
	}

	c.JSON(http.StatusOK, statuses)
}