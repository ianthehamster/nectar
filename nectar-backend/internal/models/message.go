package models

import "time"

type DirectMessage struct {
	ID          int       `json:"id"`
	CompanionID int       `json:"companion_id"`
	Content     string    `json:"content"`
	IsUser      bool      `json:"is_user"`
	IsRead      bool      `json:"is_read"`
	CreatedAt   time.Time `json:"created_at"`
}