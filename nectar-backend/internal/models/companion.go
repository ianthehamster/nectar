package models

type Companion struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Archetype   string `json:"archetype"`
	Bio         string `json:"bio"`
	AvatarURL   string `json:"avatar_url"`
	Personality string `json:"personality_prompt"`
	MoodState   string `json:"mood_state"`
}
