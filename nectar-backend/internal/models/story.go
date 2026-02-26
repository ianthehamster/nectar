package models

type StoryItem struct {
	ID         int    `json:"id"`
	MediaURL   string `json:"media_url"`
	MediaType  string `json:"media_type"`
	Caption    string `json:"caption"`
	OrderIndex int    `json:"order_index"`
}

type Story struct {
	ID          int         `json:"id"`
	CompanionID int         `json:"companion_id"`
	Items       []StoryItem `json:"items"`
}