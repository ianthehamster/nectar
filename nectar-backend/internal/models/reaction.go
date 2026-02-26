package models

type StoryReactionRequest struct {
	StoryItemID int    `json:"story_item_id"`
	Reaction    string `json:"reaction_type"`
}